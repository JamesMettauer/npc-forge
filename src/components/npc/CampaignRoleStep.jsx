import { useState, useEffect } from 'react';
import { Info, Wand2 } from 'lucide-react';
import { STANDALONE_NOTE, gatherCampaignContext, generateCampaignRole, isStandalone } from '@/lib/campaignRole';
import PersistentRoleDropdown from './PersistentRoleDropdown';

const has = (v) => !!(v && String(v).trim());
const FIELDS = [
  { key: 'role', label: 'Campaign role', type: 'select' },
  { key: 'location', label: 'Current location', type: 'text' },
  { key: 'services', label: 'Services offered', type: 'textarea' },
  { key: 'quests_rumors', label: 'Rumors or quest hooks', type: 'textarea' },
  { key: 'world_knowledge', label: 'Knowledge available', type: 'textarea' },
  { key: 'party_relationship', label: 'Relationship with player characters', type: 'textarea' },
  { key: 'initial_attitude', label: 'Initial attitude toward the party', type: 'text' },
];

export default function CampaignRoleStep({ npc, setNPC }){
  const [ctx, setCtx] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const standalone = isStandalone(npc);

  useEffect(() => {
    if (!npc.campaign_id) { setCtx(null); return; }
    let active = true;
    gatherCampaignContext(npc.campaign_id).then((c) => { if (active) setCtx(c); });
    return () => { active = false; };
  }, [npc.campaign_id]);

  const set = (k, v) => setNPC((p) => ({ ...p, [k]: v }));

  const generate = async () => {
    setBusy(true); setMsg('Generating campaign role…');
    try {
      const data = await generateCampaignRole(npc, ctx);
      if (data) {
        for (const f of FIELDS) if (has(data[f.key])) set(f.key, data[f.key]);
        setMsg('Campaign role generated.');
      } else setMsg('Could not generate campaign role. Please try again.');
    } catch { setMsg('Could not generate campaign role. Please try again.'); }
    setBusy(false); setTimeout(() => setMsg(''), 3000);
  };

  const inputCls = 'mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50';

  return (
    <div className="mt-6 space-y-4">
      {standalone ? (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-foreground">
          <Info size={14} className="mt-0.5 shrink-0 text-yellow-600"/>
          <div><p className="font-medium">Standalone/Test NPC</p><p className="mt-1 text-muted-foreground">{STANDALONE_NOTE}</p></div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
          <p className="font-medium text-foreground">{ctx?.campaign?.name || npc.campaign}</p>
          <p className="mt-1 text-muted-foreground">{ctx?.campaign?.setting || ''}</p>
          {ctx && (ctx.regions.length > 0 || ctx.factions.length > 0 || ctx.locations.length > 0) && (
            <div className="mt-2 space-y-0.5 text-muted-foreground">
              {ctx.regions.length > 0 && <p>Existing regions: {ctx.regions.join(', ')}</p>}
              {ctx.factions.length > 0 && <p>Existing factions: {ctx.factions.join(', ')}</p>}
              {ctx.locations.length > 0 && <p>Existing locations: {ctx.locations.join(', ')}</p>}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={generate} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-40"><Wand2 size={12}/>{busy ? 'Generating…' : 'Generate Campaign Role'}</button>
      </div>
      {msg && <p className="rounded-lg bg-muted p-2 text-xs text-foreground">{msg}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="rounded-xl border border-border p-3">
            <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
            {f.type === 'select' ? (
              <PersistentRoleDropdown value={npc[f.key] || ''} onChange={(v) => set(f.key, v)} placeholder="Choose…"/>
            ) : f.type === 'textarea' ? (
              <textarea rows={3} value={npc[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} className={inputCls}/>
            ) : (
              <input value={npc[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} className={inputCls}/>
            )}
          </div>
        ))}
      </div>
      {standalone && <p className="text-xs text-muted-foreground">A neutral default relationship is used. You can assign this NPC to a campaign later from the NPC profile.</p>}
    </div>
  );
}