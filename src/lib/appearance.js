import { base44 } from '@/api/base44Client';
import { requireRecord, stringValue } from '@/lib/runtimeTypes';

const clean = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return '';
  return String(v).trim();
};
const has = (v) => !!clean(v);
const dedup = (arr) => [...new Set(arr.map((s) => s.trim()))].filter(Boolean);
const stripPeriod = (s) => clean(s).replace(/\.$/, '').trim();

const EMPTY_STATES = {
  physical_description: 'Not yet defined',
  clothing_equipment: 'No visible equipment recorded',
  distinguishing_features: 'No distinguishing features recorded',
  image_prompt: 'Image description will be generated after appearance details are added',
  current_visible_equipment: 'No current visible equipment recorded',
  current_expression: 'No current expression recorded',
  current_pose: 'No current pose recorded',
  current_background: 'No current background recorded',
  current_lighting: 'No current lighting recorded',
  current_injury: 'No current injury recorded',
  art_style: 'Default art style will be used',
};

export const emptyState = (field) => EMPTY_STATES[field] || 'Not yet defined';

export const displayValue = (npc, field) => {
  const v = clean(npc?.[field]);
  return v || emptyState(field);
};

export const hasMixedAppearance = (npc) => {
  const n = npc || {};
  if (!has(n.physical_description)) return false;
  const clothingWords = /\b(wears|worn|wearing|apron|armor|armour|tabard|boots|cloak|robe|goggles|spectacles|helmet|hat|belt|sword|dagger|spear|shield|weapon|pack|gloves|gauntlets|chainmail)\b/i;
  return clothingWords.test(n.physical_description) && !has(n.clothing_equipment);
};

const CLOTHING_WORDS = /\b(wears|worn|wearing|apron|armor|armour|tabard|boots|cloak|robe|goggles|spectacles|helmet|hat|belt|sword|dagger|spear|shield|weapon|pack|gloves|gauntlets|chainmail|leather apron)\b/i;
const ANATOMY_WORDS = /\b(hair|eyes|eye|face|skin|scales|fur|feathers|horns|tusk|tusks|tail|wings|ears|nose|jaw|beard|mustache|scar|tattoo|build|height|complexion|brow|cheek)\b/i;
const ABSTRACT_WORDS = /\b(loyal|wants|wishes|desires|loves|hopes|fears|believes|trusts|hates|regret|vengeance|revenge|ambition|kind|cruel|brave|cowardly|generous|greedy|seeks)\b/i;

export const validateAppearance = (npc) => {
  const n = npc || {};
  const out = [];
  if (has(n.physical_description) && CLOTHING_WORDS.test(n.physical_description)) out.push({ field: 'physical_description', message: 'This describes clothing or equipment and may fit better under Clothing and Equipment.' });
  if (has(n.clothing_equipment) && ANATOMY_WORDS.test(n.clothing_equipment)) out.push({ field: 'clothing_equipment', message: 'This describes physical anatomy and may fit better under Physical Description.' });
  if (has(n.distinguishing_features) && ABSTRACT_WORDS.test(n.distinguishing_features)) out.push({ field: 'distinguishing_features', message: 'This contains abstract personality traits that cannot be seen. Consider moving them to Personality or Motivations.' });
  if (!has(n.image_prompt)) out.push({ field: 'image_prompt', message: 'No Image-Generation Description. Use Rebuild from Appearance to generate one.' });
  return out;
};

export const buildImageDescription = (npc) => {
  const n = npc || {};
  const clauses = [];
  const identity = [n.species, n.age, n.pronouns, n.class_name, n.subclass].map(clean).filter(Boolean);
  if (identity.length) clauses.push(`Portrait of a ${identity.join(' ')}.`);
  if (has(n.physical_description)) clauses.push(stripPeriod(n.physical_description) + '.');
  if (has(n.distinguishing_features)) clauses.push(stripPeriod(n.distinguishing_features) + '.');
  if (has(n.clothing_equipment)) clauses.push('Wears ' + stripPeriod(n.clothing_equipment).replace(/^wears\s+/i, '') + '.');
  if (has(n.current_visible_equipment)) clauses.push('Currently visible: ' + stripPeriod(n.current_visible_equipment) + '.');
  if (has(n.current_expression)) clauses.push('Expression: ' + stripPeriod(n.current_expression) + '.');
  if (has(n.current_pose)) clauses.push('Pose: ' + stripPeriod(n.current_pose) + '.');
  if (has(n.current_injury)) clauses.push('Current injury: ' + stripPeriod(n.current_injury) + '.');
  if (has(n.current_background)) clauses.push('Background: ' + stripPeriod(n.current_background) + '.');
  if (has(n.current_lighting)) clauses.push('Lighting: ' + stripPeriod(n.current_lighting) + '.');
  const style = has(n.art_style) ? clean(n.art_style) : 'fantasy tabletop RPG character portrait, painterly realism';
  clauses.push(style + '.');
  if (has(n.portrait_url)) clauses.push('Preserve the exact face, age, hair, eyes, skin, species traits, clothing design, signature equipment, proportions, color palette, and established art style of the approved portrait.');
  return dedup(clauses).join(' ');
};

const llm = (prompt, schema) => base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
const normalizeAppearance = (value, context) => {
  const data = requireRecord(value, context);
  return {
    physical_description: stringValue(data.physical_description),
    clothing_equipment: stringValue(data.clothing_equipment),
    distinguishing_features: stringValue(data.distinguishing_features),
  };
};

// ── Character Contract context builder ──
// Assembles established facts in priority order so generation never
// contradicts higher-priority information.
const buildContractContext = (npc) => {
  const n = npc || {};
  const sections = [];

  // Priority 1: Guild Master-entered decisions
  if (has(n.name)) sections.push(`Name: ${clean(n.name)}`);

  // Priority 3: Approved Character Contract facts — Identity
  const identity = [];
  if (has(n.species)) identity.push(`Species: ${clean(n.species)}`);
  if (has(n.sex_gender)) identity.push(`Sex/Gender: ${clean(n.sex_gender)}`);
  if (has(n.pronouns)) identity.push(`Pronouns: ${clean(n.pronouns)}`);
  if (has(n.age)) identity.push(`Age: ${clean(n.age)}`);
  if (has(n.class_name)) identity.push(`Class: ${clean(n.class_name)}`);
  if (has(n.subclass)) identity.push(`Subclass: ${clean(n.subclass)}`);
  if (has(n.occupation)) identity.push(`Occupation: ${clean(n.occupation)}`);
  if (has(n.faction)) identity.push(`Faction: ${clean(n.faction)}`);
  if (has(n.role)) identity.push(`Role: ${clean(n.role)}`);
  if (has(n.alignment)) identity.push(`Alignment: ${clean(n.alignment)}`);
  if (has(n.level)) identity.push(`Level: ${n.level}`);
  if (identity.length) sections.push(`--- IDENTITY ---\n${identity.join('\n')}`);

  // Priority 4: Custom Species / Species definition (established species-wide facts)
  const cs = n.custom_species_data;
  if (cs && typeof cs === 'object') {
    const csLines = [];
    if (has(cs.name)) csLines.push(`Species: ${clean(cs.name)}`);
    if (has(cs.description)) csLines.push(`Description: ${clean(cs.description)}`);
    if (has(cs.size)) csLines.push(`Typical Size: ${clean(cs.size)}`);
    if (has(cs.lifespan)) csLines.push(`Typical Lifespan: ${clean(cs.lifespan)}`);
    if (has(cs.physical_traits)) csLines.push(`Physical Traits: ${clean(cs.physical_traits)}`);
    if (has(cs.distinguishing_features)) csLines.push(`Distinguishing Features: ${clean(cs.distinguishing_features)}`);
    if (has(cs.cultural_associations)) csLines.push(`Cultural Associations: ${clean(cs.cultural_associations)}`);
    if (csLines.length) sections.push(`--- SPECIES DEFINITION (established species-wide facts — use ONLY these, do not invent new species-wide facts) ---\n${csLines.join('\n')}`);
  }

  // Priority 5: Homeland and Culture
  const bg = [];
  if (has(n.homeland)) bg.push(`Homeland: ${clean(n.homeland)}`);
  if (has(n.region)) bg.push(`Region: ${clean(n.region)}`);
  if (has(n.culture)) bg.push(`Culture: ${clean(n.culture)}`);
  if (has(n.campaign)) bg.push(`Campaign: ${clean(n.campaign)}`);
  if (bg.length) sections.push(`--- BACKGROUND ---\n${bg.join('\n')}`);

  // Priority 6: Accepted personality/mannerism traits (context only)
  const traits = [];
  if (has(n.personality_traits)) traits.push(`Personality: ${clean(n.personality_traits)}`);
  if (has(n.mannerisms)) traits.push(`Mannerisms: ${clean(n.mannerisms)}`);
  if (has(n.temperament)) traits.push(`Temperament: ${clean(n.temperament)}`);
  if (has(n.speaking_style)) traits.push(`Speaking Style: ${clean(n.speaking_style)}`);
  if (has(n.expressions)) traits.push(`Expressions: ${clean(n.expressions)}`);
  if (traits.length) sections.push(`--- ACCEPTED TRAITS (use as context only; do not invent new traits) ---\n${traits.join('\n')}`);

  return sections.length ? sections.join('\n\n') : 'A generic fantasy NPC.';
};

// Existing appearance fields the generator must not contradict.
const buildExistingAppearance = (npc) => {
  const n = npc || {};
  const lines = [];
  if (has(n.physical_description)) lines.push(`Physical Description (established): ${clean(n.physical_description)}`);
  if (has(n.clothing_equipment)) lines.push(`Clothing & Equipment (established): ${clean(n.clothing_equipment)}`);
  if (has(n.distinguishing_features)) lines.push(`Distinguishing Features (established): ${clean(n.distinguishing_features)}`);
  return lines.length ? `\n\n--- EXISTING APPEARANCE (do not contradict these) ---\n${lines.join('\n')}` : '';
};

const GUARDRAILS = `FACT PRIORITY (lower-priority information must never contradict higher-priority facts):
1. Guild Master-entered decisions
2. Locked character facts
3. Approved Character Contract facts (Identity, Background)
4. Species definition facts (only what is explicitly defined in the Species definition)
5. Homeland and Culture
6. Accepted personality/mannerism traits
7. Generated character-specific filler

SPECIES FACTS: Use ONLY information explicitly stored in the Species definition. Do NOT invent unlisted species-wide facts (e.g., "all [Species] are seven feet tall", "all [Species] have glowing eyes", "all [Species] grow crystals", "[Species] cannot grow hair"). Individual character details ARE allowed and must be phrased as character-specific (e.g., "Doran has dark amber eyes" — NOT "Stoneborn have dark amber eyes").

AGE: State age numerically (e.g., "95-year-old Stoneborn"). Do NOT invent life-stage labels (child, young adult, middle-aged, elderly) based on numerical age and species lifespan unless maturation/life-stage information is explicitly defined in the Species definition.

GENERATED DETAILS ARE CHARACTER-SPECIFIC: All generated filler belongs to this NPC only. It does not update or generalize to any Species, Culture, or Campaign library.`;

export const generateAppearance = async (npc) => {
  const n = npc || {};
  const ctx = buildContractContext(npc) + buildExistingAppearance(npc);
  const prompt = `Generate a visually consistent appearance for a fantasy tabletop RPG NPC using three clearly separated fields.

${GUARDRAILS}

FIELD RULES:
- physical_description: permanent body and anatomy only — build, size, skin, face, hair or equivalent, eyes, permanent anatomy, permanent markings. No clothing, no pose, no personality.
- clothing_equipment: worn and carried items only — clothing, armor, tools, weapons, accessories. Homeland and Culture SHOULD strongly influence clothing style, materials, tools, and professional items. Do NOT turn Culture into personality.
- distinguishing_features: visually recognizable traits only — established physical traits, recognizable markings, accepted mannerisms (only if visually apparent), visually noticeable equipment. Do NOT invent new personality traits (e.g., "simmering irritation", "aggressive", "impatient", "hostile", "nervous") unless supported by accepted Character Contract traits. If an accepted trait says the character taps fingers when anxious, the visible tapping may be described — do NOT invent the emotional state unless it is already established.

CONSISTENCY: Keep the three fields consistent (no contradictions in hair, eyes, species). Do not duplicate the same detail across fields. Write in third person.

CHARACTER CONTRACT:
${ctx}

Return JSON with keys physical_description, clothing_equipment, distinguishing_features. Each value is a short descriptive paragraph.`;
  const schema = { type: 'object', properties: { physical_description: { type: 'string' }, clothing_equipment: { type: 'string' }, distinguishing_features: { type: 'string' } }, required: ['physical_description', 'clothing_equipment', 'distinguishing_features'] };
  return normalizeAppearance(await llm(prompt, schema), 'Appearance response');
};

export const generatePhysical = async (npc) => {
  const n = npc || {};
  const ctx = buildContractContext(npc) + buildExistingAppearance(npc);
  const prompt = `Generate a Physical Description for a fantasy tabletop RPG NPC.

${GUARDRAILS}

SCOPE: Describe only the permanent physical body and identifiable physical characteristics — apparent age, height, build, facial structure, skin tone, scale/fur/feather characteristics, hair color and style, eye color, facial hair, scars, tattoos, birthmarks, missing limbs, permanent injuries, horns, tusks, tail, wings, or other permanent anatomical traits.
Do NOT include clothing, armor, weapons, tools, location, mood, personality, pose, or background.
Species facts are limited to the Species definition. Individual details (eye color, hair, scars) are character-specific — phrase them as belonging to this character, not to the entire species.
Write in third person, one short paragraph.

CHARACTER CONTRACT:
${ctx}

Return JSON with key physical_description (string).`;
  const schema = { type: 'object', properties: { physical_description: { type: 'string' } }, required: ['physical_description'] };
  return stringValue(requireRecord(await llm(prompt, schema), 'Physical appearance response').physical_description);
};

export const generateClothing = async (npc) => {
  const n = npc || {};
  const ctx = buildContractContext(npc) + buildExistingAppearance(npc);
  const prompt = `Generate a Clothing and Equipment description for a fantasy tabletop RPG NPC.

${GUARDRAILS}

SCOPE: Describe only what the character is currently wearing, carrying, holding, or using — clothing, armor, footwear, cloaks, robes, jewelry, uniforms, faction symbols, helmets, shields, weapons, tools, bags, arcane focuses, holy symbols, musical instruments, visible potions, profession-specific equipment.
Homeland and Culture SHOULD strongly influence clothing style, materials, tools, accessories, and professional items. A coastal merchant culture may produce maritime or merchant-related clothing and equipment.
Do NOT turn Culture into personality — Culture informs material culture (clothing, tools, customs), not emotional disposition.
Do NOT include anatomy, scales, fur, facial scars, or body structure.
For creatures that would not wear clothing (dragons, beasts, constructs, ghosts), describe natural armor, ornaments, chains, barding, spectral remnants, or state that no manufactured clothing is visible.
Do not grant powerful magical items unless justified by the Character Contract.
Write in third person, one short paragraph.

CHARACTER CONTRACT:
${ctx}

Return JSON with key clothing_equipment (string).`;
  const schema = { type: 'object', properties: { clothing_equipment: { type: 'string' } }, required: ['clothing_equipment'] };
  return stringValue(requireRecord(await llm(prompt, schema), 'Clothing response').clothing_equipment);
};

export const generateDistinguishing = async (npc) => {
  const n = npc || {};
  const ctx = buildContractContext(npc) + buildExistingAppearance(npc);
  const prompt = `Generate a Distinguishing Features description for a fantasy tabletop RPG NPC.

${GUARDRAILS}

SCOPE: Describe only visually recognizable qualities — established physical traits, recognizable markings, accepted mannerisms (only if visually apparent), accepted expressions or behaviors (only if already established in the Character Contract), visually noticeable equipment, distinctive movement, signature expressions.
Do NOT invent new personality traits (e.g., "simmering irritation", "aggressive", "impatient", "hostile", "nervous") unless those behaviors are supported by accepted Character Contract traits.
If an accepted trait says the character taps their fingers when anxious, the visible tapping mannerism may be described. Do NOT invent the emotional state that causes a mannerism unless that state is already established.
Do NOT include clothing or equipment details (those belong in Clothing & Equipment).
Do NOT include abstract personality traits (loyal, wants revenge, loves history).
Write in third person, one short paragraph.

CHARACTER CONTRACT:
${ctx}

Return JSON with key distinguishing_features (string).`;
  const schema = { type: 'object', properties: { distinguishing_features: { type: 'string' } }, required: ['distinguishing_features'] };
  return stringValue(requireRecord(await llm(prompt, schema), 'Distinguishing features response').distinguishing_features);
};

export const ART_STYLES = [
  'Fantasy tabletop RPG — painterly realism',
  'Classic fantasy illustration',
  'Detailed fantasy concept art',
  'Dark fantasy realism',
  'Heroic fantasy realism',
  'High-fantasy storybook illustration',
  'Medieval illuminated manuscript',
  'Parchment bestiary illustration',
  'Fantasy graphic novel',
  'Comic-book fantasy',
  'Cel-shaded fantasy',
  'Stylized 3D fantasy portrait',
  'Hand-painted RPG portrait',
  'Watercolor fantasy',
  'Gothic fantasy',
  'Whimsical fantasy',
  'Cozy tavern fantasy',
  'Arcane academy fantasy',
  'Gritty low-fantasy realism',
  'Mythic legendary portrait',
  'Monster manual illustration',
  'Creature concept illustration',
  'Spectral and ethereal fantasy',
  'Clockwork and steampunk fantasy',
  'Custom Art Style',
];

export const DEFAULT_ART_STYLE = 'Fantasy tabletop RPG — painterly realism';

export const recommendArtStyles = (npc) => {
  const n = npc || {};
  const text = `${n.species || ''} ${n.role || ''} ${n.class_name || ''} ${n.occupation || ''} ${n.subclass || ''}`.toLowerCase();
  const sets = [];
  if (/dragon|beast|creature|monster|wyrm|hydra/.test(text)) sets.push(['Monster manual illustration', 'Creature concept illustration', 'Dark fantasy realism', 'Mythic legendary portrait']);
  if (/artificer|construct|engineer|tinker|clockwork|steampunk|mech/.test(text)) sets.push(['Clockwork and steampunk fantasy', 'Detailed fantasy concept art', 'Fantasy tabletop RPG — painterly realism']);
  if (/innkeeper|tavern|barkeep|merchant|farmer|commoner|blacksmith/.test(text)) sets.push(['Cozy tavern fantasy', 'Classic fantasy illustration', 'Hand-painted RPG portrait']);
  if (/noble|royal|king|queen|lord|lady|duke|emperor|baron/.test(text)) sets.push(['Heroic fantasy realism', 'Classic fantasy illustration', 'Medieval illuminated manuscript']);
  if (/ghost|spirit|undead|wraith|specter|vampire|lich|revenant/.test(text)) sets.push(['Spectral and ethereal fantasy', 'Gothic fantasy', 'Dark fantasy realism']);
  if (/jester|bard|comic|lighthearted|whimsical|fool/.test(text)) sets.push(['Whimsical fantasy', 'High-fantasy storybook illustration', 'Comic-book fantasy']);
  const recs = [...new Set(sets.flat())].filter((s) => ART_STYLES.includes(s));
  return recs.length ? recs : ['Fantasy tabletop RPG — painterly realism', 'Classic fantasy illustration', 'Hand-painted RPG portrait'];
};

export const migrateAppearance = async (npc) => {
  const n = npc || {};
  const source = [n.physical_description, n.distinguishing_features, n.clothing_equipment].filter(has).map(clean).join('\n');
  if (!source) return null;
  const prompt = `Split the following mixed NPC appearance text into three clearly separated fields.\n- physical_description: permanent body and anatomy only.\n- clothing_equipment: worn and carried items only.\n- distinguishing_features: visually recognizable traits, expressions, mannerisms that can be seen (no abstract personality).\nKeep details consistent and do not duplicate the same detail across fields. Refine wording to third person. Do not invent new details beyond the source text.\n\nMixed text:\n${source}\n\nReturn JSON with keys physical_description, clothing_equipment, distinguishing_features.`;
  const schema = { type: 'object', properties: { physical_description: { type: 'string' }, clothing_equipment: { type: 'string' }, distinguishing_features: { type: 'string' } }, required: ['physical_description', 'clothing_equipment', 'distinguishing_features'] };
  return normalizeAppearance(await llm(prompt, schema), 'Appearance migration response');
};
