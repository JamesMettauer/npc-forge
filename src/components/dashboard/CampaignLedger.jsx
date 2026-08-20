import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight, Plus, Archive, Search, MapPin, Users, MessageSquare } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function CampaignLedger({ campaigns, npcs, conversations, theme, styles }) {
  const active = campaigns.filter((c) => c.status !== 'completed');
  const archived = campaigns.filter((c) => c.status === 'completed');
  const ordered = [...active, ...archived];
  const [idx, setIdx] = useState(0);
  const [query, setQuery] = useState('');
  const safeIdx = Math.min(idx, Math.max(0, ordered.length - 1));
  const c = ordered[safeIdx];

  const filtered = query ? ordered.filter((x) => (x.name || '').toLowerCase().includes(query.toLowerCase())) : ordered;
  const npcCount = (cid) => npcs.filter((n) => n.campaign_id === cid || n.campaign === (c && c.name)).length;
  const convoCount = (cid) => conversations.filter((cv) => npcs.some((n) => n.id === cv.npc_id && (n.campaign_id === cid))).length;

  const go = (d) => setIdx((i) => Math.max(0, Math.min(ordered.length - 1, i + d)));

  return (
    <section aria-label="Campaign Ledger" className="rounded-xl p-4" style={styles.panel}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.ink }}><BookOpen size={18} style={{ color: theme.accent }} /> Campaign Ledger</h2>
        <Link to="/campaigns" className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold" style={styles.accentBtn}><Plus size={12}/>New</Link>
      </div>

      {ordered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-6 text-center" style={{ borderColor: theme.panelBorder }}>
          <BookOpen size={28} className="mx-auto mb-2" style={{ color: theme.muted }} />
          <p className="text-sm" style={{ color: theme.muted }}>The ledger is empty. Add your first campaign.</p>
          <Link to="/campaigns" className="mt-3 inline-block rounded-md px-3 py-1.5 text-xs font-semibold" style={styles.accentBtn}>Add Campaign</Link>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1">
            {ordered.map((camp, i) => (
              <button key={camp.id} onClick={() => setIdx(i)} title={camp.name}
                className={`shrink-0 rounded-t-md px-3 py-1.5 text-xs font-medium ${i === safeIdx ? 'font-bold' : ''}`}
                style={i === safeIdx ? styles.accentBtn : { background: 'transparent', color: theme.muted, border: `1px solid ${theme.panelBorder}` }}>
                {camp.name?.slice(0, 14) || 'Untitled'}
                {camp.status === 'completed' && <Archive size={10} className="ml-1 inline" />}
              </button>
            ))}
          </div>

          <div className="relative">
            <button onClick={() => go(-1)} disabled={safeIdx === 0} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 grid h-8 w-8 place-items-center rounded-full disabled:opacity-30" style={{ ...styles.accentBtn }} aria-label="Previous campaign"><ChevronLeft size={16}/></button>
            <button onClick={() => go(1)} disabled={safeIdx >= ordered.length - 1} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 grid h-8 w-8 place-items-center rounded-full disabled:opacity-30" style={{ ...styles.accentBtn }} aria-label="Next campaign"><ChevronRight size={16}/></button>

            <div className="grid gap-3 sm:grid-cols-2 px-10">
              <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <p className="text-base font-bold leading-tight" style={{ color: theme.ink }}>{c.name}</p>
                <p className="mt-1 text-xs" style={{ color: theme.muted }}>{c.setting || 'No setting recorded'}</p>
                <div className="mt-3 space-y-1.5 text-xs" style={{ color: theme.ink }}>
                  <p className="flex items-center gap-1.5"><MapPin size={11}/> Status: <span className="font-semibold">{c.status || 'active'}</span></p>
                  <p className="flex items-center gap-1.5"><Users size={11}/> NPCs: <span className="font-semibold">{npcCount(c.id)}</span></p>
                  <p className="flex items-center gap-1.5"><MessageSquare size={11}/> Conversations: <span className="font-semibold">{convoCount(c.id)}</span></p>
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>Recent summary</p>
                <p className="mt-1 text-xs leading-snug" style={{ color: theme.ink }}>{c.description || 'No session summary recorded yet.'}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>Active quests</p>
                <p className="mt-1 text-xs" style={{ color: theme.muted }}>Quest requests appear here once added to a campaign.</p>
                <Link to="/campaigns" className="mt-3 inline-block rounded-md px-3 py-1.5 text-xs font-semibold" style={styles.accentBtn}>Open Campaign</Link>
              </div>
            </div>
          </div>

          {archived.length > 0 && (
            <p className="mt-3 flex items-center gap-1 text-xs" style={{ color: theme.muted }}><Archive size={11}/> {archived.length} archived campaign{archived.length > 1 ? 's' : ''} at the back of the ledger.</p>
          )}
        </>
      )}
    </section>
  );
}