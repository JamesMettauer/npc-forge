import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Library } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function NpcCardStack({ npcs, theme, styles }) {
  const [spread, setSpread] = useState(false);
  const visible = npcs.slice(0, 6);
  const portrait = (n) => n.approved_portrait_url || n.portrait_url;

  return (
    <section aria-label="NPC character cards" className="rounded-xl p-4" style={styles.panel}
      onMouseEnter={() => setSpread(true)} onMouseLeave={() => setSpread(false)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.ink }}><Users size={18} style={{ color: theme.accent }} /> NPC Cards</h2>
        <Link to="/library" className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold" style={styles.accentBtn}><Library size={12}/>Library</Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.map((n, i) => (
          <Link key={n.id} to={`/npc/${n.id}`} title={n.name}
            className="group relative w-24 shrink-0 overflow-hidden rounded-lg border transition"
            style={{ borderColor: theme.panelBorder, transform: spread ? `rotate(${(i - 2) * 3}deg) translateY(-4px)` : 'none' }}>
            <div className="aspect-[3/4] w-full bg-black/20">
              {portrait(n) ? <Image src={portrait(n)} fittingType="fill" className="h-full w-full" alt={n.name} /> : <div className="grid h-full place-items-center"><Users size={20} style={{ color: theme.muted }} /></div>}
            </div>
            <div className="truncate bg-black/40 px-1 py-0.5 text-[10px] font-medium text-white">{n.name}</div>
          </Link>
        ))}

        <Link to="/create" title="Create a new NPC"
          className="grid w-24 shrink-0 place-items-center rounded-lg border-2 border-dashed p-2 text-center transition hover:scale-105"
          style={{ borderColor: theme.accent, color: theme.ink }}>
          <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1">
            <Plus size={20} style={{ color: theme.accent }} />
            <span className="text-[10px] font-semibold">Blank Card</span>
            <span className="text-[9px]" style={{ color: theme.muted }}>Create NPC</span>
          </div>
        </Link>
      </div>
      {npcs.length === 0 && <p className="mt-2 text-xs" style={{ color: theme.muted }}>No NPCs yet. Use the blank card to forge your first character.</p>}
    </section>
  );
}