import { useState } from 'react';
import { UserPlus, X, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function InviteModal({ open, onClose, campaigns }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [campaignId, setCampaignId] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;
  const submit = async () => {
    if (!email.trim()) return;
    setBusy(true); setErr('');
    try {
      await base44.auth.inviteUser(email.trim(), role);
      setDone(true);
    } catch (e) { setErr('Could not send invitation. The email may already be invited.'); }
    setBusy(false);
  };
  const close = () => { setEmail(''); setRole('user'); setCampaignId(''); setDone(false); setErr(''); onClose(); };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={close}>
      <div className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold"><UserPlus size={18}/> Invite Player</h3>
          <button onClick={close} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><X size={16}/></button>
        </div>
        {done ? (
          <div className="py-4 text-center">
            <Check size={32} className="mx-auto mb-2 text-brand" />
            <p className="text-sm text-foreground">Invitation sent to <strong>{email}</strong>.</p>
            <button onClick={close} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Done</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Player email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="player@example.com"
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm">
                <option value="user">Player</option>
                <option value="admin">Admin (co-DM)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Campaign (optional)</label>
              <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm">
                <option value="">No campaign</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {err && <p className="text-xs text-destructive">{err}</p>}
            <button onClick={submit} disabled={busy || !email.trim()} className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-40">
              {busy ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
