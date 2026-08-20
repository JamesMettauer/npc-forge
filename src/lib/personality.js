export const PERSONALITY_FIELDS = ['personality_traits', 'ideals', 'bonds', 'flaws', 'likes_dislikes', 'fears', 'mannerisms', 'humor', 'temperament', 'social_behavior'];

export const EMPTY_STATES = {
  personality_traits: 'No personality traits have been defined.',
  social_behavior: 'No social behavior has been defined.',
  mannerisms: 'No habits or mannerisms have been defined.',
  flaws: 'No flaws have been defined.',
  likes_dislikes: 'No likes or dislikes have been defined.',
  fears: 'No fears have been defined.',
  ideals: 'No ideals have been defined.',
  bonds: 'No bonds have been defined.',
  humor: 'No sense of humor has been defined.',
  temperament: 'No emotional temperament has been defined.',
};

const isNullish = (v) => v == null || String(v).trim() === '' || ['null', 'undefined', '[object object]'].includes(String(v).trim().toLowerCase());

export const parseEntries = (text) => (text == null ? [] : String(text).split('\n').map((s) => s.trim()).filter((s) => s && !isNullish(s)));

export const normalizeEntry = (s) => String(s).replace(/\s+/g, ' ').trim();

export const isNearDuplicate = (a, b) => {
  const na = normalizeEntry(a).toLowerCase().replace(/[^a-z0-9 ]/g, '');
  const nb = normalizeEntry(b).toLowerCase().replace(/[^a-z0-9 ]/g, '');
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  return false;
};

export const isExpansion = (existing, candidate) => {
  const ne = normalizeEntry(existing).toLowerCase();
  const nc = normalizeEntry(candidate).toLowerCase();
  return nc.length > ne.length && nc.startsWith(ne);
};

// Add an entry to a field's text, deduping near-duplicates and merging expansions.
export const addEntryToField = (currentValue, entry) => {
  const e = normalizeEntry(entry);
  if (!e || isNullish(e)) return currentValue || '';
  const entries = parseEntries(currentValue);
  for (let i = 0; i < entries.length; i++) {
    if (isNearDuplicate(entries[i], e)) {
      if (isExpansion(entries[i], e) || e.length > entries[i].length) entries[i] = e;
      return entries.join('\n');
    }
    if (isExpansion(e, entries[i])) { entries[i] = e; return entries.join('\n'); }
  }
  return [...entries, e].join('\n');
};

// Split a compound entry into distinct entries.
export const splitCompound = (text) =>
  String(text || '')
    .split(/;\s*|\.\s+|\band\s+/i)
    .map((s) => s.trim().replace(/[,.;]+$/, ''))
    .filter((s) => s && !isNullish(s));

// Clean a field: split compound entries, dedup, merge expansions.
export const cleanField = (text) => {
  const entries = parseEntries(text);
  const out = [];
  for (const raw of entries) {
    for (const p of splitCompound(raw)) {
      const e = normalizeEntry(p);
      if (!e) continue;
      let dup = false;
      for (let i = 0; i < out.length; i++) {
        if (isNearDuplicate(out[i], e)) { if (e.length > out[i].length) out[i] = e; dup = true; break; }
        if (isExpansion(e, out[i])) { out[i] = e; dup = true; break; }
      }
      if (!dup) out.push(e);
    }
  }
  return out.join('\n');
};

export const cleanPersonality = (npc) => {
  const backup = {};
  const next = { ...npc };
  for (const f of PERSONALITY_FIELDS) {
    const v = npc[f];
    if (isNullish(v)) { if (v != null) backup[f] = v; next[f] = ''; continue; }
    const cleaned = cleanField(v);
    if (cleaned !== String(v)) { backup[f] = v; next[f] = cleaned; }
  }
  return { npc: next, backup };
};

export const displayValue = (text, field) => {
  if (isNullish(text)) return EMPTY_STATES[field] || 'Not yet defined.';
  const entries = parseEntries(text);
  if (!entries.length) return EMPTY_STATES[field] || 'Not yet defined.';
  return entries.join('\n');
};