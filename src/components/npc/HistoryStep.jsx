import { useState, useEffect } from 'react';
import { Wand2, Plus } from 'lucide-react';
import { generateHistory, suggestField, HISTORY_FIELDS, SECTION_LAYOUT, SUGGESTIBLE_KEYS } from '@/lib/history';
import { loadDraft, saveDraft } from '@/lib/npcDraft';
import HistoryFieldCard from './HistoryFieldCard';

const has = (v) => !!(v && String(v).trim());

export default function HistoryStep({ npc, setNPC }){
  const [locks, setLocks] = useState({});
  const [suggestions, setSuggestions] = useState(() => loadDraft()?.history_suggestions || {});
  const [editKey, setEditKey] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldBusy, setFieldBusy] = useState(null);
  const [msg, setMsg] = useState('');

  const set = (k, v) => setNPC((p) => ({ ...p, [k]: v }));
  const toggleLock = (k) => setLocks((l) => ({ ...l, [k]: !l[k] }));

  // Suggestion state is persisted separately from the NPC object so generated
  // content never silently becomes accepted/canon. Both states survive
  // navigation and reload independently. This effect patches ONLY
  // history_suggestions against the latest draft — it never touches step,
  // npc, or other workflow metadata, so History actions can never regress
  // the current Character Contract step.
  useEffect(() => { saveDraft({ history_suggestions: suggestions }); }, [suggestions]);

  const setSuggestion = (key, val) => setSuggestions((s) => {
    const n = { ...s };
    if (val && String(val).trim()) n[key] = val; else delete n[key];
    return n;
  });
  const clearSuggestion = (key) => setSuggestions((s) => { const n = { ...s }; delete n[key]; return n; });

  const getMode = (key) => {
    if (has(npc[key])) return 'accepted';
    if (has(suggestions[key])) return 'suggested';
    return 'empty';
  };

  const generateAll = async () => {
    setBusy(true); setMsg('Suggesting their story…');
    try {
      const data = await generateHistory(npc);
      if (data) {
        const newSugg = {};
        for (const f of HISTORY_FIELDS) {
          if (!locks[f.key] && !has(npc[f.key]) && has(data[f.key])) newSugg[f.key] = data[f.key];
        }
        setSuggestions(() => newSugg);
        setMsg('Story suggestions ready — review and accept what fits.');
      } else setMsg('Could not suggest a story. Please try again.');
    } catch { setMsg('Could not suggest a story. Please try again.'); }
    setBusy(false); setTimeout(() => setMsg(''), 4000);
  };

  const suggestOne = async (key) => {
    if (locks[key] || has(npc[key])) return;
    setFieldBusy(key);
    try {
      const data = await suggestField(npc, key);
      if (data && has(data[key])) setSuggestion(key, data[key]);
    } catch {}
    setFieldBusy(null);
  };

  const regenerateField = async (key) => {
    if (locks[key] || has(npc[key])) return;
    setFieldBusy(key);
    try {
      const data = await suggestField(npc, key);
      if (data && has(data[key])) setSuggestion(key, data[key]);
      else clearSuggestion(key);
    } catch {}
    setFieldBusy(null);
  };

  const acceptField = (key) => {
    if (locks[key] || has(npc[key])) return;
    const sugg = suggestions[key];
    if (has(sugg)) {
      set(key, sugg);
      clearSuggestion(key);
    }
  };

  const clearField = (key) => {
    if (has(suggestions[key])) clearSuggestion(key);
    else if (!locks[key]) set(key, '');
  };

  const startEdit = (key) => {
    setEditKey(key);
    const mode = getMode(key);
    setDraft(mode === 'accepted' ? (npc[key] || '') : (mode === 'suggested' ? (suggestions[key] || '') : ''));
  };
  const saveEdit = () => {
    if (!editKey) return;
    const key = editKey;
    const mode = getMode(key);
    if (mode === 'accepted') {
      if (draft.trim() && !locks[key]) set(key, draft.trim());
    } else if (mode === 'suggested') {
      setSuggestion(key, draft.trim());
    } else if (draft.trim()) {
      set(key, draft.trim());
    }
    setEditKey(null); setDraft('');
  };
  const cancelEdit = () => { setEditKey(null); setDraft(''); };

  const fieldMap = Object.fromEntries(HISTORY_FIELDS.map((f) => [f.key, f]));
  const sections = [
    { title: 'What Shaped Them?', desc: 'Where the character came from and what formed them.', keys: SECTION_LAYOUT.shaped, optional: false },
    { title: 'What Do They Want Right Now?', desc: 'Their immediate situation and stakes.', keys: SECTION_LAYOUT.wantNow, optional: false },
    { title: 'What Lies Beneath?', desc: 'Optional depths — leave empty if nothing fits.', keys: SECTION_LAYOUT.beneath, optional: true },
  ];

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Develop this character's story from established facts. Suggestions are proposals — accept the ones that fit.</p>
        <button onClick={generateAll} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-40"><Wand2 size={12}/>{busy ? 'Suggesting…' : 'Suggest Their Story'}</button>
      </div>
      {msg && <p className="rounded-lg bg-muted p-2 text-xs text-foreground">{msg}</p>}

      {sections.map((sec) => (
        <section key={sec.title} className="space-y-3">
          <div>
            <h3 className="font-fantasy text-lg font-semibold">{sec.title}</h3>
            <p className="text-xs text-muted-foreground">{sec.desc}</p>
          </div>
          <div className="space-y-3">
            {sec.keys.map((key) => {
              const f = fieldMap[key];
              const mode = getMode(key);
              if (sec.optional && mode === 'empty' && editKey !== key) {
                return (
                  <div key={key} className="flex flex-wrap items-center gap-2">
                    <button onClick={() => startEdit(key)} className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-brand/40"><Plus size={12}/>Add {f.label}</button>
                    {SUGGESTIBLE_KEYS.includes(key) && <button onClick={() => suggestOne(key)} disabled={fieldBusy === key} className="flex items-center gap-1 text-xs text-brand hover:underline disabled:opacity-40"><Wand2 size={11}/>{fieldBusy === key ? 'Suggesting…' : `Suggest ${f.label}`}</button>}
                  </div>
                );
              }
              return (
                <HistoryFieldCard
                  key={key}
                  field={f}
                  mode={mode}
                  value={mode === 'accepted' ? npc[key] : (mode === 'suggested' ? suggestions[key] : '')}
                  locked={!!locks[key]}
                  editing={editKey === key}
                  draft={draft}
                  busy={fieldBusy === key}
                  onEdit={() => startEdit(key)}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onDraftChange={setDraft}
                  onToggleLock={() => toggleLock(key)}
                  onClear={() => clearField(key)}
                  onAccept={mode === 'suggested' ? () => acceptField(key) : undefined}
                  onRegenerate={mode === 'suggested' ? () => regenerateField(key) : undefined}
                  onSuggest={mode === 'empty' && SUGGESTIBLE_KEYS.includes(key) ? () => suggestOne(key) : undefined}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}