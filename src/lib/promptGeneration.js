import { base44 } from '@/api/base44Client';

export const STEP1_FIELDS = ['name','nicknames','pronouns','age','species','homeland','region','culture','occupation','class_name','subclass','level','alignment','faction','campaign'];

export const SOURCE_LABELS = {
  prompt: 'From Original Prompt',
  campaign: 'From Campaign Setting',
  lore: 'From Existing Campaign Lore',
  generated: 'Generated Suggestion',
  manual: 'Manually Entered',
  review: 'Needs Review',
  na: 'Not Applicable',
};

export const loadCampaign = async (campaignId) => {
  if (!campaignId) return null;
  try { return await base44.entities.Campaign.get(campaignId); } catch { return null; }
};

export const loadCampaigns = async () => {
  try { return await base44.entities.Campaign.list(); } catch { return []; }
};

const GENERIC_SETTINGS = [
  'Industrial fantasy city','Coastal trade kingdom','Rural frontier settlement',
  'Arcane academy city-state','Dwarven mountain hold','Elven forest enclave',
  'Underdark settlement','War-torn border province',
];

export const generateGenericSetting = (npc) => {
  const text = `${npc?.occupation||''} ${npc?.role||''} ${npc?.species||''} ${npc?.class_name||''} ${npc?.backstory||''}`.toLowerCase();
  if (/artificer|engineer|mechanic|pump|industrial|factory|soot|forge/.test(text)) return 'Industrial fantasy city';
  if (/sailor|merchant|trade|coast|port|fisher|smuggler/.test(text)) return 'Coastal trade kingdom';
  if (/farmer|frontier|rural|homestead|ranger|courier/.test(text)) return 'Rural frontier settlement';
  if (/wizard|arcane|academy|scholar|mage|sage/.test(text)) return 'Arcane academy city-state';
  if (/dwarf|mountain|miner/.test(text)) return 'Dwarven mountain hold';
  if (/elf|elven|forest|druid/.test(text)) return 'Elven forest enclave';
  if (/drow|underdark|deep|subterranean/.test(text)) return 'Underdark settlement';
  if (/war|border|refugee|soldier|mercenary|convict/.test(text)) return 'War-torn border province';
  return GENERIC_SETTINGS[0];
};

export const RULESETS = ['D&D 5e (2014)', 'D&D 5e (2024)', 'One D&D / 5.5e', 'Pathfinder 2e', 'D&D 3.5e', 'Custom'];

const SUBCLASS_LEVELS = { 'D&D 5e (2014)': 3, 'D&D 5e (2024)': 3, 'One D&D / 5.5e': 3, 'Pathfinder 2e': 1, 'D&D 3.5e': 1, Custom: 3 };

export const subclassLevelFor = (ruleset) => SUBCLASS_LEVELS[ruleset] || 3;

export const subclassStatus = (npc) => {
  if (!npc?.class_name) return 'Not applicable for role-based NPC.';
  const required = subclassLevelFor(npc?.ruleset);
  const lvl = Number(npc?.level) || 1;
  if (lvl < required) return `Not yet available — unlocks at class level ${required}.`;
  if (!npc?.subclass || !String(npc.subclass).trim()) return 'Selection required';
  return npc.subclass;
};

export const BUILD_TYPES = ['NPC Role', 'Adventuring Class', 'Hybrid NPC', 'Custom NPC'];
export const POWER_LEVELS = ['Commoner', 'Trained', 'Veteran', 'Elite', 'Boss', 'Custom'];

export const buildType = (npc) => {
  if (npc?.npc_build_type) return npc.npc_build_type === 'Custom NPC' ? 'Custom' : npc.npc_build_type;
  const hasClass = !!(npc?.class_name && String(npc.class_name).trim());
  const hasRole = !!(npc?.occupation && String(npc.occupation).trim());
  if (hasClass && hasRole) return 'Hybrid NPC';
  if (hasClass) return 'Adventuring Class';
  if (hasRole) return 'NPC Role';
  return 'Custom';
};

export const showsClass = (npc) => {
  const bt = npc?.npc_build_type;
  return bt === 'Adventuring Class' || bt === 'Hybrid NPC' || !bt;
};
export const showsRole = (npc) => {
  const bt = npc?.npc_build_type;
  return bt === 'NPC Role' || bt === 'Hybrid NPC' || bt === 'Custom NPC' || !bt;
};

export const validateCoherence = (npc) => {
  const w = [];
  const age = Number(npc?.age);
  const occ = `${npc?.occupation||''} ${npc?.backstory||''}`.toLowerCase();
  if (age && age < 16 && npc?.class_name) w.push(`Age ${age} with an adventuring class (${npc.class_name}) may need review.`);
  if (age && age < 16 && /ex-convict|convict|veteran|elderly|ancient|retired/.test(occ)) w.push(`Age ${age} may conflict with "${npc.occupation}".`);
  if (age && age > 300 && npc?.species && !/dragon|elf|dwarf|gnome|halfling|tiefling|aasimar|fey|fairy|undead|spirit|construct|elemental|deva|warforged/.test(npc.species.toLowerCase())) w.push('Age may exceed typical lifespan for this species.');
  if (npc?.homeland && npc?.region && npc.homeland === npc.region && npc.region === npc.culture) w.push('Homeland, Region, and Culture are identical — consider differentiating them.');
  return w;
};

const NAME_SYLLABLES = ['ael','bran','cor','dun','el','fen','gar','hal','is','jor','kel','lyr','mor','nyx','os','pyr','quor','ryn','syl','tor','ul','val','wyn','xan','yor','zel','thas','mir','ov','ash','brik','cav','dro','gwen','hest','iv','kal','luc','mael','nys','orr','pael','ros','shen','tar','ume','ves','whil','yr','zeph'];
const randomNameSeed = () => {
  const pick = () => NAME_SYLLABLES[Math.floor(Math.random() * NAME_SYLLABLES.length)];
  return `${pick()}${pick()}`;
};

const buildPrompt = (prompt, campaign, existing) => {
  const setting = campaign?.setting || existing?.campaign || '';
  const seed = randomNameSeed();
  return `You are generating Step 1 Basic Information for a fantasy tabletop RPG NPC from a user's written prompt. Use a two-pass process.

Pass 1 — Extract explicit information directly stated in the prompt.
Pass 2 — Generate compatible values for fields that remain empty, using the prompt, campaign setting, species, role, class, age, alignment, and world information. Make the result one internally consistent character.

Rules:
- Do not infer pronouns from a name alone. Infer from explicit gender wording (e.g. "elderly man" → he/him, "young woman" → she/her, "nonbinary scholar" → they/them); otherwise use "Unspecified".
- Age must match species lifespan and descriptive wording (child/young/middle-aged/elderly/ancient). Do not produce contradictory combinations.
- Homeland = the nation/city/settlement/plane they consider home. Region = a more specific district/province/neighborhood/territory/route. Culture = the social/ethnic/professional/guild/community traditions. Do not put the same value in all three.
- NPC Role (occupation) is the social function. Adventuring Class is separate. Do not treat an occupation (courier, farmer, guard, artisan, mechanic) as an adventuring class. If the NPC has both, fill both occupation and class_name.
- Subclass: only suggest one if class level >= 3 and a subclass fits the class; otherwise leave subclass empty.
- Faction: prefer an existing campaign faction when the campaign provides one; otherwise generate an appropriate faction, or "Independent" if no affiliation fits.
- Campaign setting: use the provided campaign setting; if none, generate a concise generic setting label (a few words, not a paragraph).
- Never use copyrighted named characters.
- The name field must always be populated. If the prompt does not state a name, generate a fitting, original fantasy character name. Never return an empty name.
- Each NPC must have a DISTINCT, original name. Do NOT default to or repeat common surnames such as "Thorne", "Ironheart", "Ashwood", or any name you have used before. Vary both the given name and surname every time. Draw naming flavor from the character's species, culture, and homeland when known.
- Use this random phonetic seed as inspiration for the name's sound (do not output the seed itself): ${seed}
- Return a sources object mapping each field to one of: prompt, campaign, lore, generated, review, na.
- Return a warnings array of any contradictions that need review.

User prompt: ${prompt || '(none)'}
Campaign setting: ${setting || '(none selected — generate a concise generic setting)'}
Existing values to preserve (do not overwrite unless empty): ${JSON.stringify(existing || {})}

Return JSON with keys: name, nicknames, pronouns, age (string), species, homeland, region, culture, occupation, class_name, subclass, level (number), alignment, faction, campaign, sources (object mapping field→source), warnings (array of strings), extracted (array of field names), generated (array of field names).`;
};

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' }, nicknames: { type: 'string' }, pronouns: { type: 'string' },
    age: { type: 'string' }, species: { type: 'string' }, homeland: { type: 'string' },
    region: { type: 'string' }, culture: { type: 'string' }, occupation: { type: 'string' },
    class_name: { type: 'string' }, subclass: { type: 'string' }, level: { type: 'number' },
    alignment: { type: 'string' }, faction: { type: 'string' }, campaign: { type: 'string' },
    sources: { type: 'object', additionalProperties: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } },
    extracted: { type: 'array', items: { type: 'string' } },
    generated: { type: 'array', items: { type: 'string' } },
  },
};

export const generateFromPrompt = async (prompt, campaign, existing) => {
  const data = await base44.integrations.Core.InvokeLLM({
    prompt: buildPrompt(prompt, campaign, existing),
    response_json_schema: schema,
  });
  return data || {};
};

export const generateMissingDetails = async (npc, campaign) => {
  const existing = {};
  for (const f of STEP1_FIELDS) if (npc[f] && String(npc[f]).trim()) existing[f] = npc[f];
  const data = await generateFromPrompt(npc.original_creation_prompt || '', campaign, existing);
  const out = { ...npc };
  const sources = { ...(npc.prompt_sources || {}) };
  for (const f of STEP1_FIELDS) {
    if (!out[f] || !String(out[f]).trim()) {
      if (data[f] != null && String(data[f]).trim() !== '') {
        out[f] = f === 'level' ? Number(data[f]) : data[f];
        sources[f] = (data.sources && data.sources[f]) || 'generated';
      }
    }
  }
  if (!out.faction || !String(out.faction).trim()) { out.faction = 'Independent'; sources.faction = sources.faction || 'generated'; }
  if (!out.campaign || !String(out.campaign).trim()) { out.campaign = campaign?.setting || generateGenericSetting(out); sources.campaign = sources.campaign || 'generated'; }
  out.prompt_sources = sources;
  out.prompt_meta = { ...(npc.prompt_meta || {}), warnings: data.warnings || [], extracted: data.extracted || [], generated: data.generated || [] };
  return out;
};