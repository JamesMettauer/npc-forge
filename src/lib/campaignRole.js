import { base44 } from '@/api/base44Client';

export const CAMPAIGN_ROLES = [
  'Ally', 'Enemy', 'Neutral', 'Quest Giver', 'Informant', 'Merchant', 'Companion',
  'Rival', 'Authority Figure', 'Faction Agent', 'Witness', 'Suspect', 'Local Expert',
  'Recurring NPC', 'Minor Background NPC', 'Major Story NPC', 'Villain', 'Custom Role',
];

export const STANDALONE_NOTE =
  'This NPC is not currently tied to an active campaign. Roleplay sessions may be used for testing or independent scenes without affecting campaign continuity.';

const clean = (v) => (v == null || typeof v === 'object' ? '' : String(v).trim());
const has = (v) => !!clean(v);

export const loadCampaignFull = async (campaignId) => {
  if (!campaignId) return null;
  try { return await base44.entities.Campaign.get(campaignId); } catch { return null; }
};

// Gather campaign-relevant context from the campaign entity and any sibling NPCs
// in the same campaign (existing regions, factions, locations) to avoid duplicates.
export const gatherCampaignContext = async (campaignId) => {
  const campaign = await loadCampaignFull(campaignId);
  if (!campaign) return null;
  let siblings = [];
  try {
    const all = await base44.entities.NPC.filter({ campaign_id: campaignId }, '-created_date', 50);
    siblings = all || [];
  } catch { siblings = []; }
  const regions = new Set();
  const factions = new Set();
  const locations = new Set();
  for (const s of siblings) {
    if (has(s.region)) regions.add(s.region);
    if (has(s.faction)) factions.add(s.faction);
    if (has(s.location)) locations.add(s.location);
  }
  return {
    campaign,
    regions: [...regions],
    factions: [...factions],
    locations: [...locations],
    siblingCount: siblings.length,
  };
};

const buildProfile = (npc) => {
  const n = npc || {};
  return [
    n.name && `Name: ${n.name}`,
    n.species && `Species: ${n.species}`,
    n.occupation && `Occupation: ${n.occupation}`,
    n.class_name && `Class: ${n.class_name}`,
    n.faction && `Faction: ${n.faction}`,
    n.homeland && `Homeland: ${n.homeland}`,
    n.region && `Region: ${n.region}`,
    n.culture && `Culture: ${n.culture}`,
    n.alignment && `Alignment: ${n.alignment}`,
    n.personality_traits && `Personality: ${n.personality_traits}`,
    n.ideals && `Ideals: ${n.ideals}`,
    n.bonds && `Bonds: ${n.bonds}`,
    n.flaws && `Flaws: ${n.flaws}`,
    n.mannerisms && `Mannerisms: ${n.mannerisms}`,
    n.goals && `Goals: ${n.goals}`,
    n.backstory && `Backstory: ${n.backstory}`,
  ].filter(Boolean).join('\n');
};

const ROLE_BOARD = [
  'Ally', 'Enemy', 'Neutral', 'Quest Giver', 'Informant', 'Merchant', 'Companion',
  'Rival', 'Authority Figure', 'Faction Agent', 'Witness', 'Suspect', 'Local Expert',
  'Recurring NPC', 'Minor Background NPC', 'Major Story NPC', 'Villain', 'Custom Role',
];

const GUARDRAILS = `FACT PRIORITY (authoritative first — generated content must never outrank a higher tier):
1. Guild Master Decision
2. Locked Fact
3. Accepted / Core Character Contract Fact
4. Source-defined Species Fact
5. Homeland / Culture influence
6. Accepted Traits
7. Cautious character-specific suggestion

CAMPAIGN ROLE:
The "role" field MUST be exactly one value from this controlled Role Board list:
${ROLE_BOARD.join(' | ')}
Do NOT invent a new free-text profession or role (e.g. "Chronometrist", "Truth-Seeker", "Independent Chronometrist and Truth-Seeker" are INVALID).
Do NOT choose "Custom Role" merely to allow invented text — "Custom Role" requires explicit Guild Master intent and should be avoided here.
Select the single most appropriate standard role based ONLY on established Character Contract facts. If no campaign context exists, "Neutral" is the safe default.

CULTURE IS NOT OCCUPATION:
Homeland and Culture may influence idioms, social conventions, regional references, and cautious cultural familiarity. They do NOT establish an occupation. "Coastal Merchant Culture" does NOT make this NPC a merchant, sailor, navigator, tradesman, clockmaker, contractual witness, repair specialist, or shipping professional. Do not derive occupation from Culture.

TRAITS ARE NOT OCCUPATION:
Personality, Ideals, Bonds, Mannerisms, and Flaws describe character — not employment. Punctuality or an interest in tracking time does NOT establish chronometrist, clockmaker, celestial navigator, or timekeeping-device repair specialist. A Truth Ideal does NOT establish truth-seeker, legal witness, investigator, judge, or authority role as a profession. Personality may inform characterization; it must not silently become biography or employment.

STANDALONE / TEST NPC RESTRAINT:
When the NPC is not attached to an active campaign (No Campaign / Standalone), apply strong restraint:
- location: LEAVE BLANK ("") unless an established Character Contract fact supplies a current location. Do NOT invent towns, mountains, taverns, plazas, shops, hideouts, lairs, or workplaces.
- quests_rumors: LEAVE BLANK ("") unless supported by established campaign/story facts or explicit Guild Master input. Do NOT invent relics, missing artifacts, crimes, conspiracies, secret chambers, active quests, or named campaign objects.
- party_relationship: LEAVE BLANK ("") without actual player-character/campaign context. Do NOT invent prior relationships.
- initial_attitude: Use a neutral default (e.g. "Neutral" or "Indifferent") when no party context exists. Do NOT invent suspicion, trust, hidden-motive concerns, loyalty, hostility, or familiarity.

SERVICES OFFERED:
Only generate "services" when an established role, occupation, skill, or Character Contract fact reasonably supports a service. Do NOT infer services from personality, Species, Culture alone, a mannerism, an Ideal, or a Bond. Empty ("") is valid and preferred over invention.

KNOWLEDGE AVAILABLE:
"world_knowledge" may cautiously reference established knowledge suggested by accepted facts. Do NOT invent professional expertise. Do NOT turn Coastal Merchant Culture into expert knowledge of trade routes, shipping, commerce, or navigation unless another established fact supports it. Do NOT turn punctuality into astronomical or celestial expertise. Empty ("") is valid.

GENERAL:
Generated content is a PROPOSAL for the Guild Master, not canon. Prefer empty strings over invention. Do not reveal DM-only campaign information to players. Keep each field concise. Write in third person.`;

export const generateCampaignRole = async (npc, campaignContext) => {
  const ctx = campaignContext || {};
  const campaign = ctx.campaign || {};
  const standalone = !campaign || (!ctx.campaign?.id && !ctx.campaign?.name);
  const prompt = `Determine how this NPC fits into the selected campaign. Generate suggestions for: role (campaign role), location (current location), services (services offered), quests_rumors (rumors or quest hooks), world_knowledge (knowledge available), party_relationship (relationship with player characters), initial_attitude (initial attitude toward the party).

${GUARDRAILS}

NPC profile:
${buildProfile(npc) || 'A generic fantasy NPC'}

Campaign setting: ${campaign.setting || campaign.name || 'Standalone/Test NPC'}
Campaign description: ${campaign.description || ''}
Standalone/Test NPC: ${standalone ? 'YES — apply standalone restraint' : 'No'}
Existing regions in campaign: ${JSON.stringify(ctx.regions || [])}
Existing factions in campaign: ${JSON.stringify(ctx.factions || [])}
Existing locations in campaign: ${JSON.stringify(ctx.locations || [])}

Return JSON with keys: role, location, services, quests_rumors, world_knowledge, party_relationship, initial_attitude (all strings; use "" for any field you cannot support from established facts).`;
  const schema = {
    type: 'object',
    properties: {
      role: { type: 'string' }, location: { type: 'string' }, services: { type: 'string' },
      quests_rumors: { type: 'string' }, world_knowledge: { type: 'string' },
      party_relationship: { type: 'string' }, initial_attitude: { type: 'string' },
    },
    required: ['role', 'location', 'services', 'quests_rumors', 'world_knowledge', 'party_relationship', 'initial_attitude'],
  };
  try {
    return await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
  } catch { return null; }
};

export const isStandalone = (npc) => !has(npc?.campaign_id) && !has(npc?.campaign);