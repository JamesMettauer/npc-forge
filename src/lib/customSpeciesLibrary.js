const STORAGE_KEY = 'npc_forge_custom_species_library';
const OLD_STORAGE_KEY = 'npc_forge_custom_species';

let hydrated = false;

export function isStorageAvailable() {
  try {
    const test = '__npc_forge_test__';
    localStorage.setItem(test, '1');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function isValidRecord(s) {
  return s && typeof s === 'object' && typeof s.id === 'string' && typeof s.name === 'string' && s.name.trim();
}

export function getCustomSpecies() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldRaw) {
        try {
          const oldList = JSON.parse(oldRaw);
          if (Array.isArray(oldList)) {
            const valid = oldList.filter(isValidRecord);
            hydrated = true;
            saveList(valid);
            localStorage.removeItem(OLD_STORAGE_KEY);
            return valid;
          }
        } catch {}
      }
      hydrated = true;
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { hydrated = true; return []; }
    const valid = parsed.filter(isValidRecord);
    hydrated = true;
    return valid;
  } catch {
    hydrated = true;
    return [];
  }
}

function saveList(list) {
  if (!hydrated && list.length === 0) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function saveCustomSpecies(data) {
  if (!data || !data.name) return null;
  const list = getCustomSpecies();
  const existingIdx = data.id
    ? list.findIndex(s => s.id === data.id)
    : list.findIndex(s => s.name.toLowerCase() === (data.name || '').toLowerCase());

  let entry;
  if (existingIdx >= 0) {
    entry = { ...list[existingIdx], ...data, updated_date: new Date().toISOString() };
    list[existingIdx] = entry;
  } else {
    entry = {
      ...data,
      id: data.id || `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      created_date: data.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    list.push(entry);
  }

  saveList(list);
  return entry;
}

export function deleteCustomSpecies(id) {
  const list = getCustomSpecies().filter(s => s.id !== id);
  saveList(list);
}

export function getCustomSpeciesById(id) {
  return getCustomSpecies().find(s => s.id === id);
}

export function migrateNPCCustomSpecies(npc) {
  if (!npc?.custom_species_data?.name) return null;
  const data = npc.custom_species_data;
  const list = getCustomSpecies();
  const existing = data.id
    ? list.find(s => s.id === data.id)
    : list.find(s => s.name.toLowerCase() === data.name.toLowerCase());
  if (existing) return existing;
  const entry = {
    ...data,
    id: data.id || `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created_date: data.created_date || new Date().toISOString(),
    updated_date: new Date().toISOString(),
  };
  list.push(entry);
  saveList(list);
  return entry;
}