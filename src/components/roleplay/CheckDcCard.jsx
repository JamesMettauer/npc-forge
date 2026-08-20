import { useState } from 'react';
import { Check, ChevronLeft, X, Plus } from 'lucide-react';
import { DC_BASELINES, computeFinalDC } from '@/lib/dice';

const DIFFS = [['easy', 'Easy — DC 10'], ['medium', 'Medium — DC 15'], ['hard', 'Hard — DC 20']];

export default function CheckDcCard({ skill, dc, onAccept, onChange, onBack }){
  const [editing, setEditing] = useState(false);
  const [editFinal, setEditFinal] = useState(String(dc.final ?? 15));
  const [adjLabel, setAdjLabel] = useState('');
  const [adjValue, setAdjValue] = useState('');

  const isOpposed = !!dc.opposed;

  const setDifficulty = (diff) => {
    const base = DC_BASELINES[diff] || 15;
    onChange({ ...dc, base, difficulty: diff, final: computeFinalDC(base, dc.adjustments), hideDc: false });
  };

  const setNoDc = () => {
    onChange({ ...dc, final: null, hideDc: true });
    onAccept();
  };

  const addAdjustment = () => {
    if (!adjLabel.trim()) return;
    const adj = [...dc.adjustments, { label: adjLabel.trim(), value: parseInt(adjValue, 10) || 0 }];
    setAdjLabel(''); setAdjValue('');
    onChange({ ...dc, adjustments: adj, final: computeFinalDC(dc.base, adj), hideDc: false });
  };

  const removeAdjustment = (i) => {
    const adj = dc.adjustments.filter((_, idx) => idx !== i);
    onChange({ ...dc, adjustments: adj, final: computeFinalDC(dc.base, adj) });
  };

  const applyEdit = () => {
    onChange({ ...dc, final: parseInt(editFinal, 10) || 0, hideDc: false });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{skill} Check</p>
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ChevronLeft size={12}/>Back</button>
      </div>

      {isOpposed && (
        <div className="mt-2 rounded-lg border border-brand/20 bg-brand/5 p-2">
          <p className="text-xs font-medium text-brand">Opposed Check</p>
          <p className="text-xs text-muted-foreground">NPC {dc.opposed.skill} will be rolled privately. No static DC needed — the NPC's roll determines the outcome.</p>
        </div>
      )}

      {!editing ? (
        <>
          {!isOpposed && (
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Base difficulty</span><span className="text-foreground capitalize">{dc.difficulty} — DC {dc.base}</span></div>
              {dc.adjustments.map((a, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{a.label}</span>
                  <span className="text-foreground">{a.value >= 0 ? '+' : ''}{a.value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-1 font-medium">
                <span className="text-foreground">Suggested Final DC</span>
                <span className="text-brand">{dc.final}</span>
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={onAccept} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground"><Check size={12}/>{isOpposed ? 'Proceed to Roll' : 'Accept DC'}</button>
            {!isOpposed && <button onClick={() => setEditing(true)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Edit DC</button>}
            {!isOpposed && DIFFS.map(([key, label]) => (
              <button key={key} onClick={() => setDifficulty(key)} className="rounded-lg border border-border px-3 py-1.5 text-xs">{label}</button>
            ))}
            {!isOpposed && <button onClick={setNoDc} className="rounded-lg border border-border px-3 py-1.5 text-xs">No DC / Narrative</button>}
            {isOpposed && <button onClick={() => setEditing(true)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Add Static DC Too</button>}
          </div>
        </>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Final DC</label>
            <input type="number" value={editFinal} onChange={e => setEditFinal(e.target.value)} className="field w-20 text-xs"/>
            <button onClick={applyEdit} className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">Set</button>
          </div>
          <div className="space-y-1">
            {dc.adjustments.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{a.label}: {a.value >= 0 ? '+' : ''}{a.value}</span>
                <button onClick={() => removeAdjustment(i)} className="text-destructive"><X size={12}/></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={adjLabel} onChange={e => setAdjLabel(e.target.value)} placeholder="Adjustment label" className="field flex-1 text-xs"/>
              <input type="number" value={adjValue} onChange={e => setAdjValue(e.target.value)} placeholder="+/-" className="field w-16 text-xs"/>
              <button onClick={addAdjustment} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"><Plus size={12}/>Add</button>
            </div>
          </div>
          <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground">Done editing</button>
        </div>
      )}
    </div>
  );
}