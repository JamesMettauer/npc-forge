import { ChevronDown, X } from 'lucide-react';

export default function SuggestedChecks({ suggestions, onPick, onDismiss }){
  if (!suggestions?.length) return null;
  return (
    <div className="mt-4 rounded-xl border border-brand/30 bg-brand/5 p-3">
      <p className="text-xs font-semibold text-foreground">Suggested Check</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s.skill} onClick={() => onPick(s.skill)} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground">
            {s.skill} — {s.label}
          </button>
        ))}
        <button onClick={() => onPick(null)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground"><ChevronDown size={12}/>Choose Another Check</button>
        <button onClick={onDismiss} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"><X size={12}/>Dismiss</button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{suggestions[0].reason}</p>
    </div>
  );
}