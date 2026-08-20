import { useState } from 'react';
import { ChevronLeft, Dices, ChevronDown, ChevronUp } from 'lucide-react';

export default function CheckRollCard({ skill, dc, npc, actingCharacter, autoModifier, onResolve, onBack }){
  const [character, setCharacter] = useState(actingCharacter || '');
  const [modifier, setModifier] = useState(autoModifier != null ? String(autoModifier) : '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advantage, setAdvantage] = useState('normal');
  const [entryMode, setEntryMode] = useState('die');
  const [d20, setD20] = useState('');
  const [d20b, setD20b] = useState('');
  const [total, setTotal] = useState('');

  const effCharacter = showAdvanced ? character.trim() : (actingCharacter || character.trim());
  const effModifier = showAdvanced
    ? (parseInt(modifier, 10) || 0)
    : (autoModifier != null ? autoModifier : (parseInt(modifier, 10) || 0));

  const d1 = parseInt(d20, 10);
  const d2 = parseInt(d20b, 10);
  const hasD1 = !Number.isNaN(d1);
  const hasD2 = !Number.isNaN(d2);

  const kept = advantage === 'advantage' && hasD1 && hasD2 ? Math.max(d1, d2)
    : advantage === 'disadvantage' && hasD1 && hasD2 ? Math.min(d1, d2)
    : hasD1 ? d1 : 0;
  const computedTotal = entryMode === 'total' ? (parseInt(total, 10) || 0) : kept + effModifier;
  const canResolve = entryMode === 'total' ? !Number.isNaN(parseInt(total, 10)) : hasD1;

  const handleResolve = () => {
    if (!canResolve) return;
    const d20s = entryMode === 'die' ? [d1, ...(advantage !== 'normal' && hasD2 ? [d2] : [])] : [];
    onResolve({
      character: effCharacter,
      modifier: entryMode === 'die' ? effModifier : 0,
      d20s,
      kept: entryMode === 'die' ? kept : parseInt(total, 10),
      total: computedTotal,
      advantage: advantage === 'advantage',
      disadvantage: advantage === 'disadvantage',
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {effCharacter || 'Player'} — {skill}{entryMode === 'die' && effModifier ? ` ${effModifier >= 0 ? '+' : ''}${effModifier}` : ''}
        </p>
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ChevronLeft size={12}/>Back</button>
      </div>

      {dc.opposed && (
        <p className="mt-1 text-[10px] text-muted-foreground">Opposed check: NPC {dc.opposed.skill} will be rolled privately</p>
      )}
      {dc.final != null && !dc.hideDc && (
        <p className="mt-1 text-xs text-muted-foreground">DC: <span className="font-medium text-foreground">{dc.final}</span></p>
      )}

      <button onClick={() => setShowAdvanced(s => !s)} className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
        {showAdvanced ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
        {showAdvanced ? 'Hide override' : 'Override character or modifier'}
      </button>
      {showAdvanced && (
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <input value={character} onChange={e => setCharacter(e.target.value)} placeholder="Character name" className="field text-xs"/>
          <input type="number" value={modifier} onChange={e => setModifier(e.target.value)} placeholder="Modifier (e.g. 5)" className="field text-xs"/>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Roll mode:</span>
        <div className="flex rounded-lg border border-border p-0.5">
          {['normal', 'advantage', 'disadvantage'].map(a => (
            <button key={a} onClick={() => setAdvantage(a)} className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize ${advantage === a ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{a}</button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Player reports:</span>
        <div className="flex rounded-lg border border-border p-0.5">
          {['die', 'total'].map(m => (
            <button key={m} onClick={() => setEntryMode(m)} className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${entryMode === m ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{m === 'die' ? 'd20 Roll' : 'Final Total'}</button>
          ))}
        </div>
      </div>

      {entryMode === 'die' ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {advantage !== 'normal' ? (
            <>
              <input type="number" value={d20} onChange={e => setD20(e.target.value)} placeholder="d20 (first)" className="field w-24 text-xs"/>
              <input type="number" value={d20b} onChange={e => setD20b(e.target.value)} placeholder="d20 (second)" className="field w-24 text-xs"/>
            </>
          ) : (
            <input type="number" value={d20} onChange={e => setD20(e.target.value)} placeholder="d20 roll" className="field w-24 text-xs"/>
          )}
          {effModifier !== 0 && <span className="text-xs text-muted-foreground">{effModifier >= 0 ? '+' : ''}{effModifier}</span>}
          <span className="text-xs text-muted-foreground">=</span>
          <span className="text-sm font-semibold text-foreground">{computedTotal}</span>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="Final total (modifier already included)" className="field w-56 text-xs"/>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button onClick={handleResolve} disabled={!canResolve} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground disabled:opacity-40"><Dices size={14}/>Resolve Check</button>
      </div>
    </div>
  );
}