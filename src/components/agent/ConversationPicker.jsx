import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare } from 'lucide-react';

export default function ConversationPicker({ onPick }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    base44.entities.Conversation.filter({ active: true }, '-updated_date')
      .then(setItems).finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-sm text-muted-foreground">Loading your roleplay sessions…</p>;
  if (!items.length) return <p className="text-sm text-muted-foreground">No active conversations. Start one from the Roleplay page first.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(c => (
        <button key={c.id} onClick={() => onPick(c)} className="rounded-2xl border border-border bg-card p-4 text-left hover:border-brand/40">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-brand/70"/>
            <h3 className="font-serif text-lg">{c.npc_name || 'Unknown NPC'}</h3>
          </div>
          <p className="mt-1 text-xs text-brand/60">{c.name || 'Untitled session'}</p>
          <p className="mt-2 text-sm text-muted-foreground">{c.scene || 'Unspecified scene'} · {c.mood || 'neutral'}</p>
        </button>
      ))}
    </div>
  );
}