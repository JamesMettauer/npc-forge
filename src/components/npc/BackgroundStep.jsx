import { useState, useEffect } from 'react';
import TextCombobox from './TextCombobox';
import { loadCampaigns } from '@/lib/promptGeneration';

const inputCls = 'w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-brand/50';
const labelCls = 'text-xs font-medium text-muted-foreground';

export default function BackgroundStep({ npc, setNPC }) {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => { loadCampaigns().then(setCampaigns); }, []);

  const set = (k, v) => setNPC(prev => ({ ...prev, [k]: v }));

  const onCampaign = (e) => {
    const id = e.target.value;
    if (!id) { set('campaign_id', ''); set('campaign', ''); return; }
    const c = campaigns.find(x => x.id === id);
    set('campaign_id', id);
    set('campaign', c?.name || '');
  };

  return (
    <div className="mt-6 space-y-5">
      <p className="text-sm text-muted-foreground">Where does this character come from, and what shaped them?</p>

      <div>
        <label className={labelCls}>Campaign</label>
        <select value={npc.campaign_id || ''} onChange={onCampaign} className={`mt-1.5 ${inputCls}`}>
          <option value="">No Campaign / Standalone</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <p className="mt-1 text-[10px] text-muted-foreground">Optional. The game world this character exists in.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Homeland</label>
          <div className="mt-1.5">
            <TextCombobox
              value={npc.homeland || ''}
              onChange={v => set('homeland', v)}
              suggestions={['Unknown']}
              placeholder="Enter or search homeland…"
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Where the individual comes from. Independent of Species.</p>
        </div>

        <div>
          <label className={labelCls}>Culture</label>
          <div className="mt-1.5">
            <TextCombobox
              value={npc.culture || ''}
              onChange={v => set('culture', v)}
              suggestions={['Unknown']}
              placeholder="Enter or search culture…"
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Social environment that shaped them. Not derived from Species.</p>
        </div>
      </div>
    </div>
  );
}