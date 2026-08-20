import { base44 } from '@/api/base44Client';

const has = (v) => !!(v && String(v).trim());

export const HISTORY_FIELDS = [
  { key: 'backstory', label: 'Summary Backstory', core: true, desc: 'Established facts that define the NPC.', suggestedDesc: 'Suggested history based on established character details.' },
  { key: 'goals', label: 'Core Motivation', core: true, desc: 'The stable reason behind the NPC\'s actions.', suggestedDesc: 'Suggested motivation based on established character details.' },
  { key: 'relationships', label: 'Important Relationships', desc: 'Family, allies, rivals, mentors.' },
  { key: 'objectives', label: 'Short-term Goal', desc: 'Current immediate objective.' },
  { key: 'current_problems', label: 'Current Problem', desc: 'Immediate challenge.' },
  { key: 'party_stance_reasons', label: 'Reason to Help or Oppose the Party', desc: 'Why the NPC engages with the party.' },
  { key: 'internal_conflicts', label: 'Internal Conflict', desc: 'Tensions within the NPC.' },
  { key: 'secrets', label: 'Secret (DM only)', desc: 'Hidden information.' },
];

export const SECTION_LAYOUT = {
  shaped: ['backstory', 'goals', 'relationships'],
  wantNow: ['objectives', 'current_problems', 'party_stance_reasons'],
  beneath: ['internal_conflicts', 'secrets'],
};

export const SUGGESTIBLE_KEYS = ['relationships', 'internal_conflicts', 'secrets'];

const FACT_PRIORITY = `FACT PRIORITY (authoritative first — never override a higher tier):
1. Guild Master-entered facts (manually typed or edited values).
2. Locked fields.
3. Accepted Character Contract facts.
4. Accepted Personality traits.
5. Homeland.
6. Culture.
7. Explicitly established occupation, role, faction, and relationships.
8. Cautious, character-specific connective flavor — modest and never consequential.`;

const GUARDRAILS = `${FACT_PRIORITY}

CULTURE VS OCCUPATION GUARDRAIL:
Culture describes social context, not personal biography. A culture associated with commerce (e.g. "Coastal Merchant Culture") may support familiarity with trade customs, harbor terminology, cultural exposure to merchants, and social norms shaped by commerce. It does NOT establish that this NPC is a trader, merchant, sailor, ship crew, quartermaster, business owner, or cargo handler. Do not turn cultural influence into a personal occupation or career.

AGE / BIOGRAPHICAL DURATION GUARDRAIL:
Do not infer that a character has performed an occupation or role for most or all of their lifetime. Age alone (e.g. 95) does NOT support phrases like "spent nearly a century as..." unless the Character Contract explicitly establishes that history. Do not invent childhood, adolescence, or career duration from Age alone.

SPECIES LORE GUARDRAIL:
Do NOT infer biography, culture, profession, religion, personality, or history from Species alone. Species contributes only its actual established facts (e.g. lifespan, noted traits). "Stoneborn" does not imply mining, masonry, subterranean upbringing, mountain culture, a particular religion, profession, social status, personality, or historical events unless separately established.

BIOGRAPHICAL INVENTION GUARDRAIL:
Do not silently invent consequential campaign facts — dead spouses or children, crimes, military service, major organizations, debts, enemies, betrayals, traumatic events, hidden treasure, political offices, named historical events, or major property ownership — unless supported by existing facts. Prefer modest connective details over major biography.

BULK RESTRAINT:
Prefer restraint. You do NOT need to fill every field. Empty is valid and preferred over invention. For a character with No Campaign / Standalone, a good result may include only Summary Backstory, Core Motivation, and possibly Internal Conflict, while leaving Important Relationships, Short-term Goal, Current Problem, Reason to Help or Oppose the Party, and Secret empty.

RELATIONSHIPS:
Do not invent named or unnamed family members, allies, rivals, mentors, or enemies merely because the field is empty. If unsupported, return an empty string. Generated relationship suggestions are suggestions, not canon.

SHORT-TERM GOAL:
Do not derive a Short-term Goal from an invented occupation. For No Campaign / Standalone characters, leave this field empty unless established facts clearly support a modest goal. A generated goal remains a suggestion.

CURRENT PROBLEM:
Do not invent a current campaign situation merely to populate this field. Do not create current business deals, active enemies, debts, shipments, legal problems, missing people, or faction conflicts without established support. Empty is valid.

REASON TO HELP OR OPPOSE THE PARTY:
If there is no established party or campaign relationship, leave this field EMPTY. Do not infer party loyalty, hostility, suspicion, or alliance. This field may be generated later when party context exists or the Guild Master explicitly requests it.

INTERNAL CONFLICT:
Do not invent trauma or psychological disorders. Internal Conflict may be cautiously suggested only when two established facts genuinely conflict (for example, optimism combined with distrust of magic). If no conflict is supported, return an empty string.

SECRET (DM ONLY):
Do not fill the Secret field merely because it exists. An NPC does not require a secret. Return an empty string unless established character facts strongly imply one. Do not invent arbitrary crimes, betrayals, conspiracies, forbidden identities, or hidden loyalties.`;

const buildProfile = (npc) => {
  const n = npc || {};
  return [
    n.name && `Name: ${n.name}`,
    n.species && `Species: ${n.species}`,
    n.age && `Age: ${n.age}`,
    n.sex_gender && `Sex/Gender: ${n.sex_gender}`,
    n.occupation && `Occupation: ${n.occupation}`,
    n.class_name && `Class: ${n.class_name}`,
    n.homeland && `Homeland: ${n.homeland}`,
    n.region && `Region: ${n.region}`,
    n.culture && `Culture: ${n.culture}`,
    n.faction && `Faction: ${n.faction}`,
    n.role && `Role: ${n.role}`,
    n.personality_traits && `Personality: ${n.personality_traits}`,
    n.ideals && `Ideals: ${n.ideals}`,
    n.bonds && `Bonds: ${n.bonds}`,
    n.flaws && `Flaws: ${n.flaws}`,
    n.mannerisms && `Mannerisms: ${n.mannerisms}`,
    n.campaign && `Campaign setting: ${n.campaign}`,
    n.original_creation_prompt && `Original prompt: ${n.original_creation_prompt}`,
  ].filter(Boolean).join('\n');
};

export const generateHistory = async (npc) => {
  const prompt = `You are helping a Dungeon Master develop a character's story for a fantasy tabletop RPG NPC. Suggest a coherent history and motivation profile based ONLY on established facts. Generated text is a PROPOSAL for the Guild Master to accept — not unquestionable canon.

${GUARDRAILS}

Suggest these fields together so they are internally consistent and do not contradict each other or the existing profile. Return empty strings ("") for any field you cannot support from established facts:
- backstory: Summary Backstory (where they came from, what shaped them).
- goals: Core Motivation (the stable reason behind their actions).
- relationships: Important Relationships (only if supported by facts; otherwise empty string).
- objectives: Short-term Goal (current immediate objective; empty if no campaign and no modest established goal).
- current_problems: Current Problem (immediate challenge; empty if unsupported).
- party_stance_reasons: Reason to Help or Oppose the Party (empty if no party/campaign context).
- internal_conflicts: Internal Conflict (only if two established facts genuinely conflict; otherwise empty string).
- secrets: Secret (DM only) (only if strongly implied by established facts; otherwise empty string).

Write in third person, concise.

NPC profile:
${buildProfile(npc) || 'A generic fantasy NPC'}

Return JSON with keys: backstory, goals, relationships, objectives, current_problems, party_stance_reasons, internal_conflicts, secrets (all strings).`;
  const schema = { type: 'object', properties: Object.fromEntries(HISTORY_FIELDS.map((f) => [f.key, { type: 'string' }])), required: HISTORY_FIELDS.map((f) => f.key) };
  try {
    return await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
  } catch { return null; }
};

const FIELD_GUIDES = {
  secrets: `Suggest a Secret (DM only) for this NPC. Apply a HIGH EVIDENCE STANDARD: only suggest a secret when established character facts strongly imply one. Do not invent arbitrary crimes, betrayals, conspiracies, forbidden identities, or hidden loyalties. If no secret is supported, return an empty string. An NPC does not require a secret.`,
  internal_conflicts: `Suggest an Internal Conflict for this NPC. Do not invent trauma or psychological disorders. Derive cautiously only from two genuinely conflicting established motivations, ideals, bonds, flaws, or obligations. If no conflict is supported, return an empty string.`,
  relationships: `Suggest Important Relationships for this NPC. Do not invent named or unnamed family members, allies, rivals, mentors, or enemies unless supported by established facts. If unsupported, return an empty string.`,
  objectives: `Suggest a Short-term Goal for this NPC. Do not derive it from an invented occupation. For No Campaign / Standalone, only suggest a modest goal clearly supported by established facts; otherwise return an empty string.`,
  current_problems: `Suggest a Current Problem for this NPC. Do not invent current business deals, active enemies, debts, shipments, legal problems, missing people, or faction conflicts. If unsupported, return an empty string.`,
  party_stance_reasons: `Suggest a Reason to Help or Oppose the Party. If there is no established party or campaign relationship, return an empty string. Do not infer loyalty, hostility, suspicion, or alliance.`,
};

export const suggestField = async (npc, key) => {
  const field = HISTORY_FIELDS.find((f) => f.key === key);
  if (!field) return null;
  const guide = FIELD_GUIDES[key] || `Suggest the ${field.label} for this NPC based on established facts. Prefer modest, character-specific detail. If unsupported, return an empty string.`;
  const prompt = `You are helping a Dungeon Master develop a character's story for a fantasy tabletop RPG NPC. ${guide} The result is a PROPOSAL for the Guild Master, not canon.

${FACT_PRIORITY}

CULTURE VS OCCUPATION GUARDRAIL: Culture describes social context, not personal biography. A commerce-associated culture supports familiarity with trade customs, harbor terminology, and social norms — not that this NPC is a trader, merchant, sailor, or business owner.

AGE / BIOGRAPHICAL DURATION GUARDRAIL: Do not infer an occupation performed for most or all of a lifetime from Age alone.

SPECIES LORE GUARDRAIL: Do NOT infer biography, culture, profession, religion, personality, or history from Species alone.

BIOGRAPHICAL INVENTION GUARDRAIL: Do not silently invent consequential campaign facts (dead spouses or children, crimes, military service, major organizations, debts, enemies, betrayals, traumatic events, hidden treasure, political offices, named historical events, major property ownership) unless supported by existing facts.

Write in third person, concise.

NPC profile:
${buildProfile(npc) || 'A generic fantasy NPC'}

Return JSON with a single key "${key}" (string). Use an empty string if you cannot support the suggestion from established facts.`;
  const schema = { type: 'object', properties: { [key]: { type: 'string' } }, required: [key] };
  try {
    return await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
  } catch { return null; }
};