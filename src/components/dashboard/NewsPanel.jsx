import { useState } from 'react';
import { Newspaper, X } from 'lucide-react';

const NEWS = [
  { id: 'n1', category: 'NPC Forge updates', title: 'Dashboard Command Center arrives', body: 'Your desk is now a living, themeable DM workspace with DM Attention, a Campaign Ledger, and quick-action desk objects.', date: '2026-08-01' },
  { id: 'n2', category: 'New features', title: 'Four immersive desk themes', body: 'Switch between Guildmaster’s Desk, Wizard’s Tower, Royal War Room, and Tavern Backroom — each restyles your workspace.', date: '2026-07-28' },
  { id: 'n3', category: 'NPC Forge updates', title: 'Safer reusable templates', body: 'NPC templates now preserve reusable character-building fields while excluding identity, campaign, portrait, runtime, history, and backup data.', date: '2026-07-20' },
  { id: 'n4', category: 'New features', title: 'Create your own NPC templates', body: 'Save a reusable foundation from an existing NPC, then select it when starting a new character.', date: '2026-07-15' },
  { id: 'n5', category: 'Maintenance notices', title: 'Theme asset caching', body: 'Desk themes now cache locally for faster loads on return visits.', date: '2026-07-10' },
];

const CATEGORIES = ['All', 'NPC Forge updates', 'New features', 'Maintenance notices'];

export default function NewsPanel({ state, onMarkRead, onHide, theme, styles }) {
  const [cat, setCat] = useState('All');
  const read = state.read_news || [];
  const items = cat === 'All' ? NEWS : NEWS.filter((n) => n.category === cat);
  const unread = items.filter((n) => !read.includes(n.id));

  return (
    <section aria-label="News and updates" className="rounded-xl p-4" style={styles.panel}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.ink }}><Newspaper size={18} style={{ color: theme.accent }} /> News & Updates</h2>
        <button onClick={onHide} title="Hide panel" className="grid h-6 w-6 place-items-center rounded" style={{ color: theme.muted }}><X size={14}/></button>
      </div>
      {unread.length > 0 && <p className="mb-2 text-xs" style={{ color: theme.accent }}>{unread.length} unread</p>}
      <div className="mb-2 flex flex-wrap gap-1">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-2 py-0.5 text-[10px] ${cat === c ? 'font-bold' : ''}`}
            style={cat === c ? styles.accentBtn : { color: theme.muted, border: `1px solid ${theme.panelBorder}` }}>{c}</button>
        ))}
      </div>
      <div className="space-y-2">
        {items.map((n) => {
          const isRead = read.includes(n.id);
          return (
            <button key={n.id} onClick={() => onMarkRead([n.id])} className="block w-full rounded-lg p-2 text-left transition hover:scale-[1.01]"
              style={{ background: 'rgba(0,0,0,0.06)', opacity: isRead ? 0.6 : 1, borderLeft: `3px solid ${isRead ? 'transparent' : theme.accent}` }}>
              <p className="text-xs font-semibold" style={{ color: theme.ink }}>{n.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug" style={{ color: theme.muted }}>{n.body}</p>
              <p className="mt-1 text-[10px]" style={{ color: theme.muted }}>{n.category} · {n.date}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
