import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Pencil, Lock, Unlock, Check, X, Sparkles, Wand2, AlertTriangle, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { buildImageDescription, generateAppearance, generatePhysical, generateClothing, generateDistinguishing, ART_STYLES, DEFAULT_ART_STYLE, recommendArtStyles, emptyState } from '@/lib/appearance';
import ClampableText from './ClampableText';

const FIELDS = [
  { key: 'physical_description', label: 'Physical Description', desc: 'Permanent body and identifying physical traits.', gen: generatePhysical },
  { key: 'clothing_equipment', label: 'Clothing & Equipment', desc: 'Currently visible clothing, armor, tools, weapons, and carried items.', gen: generateClothing },
  { key: 'distinguishing_features', label: 'Distinguishing Features', desc: 'Recognizable species traits, expressions, mannerisms, and visual qualities.', gen: generateDistinguishing },
];

const has = (v) => !!(v && String(v).trim());

export default function AppearanceStep({ npc, setNPC }){
  const [locks, setLocks] = useState(/** @type {Record<string, boolean>} */ ({}));
  const [status, setStatus] = useState(/** @type {Record<string, '' | 'generating' | 'error'>} */ ({}));
  const [editKey, setEditKey] = useState(null);
  const [draft, setDraft] = useState('');
  const [imageEdited, setImageEdited] = useState(false);
  const [showRebuild, setShowRebuild] = useState(false);
  const [showClothingStale, setShowClothingStale] = useState(false);
  const [msg, setMsg] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const initRef = useRef(false);
  const mountedRef = useRef(false);
  const clothingKeyRef = useRef('');

  const set = (key, value) => setNPC((p) => ({ ...p, [key]: value }));
  const combo = [npc.species, npc.role, npc.class_name, npc.subclass, npc.region, npc.culture].filter(Boolean).join('|');

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      if (!has(npc.art_style)) set('art_style', DEFAULT_ART_STYLE);
      const tasks = [];
      if (!has(npc.physical_description) && !locks.physical_description) tasks.push({ key: 'physical_description', gen: generatePhysical });
      if (!has(npc.clothing_equipment) && !locks.clothing_equipment) tasks.push({ key: 'clothing_equipment', gen: generateClothing });
      if (!has(npc.distinguishing_features) && !locks.distinguishing_features) tasks.push({ key: 'distinguishing_features', gen: generateDistinguishing });
      for (const t of tasks) {
        setStatus((s) => ({ ...s, [t.key]: 'generating' }));
        try { const v = await t.gen(npc); set(t.key, v); setStatus((s) => ({ ...s, [t.key]: '' })); }
        catch { setStatus((s) => ({ ...s, [t.key]: 'error' })); }
      }
      if (tasks.some((t) => t.key === 'clothing_equipment')) clothingKeyRef.current = combo;
      if (!has(npc.image_prompt) && !locks.image_prompt) set('image_prompt', buildImageDescription({ ...npc, art_style: npc.art_style || DEFAULT_ART_STYLE }));
    })();
  }, []);

  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (locks.image_prompt) return;
    if (!has(npc.physical_description) && !has(npc.clothing_equipment) && !has(npc.distinguishing_features)) return;
    if (imageEdited) { setShowRebuild(true); return; }
    set('image_prompt', buildImageDescription(npc));
  }, [npc.physical_description, npc.clothing_equipment, npc.distinguishing_features, npc.art_style, npc.species, npc.role, npc.class_name, npc.subclass]);

  useEffect(() => {
    if (!has(npc.clothing_equipment)) return;
    if (!clothingKeyRef.current) { clothingKeyRef.current = combo; return; }
    if (clothingKeyRef.current !== combo && !locks.clothing_equipment) setShowClothingStale(true);
  }, [combo]);

  const generateAll = async () => {
    setMsg('Generating appearance…');
    try {
      const r = await generateAppearance(npc);
      if (!locks.physical_description) set('physical_description', r.physical_description);
      if (!locks.clothing_equipment) set('clothing_equipment', r.clothing_equipment);
      if (!locks.distinguishing_features) set('distinguishing_features', r.distinguishing_features);
      if (!has(npc.art_style)) set('art_style', DEFAULT_ART_STYLE);
      setImageEdited(false);
      set('image_prompt', buildImageDescription({ ...npc, ...r, art_style: npc.art_style || DEFAULT_ART_STYLE }));
      clothingKeyRef.current = combo;
      setMsg('Appearance generated.');
    } catch { setMsg('Could not generate appearance. Please try again.'); }
    finally { setTimeout(() => setMsg(''), 3000); }
  };

  const regenField = async (f) => {
    if (locks[f.key]) return;
    setStatus((s) => ({ ...s, [f.key]: 'generating' }));
    try { const v = await f.gen(npc); set(f.key, v); setStatus((s) => ({ ...s, [f.key]: '' })); if (f.key === 'clothing_equipment') clothingKeyRef.current = combo; }
    catch { setStatus((s) => ({ ...s, [f.key]: 'error' })); }
  };

  const startEdit = (key) => { setEditKey(key); setDraft(npc[key] || ''); };
  const saveEdit = () => { set(editKey, draft.trim()); setEditKey(null); if (editKey === 'image_prompt') setImageEdited(true); if (editKey === 'clothing_equipment') clothingKeyRef.current = combo; };
  const cancelEdit = () => { setEditKey(null); setDraft(''); };
  const toggleLock = (key) => setLocks((l) => ({ ...l, [key]: !l[key] }));

  const rebuildImage = () => { set('image_prompt', buildImageDescription(npc)); setImageEdited(false); setShowRebuild(false); };

  const recs = recommendArtStyles(npc);
  const artValue = ART_STYLES.includes(npc.art_style) ? npc.art_style : (has(npc.art_style) ? 'Custom Art Style' : DEFAULT_ART_STYLE);
  const isCustom = artValue === 'Custom Art Style';

  const renderField = (f) => {
    const val = npc[f.key];
    return (
      <div key={f.key} className="rounded-xl border border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <div><p className="text-sm font-semibold text-foreground">{f.label}</p><p className="text-xs text-muted-foreground">{f.desc}</p></div>
          <div className="flex items-center gap-1.5">
            {locks[f.key] && <span className="flex items-center gap-1 text-xs text-brand"><Lock size={12}/></span>}
            {status[f.key] === 'generating' && <span className="text-xs text-muted-foreground">Generating…</span>}
            {status[f.key] === 'error' && <button onClick={() => regenField(f)} className="text-xs text-destructive">Retry</button>}
          </div>
        </div>
        {editKey === f.key ? (
          <div className="mt-2">
            <textarea rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>
            <div className="mt-1 flex gap-1">
              <button onClick={saveEdit} className="rounded-lg bg-brand px-2 py-1 text-xs text-brand-foreground"><Check size={12}/></button>
              <button onClick={cancelEdit} className="rounded-lg border border-border px-2 py-1 text-xs"><X size={12}/></button>
            </div>
          </div>
        ) : (
          <ClampableText text={has(val) ? val : ''} emptyText={emptyState(f.key)} lines={3}/>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {!has(val) && <button onClick={() => regenField(f)} disabled={locks[f.key] || status[f.key] === 'generating'} className="tool"><Sparkles size={12}/>Generate</button>}
          {has(val) && <button onClick={() => regenField(f)} disabled={locks[f.key] || status[f.key] === 'generating'} className="tool"><RefreshCw size={12}/>Regenerate</button>}
          {editKey !== f.key && <button onClick={() => startEdit(f.key)} className="tool"><Pencil size={12}/>Edit</button>}
          <button onClick={() => toggleLock(f.key)} className="tool">{locks[f.key] ? <Unlock size={12}/> : <Lock size={12}/>}{locks[f.key] ? 'Unlock' : 'Lock'}</button>
          {f.key === 'clothing_equipment' && has(val) && <button onClick={() => set('clothing_equipment', '')} className="tool"><X size={12}/>Clear</button>}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-6">
      {msg && <p className="rounded-lg bg-muted p-2 text-xs text-foreground">{msg}</p>}

      {/* ── APPEARANCE DETAILS ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-fantasy text-lg font-semibold">Appearance Details</h3>
          <button onClick={generateAll} className="tool"><Wand2 size={14}/>Generate All</button>
        </div>

        {showClothingStale && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-2 text-xs text-foreground">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-600"/>
            <span className="flex-1">Earlier character choices have changed. Update Clothing & Equipment?</span>
            <button onClick={() => { regenField(FIELDS[1]); setShowClothingStale(false); }} className="rounded-lg bg-brand px-2 py-1 text-xs text-brand-foreground">Regenerate</button>
            <button onClick={() => setShowClothingStale(false)} className="rounded-lg border border-border px-2 py-1 text-xs">Keep Current</button>
          </div>
        )}

        <div className="space-y-3">{FIELDS.map(renderField)}</div>
      </section>

      {/* ── PORTRAIT STYLE ── */}
      <section>
        <h3 className="mb-3 font-fantasy text-lg font-semibold">Portrait Style</h3>
        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Portrait Style</p>
            <button onClick={() => toggleLock('art_style')} className="tool">{locks.art_style ? <Unlock size={12}/> : <Lock size={12}/>}{locks.art_style ? 'Unlock' : 'Lock'}</button>
          </div>
          <select value={artValue} onChange={(e) => set('art_style', e.target.value === 'Custom Art Style' ? '' : e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50">
            {ART_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {isCustom && <input value={has(npc.art_style) ? npc.art_style : ''} onChange={(e) => set('art_style', e.target.value)} placeholder="Describe your custom art style…" className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>}
          {recs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recs.map((s) => <button key={s} onClick={() => set('art_style', s)} className="rounded-full bg-brand/10 px-2.5 py-1 text-xs text-brand hover:bg-brand/20">{s}</button>)}
            </div>
          )}
        </div>
      </section>

      {/* ── ADVANCED (collapsed) ── */}
      <section>
        <button onClick={() => setShowAdvanced((p) => !p)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Settings size={14}/>{showAdvanced ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}Advanced
        </button>
        {showAdvanced && (
          <div className="mt-2 space-y-3">
            <div className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div><p className="text-sm font-semibold text-foreground">Image-Generation Description</p><p className="text-xs text-muted-foreground">Structured prompt for consistent portraits.</p></div>
                <div className="flex items-center gap-1.5">
                  {locks.image_prompt && <span className="flex items-center gap-1 text-xs text-brand"><Lock size={12}/></span>}
                  {imageEdited && <span className="text-xs text-muted-foreground">Edited</span>}
                </div>
              </div>
              {editKey === 'image_prompt' ? (
                <div className="mt-2">
                  <textarea rows={5} value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>
                  <div className="mt-1 flex gap-1">
                    <button onClick={saveEdit} className="rounded-lg bg-brand px-2 py-1 text-xs text-brand-foreground"><Check size={12}/></button>
                    <button onClick={cancelEdit} className="rounded-lg border border-border px-2 py-1 text-xs"><X size={12}/></button>
                  </div>
                </div>
              ) : (
                <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${has(npc.image_prompt) ? 'text-foreground' : 'italic text-muted-foreground'}`}>{has(npc.image_prompt) ? npc.image_prompt : emptyState('image_prompt')}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                <button onClick={rebuildImage} disabled={locks.image_prompt} className="tool"><RefreshCw size={12}/>Rebuild from Appearance</button>
                {editKey !== 'image_prompt' && <button onClick={() => startEdit('image_prompt')} className="tool"><Pencil size={12}/>Edit</button>}
                <button onClick={() => toggleLock('image_prompt')} className="tool">{locks.image_prompt ? <Unlock size={12}/> : <Lock size={12}/>}{locks.image_prompt ? 'Unlock' : 'Lock'}</button>
              </div>
            </div>

            {showRebuild && (
              <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-2 text-xs text-foreground">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-600"/>
                <span className="flex-1">Appearance information changed. Rebuild the image description?</span>
                <button onClick={rebuildImage} className="rounded-lg bg-brand px-2 py-1 text-xs text-brand-foreground">Rebuild</button>
                <button onClick={() => setShowRebuild(false)} className="rounded-lg border border-border px-2 py-1 text-xs">Keep Current</button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
