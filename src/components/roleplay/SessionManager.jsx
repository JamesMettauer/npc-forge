import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, MessageSquare } from 'lucide-react';
export default function SessionManager({ sessions, currentId, onSelect, onNew, onRename, onDelete }){
  const [editingId,setEditingId]=useState(null),[editName,setEditName]=useState('');
  return <div>
    <div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-lg">Conversations</h2><button onClick={onNew} className="flex items-center gap-1 rounded-lg bg-brand/10 px-2.5 py-1 text-xs text-brand"><Plus size={12}/>New</button></div>
    <div className="space-y-1.5">
      {sessions.length===0&&<p className="text-xs text-muted-foreground">No saved sessions yet.</p>}
      {sessions.map(s=><div key={s.id} className={`rounded-lg border p-2.5 ${s.id===currentId?'border-brand/40 bg-brand/5':'border-border'}`}>
        {editingId===s.id?<div className="flex gap-1"><input value={editName} onChange={e=>setEditName(e.target.value)} className="flex-1 rounded border border-border bg-input px-2 py-1 text-xs text-foreground"/><button onClick={()=>{onRename(s.id,editName);setEditingId(null);}} className="text-green-600 dark:text-green-300"><Check size={14}/></button><button onClick={()=>setEditingId(null)} className="text-muted-foreground"><X size={14}/></button></div>:
        <div className="flex items-center justify-between gap-1"><button onClick={()=>onSelect(s.id)} className="flex flex-1 items-center gap-2 text-left text-sm text-foreground"><MessageSquare size={12} className="shrink-0 text-muted-foreground"/>{s.name||s.scene||'Untitled session'}</button><button onClick={()=>{setEditingId(s.id);setEditName(s.name||'');}} className="text-muted-foreground hover:text-foreground"><Pencil size={12}/></button><button onClick={()=>onDelete(s.id)} className="text-destructive/60 hover:text-destructive"><Trash2 size={12}/></button></div>}
      </div>)}
    </div>
  </div>;
}