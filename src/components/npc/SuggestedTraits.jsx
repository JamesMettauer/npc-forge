import { useEffect, useState, useRef } from 'react';
import { RefreshCw, Plus, X, Pencil, Check, Sparkles, Lock, Unlock, Star, AlertTriangle, Wand2, Shuffle, Eraser, GitMerge } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { CATEGORIES, FIELD_MAP, FILTERS, isDuplicate, getSelectedTraits, addTraitToField, removeTraitFully, editTraitFully, moveTrait, isLocked, isCore, isRejected, isIntentionalConflict, toggleLock, toggleCore, addRejected, clearRejected, addIntentionalConflict, mergeSimilar, detectConflicts, getMeta, setMeta, getAutoStarters, markAutoStarters, clearAutoStarters } from '@/lib/traits';

export default function SuggestedTraits({ npc, setNPC }){
  const [mode, setMode] = useState('common');
  const [suggestions, setSuggestions] = useState({});
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editTarget, setEditTarget] = useState(null);
  const [editText, setEditText] = useState('');
  const [customCat, setCustomCat] = useState(null);
  const [customText, setCustomText] = useState('');
  const [conflict, setConflict] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [msg, setMsg] = useState('');
  const lastKey = useRef('');
  const conflictTimer = useRef(null);
  const lastPreselectCombo = useRef('');

  const combo = [npc.name, npc.species, npc.age, npc.sex_gender, npc.pronouns, npc.homeland, npc.region, npc.culture, npc.class_name, npc.subclass, npc.level, npc.alignment, npc.faction, npc.occupation, npc.role, npc.campaign].filter(Boolean).join('|');
  const selected = getSelectedTraits(npc);
  const selectedTexts = selected.map((s) => s.text);

  const generate = async () => {
    if (!combo) return;
    setBusy(true);
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate D&D NPC trait suggestions for an individual person, not a species stereotype. Use ALL available context: Name=${npc.name||'unspecified'}, Original prompt=${npc.original_creation_prompt||'none'}, Species=${npc.species||'unspecified'}, Age=${npc.age||'unspecified'}, Sex/Gender=${npc.sex_gender||'unspecified'}, Homeland=${npc.homeland||'unspecified'}, Region=${npc.region||'unspecified'}, Culture=${npc.culture||'unspecified'}, Class=${npc.class_name||'unspecified'}, Subclass=${npc.subclass||'unspecified'}, Level=${npc.level||'unspecified'}, Alignment=${npc.alignment||'unspecified'}, Faction=${npc.faction||'unspecified'}, Occupation=${npc.occupation||'unspecified'}, Role=${npc.role||'unspecified'}, Campaign=${npc.campaign||'unspecified'}. ${npc.custom_species_data ? `Custom Species physical context (physical/appearance only, NOT personality): ${JSON.stringify({ physical_traits: npc.custom_species_data.physical_traits, lifespan: npc.custom_species_data.lifespan, distinguishing_features: npc.custom_species_data.distinguishing_features })}. ` : ''}IMPORTANT: Species provides biological/physical context only. Do NOT derive personality, ideals, morality, or social behavior from species stereotypes. Describe an individual person. Tone: ${mode} (common=typical, unusual=less expected but plausible, unpredictable=surprising twist). Provide 3 distinct suggestions per category. Never use copyrighted named characters. Keep each suggestion to one concise sentence. Avoid suggesting traits similar to these already selected: ${JSON.stringify(selectedTexts)}`,
        response_json_schema: { type: 'object', properties: Object.fromEntries(CATEGORIES.map(([k]) => [k, { type: 'array', items: { type: 'string' } }])) },
      });
      setSuggestions(data || {});
    } catch { setMsg('Trait suggestions could not be refreshed. Your selected traits remain saved.'); setTimeout(() => setMsg(''), 4000); }
    setBusy(false);
  };

  useEffect(() => {
    const key = `${combo}|${mode}`;
    if (!combo || key === lastKey.current) return;
    const t = setTimeout(() => { lastKey.current = key; generate(); }, 800);
    return () => clearTimeout(t);
  }, [combo, mode]);

  useEffect(() => {
    if (!lastPreselectCombo.current) lastPreselectCombo.current = getMeta(npc).preselect_combo || '';
    if (combo === lastPreselectCombo.current) return;
    const required = { personality_traits: 2, ideals: 1, bonds: 1, flaws: 1, mannerisms: 1 };
    let canPreselect = true;
    for (const [cat, count] of Object.entries(required)) {
      const items = (suggestions[cat] || []).map((s) => (s || '').trim()).filter(Boolean);
      if (items.length < count) { canPreselect = false; break; }
    }
    if (!canPreselect) return;
    const autoStarters = getAutoStarters(npc);
    if (selected.length > 0 && autoStarters.length === 0) {
      lastPreselectCombo.current = combo;
      return;
    }
    let next = npc;
    const autoStarterCats = {};
    if (autoStarters.length > 0) {
      for (const text of autoStarters) {
        const trait = selected.find((s) => s.text === text);
        if (trait) {
          next = removeTraitFully(next, trait.field, text);
          autoStarterCats[trait.cat] = (autoStarterCats[trait.cat] || 0) + 1;
        }
      }
      next = clearAutoStarters(next);
    }
    const targets = selected.length === 0 ? required : autoStarterCats;
    const newStarters = [];
    for (const [cat, count] of Object.entries(targets)) {
      const items = (suggestions[cat] || []).map((s) => (s || '').trim()).filter(Boolean);
      let added = 0;
      for (const item of items) {
        if (added >= count) break;
        const before = next;
        next = addTraitToField(next, FIELD_MAP[cat], item);
        if (next !== before) { newStarters.push(item); added++; }
      }
    }
    if (newStarters.length === 0 && autoStarters.length === 0) {
      lastPreselectCombo.current = combo;
      return;
    }
    if (newStarters.length > 0) next = markAutoStarters(next, newStarters);
    next = setMeta(next, { ...getMeta(next), preselect_combo: combo });
    lastPreselectCombo.current = combo;
    setNPC(next);
  }, [suggestions, combo, selected.length]);

  const visibleSuggestions = (cat) => {
    const raw = suggestions[cat] || [];
    const out = [];
    for (const s of raw) {
      const t = (s || '').trim();
      if (!t) continue;
      if (selectedTexts.some((sel) => isDuplicate(sel, t))) continue;
      if (isRejected(npc, t)) continue;
      if (out.some((o) => isDuplicate(o, t))) continue;
      out.push(t);
    }
    return out;
  };

  const addTrait = (cat, trait) => {
    const f = FIELD_MAP[cat];
    setNPC((p) => addTraitToField(p, f, trait));
    clearTimeout(conflictTimer.current);
    conflictTimer.current = setTimeout(() => checkConflictWith(trait, f, cat), 700);
  };

  const checkConflictWith = async (newTrait, newField, cat) => {
    const all = [...selectedTexts, newTrait];
    const conflicts = await detectConflicts(all);
    if (conflicts === null) { setMsg('Trait compatibility could not be checked.'); setTimeout(() => setMsg(''), 3000); return; }
    const c = conflicts.find((cf) => cf.traits.includes(newTrait) && !isIntentionalConflict(npc, cf.traits[0], cf.traits[1]));
    if (c) setConflict({ ...c, newTrait, newField, cat });
  };

  const dismiss = (trait) => setNPC((p) => addRejected(p, trait));
  const removeSelected = (field, text) => setNPC((p) => removeTraitFully(p, field, text));
  const saveEdit = () => { if (editTarget && editText.trim()) setNPC((p) => editTraitFully(p, editTarget.field, editTarget.text, editText.trim())); setEditTarget(null); setEditText(''); };
  const doMove = (field, text, toCat) => { if (toCat) setNPC((p) => moveTrait(p, field, text, FIELD_MAP[toCat])); };

  const regenCategory = async (cat) => {
    setBusy(true);
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 D&D NPC ${cat.replace(/_/g, ' ')} suggestions. Species=${npc.species||'unspecified'}, Class=${npc.class_name||'unspecified'}, Occupation=${npc.occupation||'unspecified'}, Role=${npc.role||'unspecified'}, Alignment=${npc.alignment||'unspecified'}. Tone: ${mode}. Never use copyrighted named characters. Avoid: ${JSON.stringify(selectedTexts)}`,
        response_json_schema: { type: 'object', properties: { [cat]: { type: 'array', items: { type: 'string' } } } },
      });
      setSuggestions((s) => ({ ...s, [cat]: [...(s[cat] || []), ...(data[cat] || [])] }));
    } catch { setMsg('Could not regenerate that category.'); setTimeout(() => setMsg(''), 3000); }
    setBusy(false);
  };

  const genMore = async (text, cat) => {
    setBusy(true);
    try {
      const data = await base44.integrations.Core.InvokeLLM({ prompt: `Given this D&D NPC trait: "${text}". Generate 3 similar traits in the same vein for category ${cat}. Distinct from the original. One concise sentence each.`, response_json_schema: { type: 'object', properties: { [cat]: { type: 'array', items: { type: 'string' } } } } });
      setSuggestions((s) => ({ ...s, [cat]: [...(s[cat] || []), ...(data[cat] || [])] }));
    } catch {}
    setBusy(false);
  };
  const genContrasting = async (text, cat) => {
    setBusy(true);
    try {
      const data = await base44.integrations.Core.InvokeLLM({ prompt: `Given this D&D NPC trait: "${text}". Generate 3 contrasting traits that create interesting character tension (not direct contradictions). One concise sentence each.`, response_json_schema: { type: 'object', properties: { [cat]: { type: 'array', items: { type: 'string' } } } } });
      setSuggestions((s) => ({ ...s, [cat]: [...(s[cat] || []), ...(data[cat] || [])] }));
    } catch {}
    setBusy(false);
  };

  const reviewTraits = async () => {
    if (selectedTexts.length < 2) return;
    setReviewing(true);
    const conflicts = await detectConflicts(selectedTexts);
    setReviewing(false);
    if (conflicts === null) { setMsg('Trait compatibility could not be checked.'); setTimeout(() => setMsg(''), 3000); return; }
    const c = conflicts.find((cf) => !isIntentionalConflict(npc, cf.traits[0], cf.traits[1]));
    if (c) {
      const newTrait = c.traits[0];
      const existing = selected.find((s) => s.text === c.traits[1]) || selected.find((s) => s.text === newTrait);
      setConflict({ ...c, newTrait, newField: existing?.field || 'personality_traits', cat: existing?.cat || 'personality_traits' });
    } else setMsg('No unresolved trait conflicts found.');
  };

  const resolveConflict = (action) => {
    if (!conflict) return;
    const { newTrait, newField, traits, suggestion } = conflict;
    const otherTrait = traits.find((t) => t !== newTrait) || traits[0];
    if (action === 'intentional') setNPC((p) => addIntentionalConflict(p, newTrait, otherTrait, suggestion || ''));
    else if (action === 'refine' && suggestion) setNPC((p) => editTraitFully(p, newField, newTrait, suggestion));
    else if (action === 'remove') setNPC((p) => removeTraitFully(p, newField, newTrait));
    setConflict(null);
  };

  const dupPairs = [];
  for (let i = 0; i < selectedTexts.length; i++) for (let j = i + 1; j < selectedTexts.length; j++) if (isDuplicate(selectedTexts[i], selectedTexts[j])) dupPairs.push([selectedTexts[i], selectedTexts[j]]);

  const shownCats = filter === 'all' ? CATEGORIES : CATEGORIES.filter(([k]) => k === filter);

  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-input p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles size={16} className="text-brand"/>Suggestions sync to species, class, role, faction, and other Step 1 choices.</div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={mode} onChange={(e) => { setMode(e.target.value); lastKey.current = ''; }} className="rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground">
            <option value="common">Common</option><option value="unusual">Unusual</option><option value="unpredictable">Unpredictable</option>
          </select>
          <button onClick={generate} disabled={busy || !combo} className="flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs text-brand disabled:opacity-40"><RefreshCw size={12}/>{busy ? 'Working…' : 'Refresh'}</button>
          <button onClick={() => setSuggestions({})} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"><Eraser size={12}/>Clear Unselected</button>
          <button onClick={() => setNPC((p) => clearRejected(p))} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"><RefreshCw size={12}/>Reset Rejected</button>
        </div>
      </div>

      {msg && <p className="rounded-lg bg-muted p-2 text-xs text-foreground">{msg}</p>}

      <section>
        <h3 className="mb-2 font-serif text-lg">Selected Traits</h3>
        {selected.length === 0 ? (busy ? <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Preparing starter trait suggestions…</p> : <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">No traits selected yet. Add suggestions below or enter a custom trait.</p>) :
          <div className="space-y-2">
            {CATEGORIES.map(([cat, label]) => {
              const items = selected.filter((s) => s.cat === cat);
              if (!items.length) return null;
              return (
                <div key={cat} className="rounded-xl border border-border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <div className="space-y-1.5">
                    {items.map((s) => (
                      <div key={s.text} className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/40 px-2 py-1.5">
                        {editTarget && editTarget.text === s.text ? (
                          <div className="flex flex-1 items-center gap-1">
                            <input value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 rounded border border-border bg-input px-2 py-1 text-xs text-foreground"/>
                            <button onClick={saveEdit} className="text-green-600 dark:text-green-300"><Check size={12}/></button>
                            <button onClick={() => { setEditTarget(null); setEditText(''); }} className="text-muted-foreground"><X size={12}/></button>
                          </div>
                        ) : (
                          <span className="flex-1 text-sm text-foreground">{s.text}{isLocked(npc, s.text) && <Lock size={10} className="ml-1 inline text-brand"/>}{isCore(npc, s.text) && <Star size={10} className="ml-1 inline text-brand"/>}</span>
                        )}
                        {!editTarget && <>
                          <button onClick={() => { setEditTarget(s); setEditText(s.text); }} className="text-muted-foreground hover:text-foreground" title="Edit"><Pencil size={12}/></button>
                          <button onClick={() => setNPC((p) => toggleLock(p, s.text))} className={isLocked(npc, s.text) ? 'text-brand' : 'text-muted-foreground hover:text-foreground'} title="Lock">{isLocked(npc, s.text) ? <Lock size={12}/> : <Unlock size={12}/>}</button>
                          <button onClick={() => setNPC((p) => toggleCore(p, s.text))} className={isCore(npc, s.text) ? 'text-brand' : 'text-muted-foreground hover:text-foreground'} title="Core trait"><Star size={12}/></button>
                          <select value="" onChange={(e) => doMove(s.field, s.text, e.target.value)} className="rounded border border-border bg-input px-1 py-0.5 text-[10px] text-muted-foreground" title="Move category">
                            <option value="">Move…</option>
                            {CATEGORIES.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
                          </select>
                          <button onClick={() => genMore(s.text, s.cat)} disabled={busy} className="text-muted-foreground hover:text-foreground" title="More like this"><Wand2 size={12}/></button>
                          <button onClick={() => genContrasting(s.text, s.cat)} disabled={busy} className="text-muted-foreground hover:text-foreground" title="Contrasting"><Shuffle size={12}/></button>
                          <button onClick={() => removeSelected(s.field, s.text)} className="text-muted-foreground hover:text-destructive" title="Remove"><X size={12}/></button>
                        </>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>}
      </section>

      {(dupPairs.length > 0 || selected.length >= 2) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
          {dupPairs.length > 0 && <span className="flex items-center gap-1 text-foreground"><AlertTriangle size={12} className="text-yellow-600"/>{dupPairs.length} selected trait(s) describe nearly the same behavior.</span>}
          <button onClick={() => setNPC((p) => mergeSimilar(p))} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground"><GitMerge size={12}/>Merge Similar</button>
          <button onClick={reviewTraits} disabled={reviewing} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground"><AlertTriangle size={12}/>{reviewing ? 'Checking…' : 'Review Traits'}</button>
        </div>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-serif text-lg">Suggested Traits</h3>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-2.5 py-1 text-[10px] ${filter === k ? 'bg-brand text-brand-foreground' : 'border border-border text-muted-foreground'}`}>{l}</button>)}
          </div>
        </div>
        {!combo ? <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Select a species, class, or role in Basic Information to see suggested traits.</p> :
          <div className="grid gap-3 sm:grid-cols-2">
            {shownCats.map(([cat, label]) => {
              const items = visibleSuggestions(cat);
              return (
                <div key={cat} className="rounded-xl border border-border bg-input p-3">
                  <div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-medium text-foreground">{label}</h4><button onClick={() => regenCategory(cat)} disabled={busy} className="text-muted-foreground hover:text-brand"><RefreshCw size={12}/></button></div>
                  <div className="space-y-1.5">
                    {items.length ? items.map((s, i) => (
                      <div key={i} className="group flex items-start gap-2 rounded-lg p-1.5 hover:bg-muted">
                        <p className="flex-1 text-xs leading-5 text-muted-foreground">{s}</p>
                        <div className="flex shrink-0 gap-1 opacity-60 group-hover:opacity-100">
                          <button onClick={() => addTrait(cat, s)} className="text-green-600 dark:text-green-300 hover:text-green-700 dark:hover:text-green-200" title="Add"><Check size={12}/></button>
                          <button onClick={() => dismiss(s)} className="text-muted-foreground hover:text-destructive" title="Dismiss"><X size={12}/></button>
                        </div>
                      </div>
                    )) : <p className="text-xs text-muted-foreground">No suggestions in this category.</p>}
                  </div>
                  {customCat === cat ? (
                    <div className="mt-2 flex gap-1">
                      <input autoFocus value={customText} onChange={(e) => setCustomText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && customText.trim()) { addTrait(cat, customText.trim()); setCustomText(''); setCustomCat(null); } }} placeholder="Custom trait…" className="flex-1 rounded border border-border bg-input px-2 py-1 text-xs text-foreground"/>
                      <button onClick={() => { if (customText.trim()) { addTrait(cat, customText.trim()); setCustomText(''); setCustomCat(null); } }} className="text-green-600 dark:text-green-300"><Check size={12}/></button>
                      <button onClick={() => { setCustomCat(null); setCustomText(''); }} className="text-muted-foreground"><X size={12}/></button>
                    </div>
                  ) : <button onClick={() => setCustomCat(cat)} className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Plus size={10}/>Add custom</button>}
                </div>
              );
            })}
          </div>}
      </section>

      {conflict && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="max-w-md rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-600"/><h3 className="font-serif text-lg">Trait Conflict — {conflict.severity}</h3></div>
            <p className="mt-2 text-sm text-foreground">{conflict.reason}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p><span className="text-foreground">Existing:</span> {conflict.traits.find((t) => t !== conflict.newTrait) || conflict.traits[0]}</p>
              <p><span className="text-foreground">New:</span> {conflict.newTrait}</p>
              {conflict.suggestion && <p className="text-brand">Refinement: {conflict.suggestion}</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => resolveConflict('intentional')} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground">Keep as Intentional Conflict</button>
              {conflict.suggestion && <button onClick={() => resolveConflict('refine')} className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground">Refine to Suggestion</button>}
              <button onClick={() => resolveConflict('remove')} className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground">Remove New Trait</button>
              <button onClick={() => setConflict(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}