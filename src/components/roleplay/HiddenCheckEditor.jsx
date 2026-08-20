/**
 * HiddenCheckEditor — DM-only editor for auto-generated Observable Symptoms
 * and Hidden Conditions. Supports edit, lock, approve, reject, regenerate,
 * clear, and restore-automatic. Reads from convo.intelligence.
 */
import { useState } from 'react';
import { Stethoscope, ChevronDown, ChevronUp, Lock, Unlock, Pencil, Trash2, Check, X, Sparkles, RefreshCw, Plus } from 'lucide-react';

const STATUS_STYLES = {
  'Confirmed': 'bg-green-500/15 text-green-600 dark:text-green-300',
  'Established Profile Fact': 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  'Likely Hidden Condition': 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  'Proposed Hidden Condition': 'bg-orange-500/15 text-orange-600 dark:text-orange-300',
  'Temporary Condition': 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
  'Unconfirmed': 'bg-muted text-muted-foreground',
};

const STATUSES = ['Proposed Hidden Condition', 'Likely Hidden Condition', 'Confirmed', 'Established Profile Fact', 'Temporary Condition', 'Unconfirmed'];

export default function HiddenCheckEditor({ convo, npc, onUpdateIntel, onRegenerate, onClear, busy }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // { type: 'symptom'|'condition', id, text }
  const intel = convo?.intelligence || {};
  const symptoms = intel.observableSymptoms || [];
  const conditions = intel.hiddenConditions || [];

  const update = (partial) => onUpdateIntel?.(partial);

  // Symptom handlers
  const editSymptom = (id, text) => {
    update({ observableSymptoms: symptoms.map((s) => s.id === id ? { ...s, text } : s) });
  };
  const deleteSymptom = (id) => {
    update({ observableSymptoms: symptoms.filter((s) => s.id !== id) });
  };
  const toggleLockSymptom = (id) => {
    update({ observableSymptoms: symptoms.map((s) => s.id === id ? { ...s, locked: !s.locked } : s) });
  };
  const addSymptom = () => {
    const ns = [...symptoms, { id: `${Date.now()}`, text: 'New observable symptom', temporary: false, locked: false, source: 'DM' }];
    update({ observableSymptoms: ns });
  };

  // Condition handlers
  const editCondition = (id, field, value) => {
    update({ hiddenConditions: conditions.map((c) => c.id === id ? { ...c, [field]: value } : c) });
  };
  const deleteCondition = (id) => {
    update({ hiddenConditions: conditions.filter((c) => c.id !== id) });
  };
  const toggleLockCondition = (id) => {
    update({ hiddenConditions: conditions.map((c) => c.id === id ? { ...c, locked: !c.locked } : c) });
  };
  const approveCondition = (id) => {
    update({ hiddenConditions: conditions.map((c) => c.id === id ? { ...c, status: 'Confirmed' } : c) });
  };
  const addCondition = () => {
    const nc = [...conditions, { id: `${Date.now()}`, text: 'New hidden condition', status: 'Proposed Hidden Condition', linkedSymptoms: [], locked: false, source: 'DM' }];
    update({ hiddenConditions: nc });
  };

  const restoreAutomatic = () => {
    update({ lockedDCs: {}, lockedTiers: {}, observableSymptoms: symptoms.map((s) => ({ ...s, locked: false })), hiddenConditions: conditions.map((c) => ({ ...c, locked: false })) });
    onRegenerate?.();
  };

  const ta = 'w-full rounded-lg border border-border bg-input px-2 py-1.5 text-xs outline-none focus:border-brand/50';

  return (
    <div className="rounded-xl border border-border">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between p-3 text-sm font-medium text-foreground">
        <span className="flex items-center gap-2"><Stethoscope size={14}/>Hidden Check Data <span className="text-destructive text-[10px]">DM</span></span>
        {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
      </button>
      {open && (
        <div className="space-y-4 border-t border-border p-3">
          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <button onClick={onRegenerate} disabled={busy} className="flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-40"><Sparkles size={12}/>Regenerate</button>
            <button onClick={onClear} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"><Trash2 size={12}/>Clear</button>
            <button onClick={restoreAutomatic} disabled={busy} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"><RefreshCw size={12}/>Restore Automatic</button>
          </div>

          {/* Observable Symptoms */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observable Symptoms</p>
              <button onClick={addSymptom} className="flex items-center gap-1 text-[10px] text-brand"><Plus size={10}/>Add</button>
            </div>
            {symptoms.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No symptoms generated. Click Regenerate or add manually.</p>
            ) : (
              <div className="space-y-1.5">
                {symptoms.map((s) => (
                  <div key={s.id} className="rounded-lg border border-border/60 p-2">
                    {editing?.type === 'symptom' && editing.id === s.id ? (
                      <div className="space-y-1.5">
                        <textarea rows={2} defaultValue={s.text} onBlur={(e) => { editSymptom(s.id, e.target.value); setEditing(null); }} autoFocus className={ta} />
                        <div className="flex gap-1">
                          <button onClick={() => setEditing(null)} className="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px]"><Check size={10}/>Done</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5">
                        <span className="flex-1 text-xs text-foreground">{s.text}</span>
                        {s.temporary && <span className="rounded bg-purple-500/15 px-1 py-0.5 text-[9px] text-purple-600 dark:text-purple-300">temp</span>}
                        {s.locked && <Lock size={10} className="text-brand mt-0.5" />}
                        <div className="flex shrink-0 gap-0.5">
                          <button onClick={() => setEditing({ type: 'symptom', id: s.id, text: s.text })} className="text-muted-foreground hover:text-foreground"><Pencil size={11}/></button>
                          <button onClick={() => toggleLockSymptom(s.id)} className="text-muted-foreground hover:text-brand">{s.locked ? <Lock size={11}/> : <Unlock size={11}/>}</button>
                          <button onClick={() => deleteSymptom(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={11}/></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hidden Conditions — DM Only */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hidden Conditions <span className="text-destructive">— DM Only</span></p>
              <button onClick={addCondition} className="flex items-center gap-1 text-[10px] text-brand"><Plus size={10}/>Add</button>
            </div>
            {conditions.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No hidden conditions. Regenerate to propose some, or add manually.</p>
            ) : (
              <div className="space-y-1.5">
                {conditions.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border/60 p-2">
                    {editing?.type === 'condition' && editing.id === c.id ? (
                      <div className="space-y-1.5">
                        <textarea rows={2} defaultValue={c.text} onBlur={(e) => editCondition(c.id, 'text', e.target.value)} autoFocus className={ta} />
                        <select value={c.status} onChange={(e) => editCondition(c.id, 'status', e.target.value)} className="w-full rounded-lg border border-border bg-input px-2 py-1 text-xs">
                          {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                        <button onClick={() => setEditing(null)} className="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px]"><Check size={10}/>Done</button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground">{c.text}</p>
                          <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] ${STATUS_STYLES[c.status] || STATUS_STYLES.Unconfirmed}`}>{c.status}</span>
                        </div>
                        <div className="flex shrink-0 gap-0.5">
                          {c.status === 'Proposed Hidden Condition' && <button onClick={() => approveCondition(c.id)} title="Approve" className="text-muted-foreground hover:text-green-600"><Check size={11}/></button>}
                          <button onClick={() => setEditing({ type: 'condition', id: c.id })} className="text-muted-foreground hover:text-foreground"><Pencil size={11}/></button>
                          <button onClick={() => toggleLockCondition(c.id)} className="text-muted-foreground hover:text-brand">{c.locked ? <Lock size={11}/> : <Unlock size={11}/>}</button>
                          <button onClick={() => deleteCondition(c.id)} className="text-muted-foreground hover:text-destructive"><X size={11}/></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}