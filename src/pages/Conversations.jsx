import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import NavControls from '@/components/NavControls';

export default function Conversations() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    (async () => {
      const [convos, npcs] = await Promise.all([
        base44.entities.Conversation.filter({ active: true }, '-updated_date'),
        base44.entities.NPC.list(),
      ]);
      const npcIds = new Set(npcs.map((n) => n.id));
      setItems(convos.filter((c) => npcIds.has(c.npc_id)));
    })();
  }, []);

  return (
    <div className="p-5 sm:p-8">
      <NavControls />
      <PageHeader eyebrow="Ongoing scenes" title="Active Conversations" />
      <div className="mb-4 flex justify-end">
        <Link to="/agent-roleplay" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Facilitate with AI Agent</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((c) => (
          <Link key={c.id} to={`/roleplay/${c.npc_id}`} className="rounded-2xl border border-border bg-card p-5 hover:border-brand/40">
            <h2 className="font-serif text-xl">{c.npc_name}</h2>
            <p className="mt-1 text-xs text-brand/60">{c.name || 'Untitled session'}</p>
            <p className="mt-2 text-sm text-muted-foreground">{c.scene || 'Unspecified scene'} · {c.mood || 'neutral'}</p>
            {c.summary && <p className="mt-4 line-clamp-2 text-sm text-stone-300">{c.summary}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}