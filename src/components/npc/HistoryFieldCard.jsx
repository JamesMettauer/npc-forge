import { Pencil, Lock, Unlock, Check, X, Star, Wand2, RefreshCw, Sparkles } from 'lucide-react';

const has = (v) => !!(v && String(v).trim());

export default function HistoryFieldCard({ field, mode, value, locked, editing, draft, busy, onEdit, onSaveEdit, onCancelEdit, onDraftChange, onToggleLock, onClear, onAccept, onRegenerate, onSuggest }){
  const isSuggested = mode === 'suggested';
  const isAccepted = mode === 'accepted';
  const desc = isSuggested && field.suggestedDesc ? field.suggestedDesc : field.desc;
  return (
    <div className={`rounded-xl border p-3 ${isSuggested ? 'border-brand/30 bg-brand/5' : 'border-border'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {field.core && isAccepted && <Star size={12} className="text-brand" fill="currentColor"/>}
          <div>
            <p className="text-sm font-semibold text-foreground">{field.label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isSuggested && <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand"><Sparkles size={10}/>Suggested</span>}
          {isAccepted && field.core && <span className="text-[10px] uppercase tracking-wider text-brand">Core</span>}
          {locked && <Lock size={11} className="text-brand"/>}
        </div>
      </div>
      {editing ? (
        <div className="mt-2">
          <textarea rows={4} value={draft} onChange={(e) => onDraftChange(e.target.value)} className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>
          <div className="mt-1 flex gap-1">
            <button onClick={onSaveEdit} className="rounded-lg bg-brand px-2 py-1 text-xs text-brand-foreground"><Check size={12}/></button>
            <button onClick={onCancelEdit} className="rounded-lg border border-border px-2 py-1 text-xs"><X size={12}/></button>
          </div>
        </div>
      ) : (
        <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${has(value) ? (isSuggested ? 'text-foreground/90' : 'text-foreground') : 'italic text-muted-foreground'}`}>{has(value) ? value : 'Not yet defined.'}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {isSuggested && !editing && <button onClick={onAccept} className="flex items-center gap-1 rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-brand-foreground"><Check size={11}/>Accept</button>}
        {!editing && <button onClick={onEdit} className="tool"><Pencil size={11}/>Edit</button>}
        {isSuggested && !editing && <button onClick={onRegenerate} disabled={busy} className="tool disabled:opacity-40"><RefreshCw size={11}/>{busy ? 'Regenerating…' : 'Regenerate'}</button>}
        {mode === 'empty' && onSuggest && !editing && <button onClick={onSuggest} disabled={busy} className="tool disabled:opacity-40"><Wand2 size={11}/>{busy ? 'Suggesting…' : 'Suggest'}</button>}
        <button onClick={onToggleLock} className="tool">{locked ? <Unlock size={11}/> : <Lock size={11}/>}{locked ? 'Unlock' : 'Lock'}</button>
        {has(value) && !editing && <button onClick={onClear} className="tool"><X size={11}/>Clear</button>}
      </div>
    </div>
  );
}