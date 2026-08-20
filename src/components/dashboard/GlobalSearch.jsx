import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Users, BookOpen, MessageSquare, Clock } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'NPC', label: 'NPCs' },
  { id: 'Campaign', label: 'Campaigns' },
  { id: 'Conversation', label: 'Conversations' },
];

const TYPE_META = {
  NPC: { icon: Users, to: (r) => `/npc/${r.refId}` },
  Campaign: { icon: BookOpen, to: () => '/campaigns' },
  Conversation: { icon: MessageSquare, to: (r) => `/roleplay/${r.refId}` },
};

const RECENT_KEY = 'npcforge_recent_searches';

export default function GlobalSearch({ open, onClose, npcs, campaigns, conversations }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')); } catch { setRecent([]); }
  }, [open]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const t = q.toLowerCase();
    const npcHits = npcs.filter((n) => (n.name || '').toLowerCase().includes(t)).slice(0, 8)
      .map((n) => ({ type: 'NPC', label: n.name, sub: n.campaign || 'No campaign', refId: n.id }));
    const campHits = campaigns.filter((c) => (c.name || '').toLowerCase().includes(t)).slice(0, 8)
      .map((c) => ({ type: 'Campaign', label: c.name, sub: c.setting || 'No setting', refId: c.id }));
    const convoHits = conversations.filter((c) => (c.npc_name || '').toLowerCase().includes(t)).slice(0, 8)
      .map((c) => ({ type: 'Conversation', label: c.npc_name, sub: c.active ? 'Active' : 'Ended', refId: c.npc_id }));
    let all = [...npcHits, ...campHits, ...convoHits];
    if (cat !== 'all') all = all.filter((r) => r.type === cat);
    return all;
  }, [q, cat, npcs, campaigns, conversations]);

  if (!open) return null;

  const saveRecent = (term) => {
    if (!term.trim()) return;
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  };

  const runSearch = (term) => { setQ(term); saveRecent(term); };
  const close = () => { setQ(''); setCat('all'); onClose(); };

  return (
    <div className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/60 p-4 pt-24" onClick={close}>
      <div className="w-full max-w-lg rounded-xl border bg-card p-4 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search NPC Forge">
        <div className="mb-3 flex items-center gap-2">
          <Search size={18} className="text-muted-foreground" aria-hidden="true" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveRecent(q); }}
            placeholder="Search NPC Forge…" aria-label="Search NPC Forge"
            className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50" />
          <button onClick={() => saveRecent(q)} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground">Search</button>
          <button onClick={close} className="grid h-8 w-8 place-items-center rounded-lg border border-border" aria-label="Close search"><X size={16}/></button>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
              className={`rounded-full px-2.5 py-1 text-xs ${cat === c.id ? 'bg-brand text-brand-foreground font-semibold' : 'border border-border text-muted-foreground'}`}>
              {c.label}
            </button>
          ))}
        </div>

        {!q.trim() ? (
          recent.length > 0 ? (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Clock size={12}/> Recent searches</p>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((r) => (
                  <button key={r} onClick={() => runSearch(r)} className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted">{r}</button>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Search NPCs, campaigns, players, quests, conversations, notes, and other NPC Forge content.</p>
          )
        ) : results.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No matches for “{q}”.</p>
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {results.map((r, i) => {
              const meta = TYPE_META[r.type];
              const Icon = meta.icon;
              return (
                <Link key={i} to={meta.to(r)} onClick={close} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                  <Icon size={16} className="text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{r.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.sub}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.type}</span>
                  <span className="text-xs font-semibold text-brand">Open</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}