// Quick NPC Character Contract draft persistence.
// One authoritative draft record in localStorage, keyed separately from
// the Custom Species library. Synchronous read/write so hydration can run
// in a useState lazy initializer (no empty-state overwrite race).

const KEY = 'npc_forge_quick_draft';

const isAvailable = () => {
  try {
    localStorage.setItem('__npcf_test', '1');
    localStorage.removeItem('__npcf_test');
    return true;
  } catch { return false; }
};

export const loadDraft = () => {
  if (!isAvailable()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch { return null; }
};

// Merge a partial update into the stored draft (read-modify-write so
// independent writers — e.g. CreateNPC writing `npc` and NPCWizard writing
// `step` — never clobber each other's field).
export const saveDraft = (partial) => {
  if (!isAvailable()) return;
  try {
    const current = loadDraft() || {};
    const next = { ...current, ...partial };
    localStorage.setItem(KEY, JSON.stringify(next));
    if (partial.step !== undefined) console.log('[draft] saveDraft step =', partial.step, '| draft.step now =', next.step);
  } catch {}
};

export const clearDraft = () => {
  if (!isAvailable()) return;
  try { localStorage.removeItem(KEY); } catch {}
};

// Fields that are part of every fresh initialNPC and don't count as
// meaningful user-entered data.
const DRAFT_EXCLUDE = ['mode', 'archived', 'ally_status', 'level', 'npc_build_type', 'power_level', 'ruleset'];

export const hasDraftData = (npc) => {
  if (!npc || typeof npc !== 'object') return false;
  return Object.entries(npc).some(([k, v]) => {
    if (DRAFT_EXCLUDE.includes(k)) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === 'object') return Object.keys(v).length > 0;
    return !!(v && String(v).trim());
  });
};