import { useState } from 'react';
import { Undo2, History, Sparkles } from 'lucide-react';

export default function ProfileHistory({ npc, onUndo, onClean }){
  const [open, setOpen] = useState(false);
  const history = npc?.profile_history || [];
  return (
    <section>
      <div className="flex items-center justify-between">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <History size={16}/>Profile history ({history.length})
        </button>
        {onClean && <button onClick={onClean} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"><Sparkles size={12}/>Clean Duplicates</button>}
      </div>
      {open && history.length > 0 && (
        <div className="mt-3 space-y-2">
          {[...history].reverse().map((h) => (
            <div key={h.id} className="rounded-lg border border-border bg-card p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{h.field_label || h.field}</span>
                {h.update_type !== 'undo' && <button onClick={() => onUndo(h.id)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><Undo2 size={12}/>Undo</button>}
              </div>
              <p className="mt-1 text-muted-foreground line-through">{h.previous_value || 'empty'}</p>
              <p className="text-foreground">{h.new_value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{h.update_type} · {h.approved_by} · {h.date ? new Date(h.date).toLocaleString() : ''}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}