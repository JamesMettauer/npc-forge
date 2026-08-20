import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { SKILL_LIST, DC_BASELINES } from '@/lib/dice';

// Compact entry for a dice roll the DM made physically at the table.
// The staged roll is attached to the player's next message and gates the NPC's response.
export default function PlayerRollForm({ prefillSkill, onClose, onStage }){
  const [skill, setSkill] = useState(prefillSkill || 'SleightOfHand');
  const [character, setCharacter] = useState('');
  const [total, setTotal] = useState('');
  const [dc, setDc] = useState('');

  useEffect(() => { if (prefillSkill) setSkill(prefillSkill); }, [prefillSkill]);

  const totalNum = parseInt(total, 10);
  const dcNum = parseInt(dc, 10);
  const ready = !Number.isNaN(totalNum) && !Number.isNaN(dcNum);
  const success = ready && totalNum >= dcNum;

  const reset = () => { setCharacter(''); setTotal(''); setDc(''); onClose?.(); };

  const attach = () => {
    if (!ready) return;
    onStage({ skill, character: character.trim(), total: totalNum, dc: dcNum, success });
    reset();
  };

  return (
    <div className="rounded-xl border border-brand/30 bg-brand/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Enter the player's roll</p>
        <button onClick={reset} className="text-muted-foreground hover:text-foreground"><X size={14}/></button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select value={skill} onChange={(e) => setSkill(e.target.value)} className="field text-xs">
          {SKILL_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={character} onChange={(e) => setCharacter(e.target.value)} placeholder="Character" className="field text-xs"/>
        <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Total" className="field text-xs"/>
        <input type="number" value={dc} onChange={(e) => setDc(e.target.value)} placeholder="DC" className="field text-xs"/>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {Object.entries(DC_BASELINES).map(([label, val]) => (
            <button key={label} onClick={() => setDc(String(val))} className="rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted">{label} {val}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {ready && (
            <span className={`text-xs font-semibold ${success ? 'text-green-600 dark:text-green-300' : 'text-destructive'}`}>
              {success ? '✓ Success' : '✗ Failure'}
            </span>
          )}
          <button onClick={attach} disabled={!ready} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-40">
            <Check size={12}/>Attach to turn
          </button>
        </div>
      </div>
    </div>
  );
}