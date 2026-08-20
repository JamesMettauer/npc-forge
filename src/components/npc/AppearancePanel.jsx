import { useState } from 'react';
import { Edit3, Save, X, RefreshCw, Copy, Lock, Unlock, Wand2, Split, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { buildImageDescription, validateAppearance, hasMixedAppearance, migrateAppearance, generateAppearance, displayValue, emptyState } from '@/lib/appearance';

const FIELDS = [
  { key: 'physical_description', label: 'Physical Description', desc: 'Permanent body and identifying physical traits.' },
  { key: 'clothing_equipment', label: 'Clothing and Equipment', desc: 'Currently visible clothing, armor, tools, weapons, and carried items.' },
  { key: 'distinguishing_features', label: 'Distinguishing Features', desc: 'Recognizable species traits, expressions, mannerisms, and visual qualities.' },
];

const CURRENT_FIELDS = [
  { key: 'current_expression', label: 'Current Expression' },
  { key: 'current_pose', label: 'Current Pose' },
  { key: 'current_visible_equipment', label: 'Current Visible Equipment' },
  { key: 'current_background', label: 'Current Background' },
  { key: 'current_lighting', label: 'Current Lighting' },
  { key: 'current_injury', label: 'Current Injury' },
];

export default function AppearancePanel({ npc, onUpdated }){
  const [editKey, setEditKey] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [msg, setMsg] = useState('');

  const suggestions = validateAppearance(npc);
  const mixed = hasMixedAppearance(npc);

  const updateField = async (key, value) => {
    try { await base44.entities.NPC.update(npc.id, { [key]: value }); await onUpdated?.(); }
    catch { setMsg('Could not save the field.'); }
  };

  const startEdit = (key) => { setEditKey(key); setDraft(npc[key] || ''); };
  const cancelEdit = () => { setEditKey(null); setDraft(''); };
  const saveEdit = async () => {
    setBusy(true);
    try { await updateField(editKey, draft.trim()); setEditKey(null); }
    finally { setBusy(false); }
  };

  const rebuild = async () => {
    setBusy(true); setMsg('');
    try { const prompt = buildImageDescription(npc); await base44.entities.NPC.update(npc.id, { image_prompt: prompt }); await onUpdated?.(); setMsg('Image description rebuilt from appearance.'); }
    catch { setMsg('Could not rebuild the image description.'); }
    finally { setBusy(false); }
  };

  const copy = () => navigator.clipboard.writeText(npc.image_prompt || buildImageDescription(npc));

  const toggleLock = async () => {
    setBusy(true);
    try { await base44.entities.NPC.update(npc.id, { lock_identity: !npc.lock_identity }); await onUpdated?.(); }
    catch { setMsg('Could not update the lock.'); }
    finally { setBusy(false); }
  };

  const generate = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await generateAppearance(npc);
      const merged = { ...npc, ...r };
      await base44.entities.NPC.update(npc.id, {
        physical_description: r.physical_description,
        clothing_equipment: r.clothing_equipment,
        distinguishing_features: r.distinguishing_features,
        image_prompt: buildImageDescription(merged),
      });
      await onUpdated?.(); setMsg('Appearance generated and image description built.');
    } catch { setMsg('Could not generate appearance. Please try again.'); }
    finally { setBusy(false); }
  };

  const migrate = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await migrateAppearance(npc);
      if (!r) { setMsg('No appearance text to migrate.'); setBusy(false); return; }
      const prev = [npc.physical_description, npc.clothing_equipment, npc.distinguishing_features].filter(Boolean).join(' | ');
      const history = [...(npc.profile_history || []), {
        id: `${Date.now()}`, field: 'appearance_migration', field_label: 'Appearance migration',
        previous_value: prev, new_value: 'Migrated into separated fields',
        update_type: 'migration', source: 'appearance migration', date: new Date().toISOString(), approved_by: 'DM',
      }];
      const merged = { ...npc, ...r };
      await base44.entities.NPC.update(npc.id, {
        physical_description: r.physical_description,
        clothing_equipment: r.clothing_equipment,
        distinguishing_features: r.distinguishing_features,
        image_prompt: buildImageDescription(merged),
        profile_history: history,
      });
      await onUpdated?.(); setMsg('Appearance migrated into the correct fields. Original values stored in profile history.');
    } catch { setMsg('Could not migrate appearance. Please try again.'); }
    finally { setBusy(false); }
  };

  const renderField = (f) => (
    <div key={f.key} className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div><p className="text-sm font-semibold text-foreground">{f.label}</p><p className="text-xs text-muted-foreground">{f.desc}</p></div>
        {editKey === f.key ? (
          <div className="flex gap-1">
            <button onClick={saveEdit} disabled={busy} className="rounded-lg bg-brand px-2 py-1 text-xs text-brand-foreground"><Save size={12}/></button>
            <button onClick={cancelEdit} className="rounded-lg border border-border px-2 py-1 text-xs"><X size={12}/></button>
          </div>
        ) : (
          <button onClick={() => startEdit(f.key)} className="tool"><Edit3 size={12}/>Edit</button>
        )}
      </div>
      {editKey === f.key ? (
        <textarea rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>
      ) : (
        <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${npc[f.key] ? 'text-foreground' : 'italic text-muted-foreground'}`}>{displayValue(npc, f.key)}</p>
      )}
    </div>
  );

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-xl text-brand">Appearance</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={generate} disabled={busy} className="tool"><Wand2 size={14}/>{busy ? 'Working…' : 'Generate Appearance'}</button>
          {mixed && <button onClick={migrate} disabled={busy} className="tool"><Split size={14}/>Migrate Appearance</button>}
        </div>
      </div>

      {msg && <p className="mt-2 rounded-lg bg-muted p-2 text-xs text-foreground">{msg}</p>}

      {suggestions.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-2 text-xs text-foreground">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-600"/>{s.message}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {FIELDS.map(renderField)}

        <div className="rounded-xl border border-border">
          <button onClick={() => setShowCurrent((s) => !s)} className="flex w-full items-center justify-between p-3 text-sm font-medium text-foreground">
            Current Visual State (roleplay)
            {showCurrent ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
          {showCurrent && (
            <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
              {CURRENT_FIELDS.map((f) => (
                <div key={f.key}>
                  <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
                  <p className={`mt-1 text-sm ${npc[f.key] ? 'text-foreground' : 'italic text-muted-foreground'}`}>{displayValue(npc, f.key)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-sm font-semibold text-foreground">Image-Generation Description</p><p className="text-xs text-muted-foreground">Structured prompt for consistent portrait variations.</p></div>
            {editKey === 'image_prompt' ? (
              <div className="flex gap-1">
                <button onClick={saveEdit} disabled={busy} className="rounded-lg bg-brand px-2 py-1 text-xs text-brand-foreground"><Save size={12}/></button>
                <button onClick={cancelEdit} className="rounded-lg border border-border px-2 py-1 text-xs"><X size={12}/></button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                <button onClick={rebuild} disabled={busy} className="tool"><RefreshCw size={12}/>Rebuild</button>
                <button onClick={() => startEdit('image_prompt')} className="tool"><Edit3 size={12}/>Edit</button>
                <button onClick={copy} className="tool"><Copy size={12}/>Copy</button>
                <button onClick={toggleLock} disabled={busy} className="tool">{npc.lock_identity ? <Lock size={12}/> : <Unlock size={12}/>}{npc.lock_identity ? 'Locked' : 'Lock'}</button>
                <button onClick={() => setImgExpanded((s) => !s)} className="tool">{imgExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}{imgExpanded ? 'Collapse' : 'Expand'}</button>
              </div>
            )}
          </div>
          {editKey === 'image_prompt' ? (
            <textarea rows={5} value={draft} onChange={(e) => setDraft(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>
          ) : imgExpanded ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{npc.image_prompt || emptyState('image_prompt')}</p>
          ) : (
            <p className={`mt-2 line-clamp-2 text-sm ${npc.image_prompt ? 'text-foreground' : 'italic text-muted-foreground'}`}>{npc.image_prompt ? npc.image_prompt.slice(0, 160) + (npc.image_prompt.length > 160 ? '…' : '') : emptyState('image_prompt')}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Art style:</span>
            <input defaultValue={npc.art_style || ''} onBlur={(e) => updateField('art_style', e.target.value)} placeholder="fantasy tabletop RPG, painterly realism" className="field min-w-[12rem] flex-1"/>
          </div>
        </div>
      </div>
    </section>
  );
}