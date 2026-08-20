import { base44 } from '@/api/base44Client';

export const CONFIDENCE_STATES = {
  confirmed: { label: 'Confirmed', badge: 'bg-green-500/15 text-green-700 dark:text-green-300' },
  likely: { label: 'Likely', badge: 'bg-brand/15 text-brand' },
  needs_review: { label: 'Needs Review', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  unreadable: { label: 'Unreadable', badge: 'bg-destructive/15 text-destructive' },
  missing: { label: 'Missing', badge: 'bg-muted text-muted-foreground' },
};

export const ACCEPT_STRING = '.pdf,.docx,.jpg,.jpeg,.png,.webp,.heic';

export const isImageFile = (file) => file?.type?.startsWith('image/');

const profBonusForLevel = (level) => {
  const l = Number(level) || 1;
  if (l >= 17) return 6;
  if (l >= 13) return 5;
  if (l >= 9) return 4;
  if (l >= 5) return 3;
  return 2;
};

const numOr = (val, fallback) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    identity: {
      type: 'object',
      properties: {
        character_name: { type: 'string' }, player_name: { type: 'string' },
        pronouns: { type: 'string' }, species: { type: 'string' },
        background: { type: 'string' }, alignment: { type: 'string' },
        level: { type: 'number' }, experience: { type: 'number' },
      },
    },
    class_info: {
      type: 'object',
      properties: { class: { type: 'string' }, subclass: { type: 'string' }, multiclass: { type: 'string' } },
    },
    ability_scores: {
      type: 'object',
      properties: {
        strength: { type: 'number' }, dexterity: { type: 'number' }, constitution: { type: 'number' },
        intelligence: { type: 'number' }, wisdom: { type: 'number' }, charisma: { type: 'number' },
      },
    },
    combat: {
      type: 'object',
      properties: {
        armor_class: { type: 'number' }, initiative: { type: 'number' }, speed: { type: 'number' },
        max_hp: { type: 'number' }, current_hp: { type: 'number' }, temp_hp: { type: 'number' },
        hit_dice: { type: 'string' },
      },
    },
    saving_throws: {
      type: 'object',
      properties: {
        strength: { type: 'boolean' }, dexterity: { type: 'boolean' }, constitution: { type: 'boolean' },
        intelligence: { type: 'boolean' }, wisdom: { type: 'boolean' }, charisma: { type: 'boolean' },
      },
    },
    skills: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' }, modifier: { type: 'number' },
          proficiency: { type: 'string' }, confidence: { type: 'string' },
        },
      },
    },
    other: {
      type: 'object',
      properties: {
        passive_perception: { type: 'number' }, passive_insight: { type: 'number' },
        passive_investigation: { type: 'number' }, languages: { type: 'string' },
        tool_proficiencies: { type: 'string' }, weapon_proficiencies: { type: 'string' },
        armor_proficiencies: { type: 'string' }, equipment: { type: 'string' },
        weapons: { type: 'string' }, armor: { type: 'string' }, spells: { type: 'string' },
        feats: { type: 'string' }, personality_traits: { type: 'string' },
        ideals: { type: 'string' }, bonds: { type: 'string' }, flaws: { type: 'string' },
        appearance: { type: 'string' }, backstory: { type: 'string' },
        allies_organizations: { type: 'string' },
      },
    },
    confidence: { type: 'object', additionalProperties: { type: 'string' } },
    page_quality: { type: 'string' },
    quality_notes: { type: 'string' },
  },
};

const buildExtractionPrompt = (fileCount, quickMode) => {
  const pageWord = fileCount === 1 ? 'document' : `${fileCount} pages`;
  return `You are analyzing a D&D 5e character sheet (${pageWord}). Extract all character information you can identify from the document.

${quickMode
  ? 'QUICK MODE: Focus on extracting only the most essential fields for roleplay: character name, player name, species, class, level, appearance, and the following skill modifiers: Insight, Perception, Investigation, Medicine, Stealth, SleightOfHand, and Passive Perception. Extract other fields if clearly visible but do not spend effort on obscure values.'
  : 'Extract ALL available character information.'}

For EVERY field you extract, assign a confidence value in the confidence object:
- "confirmed": clearly printed/typed, unambiguous
- "likely": probably correct but uncertain (messy handwriting, partial)
- "needs_review": difficult to read, best guess
- "unreadable": field exists but cannot be read at all
- "missing": field not present on the sheet

CRITICAL RULES:
- NEVER invent or fabricate values for unreadable or missing fields. Only report what you can actually see.
- For handwritten values, do your best to read them but mark uncertain ones as "needs_review".
- For skill proficiency, set proficiency to "proficient" if the bubble/checkmark is filled, "expertise" if explicitly marked as expertise, "none" if not proficient.
- For saving throws, set the ability to true if the proficiency bubble is filled.
- Include ALL 18 standard skills in the skills array, even if not proficient (set modifier to the calculated ability modifier and proficiency to "none").
- If this is a photo or scan that is difficult to read, set page_quality to "poor" and explain in quality_notes. Set to "fair" if partially readable, "good" if clear.
- The confidence object maps field names (e.g., "character_name", "strength", "insight") to their confidence values.

Standard D&D 5e skills: Acrobatics, AnimalHandling, Arcana, Athletics, Deception, History, Insight, Intimidation, Investigation, Medicine, Nature, Perception, Performance, Persuasion, Religion, SleightOfHand, Stealth, Survival.`;
};

export const extractFromFiles = async (fileUrls, options = {}) => {
  const { quickMode = false } = options;
  if (!fileUrls?.length) throw new Error('No files to extract');
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: buildExtractionPrompt(fileUrls.length, quickMode),
    file_urls: fileUrls,
    response_json_schema: EXTRACTION_SCHEMA,
  });
  return normalizeExtractedData(result);
};

export const normalizeExtractedData = (raw) => {
  const r = raw || {};
  const id = r.identity || {};
  const ci = r.class_info || {};
  const as = r.ability_scores || {};
  const cb = r.combat || {};
  const st = r.saving_throws || {};
  const ot = r.other || {};
  const conf = r.confidence || {};
  const skills = Array.isArray(r.skills) ? r.skills : [];

  const skillDetails = {};
  const skillProfList = [];
  for (const s of skills) {
    const name = s.name?.trim();
    if (!name) continue;
    const prof = s.proficiency || 'none';
    skillDetails[name] = {
      modifier: numOr(s.modifier, 0),
      proficiency: prof,
      confidence: s.confidence || conf[name] || 'needs_review',
    };
    if (prof === 'proficient' || prof === 'expertise') skillProfList.push(name);
  }

  const savingThrowProf = Object.entries(st)
    .filter(([, v]) => v === true)
    .map(([k]) => k)
    .join(', ');

  const level = numOr(id.level, 1);
  const data = {
    name: id.character_name || '',
    player_name: id.player_name || '',
    pronouns: id.pronouns || '',
    race: id.species || '',
    background: id.background || '',
    alignment: id.alignment || '',
    level,
    experience: numOr(id.experience, undefined),
    character_class: ci.class || '',
    subclass: ci.subclass || '',
    multiclass: ci.multiclass || '',
    str_score: numOr(as.strength, 10),
    dex_score: numOr(as.dexterity, 10),
    con_score: numOr(as.constitution, 10),
    int_score: numOr(as.intelligence, 10),
    wis_score: numOr(as.wisdom, 10),
    cha_score: numOr(as.charisma, 10),
    proficiency_bonus: profBonusForLevel(level),
    armor_class: numOr(cb.armor_class, undefined),
    initiative: numOr(cb.initiative, undefined),
    speed: numOr(cb.speed, undefined),
    max_hp: numOr(cb.max_hp, undefined),
    current_hp: numOr(cb.current_hp, undefined),
    temp_hp: numOr(cb.temp_hp, undefined),
    hit_dice: cb.hit_dice || '',
    saving_throw_proficiencies: savingThrowProf,
    skill_proficiencies: skillProfList.join(', '),
    skill_details: skillDetails,
    passive_perception: numOr(ot.passive_perception, undefined),
    passive_insight: numOr(ot.passive_insight, undefined),
    passive_investigation: numOr(ot.passive_investigation, undefined),
    languages: ot.languages || '',
    tool_proficiencies: ot.tool_proficiencies || '',
    weapon_proficiencies: ot.weapon_proficiencies || '',
    armor_proficiencies: ot.armor_proficiencies || '',
    equipment: ot.equipment || '',
    weapons: ot.weapons || '',
    armor: ot.armor || '',
    spells: ot.spells || '',
    feats: ot.feats || '',
    personality_traits: ot.personality_traits || '',
    ideals: ot.ideals || '',
    bonds: ot.bonds || '',
    flaws: ot.flaws || '',
    appearance: ot.appearance || '',
    backstory: ot.backstory || '',
    allies_organizations: ot.allies_organizations || '',
    import_confidence: conf,
    page_quality: r.page_quality || 'good',
    notes: r.quality_notes || '',
  };

  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);
  data.roleplay_summary = computeRoleplaySummary(data);
  return data;
};

export const computeRoleplaySummary = (data) => {
  const ROLEPLAY_SKILLS = ['Insight', 'Persuasion', 'Deception', 'Intimidation', 'Perception', 'Investigation', 'Medicine', 'Stealth', 'SleightOfHand'];
  const sd = data.skill_details || {};
  const keySkills = {};
  for (const s of ROLEPLAY_SKILLS) {
    if (sd[s]) keySkills[s] = sd[s].modifier;
  }
  return {
    name: data.name,
    species: data.race,
    class: data.character_class,
    background: data.background,
    appearance: data.appearance,
    languages: data.languages,
    key_skills: keySkills,
    passive_perception: data.passive_perception,
    visible_equipment: [data.armor, data.weapons].filter(Boolean).join('; '),
    level: data.level,
  };
};

export const compareSheets = (existing, incoming) => {
  const changes = [];
  const fields = [
    'name', 'player_name', 'race', 'background', 'alignment', 'level', 'experience',
    'character_class', 'subclass', 'multiclass',
    'str_score', 'dex_score', 'con_score', 'int_score', 'wis_score', 'cha_score',
    'proficiency_bonus', 'armor_class', 'initiative', 'speed', 'max_hp', 'current_hp',
    'passive_perception', 'languages', 'equipment', 'weapons', 'armor', 'spells', 'feats',
    'personality_traits', 'ideals', 'bonds', 'flaws', 'appearance', 'backstory',
  ];
  for (const f of fields) {
    const oldVal = existing?.[f];
    const newVal = incoming?.[f];
    if (newVal == null || newVal === '') continue;
    if (String(oldVal ?? '') !== String(newVal)) {
      changes.push({ field: f, oldValue: oldVal, newValue: newVal });
    }
  }
  const oldSd = existing?.skill_details || {};
  const newSd = incoming?.skill_details || {};
  for (const skill of Object.keys(newSd)) {
    const old = oldSd[skill];
    const newVal = newSd[skill];
    if (!old) {
      changes.push({ field: `skill:${skill}`, oldValue: null, newValue: newVal });
    } else if (old.modifier !== newVal.modifier || old.proficiency !== newVal.proficiency) {
      changes.push({ field: `skill:${skill}`, oldValue: old, newValue: newVal });
    }
  }
  return changes;
};

export const uploadFiles = async (files) => {
  const urls = [];
  for (const file of files) {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    urls.push(file_url);
  }
  return urls;
};

export const QUICK_SKILLS = ['Insight', 'Perception', 'Investigation', 'Medicine', 'Stealth', 'SleightOfHand'];