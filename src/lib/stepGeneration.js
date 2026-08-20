import { generateAppearance } from '@/lib/appearance';
import { generateCompleteVoiceProfile, VOICE_PROFILE_FIELDS } from '@/lib/voice';
import { generateCampaignRole, gatherCampaignContext } from '@/lib/campaignRole';
import { generateHistory, HISTORY_FIELDS } from '@/lib/history';

const has = (v) => !!(v && String(v).trim());

const APPEARANCE_FIELDS = ['physical_description', 'clothing_equipment', 'distinguishing_features'];
const CAMPAIGN_ROLE_FIELDS = ['role', 'location', 'services', 'quests_rumors', 'world_knowledge', 'party_relationship', 'initial_attitude', 'party_stance_reasons'];

// Step index → generatable field config.
// Each generate() returns only the updates for fields that were empty;
// existing (manual / locked / accepted) values are never overwritten.
export const STEP_GENERATION = {
  3: { // Appearance & Portrait
    fields: APPEARANCE_FIELDS,
    generate: async (npc) => {
      const data = await generateAppearance(npc);
      if (!data) return {};
      const updates = {};
      for (const f of APPEARANCE_FIELDS) if (!has(npc[f]) && has(data[f])) updates[f] = data[f];
      return updates;
    },
  },
  5: { // Voice & Communication
    fields: VOICE_PROFILE_FIELDS,
    generate: async (npc) => {
      const data = await generateCompleteVoiceProfile(npc);
      if (!data) return {};
      const updates = {};
      for (const f of VOICE_PROFILE_FIELDS) if (!has(npc[f]) && has(data[f])) updates[f] = data[f];
      return updates;
    },
  },
  6: { // History & Motivation
    fields: HISTORY_FIELDS.map((f) => f.key),
    generate: async (npc) => {
      const data = await generateHistory(npc);
      if (!data) return {};
      const updates = {};
      for (const f of HISTORY_FIELDS) if (!has(npc[f.key]) && has(data[f.key])) updates[f.key] = data[f.key];
      return updates;
    },
  },
  7: { // Campaign Role
    fields: CAMPAIGN_ROLE_FIELDS,
    generate: async (npc) => {
      const ctx = await gatherCampaignContext(npc.campaign_id);
      const data = await generateCampaignRole(npc, ctx);
      if (!data) return {};
      const updates = {};
      for (const f of CAMPAIGN_ROLE_FIELDS) if (!has(npc[f]) && has(data[f])) updates[f] = data[f];
      return updates;
    },
  },
};

export const getMissingGeneratableFields = (stepIndex, npc) => {
  const config = STEP_GENERATION[stepIndex];
  if (!config) return [];
  return config.fields.filter((f) => !has(npc[f]));
};

export const canGenerateMissing = (stepIndex, npc) => getMissingGeneratableFields(stepIndex, npc).length > 0;

export const generateMissingForStep = async (stepIndex, npc) => {
  const config = STEP_GENERATION[stepIndex];
  if (!config) return {};
  return config.generate(npc);
};

// All generatable steps in wizard order.
const ALL_GENERATABLE_STEPS = [3, 5, 6, 7];

// Fields that must NEVER be touched by broad regeneration (portrait identity,
// custom species, campaign assignment).
const PROTECTED_FIELDS = new Set([
  'approved_portrait_url', 'portrait_url', 'portrait_candidates', 'portrait_variants',
  'custom_species_data', 'campaign', 'campaign_id',
]);

// Raw generators return fresh values for ALL of their fields (not just blanks).
const RAW_GENERATORS = {
  3: generateAppearance,
  5: generateCompleteVoiceProfile,
  6: generateHistory,
  7: async (npc) => {
    const ctx = await gatherCampaignContext(npc.campaign_id);
    return generateCampaignRole(npc, ctx);
  },
};

const STEP_FIELDS = {
  3: APPEARANCE_FIELDS,
  5: VOICE_PROFILE_FIELDS,
  6: HISTORY_FIELDS.map((f) => f.key),
  7: CAMPAIGN_ROLE_FIELDS,
};

// Fill blank generatable fields across every step. Existing values, Guild
// Master edits, locks, and accepted/core values are preserved (each step
// generator only writes to blank fields).
export const fillMissingAllSteps = async (npc) => {
  const updates = {};
  let working = { ...npc };
  for (const step of ALL_GENERATABLE_STEPS) {
    const config = STEP_GENERATION[step];
    if (!config) continue;
    const stepUpdates = await config.generate(working);
    for (const [k, v] of Object.entries(stepUpdates)) {
      updates[k] = v;
      working[k] = v;
    }
  }
  return updates;
};

// Regenerate AI-generated, unlocked detail fields across every step. This is
// a broad recovery action: it overwrites generated/suggested material in the
// generatable areas (appearance, voice, history, campaign role) while
// preserving approved portrait identity, custom species definitions, and
// campaign assignment. Identity (Step 1) is not touched.
export const regenerateAllGenerated = async (npc) => {
  const updates = {};
  let working = { ...npc };
  for (const step of ALL_GENERATABLE_STEPS) {
    const gen = RAW_GENERATORS[step];
    const fields = STEP_FIELDS[step];
    if (!gen || !fields) continue;
    const data = await gen(working);
    if (!data) continue;
    for (const f of fields) {
      if (PROTECTED_FIELDS.has(f)) continue;
      if (data[f] != null && String(data[f]).trim() !== '') {
        updates[f] = data[f];
        working[f] = data[f];
      }
    }
  }
  return updates;
};