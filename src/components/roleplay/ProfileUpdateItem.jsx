import { useState } from 'react';
import { Check, X, Pencil, Clock, FileText } from 'lucide-react';

const CONF = { high: 'bg-brand/15 text-brand', medium: 'bg-muted text-muted-foreground', low: 'bg-muted text-muted-foreground' };

export default function ProfileUpdateItem({ update, onAccept, onReject, onEdit, onTemporary, onNote }){
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(update.proposed_value);
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{update.field_label || update.field}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${CONF[update.confidence] || CONF.medium}`}>{update.confidence}</span>
      </div>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{update.update_type} · {update.classification}{update.temporary ? ' · temporary' : ''}</p>
      <div className="mt-2 text-xs text-muted-foreground">{update.current_value ? <span className="line-through">{update.current_value}</span> : <span className="italic">empty field</span>}</div>
      {editing ? (
        <div className="mt-2">
          <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-input p-2 text-sm text-foreground outline-none focus:border-brand/50"/>
          <div className="mt-2 flex gap-2">
            <button onClick={() => { onEdit(update.id, val); setEditing(false); }} className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">Save</button>
            <button onClick={() => setEditing(false)} className="rounded-lg border border-border px-3 py-1 text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="mt-1 rounded-lg bg-muted p-2 text-sm text-foreground">{update.proposed_value}</p>
      )}
      {update.reason && <p className="mt-2 text-xs text-muted-foreground">{update.reason}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button onClick={() => onAccept(update)} className="flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-brand-foreground"><Check size={12}/>Accept</button>
        <button onClick={() => onReject(update.id)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs"><X size={12}/>Reject</button>
        <button onClick={() => setEditing(true)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs"><Pencil size={12}/>Edit</button>
        <button onClick={() => onTemporary(update)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs"><Clock size={12}/>Temporary</button>
        <button onClick={() => onNote(update)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs"><FileText size={12}/>Note</button>
      </div>
    </div>
  );
}