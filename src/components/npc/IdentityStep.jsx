import { useState, useEffect, useRef } from 'react';
import CustomSpeciesPage from './CustomSpeciesPage';
import { getCustomSpecies, saveCustomSpecies, deleteCustomSpecies, migrateNPCCustomSpecies, isStorageAvailable } from '@/lib/customSpeciesLibrary';
import { suggestAge } from '@/lib/speciesAge';

const STANDARD_SPECIES = ['Human', 'Dwarf', 'Elf', 'Halfling'];
const PRONOUN_OPTIONS = [
  { value: 'He/Him', label: 'He / Him' },
  { value: 'She/Her', label: 'She / Her' },
];
const SEX_GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const expectedPronouns = (sex) => sex === 'male' ? 'He/Him' : sex === 'female' ? 'She/Her' : null;

const inputCls = 'w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-brand/50';
const labelCls = 'text-xs font-medium text-muted-foreground';

export default function IdentityStep({ npc, setNPC }) {
  const set = (k, v) => setNPC(prev => ({ ...prev, [k]: v }));
  const [showCustom, setShowCustom] = useState(false);
  const [editInitial, setEditInitial] = useState(null);
  const [customSpeciesList, setCustomSpeciesList] = useState(() => isStorageAvailable() ? getCustomSpecies() : []);
  const [storageError, setStorageError] = useState(false);
  const [ageInput, setAgeInput] = useState(() => npc.age != null ? String(npc.age) : '');
  const prevSpeciesRef = useRef(undefined);
  useEffect(() => {
    if (!isStorageAvailable()) { setStorageError(true); return; }
    if (npc.custom_species_data?.name) {
      migrateNPCCustomSpecies(npc);
      setCustomSpeciesList(getCustomSpecies());
    }
  }, [npc.custom_species_data]);
  useEffect(() => {
    setAgeInput(npc.age != null ? String(npc.age) : '');
  }, [npc.age]);

  useEffect(() => {
    const prevSpecies = prevSpeciesRef.current;
    prevSpeciesRef.current = npc.species;
    if (!npc.species) return;
    const ageSource = npc.prompt_meta?.age_source;
    if (ageSource === 'user') return;
    if (prevSpecies === undefined) {
      if (npc.age) return;
    } else {
      if (npc.age && !ageSource) return;
    }
    const { age, fromLifespan } = suggestAge(npc.species, npc.custom_species_data);
    setNPC(prev => ({
      ...prev,
      age: String(age),
      prompt_meta: { ...(prev.prompt_meta || {}), age_source: fromLifespan ? 'lifespan' : 'suggested' },
    }));
    setAgeInput(String(age));
  }, [npc.species]);

  const refreshCustomSpecies = () => setCustomSpeciesList(getCustomSpecies());
  const handleCustomSave = (data) => { const saved = saveCustomSpecies(data); setNPC(prev => ({ ...prev, species: saved.name, custom_species_data: saved })); setShowCustom(false); refreshCustomSpecies(); };
  const handleCustomDelete = (id) => { deleteCustomSpecies(id); setShowCustom(false); refreshCustomSpecies(); };
  const onSpeciesChange = (e) => {
    const value = e.target.value;
    const saved = customSpeciesList.find(s => s.name === value);
    if (saved) setNPC(prev => ({ ...prev, species: saved.name, custom_species_data: saved }));
    else setNPC(prev => ({ ...prev, species: value, custom_species_data: undefined }));
  };
  const isCustomActive = npc.custom_species_data?.name && npc.species === npc.custom_species_data.name;
  const libraryNames = new Set(customSpeciesList.map(s => s.name));
  const showCurrentCustom = isCustomActive && !libraryNames.has(npc.custom_species_data.name);
  const openCreate = () => { setEditInitial(null); setShowCustom(true); };
  const openEdit = () => { setEditInitial(npc.custom_species_data); setShowCustom(true); };

  const onSexGenderChange = (value) => {
    const currentExpected = expectedPronouns(npc.sex_gender);
    const isAutomatic = !npc.pronouns || (currentExpected !== null && npc.pronouns === currentExpected);
    setNPC(prev => {
      const update = { ...prev, sex_gender: value };
      if (isAutomatic) {
        const newPronouns = expectedPronouns(value);
        if (newPronouns) update.pronouns = newPronouns;
      }
      return update;
    });
  };

  const onAgeChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAgeInput(raw);
    setNPC(prev => ({ ...prev, age: raw, prompt_meta: { ...(prev.prompt_meta || {}), age_source: 'user' } }));
  };

  return (
    <div className="mt-6 space-y-5">
      <p className="text-sm text-muted-foreground">Who is this character?</p>

      <div>
        <label className={labelCls}>Name</label>
        <input
          type="text"
          value={npc.name || ''}
          onChange={e => set('name', e.target.value)}
          placeholder="Character name"
          className={`mt-1.5 ${inputCls}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Species</label>
          <select
            value={npc.species || ''}
            onChange={onSpeciesChange}
            className={`mt-1.5 ${inputCls}`}
          >
            <option value="">Select Species</option>
            <optgroup label="Standard Species">
              {STANDARD_SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
            </optgroup>
            {(customSpeciesList.length > 0 || showCurrentCustom) && (
              <optgroup label="My Custom Species · Stored Locally">
                {customSpeciesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                {showCurrentCustom && <option value={npc.custom_species_data.name}>{npc.custom_species_data.name}</option>}
              </optgroup>
            )}
          </select>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {isCustomActive && (
              <button onClick={openEdit} className="rounded-lg border border-brand/40 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10">Edit Custom Species</button>
            )}
            <button onClick={openCreate} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">+ Create Custom Species / Lineage</button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Custom species are stored locally on this device.</p>
          {storageError && <p className="mt-1 text-[10px] text-destructive">Local Custom Species could not be loaded.</p>}
        </div>

        <div>
          <label className={labelCls}>Age</label>
          <input
            type="text"
            inputMode="numeric"
            value={ageInput}
            onChange={onAgeChange}
            placeholder="Positive whole number"
            className={`mt-1.5 ${inputCls}`}
          />
          {npc.prompt_meta?.age_source === 'lifespan' && <p className="mt-1 text-[10px] text-muted-foreground">Suggested from species lifespan — change freely.</p>}
          {npc.prompt_meta?.age_source === 'suggested' && <p className="mt-1 text-[10px] text-muted-foreground">Suggested age — change freely.</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Sex / Gender</label>
          <div className="mt-1.5 flex gap-2">
            {SEX_GENDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSexGenderChange(opt.value)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${npc.sex_gender === opt.value ? 'border-brand bg-brand/10 text-brand' : 'border-border text-foreground hover:bg-muted'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Pronouns</label>
          <select
            value={npc.pronouns || ''}
            onChange={e => set('pronouns', e.target.value)}
            className={`mt-1.5 ${inputCls}`}
          >
            <option value="">Select Pronouns</option>
            {PRONOUN_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>
      {showCustom && <CustomSpeciesPage onSave={handleCustomSave} onCancel={() => setShowCustom(false)} initial={editInitial} onDelete={editInitial?.id ? handleCustomDelete : undefined}/>}
    </div>
  );
}