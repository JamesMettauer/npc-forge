import { base44 } from '@/api/base44Client';
import { arrayOf, isString, requireRecord, recordArray, stringValue } from '@/lib/runtimeTypes';

export const CATEGORIES = [
  ['personality_traits', 'Personality traits'],
  ['ideals', 'Ideals'],
  ['bonds', 'Bonds'],
  ['flaws', 'Flaws'],
  ['mannerisms', 'Habits & mannerisms'],
  ['speech_patterns', 'Speech patterns'],
  ['motivations', 'Motivations'],
  ['fears', 'Fears'],
  ['social_behaviors', 'Social behaviors'],
  ['combat_behaviors', 'Combat behaviors'],
  ['physical_features', 'Physical features'],
  ['cultural_influences', 'Cultural influences'],
  ['skills', 'Skills'],
  ['equipment', 'Equipment'],
  ['potential_secrets', 'Potential secrets'],
  ['quest_hooks', 'Quest hooks'],
];

export const FIELD_MAP = {
  personality_traits: 'personality_traits', ideals: 'ideals', bonds: 'bonds', flaws: 'flaws',
  physical_features: 'distinguishing_features', cultural_influences: 'accent',
  mannerisms: 'mannerisms', speech_patterns: 'speaking_style', motivations: 'goals',
  fears: 'fears', skills: 'skills', equipment: 'equipment', combat_behaviors: 'actions',
  social_behaviors: 'social_behavior', potential_secrets: 'secrets', quest_hooks: 'quests_rumors',
};

export const FILTERS = [
  ['all', 'All'], ['personality_traits', 'Personality'], ['ideals', 'Ideals'], ['bonds', 'Bonds'],
  ['flaws', 'Flaws'], ['mannerisms', 'Mannerisms'], ['social_behaviors', 'Social'],
  ['combat_behaviors', 'Combat'], ['fears', 'Fears'], ['motivations', 'Motivations'],
  ['cultural_influences', 'Culture'], ['physical_features', 'Physical'],
];

export const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const words = (s) => norm(s).split(' ').filter((w) => w.length > 3);

// Trait fields are newline-delimited strings, but data from the interview agent,
// templates, or imports can arrive as arrays. Coerce to a string so split/trim
// never throw or silently drop the value.
const fieldStr = (v) => (Array.isArray(v) ? v.map((x) => String(x)).join('\n') : (v == null ? '' : String(v)));

export const isDuplicate = (a, b) => {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const wa = new Set(words(a)), wb = new Set(words(b));
  if (wa.size && wb.size) {
    let shared = 0;
    for (const w of wa) if (wb.has(w)) shared++;
    if (shared >= Math.min(wa.size, wb.size) * 0.7 && Math.min(wa.size, wb.size) >= 2) return true;
  }
  return false;
};

export const getSelectedTraits = (npc) => {
  const out = [];
  for (const [cat, label] of CATEGORIES) {
    const f = FIELD_MAP[cat];
    const val = fieldStr(npc[f]).split('\n').map((s) => s.trim()).filter(Boolean);
    for (const text of val) out.push({ cat, label, field: f, text });
  }
  return out;
};

export const addTraitToField = (npc, field, text) => {
  const t = (text || '').trim();
  if (!t) return npc;
  const lines = fieldStr(npc[field]).split('\n').map((s) => s.trim()).filter(Boolean);
  if (lines.some((l) => isDuplicate(l, t))) return npc;
  return { ...npc, [field]: [...lines, t].join('\n') };
};

export const removeTraitFromField = (npc, field, text) => {
  const lines = fieldStr(npc[field]).split('\n').map((s) => s.trim()).filter((l) => l && l !== text);
  return { ...npc, [field]: lines.join('\n') };
};

export const editTraitInField = (npc, field, oldText, newText) => {
  const lines = fieldStr(npc[field]).split('\n').map((s) => s.trim()).filter(Boolean).map((l) => (l === oldText ? (newText || '').trim() : l));
  return { ...npc, [field]: lines.join('\n') };
};

export const moveTrait = (npc, fromField, text, toField) => {
  let next = removeTraitFromField(npc, fromField, text);
  next = addTraitToField(next, toField, text);
  const m = getMeta(next);
  next = setMeta(next, { ...m, auto_starters: (m.auto_starters || []).filter((t) => t !== text) });
  return next;
};

export const getMeta = (npc) => npc.trait_meta || { locked: [], core: [], conflicts: [], rejected: [], auto_starters: [], preselect_combo: '' };
export const setMeta = (npc, meta) => ({ ...npc, trait_meta: meta });
export const getAutoStarters = (npc) => getMeta(npc).auto_starters || [];
export const markAutoStarters = (npc, texts) => {
  const m = getMeta(npc);
  const set = new Set([...(m.auto_starters || []), ...texts]);
  return setMeta(npc, { ...m, auto_starters: [...set] });
};
export const clearAutoStarters = (npc) => setMeta(npc, { ...getMeta(npc), auto_starters: [] });
export const unmarkAutoStarter = (npc, text) => {
  const m = getMeta(npc);
  return setMeta(npc, { ...m, auto_starters: (m.auto_starters || []).filter((t) => t !== text) });
};

export const isLocked = (npc, text) => getMeta(npc).locked.includes(text);
export const isCore = (npc, text) => getMeta(npc).core.includes(text);
export const isRejected = (npc, text) => getMeta(npc).rejected.some((r) => isDuplicate(r, text));
export const isIntentionalConflict = (npc, a, b) => getMeta(npc).conflicts.some((c) => c.traits.includes(a) && c.traits.includes(b));

export const toggleLock = (npc, text) => {
  const m = getMeta(npc);
  const isLocking = !m.locked.includes(text);
  const locked = isLocking ? [...m.locked, text] : m.locked.filter((t) => t !== text);
  const auto_starters = isLocking ? (m.auto_starters || []).filter((t) => t !== text) : m.auto_starters;
  return setMeta(npc, { ...m, locked, auto_starters });
};
export const toggleCore = (npc, text) => {
  const m = getMeta(npc);
  const isMarking = !m.core.includes(text);
  const core = isMarking ? [...m.core, text] : m.core.filter((t) => t !== text);
  const auto_starters = isMarking ? (m.auto_starters || []).filter((t) => t !== text) : m.auto_starters;
  return setMeta(npc, { ...m, core, auto_starters });
};
export const addRejected = (npc, text) => {
  const m = getMeta(npc);
  if (m.rejected.some((r) => isDuplicate(r, text))) return npc;
  return setMeta(npc, { ...m, rejected: [...m.rejected, text] });
};
export const clearRejected = (npc) => setMeta(npc, { ...getMeta(npc), rejected: [] });
export const addIntentionalConflict = (npc, a, b, note) => {
  const m = getMeta(npc);
  if (m.conflicts.some((c) => c.traits.includes(a) && c.traits.includes(b))) return npc;
  return setMeta(npc, { ...m, conflicts: [...m.conflicts, { traits: [a, b], note: note || '', intentional: true }] });
};

export const removeTraitFully = (npc, field, text) => {
  let next = removeTraitFromField(npc, field, text);
  const m = getMeta(next);
  next = setMeta(next, { ...m, locked: m.locked.filter((t) => t !== text), core: m.core.filter((t) => t !== text), auto_starters: (m.auto_starters || []).filter((t) => t !== text) });
  return next;
};
export const editTraitFully = (npc, field, oldText, newText) => {
  let next = editTraitInField(npc, field, oldText, newText);
  const m = getMeta(next);
  next = setMeta(next, { ...m, locked: m.locked.map((t) => (t === oldText ? newText : t)), core: m.core.map((t) => (t === oldText ? newText : t)), auto_starters: (m.auto_starters || []).filter((t) => t !== oldText) });
  return next;
};

export const mergeSimilar = (npc) => {
  const selected = getSelectedTraits(npc);
  const keep = new Set();
  const drop = [];
  for (const s of selected) {
    let dup = false;
    for (const k of keep) { if (isDuplicate(k, s.text)) { dup = true; break; } }
    if (dup) drop.push(s);
    else keep.add(s.text);
  }
  let next = npc;
  for (const d of drop) next = removeTraitFully(next, d.field, d.text);
  return next;
};

export const detectConflicts = async (traits) => {
  if (!traits || traits.length < 2) return [];
  try {
    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Evaluate these D&D NPC traits for conflicts. Traits: ${JSON.stringify(traits)}. Identify direct contradictions, strong conflicts, duplicates, and minor tensions. Do NOT flag nuanced complexity (e.g. "brave but afraid of enclosed spaces", "honest except when protecting family") as conflicts. Return a conflicts array; each item: {traits:[a,b], severity (Duplicate|Minor Tension|Strong Conflict|Direct Contradiction), reason, suggestion}. Only include real conflicts.`,
      response_json_schema: { type: 'object', properties: { conflicts: { type: 'array', items: { type: 'object', properties: { traits: { type: 'array', items: { type: 'string' } }, severity: { type: 'string' }, reason: { type: 'string' }, suggestion: { type: 'string' } } } } } },
    });
    return recordArray(requireRecord(data, 'Trait conflict response').conflicts).map((conflict) => ({
      traits: arrayOf(conflict.traits, isString),
      severity: stringValue(conflict.severity),
      reason: stringValue(conflict.reason),
      suggestion: stringValue(conflict.suggestion),
    }));
  } catch { return null; }
};
