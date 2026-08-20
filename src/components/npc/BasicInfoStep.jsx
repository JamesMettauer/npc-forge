import { useState, useEffect } from 'react';
import { RefreshCw, Lock, Unlock, Sparkles, Wand2, AlertTriangle, Info, X } from 'lucide-react';
import { generateFromPrompt, generateMissingDetails, loadCampaign, loadCampaigns, subclassStatus, subclassLevelFor, buildType, BUILD_TYPES, POWER_LEVELS, RULESETS, showsClass, showsRole, validateCoherence, generateGenericSetting, SOURCE_LABELS } from '@/lib/promptGeneration';

const ALL_FIELDS = [
  { key: 'name', label: 'Character name' },
  { key: 'nicknames', label: 'Nicknames or titles' },
  { key: 'pronouns', label: 'Pronouns' },
  { key: 'age', label: 'Age' },
  { key: 'species', label: 'Species or lineage' },
  { key: 'homeland', label: 'Homeland' },
  { key: 'region', label: 'Region' },
  { key: 'culture', label: 'Culture' },
  { key: 'occupation', label: 'Occupation or role', role: true },
  { key: 'class_name', label: 'Adventuring class', cls: true },
  { key: 'subclass', label: 'Subclass', status: true, cls: true },
  { key: 'level', label: 'Character level', number: true, cls: true },
  { key: 'alignment', label: 'Alignment' },
  { key: 'faction', label: 'Faction or organization' },
  { key: 'campaign', label: 'Campaign setting' },
];

const has = (v) => !!(v && String(v).trim());

export default function BasicInfoStep({ npc, setNPC }){
  const [campaigns, setCampaigns] = useState([]);
  const [locks, setLocks] = useState({});
  const [status, setStatus] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadCampaigns().then(setCampaigns); }, []);

  const set = (k, v) => setNPC((p) => ({ ...p, [k]: v }));
  const setSource = (k, src) => setNPC((p) => ({ ...p, prompt_sources: { ...(p.prompt_sources || {}), [k]: src } }));
  const toggleLock = (k) => setLocks((l) => ({ ...l, [k]: !l[k] }));

  const onBuildType = (e) => {
    const bt = e.target.value;
    set('npc_build_type', bt);
    if (bt === 'NPC Role') { set('class_name', ''); set('subclass', ''); set('level', ''); }
  };

  const onCampaign = (e) => {
    const id = e.target.value;
    if (!id) { set('campaign_id', ''); set('campaign', generateGenericSetting(npc)); setSource('campaign', 'generated'); return; }
    const c = campaigns.find((x) => x.id === id);
    set('campaign_id', id);
    set('campaign', c?.setting || c?.name || '');
    setSource('campaign', 'campaign');
  };

  const generateMissing = async () => {
    setBusy(true); setMsg('Generating missing details…');
    try {
      const campaign = npc.campaign_id ? await loadCampaign(npc.campaign_id) : null;
      const updated = await generateMissingDetails(npc, campaign);
      setNPC(updated);
      const added = ALL_FIELDS.filter((f) => !has(npc[f.key]) && has(updated[f.key]));
      setMsg(added.length ? `Added ${added.map((f) => f.label).join(', ')}.` : 'All fields already complete.');
    } catch { setMsg('Could not generate details. Please try again.'); }
    setBusy(false); setTimeout(() => setMsg(''), 4000);
  };

  const regenField = async (f) => {
    if (locks[f.key]) return;
    setStatus((s) => ({ ...s, [f.key]: 'generating' }));
    try {
      const campaign = npc.campaign_id ? await loadCampaign(npc.campaign_id) : null;
      const data = await generateFromPrompt(npc.original_creation_prompt || '', campaign, { ...npc, [f.key]: '' });
      if (data[f.key] != null && String(data[f.key]).trim()) {
        set(f.key, f.number ? Number(data[f.key]) : data[f.key]);
        setSource(f.key, (data.sources && data.sources[f.key]) || 'generated');
        setStatus((s) => ({ ...s, [f.key]: '' }));
      } else {
        setStatus((s) => ({ ...s, [f.key]: 'error' }));
        setMsg(`Could not generate ${f.label.toLowerCase()}. Try again or enter it manually.`);
        setTimeout(() => setMsg(''), 4000);
      }
    } catch { setStatus((s) => ({ ...s, [f.key]: 'error' })); }
  };

  const sourceBadge = (key) => {
    const src = npc.prompt_sources?.[key] || (has(npc[key]) ? 'manual' : '');
    if (!src) return null;
    const label = SOURCE_LABELS[src] || src;
    const color = src === 'prompt' ? 'bg-brand/10 text-brand' : src === 'campaign' || src === 'lore' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300' : src === 'generated' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300' : src === 'review' ? 'bg-red-500/10 text-red-600 dark:text-red-300' : 'bg-muted text-muted-foreground';
    return <span className={`rounded-full px-2 py-0.5 text-[10px] ${color}`} title={label}>{label}</span>;
  };

  const warnings = [...(npc.prompt_meta?.warnings || []), ...validateCoherence(npc)];
  const showCls = showsClass(npc);
  const showRole = showsRole(npc);
  const fields = ALL_FIELDS.filter((f) => {
    if (f.cls && !showCls) return false;
    if (f.role && !showRole) return false;
    return true;
  });
  const subclassEligible = !!(npc.class_name && (Number(npc.level) || 0) >= subclassLevelFor(npc.ruleset));
  const completed = fields.filter((f) => has(npc[f.key]) || f.status).length;

  const inputCls = 'mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50';
  const labelCls = 'text-xs font-medium text-muted-foreground';

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-3">
          <label className={labelCls}>NPC Build Type</label>
          <select value={npc.npc_build_type || ''} onChange={onBuildType} className={inputCls}>
            <option value="">Auto-detect</option>
            {BUILD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <p className="mt-1 text-[10px] text-muted-foreground">Detected: {buildType(npc)}</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <label className={labelCls}>NPC Power Level</label>
          <select value={npc.power_level || ''} onChange={(e) => set('power_level', e.target.value)} className={inputCls}>
            <option value="">Not set</option>
            {POWER_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <p className="mt-1 text-[10px] text-muted-foreground">Competence without class progression.</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <label className={labelCls}>Ruleset</label>
          <select value={npc.ruleset || ''} onChange={(e) => set('ruleset', e.target.value)} className={inputCls}>
            <option value="">D&D 5e (default)</option>
            {RULESETS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <p className="mt-1 text-[10px] text-muted-foreground">Subclass unlocks at level {subclassLevelFor(npc.ruleset)}.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-input p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Info size={14}/>Build type: <span className="font-medium text-foreground">{buildType(npc)}</span>{npc.power_level && <span className="text-xs">· {npc.power_level}</span>}</div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={npc.campaign_id || ''} onChange={onCampaign} className="rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground">
            <option value="">No campaign — generic setting</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <button onClick={generateMissing} disabled={busy} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-40"><Wand2 size={14}/>{busy ? 'Generating missing details…' : 'Generate Missing Details'}</button>

      {msg && <p className="rounded-lg bg-muted p-2 text-xs text-foreground">{msg}</p>}

      {warnings.length > 0 && (
        <div className="space-y-1 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-2">
          {warnings.map((w, i) => <p key={i} className="flex items-start gap-1.5 text-xs text-foreground"><AlertTriangle size={12} className="mt-0.5 shrink-0 text-yellow-600"/>{w}</p>)}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <label className={labelCls}>{f.label}</label>
              <div className="flex items-center gap-1.5">
                {sourceBadge(f.key)}
                {locks[f.key] && <Lock size={11} className="text-brand"/>}
                {status[f.key] === 'generating' && <span className="text-[10px] text-muted-foreground">Generating…</span>}
                {status[f.key] === 'error' && <button onClick={() => regenField(f)} className="text-[10px] text-destructive">Retry</button>}
              </div>
            </div>
            {f.status ? (
              <div>
                {subclassEligible ? (
                  <input value={npc[f.key] || ''} onChange={(e) => { set(f.key, e.target.value); setSource(f.key, 'manual'); }} placeholder="Selection required" className={inputCls}/>
                ) : (
                  <p className="mt-1 rounded-lg bg-muted px-3 py-2 text-sm italic text-muted-foreground">{subclassStatus(npc)}</p>
                )}
              </div>
            ) : (
              <input type={f.number ? 'number' : 'text'} value={npc[f.key] ?? ''} onChange={(e) => { set(f.key, f.number ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value); setSource(f.key, 'manual'); }} placeholder={f.key === 'faction' ? 'Independent' : ''} className={inputCls}/>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {!has(npc[f.key]) && !f.status && <button onClick={() => regenField(f)} disabled={locks[f.key] || status[f.key] === 'generating'} className="tool"><Sparkles size={11}/>Generate</button>}
              {has(npc[f.key]) && <button onClick={() => regenField(f)} disabled={locks[f.key] || status[f.key] === 'generating'} className="tool"><RefreshCw size={11}/>Regenerate</button>}
              <button onClick={() => toggleLock(f.key)} className="tool">{locks[f.key] ? <Unlock size={11}/> : <Lock size={11}/>}{locks[f.key] ? 'Unlock' : 'Lock'}</button>
              {has(npc[f.key]) && <button onClick={() => set(f.key, f.number ? '' : '')} className="tool"><X size={11}/>Clear</button>}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{completed} of {fields.length} fields complete. Empty fields use placeholders (Unspecified, Independent, Not yet available) where appropriate.</p>
    </div>
  );
}