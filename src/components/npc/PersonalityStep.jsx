import { useState } from 'react';
import { Star, Plus, X, Pencil, Check, Lock, Unlock, Sparkles, AlertTriangle, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { addEntryToField, parseEntries, PERSONALITY_FIELDS, EMPTY_STATES } from '@/lib/personality';

const has = (v) => !!(v && String(v).trim());
const MAX_PRIMARY = 5;

const FLEX_FIELDS = [
  { key: 'ideals', label: 'Ideals' },
  { key: 'bonds', label: 'Bonds' },
  { key: 'flaws', label: 'Flaws' },
  { key: 'likes_dislikes', label: 'Likes / Dislikes' },
  { key: 'fears', label: 'Fears' },
  { key: 'mannerisms', label: 'Habits & Mannerisms' },
  { key: 'humor', label: 'Sense of Humor' },
  { key: 'temperament', label: 'Emotional Temperament' },
  { key: 'social_behavior', label: 'Social Behavior' },
];

const PRIMARY_FLEX = ['ideals', 'bonds', 'flaws'];
const SECONDARY_FLEX = ['mannerisms', 'humor', 'temperament', 'social_behavior'];
const OPTIONAL_FLEX = ['likes_dislikes', 'fears'];

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function PersonalityStep({ npc, setNPC }){
  const [locks, setLocks] = useState({});
  const [editKey, setEditKey] = useState(null);
  const [draft, setDraft] = useState('');
  const [newTrait, setNewTrait] = useState('');
  const [showMajor, setShowMajor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [expanded, setExpanded] = useState({});

  const set = (k, v) => setNPC((p) => ({ ...p, [k]: v }));
  const traits = parseEntries(npc.personality_traits);
  const primary = npc.primary_traits || [];

  const togglePrimary = (text) => {
    const isPrim = primary.includes(text);
    if (isPrim) set('primary_traits', primary.filter((t) => t !== text));
    else if (primary.length < MAX_PRIMARY) set('primary_traits', [...primary, text]);
    else setMsg(`Primary traits are limited to ${MAX_PRIMARY}.`);
  };

  const addTrait = () => {
    const t = (newTrait || '').trim();
    if (!t) return;
    set('personality_traits', addEntryToField(npc.personality_traits, t));
    setNewTrait('');
  };

  const removeTrait = (text) => {
    set('personality_traits', parseEntries(npc.personality_traits).filter((t) => t !== text).join('\n'));
    set('primary_traits', primary.filter((t) => t !== text));
  };

  const editTrait = (oldText, newText) => {
    const n = newText.trim();
    if (!n) return;
    set('personality_traits', parseEntries(npc.personality_traits).map((t) => (t === oldText ? n : t)).join('\n'));
    set('primary_traits', primary.map((t) => (t === oldText ? n : t)));
  };

  const addFlex = (key, text) => set(key, addEntryToField(npc[key], text));

  const generateFlex = async (key) => {
    const f = FLEX_FIELDS.find((x) => x.key === key);
    if (!f || locks[key]) return;
    setBusy(true); setMsg(`Suggesting ${f.label.toLowerCase()}…`);
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate the "${f.label}" for a D&D NPC, derived from and consistent with the character's Primary Personality Traits. Keep it concise (one short sentence or a few phrases). Write in third person.\n\nPrimary personality traits:\n${(npc.primary_traits || []).join('\n') || 'None defined yet — infer from the full profile.'}\n\nFull NPC profile:\n${JSON.stringify({ name: npc.name, species: npc.species, occupation: npc.occupation, class_name: npc.class_name, personality_traits: npc.personality_traits, backstory: npc.backstory, goals: npc.goals })}`,
        response_json_schema: { type: 'object', properties: { [key]: { type: 'string' } }, required: [key] },
      });
      if (data?.[key] && String(data[key]).trim()) set(key, addEntryToField(npc[key], data[key]));
      setMsg(`${f.label} suggested from primary traits.`);
    } catch { setMsg(`Could not suggest ${f.label.toLowerCase()}.`); }
    setBusy(false); setTimeout(() => setMsg(''), 3000);
  };

  const generatePrimary = async () => {
    setBusy(true); setMsg('Suggesting primary traits…');
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Given this D&D NPC, suggest 3-5 Primary Personality Traits that define the character's stable identity. Base them on the existing profile. Each trait should be one concise sentence. Return as a JSON array of strings.\n\nNPC: ${JSON.stringify({ name: npc.name, species: npc.species, occupation: npc.occupation, class_name: npc.class_name, backstory: npc.backstory, goals: npc.goals, personality_traits: npc.personality_traits })}`,
        response_json_schema: { type: 'object', properties: { traits: { type: 'array', items: { type: 'string' } } } },
      });
      const suggested = (data?.traits || []).filter((t) => t && !traits.some((x) => x.toLowerCase() === t.toLowerCase()));
      if (suggested.length) set('personality_traits', addEntryToField(npc.personality_traits, suggested.join('\n')));
      const slots = MAX_PRIMARY - primary.length;
      const newPrim = suggested.slice(0, Math.max(1, slots)).filter((t) => !primary.includes(t));
      if (newPrim.length) set('primary_traits', [...primary, ...newPrim]);
      setMsg('Primary traits suggested.');
    } catch { setMsg('Could not suggest primary traits.'); }
    setBusy(false); setTimeout(() => setMsg(''), 3000);
  };

  const submitMajor = (e) => {
    e?.preventDefault();
    const form = Object.fromEntries(new FormData(e?.target || new FormData()).entries());
    const ev = {
      id: newId(), date: new Date().toISOString(),
      existing_trait: form.existing_trait || '', proposed_trait: form.proposed_trait || '',
      life_event: form.life_event || '', campaign_event: form.campaign_event || '',
      change_type: form.change_type || 'replace', approved: true,
    };
    set('major_life_events', [...(npc.major_life_events || []), ev]);
    if (ev.proposed_trait) set('personality_traits', addEntryToField(npc.personality_traits, ev.proposed_trait));
    setShowMajor(false);
    setMsg('Major character change recorded.');
    setTimeout(() => setMsg(''), 3000);
  };

  const renderFlexField = (key, { compact = false } = {}) => {
    const f = FLEX_FIELDS.find((x) => x.key === key);
    if (!f) return null;
    const entries = parseEntries(npc[key]);
    const isEmpty = entries.length === 0;
    const isLocked = locks[key];
    const isExpanded = expanded[key] || !isEmpty;

    if (compact && isEmpty && !isExpanded) {
      return (
        <button key={key} onClick={() => setExpanded((s) => ({ ...s, [key]: true }))} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground">
          <Plus size={14}/> Add {f.label}
        </button>
      );
    }

    return (
      <div key={key} className="rounded-xl border border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{f.label}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => generateFlex(key)} disabled={busy || isLocked} className="tool" title="Suggest from primary traits"><Wand2 size={11}/>Suggest</button>
            <button onClick={() => setLocks((l) => ({ ...l, [key]: !l[key] }))} className="tool">{isLocked ? <Lock size={11}/> : <Unlock size={11}/>}{isLocked ? 'Unlock' : 'Lock'}</button>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          {entries.map((e) => (
            <div key={e} className="flex items-center gap-1.5 rounded bg-muted/40 px-2 py-1">
              <span className="flex-1 text-xs text-foreground">{e}</span>
              <button onClick={() => set(key, entries.filter((x) => x !== e).join('\n'))} className="text-muted-foreground hover:text-destructive"><X size={11}/></button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1">
          <input placeholder={`Add ${f.label.toLowerCase()}…`} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) { addFlex(key, e.target.value.trim()); e.target.value = ''; } }} className="flex-1 rounded border border-border bg-input px-2 py-1 text-xs text-foreground outline-none focus:border-brand/50"/>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-7">
      {/* ── WHO IS THIS CHARACTER? ── */}
      <section>
        <h3 className="font-fantasy text-xl text-foreground">Who Is This Character?</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Core identity — the traits, ideals, bonds, and flaws that define who they are when someone meets them.</p>

        {/* Primary Personality Traits */}
        <div className="mt-3 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div><p className="text-sm font-semibold text-foreground">Personality Traits</p><p className="text-xs text-muted-foreground">Primary traits become part of the character's stable identity after approval.</p></div>
            <button onClick={generatePrimary} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs text-brand disabled:opacity-40"><Wand2 size={12}/>{busy ? 'Suggesting…' : 'Suggest'}</button>
          </div>
          <div className="mt-2 flex gap-1">
            <input value={newTrait} onChange={(e) => setNewTrait(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newTrait.trim()) addTrait(); }} placeholder="Add a personality trait…" className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>
            <button onClick={addTrait} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground"><Plus size={12}/>Add</button>
          </div>
          <div className="mt-2 space-y-1.5">
            {traits.length === 0 && <p className="text-sm italic text-muted-foreground">No personality traits yet — add one or tap Suggest.</p>}
            {traits.map((t) => {
              const isPrim = primary.includes(t);
              return (
                <div key={t} className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/40 px-2 py-1.5">
                  {editKey === t ? (
                    <div className="flex flex-1 items-center gap-1">
                      <input autoFocus defaultValue={t} onKeyDown={(e) => { if (e.key === 'Enter') { editTrait(t, e.target.value); setEditKey(null); } }} className="flex-1 rounded border border-border bg-input px-2 py-1 text-xs text-foreground"/>
                      <button onClick={(e) => { const inp = e.target.closest('div').querySelector('input'); editTrait(t, inp.value); setEditKey(null); }} className="text-green-600 dark:text-green-300"><Check size={12}/></button>
                      <button onClick={() => setEditKey(null)} className="text-muted-foreground"><X size={12}/></button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-foreground">{t}</span>
                      <button onClick={() => togglePrimary(t)} className={isPrim ? 'text-brand' : 'text-muted-foreground hover:text-foreground'} title={isPrim ? 'Primary Trait — click to unmark' : 'Mark as Primary'} aria-label={isPrim ? 'Primary Trait — click to unmark' : 'Mark as Primary'}><Star size={12} fill={isPrim ? 'currentColor' : 'none'}/></button>
                      <button onClick={() => setEditKey(t)} className="text-muted-foreground hover:text-foreground" title="Edit"><Pencil size={12}/></button>
                      <button onClick={() => removeTrait(t)} className="text-muted-foreground hover:text-destructive" title="Remove"><X size={12}/></button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Primary traits: {primary.length} / {MAX_PRIMARY}</p>
              <p className="text-xs text-muted-foreground/70">Choose up to {MAX_PRIMARY} defining traits.</p>
            </div>
            <button onClick={() => setShowMajor(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><AlertTriangle size={12}/>Record a Major Life Change…</button>
          </div>
        </div>

        {/* Ideals, Bonds, Flaws */}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {PRIMARY_FLEX.map((k) => renderFlexField(k))}
        </div>
      </section>

      {/* ── WHAT ARE THEY LIKE TO BE AROUND? ── */}
      <section>
        <h3 className="font-fantasy text-xl text-foreground">What Are They Like To Be Around?</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">How they come across in everyday interaction — mannerisms, humor, temperament, and social style.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SECONDARY_FLEX.map((k) => renderFlexField(k, { compact: true }))}
        </div>
      </section>

      {/* ── ADD MORE PERSONALITY DETAIL ── */}
      <section>
        <h3 className="font-fantasy text-lg text-foreground">Add More Personality Detail</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Optional depth — likes, dislikes, and fears. Add them only if they matter for this character.</p>
        <div className="mt-2 space-y-2">
          {OPTIONAL_FLEX.map((k) => renderFlexField(k, { compact: true }))}
        </div>
      </section>

      {msg && <p className="rounded-lg bg-muted p-2 text-xs text-foreground">{msg}</p>}

      {showMajor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form onSubmit={submitMajor} className="max-w-md rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-600"/><h3 className="font-fantasy text-lg">Record a Major Life Change</h3></div>
            <p className="mt-1 text-xs text-muted-foreground">A major event (betrayal, death, conversion, corruption, redemption, trauma, faction change, etc.) can justify changing an established Primary Trait.</p>
            <div className="mt-3 space-y-2 text-sm">
              <input name="existing_trait" placeholder="Existing primary trait" className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>
              <input name="proposed_trait" placeholder="Proposed new or changed trait" className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>
              <input name="life_event" placeholder="Life event or reason" className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>
              <input name="campaign_event" placeholder="Supporting campaign event" className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>
              <select name="change_type" className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground">
                <option value="replace">Replaces the trait</option>
                <option value="weaken">Weakens the trait</option>
                <option value="strengthen">Strengthens the trait</option>
                <option value="complicate">Complicates the trait</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowMajor(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">Cancel</button>
              <button type="submit" className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground">Record Change</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}