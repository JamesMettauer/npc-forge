import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import Exchange from './Exchange';

export default function EarlierExchanges({ exchanges, checksByExchange, npcName, onApply, onUndoApply, onFollowUp, onAddNote }){
  const [shown, setShown] = useState(false);
  const [opens, setOpens] = useState({});

  const toggle = (id) => setOpens((o) => ({ ...o, [id]: !o[id] }));
  const expandAll = () => setOpens(Object.fromEntries(exchanges.map((e) => [e.id, true])));
  const collapseAll = () => setOpens(Object.fromEntries(exchanges.map((e) => [e.id, false])));

  return (
    <div className="mt-6 rounded-xl border border-border">
      <div className="flex items-center justify-between gap-2 p-3">
        <button onClick={() => setShown((s) => !s)} className="flex items-center gap-2 text-sm font-medium text-foreground">
          {shown ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          Earlier Exchanges ({exchanges.length})
        </button>
        {shown && (
          <div className="flex gap-2">
            <button onClick={expandAll} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"><ChevronsUpDown size={12}/>Expand All</button>
            <button onClick={collapseAll} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"><ChevronsDownUp size={12}/>Collapse All</button>
          </div>
        )}
      </div>
      {shown && (
        <div className="space-y-4 border-t border-border p-3">
          {exchanges.map((ex) => (
            <Exchange key={ex.id} exchange={ex} collapsible open={!!opens[ex.id]} onToggle={() => toggle(ex.id)} checks={checksByExchange?.[ex.id]} npcName={npcName} onApply={onApply} onUndoApply={onUndoApply} onFollowUp={onFollowUp} onAddNote={onAddNote}/>
          ))}
        </div>
      )}
    </div>
  );
}