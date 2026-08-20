import { useState } from 'react';
import { Dices, X } from 'lucide-react';

export default function DiceModal({ open, onClose }) {
  const [rolling, setRolling] = useState(false);
  const [val, setVal] = useState(null);
  const [log, setLog] = useState([]);

  if (!open) return null;
  const roll = (sides) => {
    setRolling(true);
    setTimeout(() => {
      const r = 1 + Math.floor(Math.random() * sides);
      setVal(r);
      setLog((l) => [{ d: `d${sides}`, r, t: new Date().toLocaleTimeString() }, ...l].slice(0, 8));
      setRolling(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold"><Dices size={18}/> Dice Tower</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><X size={16}/></button>
        </div>
        <div className="mb-4 grid h-24 place-items-center rounded-lg bg-muted">
          {rolling ? <Dices size={40} className="animate-spin text-brand" /> : val != null ? <span className="text-4xl font-bold text-foreground">{val}</span> : <span className="text-sm text-muted-foreground">Roll the dice</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[4, 6, 8, 10, 12, 20, 100].map((s) => (
            <button key={s} onClick={() => roll(s)} disabled={rolling} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-40">d{s}</button>
          ))}
        </div>
        {log.length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Recent rolls</p>
            {log.map((l, i) => <p key={i} className="text-xs text-foreground">{l.d}: <span className="font-bold">{l.r}</span> <span className="text-muted-foreground">· {l.t}</span></p>)}
          </div>
        )}
      </div>
    </div>
  );
}