import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Pencil, Lock, Unlock, Check, X, Wand2, Volume2, Square, AlertCircle, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { generateVoiceField, generateCompleteVoiceProfile, speak, getVoices, voiceAvailable, TEST_SAMPLES, generateStudioSpeech } from '@/lib/voice';

const has = (v) => !!(v && String(v).trim());

const PRIMARY_FIELDS = [
  { key: 'speaking_style', label: 'Speaking Style', desc: 'Overall manner of speech.' },
  { key: 'vocabulary', label: 'Vocabulary', desc: 'Simple, common, educated, scholarly, archaic, etc.' },
];

const SECONDARY_FIELDS = [
  { key: 'accent', label: 'Dialect & Influence', desc: 'Regional, cultural, professional, or social influences on speech. Describe cadence and idioms — avoid exaggerated phonetic spelling.' },
  { key: 'expressions', label: 'Signature Expressions', desc: 'Common phrases, greetings, curses, verbal habits, or sayings.' },
];

const BOUNDARY_FIELDS = [
  { key: 'avoided_topics', label: 'Topics Avoided', desc: 'Subjects the NPC steers away from.' },
  { key: 'conditional_information', label: 'Conditions for Revealing Information', desc: 'When the NPC shares sensitive details.' },
];

const ALL_FIELDS = [...PRIMARY_FIELDS, ...SECONDARY_FIELDS, ...BOUNDARY_FIELDS];

export default function VoiceStep({ npc, setNPC }){
  const [locks, setLocks] = useState({});
  const [status, setStatus] = useState({});
  const [editKey, setEditKey] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [testLine, setTestLine] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [emotion, setEmotion] = useState('neutral');
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceName, setVoiceName] = useState('');
  const [studioUrl, setStudioUrl] = useState('');
  const [studioBusy, setStudioBusy] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [showAudio, setShowAudio] = useState(false);

  useEffect(() => { if (voiceAvailable()) { setVoices(getVoices()); const h = () => setVoices(getVoices()); window.speechSynthesis.onvoiceschanged = h; return () => { window.speechSynthesis.onvoiceschanged = null; }; } }, []);

  const set = (k, v) => setNPC((p) => ({ ...p, [k]: v }));
  const toggleLock = (k) => setLocks((l) => ({ ...l, [k]: !l[k] }));

  const regenField = async (f) => {
    if (locks[f.key]) return;
    setStatus((s) => ({ ...s, [f.key]: 'generating' }));
    try {
      const v = await generateVoiceField(npc, f.key);
      if (v && String(v).trim()) set(f.key, v);
      setStatus((s) => ({ ...s, [f.key]: '' }));
    } catch { setStatus((s) => ({ ...s, [f.key]: 'error' })); }
  };

  const generateAll = async () => {
    setBusy(true); setMsg('Suggesting communication style…');
    try {
      const data = await generateCompleteVoiceProfile(npc);
      if (data) {
        for (const f of ALL_FIELDS) if (!locks[f.key] && has(data[f.key])) set(f.key, data[f.key]);
        set('voice_profile', { speaking_style: data.speaking_style, vocabulary: data.vocabulary, accent: data.accent, expressions: data.expressions, avoided_topics: data.avoided_topics, conditional_information: data.conditional_information });
        setMsg('Communication style suggested.');
      } else setMsg('Could not suggest communication style. Please try again.');
    } catch { setMsg('Could not suggest communication style. Please try again.'); }
    setBusy(false); setTimeout(() => setMsg(''), 3000);
  };

  const startEdit = (k) => { setEditKey(k); setDraft(npc[k] || ''); };
  const saveEdit = () => { if (editKey && draft.trim()) set(editKey, draft.trim()); setEditKey(null); setDraft(''); };

  const testVoice = (text) => {
    const line = (text || testLine || TEST_SAMPLES[emotion] || '').trim();
    if (!line) return;
    if (!voiceAvailable()) { setMsg('Voice preview is not available in this browser. You can still complete the NPC.'); setTimeout(() => setMsg(''), 3000); return; }
    setSpeaking(true);
    const ctrl = speak(line, { rate, pitch, voice: voiceName });
    if (!ctrl) { setSpeaking(false); return; }
    const stop = () => { ctrl.stop(); setSpeaking(false); };
    window.speechSynthesis.onend = () => setSpeaking(false);
    setSpeaking({ stop });
  };

  const stopVoice = () => { if (typeof speaking === 'object' && speaking?.stop) speaking.stop(); else if (voiceAvailable()) window.speechSynthesis.cancel(); setSpeaking(false); };

  const studioPreview = async (text) => {
    const line = (text || testLine || TEST_SAMPLES[emotion] || '').trim();
    if (!line || studioBusy) return;
    setStudioBusy(true); setStudioUrl(''); setMsg('Generating studio voice…');
    try {
      const url = await generateStudioSpeech(line, 'storm');
      if (url) { setStudioUrl(url); setMsg('Studio voice ready.'); } else setMsg('Could not generate studio voice.');
    } catch { setMsg('Could not generate studio voice.'); }
    setStudioBusy(false); setTimeout(() => setMsg(''), 3000);
  };

  const inputCls = 'mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50';

  const renderField = (f, { compact = false } = {}) => {
    const isLocked = locks[f.key];
    const isEmpty = !has(npc[f.key]);
    const isExpanded = expanded[f.key] || !isEmpty;

    if (compact && isEmpty && !isExpanded) {
      return (
        <button key={f.key} onClick={() => setExpanded((s) => ({ ...s, [f.key]: true }))} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground">
          <Plus size={14}/> Add {f.label}
        </button>
      );
    }

    return (
      <div key={f.key} className="rounded-xl border border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <div><p className="text-sm font-semibold text-foreground">{f.label}</p><p className="text-xs text-muted-foreground">{f.desc}</p></div>
          <div className="flex items-center gap-1.5">
            {isLocked && <Lock size={11} className="text-brand"/>}
            {status[f.key] === 'generating' && <span className="text-[10px] text-muted-foreground">Generating…</span>}
            {status[f.key] === 'error' && <button onClick={() => regenField(f)} className="text-[10px] text-destructive">Retry</button>}
          </div>
        </div>
        {editKey === f.key ? (
          <div className="mt-2">
            <textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50"/>
            <div className="mt-1 flex gap-1"><button onClick={saveEdit} className="rounded-lg bg-brand px-2 py-1 text-xs text-brand-foreground"><Check size={12}/></button><button onClick={() => { setEditKey(null); setDraft(''); }} className="rounded-lg border border-border px-2 py-1 text-xs"><X size={12}/></button></div>
          </div>
        ) : (
          <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${isEmpty ? 'italic text-muted-foreground' : 'text-foreground'}`}>{isEmpty ? 'Not yet defined.' : npc[f.key]}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {isEmpty && <button onClick={() => regenField(f)} disabled={isLocked || status[f.key] === 'generating'} className="tool"><Sparkles size={11}/>Suggest</button>}
          {!isEmpty && <button onClick={() => regenField(f)} disabled={isLocked || status[f.key] === 'generating'} className="tool"><RefreshCw size={11}/>Regenerate</button>}
          {editKey !== f.key && <button onClick={() => startEdit(f.key)} className="tool"><Pencil size={11}/>Edit</button>}
          <button onClick={() => toggleLock(f.key)} className="tool">{isLocked ? <Unlock size={11}/> : <Lock size={11}/>}{isLocked ? 'Unlock' : 'Lock'}</button>
          {!isEmpty && <button onClick={() => set(f.key, '')} className="tool"><X size={11}/>Clear</button>}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-7">
      <div>
        <p className="text-xs text-muted-foreground">How does this character sound when they speak? Build a communication profile the roleplay engine can use for text dialogue — no audio required.</p>
        <div className="mt-2 flex justify-end">
          <button onClick={generateAll} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-40"><Wand2 size={12}/>{busy ? 'Suggesting…' : 'Suggest How They Speak'}</button>
        </div>
      </div>

      {msg && <p className="rounded-lg bg-muted p-2 text-xs text-foreground">{msg}</p>}

      {/* ── COMMUNICATION PROFILE ── */}
      <section>
        <h3 className="font-fantasy text-xl text-foreground">Communication Profile</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">How they phrase dialogue, the words they choose, and what makes their speech distinct.</p>
        <div className="mt-3 space-y-3">
          {PRIMARY_FIELDS.map((f) => renderField(f))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SECONDARY_FIELDS.map((f) => renderField(f, { compact: true }))}
        </div>
      </section>

      {/* ── CONVERSATION BOUNDARIES ── */}
      <section>
        <h3 className="font-fantasy text-lg text-foreground">Conversation Boundaries</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">What will this character discuss, avoid, or reveal? These shape future dialogue, relationships, and social checks.</p>
        <div className="mt-2 space-y-2">
          {BOUNDARY_FIELDS.map((f) => renderField(f, { compact: true }))}
        </div>
      </section>

      {/* ── SPOKEN VOICE PREVIEW (OPTIONAL) ── */}
      <section>
        <button onClick={() => setShowAudio((s) => !s)} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          <span>Spoken Voice Preview (optional)</span>
          {showAudio ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        </button>
        {showAudio && (
          <div className="mt-2 rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Preview the NPC's voice using your browser's speech synthesis or studio generation. This is optional — the communication profile above works for text dialogue without it.</p>
            <textarea rows={2} value={testLine} onChange={(e) => setTestLine(e.target.value)} placeholder={TEST_SAMPLES[emotion]} className={inputCls}/>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <label className="flex items-center gap-1">Emotion
                <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className="rounded-lg border border-border bg-input px-2 py-1 text-foreground">
                  {Object.entries(TEST_SAMPLES).map(([k, v]) => <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>)}
                </select>
              </label>
              <button onClick={() => setTestLine(TEST_SAMPLES[emotion])} className="rounded-lg border border-border px-2 py-1">Use Sample</button>
              <label className="flex items-center gap-1">Speed
                <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-20"/>
              </label>
              <label className="flex items-center gap-1">Pitch
                <input type="range" min="0" max="2" step="0.1" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-20"/>
              </label>
              {voices.length > 0 && <label className="flex items-center gap-1">Voice
                <select value={voiceName} onChange={(e) => setVoiceName(e.target.value)} className="rounded-lg border border-border bg-input px-2 py-1 text-foreground">
                  <option value="">Default</option>
                  {voices.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {!speaking ? <button onClick={() => testVoice()} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground"><Volume2 size={12}/>Test Voice</button>
                : <button onClick={stopVoice} className="flex items-center gap-1.5 rounded-lg border border-destructive px-3 py-1.5 text-xs text-destructive"><Square size={12}/>Stop</button>}
              <button onClick={() => testVoice(TEST_SAMPLES[emotion])} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground"><Volume2 size={12}/>Preview {emotion}</button>
              <button onClick={() => studioPreview()} disabled={studioBusy} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground disabled:opacity-40"><Sparkles size={12}/>{studioBusy ? 'Generating…' : 'Studio Preview'}</button>
              <button onClick={() => { set('voice_profile', { ...(npc.voice_profile || {}), test_line: testLine || TEST_SAMPLES[emotion], rate, pitch, emotion }); setMsg('Voice settings saved.'); setTimeout(() => setMsg(''), 2000); }} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground"><Check size={12}/>Approve Voice</button>
            </div>
            {studioUrl && !studioBusy && <audio key={studioUrl} controls src={studioUrl} className="mt-2 w-full" />}
            {!voiceAvailable() && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><AlertCircle size={12}/>Voice preview unavailable in this browser. Character creation can still continue.</p>}
          </div>
        )}
      </section>
    </div>
  );
}