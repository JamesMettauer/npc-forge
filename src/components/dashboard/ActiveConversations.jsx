import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Play, Square, AlertTriangle, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { timeSince } from '@/lib/dashboardState';
import { base44 } from '@/api/base44Client';

export default function ActiveConversations({ conversations, npcs, theme, styles, onUpdated }) {
  const active = conversations.filter((c) => c.active);
  const [confirm, setConfirm] = useState(null);
  const npcFor = (cid) => npcs.find((n) => n.id === cid);
  const portrait = (n) => n && (n.approved_portrait_url || n.portrait_url);

  const endSession = async (c) => {
    const pending = (c.pending_updates || []).filter((u) => u.status !== 'rejected').length;
    if (pending > 0) { setConfirm(c); return; }
    await doEnd(c);
  };
  const doEnd = async (c) => { try { await base44.entities.Conversation.update(c.id, { active: false }); onUpdated?.(); } catch {} setConfirm(null); };

  return (
    <section aria-label="Active conversations" className="rounded-xl p-4" style={styles.panel}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.ink }}><MessageSquare size={18} style={{ color: theme.accent }} /> Active Conversations</h2>
        <Link to="/conversations" className="text-xs font-semibold" style={{ color: theme.accent }}>All</Link>
      </div>
      {active.length === 0 ? (
        <p className="text-sm" style={{ color: theme.muted }}>No active conversations. Start one from an NPC profile.</p>
      ) : (
        <div className="space-y-2">
          {active.slice(0, 5).map((c) => {
            const n = npcFor(c.npc_id);
            const pending = (c.pending_updates || []).filter((u) => u.status !== 'rejected').length;
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.06)', boxShadow: pending > 0 ? `0 0 0 1px ${theme.accent}` : 'none' }}>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border" style={{ borderColor: theme.accent }}>
                  {n && portrait(n) ? <Image src={portrait(n)} fittingType="fill" className="h-full w-full" alt={c.npc_name} /> : <div className="grid h-full place-items-center"><MessageSquare size={14} style={{ color: theme.muted }} /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: theme.ink }}>{c.npc_name}</p>
                  <p className="text-xs" style={{ color: theme.muted }}>{timeSince(c.updated_date)}{pending > 0 && <span style={{ color: theme.accent }}> · {pending} pending</span>}</p>
                </div>
                <Link to={`/roleplay/${c.npc_id}`} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold" style={styles.accentBtn}><Play size={11}/>Continue</Link>
                <button onClick={() => endSession(c)} className="grid h-7 w-7 place-items-center rounded-md border" style={{ borderColor: theme.panelBorder, color: theme.muted }} title="End session"><Square size={11}/></button>
              </div>
            );
          })}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl p-5" style={styles.panel}>
            <div className="mb-2 flex items-center gap-2"><AlertTriangle size={18} style={{ color: '#9a2a2a' }} /><h3 className="font-bold" style={{ color: theme.ink }}>Unresolved information</h3></div>
            <p className="text-sm" style={{ color: theme.ink }}>This conversation has <strong>{(confirm.pending_updates || []).filter((u) => u.status !== 'rejected').length} pending profile update(s)</strong>. Ending the session leaves them unreviewed.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs" style={{ borderColor: theme.panelBorder, color: theme.muted }}><X size={12}/>Cancel</button>
              <Link to={`/roleplay/${confirm.npc_id}`} className="rounded-md px-3 py-1.5 text-xs font-semibold" style={styles.accentBtn}>Review First</Link>
              <button onClick={() => doEnd(confirm)} className="rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: '#9a2a2a', color: '#fff' }}>End Anyway</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}