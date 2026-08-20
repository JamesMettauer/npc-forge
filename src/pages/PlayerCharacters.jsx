import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { clearCache } from '@/lib/characterSheet';
import NavControls from '@/components/NavControls';
import ImportWizard from '@/components/player/ImportWizard';
import SourceFileCard from '@/components/player/SourceFileCard';
import ManualEntryForm from '@/components/player/ManualEntryForm';
import { Users, Plus, Trash2, Edit2, Upload, X } from 'lucide-react';

const ABILITY_FIELDS = [
  ['str_score', 'STR'], ['dex_score', 'DEX'], ['con_score', 'CON'],
  ['int_score', 'INT'], ['wis_score', 'WIS'], ['cha_score', 'CHA'],
];

export default function PlayerCharacters(){
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setCharacters(await base44.entities.PlayerCharacter.list()); } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    if (params.get('import') === '1') setWizardOpen(true);
  }, []);

  const openAdd = () => { setUpdateTarget(null); setWizardOpen(true); };
  const openUpdate = (c) => { setUpdateTarget(c); setWizardOpen(true); };
  const closeWizard = () => {
    setWizardOpen(false); setUpdateTarget(null);
    if (window.location.search) window.history.replaceState({}, '', window.location.pathname);
  };
  const onSaved = async () => { clearCache(); await load(); closeWizard(); };
  const remove = async (id) => { await base44.entities.PlayerCharacter.delete(id); clearCache(); await load(); };

  return (
    <div className="p-5 sm:p-8 max-w-4xl mx-auto">
      <NavControls/>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl flex items-center gap-2"><Users size={24}/>Player Characters</h1>
          <p className="text-sm text-muted-foreground mt-1">Import party members so NPC Forge can auto-fill skill modifiers during roleplay.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"><Plus size={16}/>Add Player Character</button>
      </div>

      {wizardOpen && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg">{updateTarget ? 'Update Character Sheet' : 'Add Player Character'}</h2>
            <button onClick={closeWizard} className="text-muted-foreground hover:text-foreground"><X size={18}/></button>
          </div>
          <ImportWizard existingCharacter={updateTarget} onSaved={onSaved} onClose={closeWizard}/>
        </div>
      )}

      {editTarget && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <ManualEntryForm
            initial={editTarget}
            onSave={async (data) => { await base44.entities.PlayerCharacter.update(editTarget.id, data); clearCache(); await load(); setEditTarget(null); }}
            onBack={() => setEditTarget(null)}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : characters.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Users size={32} className="mx-auto mb-3 text-muted-foreground"/>
          <p className="text-sm text-muted-foreground">No player characters yet. Add one so NPC Forge can auto-fill modifiers during roleplay.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {characters.map(c => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-serif text-lg">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{[c.character_class, c.level ? `Lv ${c.level}` : '', c.race, c.player_name].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openUpdate(c)} title="Update sheet" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground"><Upload size={14}/></button>
                  <button onClick={() => setEditTarget(c)} title="Edit" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground"><Edit2 size={14}/></button>
                  <button onClick={() => remove(c.id)} title="Delete" className="rounded-lg border border-destructive/30 p-2 text-destructive"><Trash2 size={14}/></button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {ABILITY_FIELDS.map(([key, label]) => <span key={key}>{label} {c[key] || 10}</span>)}
                <span>Prof +{c.proficiency_bonus || 2}</span>
                {c.passive_perception && <span>PP {c.passive_perception}</span>}
              </div>
              {c.skill_proficiencies && <p className="mt-1 text-xs text-muted-foreground">Proficient: {c.skill_proficiencies}</p>}
              <SourceFileCard character={c} onUpdate={() => openUpdate(c)}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}