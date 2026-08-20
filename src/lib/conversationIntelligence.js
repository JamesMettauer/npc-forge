/**
 * Conversation Intelligence engine.
 * - Deterministic DC calculation with skill-specific social modifiers.
 * - LLM-driven generation of observable symptoms, hidden conditions,
 *   suggested checks, and information tiers.
 * - Merge/dedup logic that preserves DM-locked and confirmed data.
 */
import { base44 } from '@/api/base44Client';

export const BASE_DC = { easy: 10, medium: 15, hard: 20 };
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const INTEL_SKILLS = ['Insight', 'Persuasion', 'Deception', 'Intimidation', 'Medicine', 'Perception', 'Investigation'];

const norm = (s) => (s || '').toLowerCase().trim();
const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const isHidingSomething = (npc) => !!(npc?.secrets || npc?.hidden_condition);

// Skill-specific social modifier calculators. Returns [{ label, value }].
const MODIFIERS = {
  Persuasion: (c, npc) => {
    const m = [];
    const { trust, hostility, respect, relationship_score } = c;
    if (trust >= 80) m.push({ label: 'Very high trust', value: -5 });
    else if (trust >= 60) m.push({ label: 'High trust', value: -2 });
    else if (trust <= 20) m.push({ label: 'Very low trust', value: 5 });
    else if (trust < 40) m.push({ label: 'Low trust', value: 2 });
    if (hostility >= 80) m.push({ label: 'Very high hostility', value: 5 });
    else if (hostility >= 60) m.push({ label: 'High hostility', value: 2 });
    if (respect >= 60) m.push({ label: 'High respect', value: -1 });
    else if (respect < 25) m.push({ label: 'Low respect', value: 1 });
    if (relationship_score >= 40) m.push({ label: 'Strong relationship', value: -2 });
    else if (relationship_score <= -40) m.push({ label: 'Poor relationship', value: 2 });
    return m;
  },
  Deception: (c, npc) => {
    const m = [];
    const { trust, hostility, attitude } = c;
    if (trust >= 60) m.push({ label: 'High trust', value: -2 });
    else if (trust < 25) m.push({ label: 'Low trust', value: 2 });
    if (hostility >= 80) m.push({ label: 'Very high hostility', value: 3 });
    else if (hostility >= 60) m.push({ label: 'High hostility', value: 2 });
    if (norm(attitude).includes('suspicious')) m.push({ label: 'Suspicious attitude', value: 2 });
    return m;
  },
  Insight: (c, npc, diff) => {
    const m = [];
    const { trust, fear, hostility, attitude } = c;
    if (diff === 'easy') {
      if (fear >= 80) m.push({ label: 'Visible intense fear', value: -3 });
      else if (fear >= 60) m.push({ label: 'Visible fear', value: -2 });
      if (hostility >= 60) m.push({ label: 'Visible hostility', value: -1 });
    } else if (diff === 'medium') {
      if (trust < 25) m.push({ label: 'Low trust', value: 1 });
      if (hostility >= 60) m.push({ label: 'High hostility', value: 1 });
      if (norm(attitude).includes('suspicious')) m.push({ label: 'Suspicious attitude', value: 1 });
    } else {
      if (trust < 15) m.push({ label: 'Very low trust', value: 3 });
      else if (trust < 25) m.push({ label: 'Low trust', value: 2 });
      if (hostility >= 60) m.push({ label: 'High hostility', value: 1 });
      if (norm(attitude).includes('suspicious')) m.push({ label: 'Suspicious attitude', value: 2 });
      if (isHidingSomething(npc)) m.push({ label: 'Deliberately concealing', value: 3 });
    }
    return m;
  },
  Intimidation: (c, npc) => {
    const m = [];
    const { fear, respect, hostility } = c;
    if (fear >= 80) m.push({ label: 'Already very frightened', value: -3 });
    else if (fear >= 60) m.push({ label: 'Already frightened', value: -2 });
    if (respect >= 60) m.push({ label: 'Respects strength', value: -1 });
    if (hostility >= 80) m.push({ label: 'Very high hostility', value: 3 });
    else if (hostility >= 60) m.push({ label: 'High hostility', value: 2 });
    return m;
  },
  Medicine: (c, npc, diff) => {
    const m = [];
    const { trust, hostility } = c;
    if (diff === 'easy') return m;
    const label = diff === 'hard' ? 'deep exam' : 'close exam';
    if (trust < 25) m.push({ label: `Low trust (${label})`, value: diff === 'hard' ? 3 : 2 });
    if (hostility >= 60) m.push({ label: `High hostility (${label})`, value: diff === 'hard' ? 3 : 2 });
    if (trust >= 60) m.push({ label: 'High trust (cooperative)', value: -2 });
    return m;
  },
  Perception: (c, npc) => {
    const m = [];
    if (c.hostility >= 80) m.push({ label: 'NPC closed off', value: 1 });
    return m;
  },
  Investigation: (c, npc, diff) => {
    const m = [];
    const { trust, hostility } = c;
    if (diff === 'easy') return m;
    if (diff === 'medium') {
      if (trust < 25) m.push({ label: 'Low trust', value: 1 });
      if (trust >= 60) m.push({ label: 'High trust (cooperative)', value: -1 });
    } else {
      if (trust < 25) m.push({ label: 'Low trust', value: 2 });
      if (trust >= 60) m.push({ label: 'High trust (cooperative)', value: -2 });
      if (isHidingSomething(npc)) m.push({ label: 'Concealing evidence', value: 3 });
      if (hostility >= 60) m.push({ label: 'High hostility', value: 2 });
    }
    return m;
  },
};

export function calculateDC(skill, difficulty, convo, npc) {
  const base = BASE_DC[difficulty];
  const mods = (MODIFIERS[skill] || (() => []))(convo || {}, npc, difficulty);
  const final = Math.max(1, base + mods.reduce((s, mm) => s + mm.value, 0));
  return { base, modifiers: mods, final };
}

/** Recalculate all DC breakdowns deterministically. Preserves locked DCs. */
export function recalculateDCs(convo, npc) {
  const intel = convo?.intelligence || {};
  const lockedDCs = intel.lockedDCs || {};
  const breakdowns = {};
  for (const skill of INTEL_SKILLS) {
    breakdowns[skill] = {};
    for (const diff of DIFFICULTIES) {
      if (lockedDCs[skill]?.[diff] != null) {
        const locked = lockedDCs[skill][diff];
        breakdowns[skill][diff] = { base: BASE_DC[diff], modifiers: [{ label: 'DM locked', value: locked - BASE_DC[diff] }], final: locked, locked: true };
      } else {
        breakdowns[skill][diff] = calculateDC(skill, diff, convo, npc);
      }
    }
  }
  return { ...intel, dcBreakdowns: breakdowns, lastUpdated: new Date().toISOString() };
}

/** LLM call to generate observable symptoms, hidden conditions, checks, and tiers. */
export async function generateIntelligence(npc, convo, recentContext = '') {
  const profile = JSON.stringify({
    name: npc?.name, species: npc?.species, personality_traits: npc?.personality_traits,
    fears: npc?.fears, mannerisms: npc?.mannerisms, temperament: npc?.temperament,
    secrets: npc?.secrets, hidden_condition: npc?.hidden_condition,
    observable_symptoms: npc?.observable_symptoms, current_injury: npc?.current_injury,
    physical_description: npc?.physical_description, goals: npc?.goals, bonds: npc?.bonds,
    flaws: npc?.flaws, speaking_style: npc?.speaking_style,
  });
  const social = JSON.stringify({
    trust: convo?.trust, fear: convo?.fear, respect: convo?.respect,
    hostility: convo?.hostility, relationship_score: convo?.relationship_score,
    mood: convo?.mood, attitude: convo?.attitude, objective: convo?.objective, scene: convo?.scene,
  });
  const prompt = `You are generating D&D 5e Conversation Intelligence for a Dungeon Master. Based on the NPC's current state, generate observable symptoms, hidden conditions, suggested checks, and information tiers.

NPC profile: ${profile}
Current social state: ${social}
Recent conversation: ${recentContext || '(start of conversation)'}

Generate a JSON object with:

1. "observableSymptoms": 2-5 objects with "text" (what a PLAYER could notice from observation: body language, voice, behavior) and "temporary" (true if tied to current scene/fear, false if persistent trait).
   - Must be consistent with the NPC's personality and temperament.
   - Only include things observable without a skill check (surface-level).
   - High fear → trembling hands, glances at exits, uneven breathing. High hostility → jaw tightening, closed posture, hand near weapon. Low trust → avoids direct answers, watches carefully. High trust → relaxed posture, voluntary details.

2. "hiddenConditions": 0-3 objects with "text" (the underlying reason), "status" (one of: "Confirmed", "Established Profile Fact", "Likely Hidden Condition", "Proposed Hidden Condition", "Temporary Condition"), and "linkedSymptoms" (array of 0-based indices into observableSymptoms).
   - Use "Confirmed" or "Established Profile Fact" ONLY if the NPC profile (secrets, hidden_condition, backstory) establishes the cause.
   - Use "Proposed" for speculative causes needing DM review.
   - Use "Temporary" for scene-specific causes.
   - NEVER invent a permanent hidden fact when no established cause exists — use "Proposed".

3. "suggestedChecks": 1-4 objects with "skill" (one of: Insight, Persuasion, Deception, Intimidation, Medicine, Perception, Investigation) and "reason" (why it is relevant now).

4. "informationTiers": array of objects with "skill", "easy" (what Easy DC 10 reveals), "medium" (what Medium DC 15 reveals), "hard" (what Hard DC 20 reveals).
   - Easy = surface observation. Medium = pattern or withholding. Hard = deep motive or specific cause.
   - Do NOT reveal specific secrets at easy/medium unless trust is high.
   - Each skill reveals information appropriate to THAT skill (Medicine = physical, Insight = emotional/motivational, Perception = visible details, Investigation = physical evidence, Persuasion/Deception/Intimidation = social outcomes).

Rules:
- Observable symptoms must NOT contradict the NPC's established personality.
- Keep all text concise (1-2 sentences per field).
- If the NPC is calm and cooperative with no secrets, observable symptoms can be minimal and hidden conditions can be empty.`;

  const schema = {
    type: 'object',
    properties: {
      observableSymptoms: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, temporary: { type: 'boolean' } } } },
      hiddenConditions: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, status: { type: 'string' }, linkedSymptoms: { type: 'array', items: { type: 'number' } } } } },
      suggestedChecks: { type: 'array', items: { type: 'object', properties: { skill: { type: 'string' }, reason: { type: 'string' } } } },
      informationTiers: { type: 'array', items: { type: 'object', properties: { skill: { type: 'string' }, easy: { type: 'string' }, medium: { type: 'string' }, hard: { type: 'string' } } } },
    },
  };
  return await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
}

const similarText = (a, b) => {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  return false;
};

/** Merge generated data into existing intelligence, preserving locked/confirmed entries. */
export function mergeIntelligence(existingIntel, generated) {
  const intel = { ...(existingIntel || {}) };

  // Observable symptoms: preserve locked, dedup new
  const existingSymptoms = intel.observableSymptoms || [];
  const newSymptoms = [...existingSymptoms.filter((s) => s.locked)];
  if (generated?.observableSymptoms) {
    for (const s of generated.observableSymptoms) {
      const dup = newSymptoms.find((x) => similarText(x.text, s.text));
      if (!dup) newSymptoms.push({ id: newId(), text: s.text, temporary: !!s.temporary, locked: false, source: 'auto' });
    }
  }
  intel.observableSymptoms = newSymptoms;

  // Hidden conditions: preserve confirmed/established/locked, add new
  const existingConditions = intel.hiddenConditions || [];
  const keepStatuses = ['Confirmed', 'Established Profile Fact'];
  const newConditions = [...existingConditions.filter((c) => c.locked || keepStatuses.includes(c.status))];
  if (generated?.hiddenConditions) {
    for (const c of generated.hiddenConditions) {
      const dup = newConditions.find((x) => similarText(x.text, c.text));
      if (!dup) newConditions.push({ id: newId(), text: c.text, status: c.status || 'Proposed Hidden Condition', linkedSymptoms: c.linkedSymptoms || [], locked: false, source: 'auto' });
    }
  }
  intel.hiddenConditions = newConditions;

  // Suggested checks: replace
  intel.suggestedChecks = (generated?.suggestedChecks || []).map((c) => ({ skill: c.skill, reason: c.reason }));

  // Information tiers: replace unless locked
  const lockedTiers = intel.lockedTiers || {};
  const tierMap = {};
  if (generated?.informationTiers) {
    for (const t of generated.informationTiers) {
      if (t.skill && !lockedTiers[t.skill]) tierMap[t.skill] = { easy: t.easy || '', medium: t.medium || '', hard: t.hard || '' };
    }
  }
  for (const skill of Object.keys(lockedTiers)) {
    if (lockedTiers[skill] && intel.informationTiers?.[skill]) tierMap[skill] = intel.informationTiers[skill];
  }
  intel.informationTiers = tierMap;
  intel.lastUpdated = new Date().toISOString();
  return intel;
}

/** Full async update: recalculate DCs + LLM generate + merge + save. */
export async function runFullIntelligenceUpdate(npc, convo, recentContext, onUpdate) {
  const withDCs = recalculateDCs(convo, npc);
  let generated = null;
  try { generated = await generateIntelligence(npc, convo, recentContext); } catch { generated = null; }
  const merged = mergeIntelligence(withDCs, generated);
  try { await base44.entities.Conversation.update(convo.id, { intelligence: merged }); } catch {}
  onUpdate?.(merged);
  return merged;
}

/** Clear all roleplay-derived intelligence, recalculate DCs from current (reset) state. */
export function clearIntelligence(convo, npc) {
  const cleared = {
    observableSymptoms: [],
    hiddenConditions: [],
    suggestedChecks: [],
    informationTiers: {},
    lockedDCs: {},
    lockedTiers: {},
  };
  return recalculateDCs({ ...convo, intelligence: cleared }, npc);
}