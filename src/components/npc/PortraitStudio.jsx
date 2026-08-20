import { useState } from 'react';
import { Image as ImageIcon, Upload, Sparkles, RefreshCw, Check, X, Lock, ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight, AlertCircle, Wand2, Pencil, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { buildImageDescription } from '@/lib/appearance';

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function PortraitStudio({ npc, setNPC }){
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [showReplace, setShowReplace] = useState(false);

  const candidates = npc.portrait_candidates || [];
  const variants = npc.portrait_variants || [];
  const approved = npc.approved_portrait_url || '';
  const current = npc.portrait_url || '';

  const buildPrompt = () => npc.image_prompt || buildImageDescription(npc) || npc.physical_description || npc.name || 'a fantasy character portrait';

  // ── PRE-APPROVAL ACTIONS ──
  const addCandidate = async () => {
    setBusy(true); setError('');
    try {
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: buildPrompt() });
      const c = { id: newId(), url, created_date: new Date().toISOString(), approved: false };
      setNPC((p) => ({ ...p, portrait_candidates: [...(p.portrait_candidates || []), c], portrait_url: url }));
    } catch { setError('Portrait generation failed. Please try again.'); }
    finally { setBusy(false); }
  };

  const regenerateCurrent = async () => {
    if (!current) return addCandidate();
    setBusy(true); setError('');
    try {
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: buildPrompt() });
      setNPC((p) => ({
        ...p,
        portrait_candidates: (p.portrait_candidates || []).map((c) => (c.url === current ? { ...c, url } : c)),
        portrait_url: url,
      }));
    } catch { setError('Regeneration failed. Please try again.'); }
    finally { setBusy(false); }
  };

  // ── POST-APPROVAL ACTIONS ──
  const createVariant = async () => {
    setBusy(true); setError('');
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `${buildPrompt()} — a new variant of this same character. Preserve face, species, anatomy, apparent age, hair, build, core clothing, and art style. Vary expression, pose, gesture, lighting, scene, weather, or temporary details.`,
      });
      const v = { id: newId(), url, created_date: new Date().toISOString(), approved: false };
      setNPC((p) => ({ ...p, portrait_variants: [...(p.portrait_variants || []), v], portrait_url: url }));
    } catch { setError('Variant generation failed. Please try again.'); }
    finally { setBusy(false); }
  };

  const applyEdit = async () => {
    const instruction = editInstruction.trim();
    if (!instruction) return;
    setBusy(true); setError('');
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `${buildPrompt()}. Apply this edit: ${instruction}. Preserve face, species, anatomy, apparent age, hair, build, core clothing, and art style.`,
      });
      const v = { id: newId(), url, created_date: new Date().toISOString(), approved: false };
      setNPC((p) => ({ ...p, portrait_variants: [...(p.portrait_variants || []), v], portrait_url: url }));
      setEditMode(false);
      setEditInstruction('');
    } catch { setError('Edit failed. Please try again.'); }
    finally { setBusy(false); }
  };

  const removeVariant = (id) => {
    setNPC((p) => {
      const prev = p.portrait_variants || [];
      const v = prev.find((x) => x.id === id);
      const next = prev.filter((x) => x.id !== id);
      const update = { portrait_variants: next };
      if (v && v.url === p.portrait_url) {
        update.portrait_url = p.approved_portrait_url || next[0]?.url || '';
      }
      return { ...p, ...update };
    });
  };

  const replaceApproved = () => {
    setNPC((p) => ({
      ...p,
      approved_portrait_url: '',
      lock_identity: false,
      portrait_candidates: (p.portrait_candidates || []).map((c) => ({ ...c, approved: false })),
      portrait_variants: [],
    }));
    setShowReplace(false);
  };

  // ── SHARED ACTIONS ──
  const approve = (url) => {
    setNPC((p) => ({
      ...p,
      approved_portrait_url: url,
      portrait_url: url,
      lock_identity: true,
      portrait_candidates: (p.portrait_candidates || []).map((c) => ({ ...c, approved: c.url === url })),
    }));
    setLightbox(null);
    setZoom(1);
  };

  const keepCurrent = () => {
    setNPC((p) => ({ ...p, approved_portrait_url: p.portrait_url || '', lock_identity: true }));
  };

  const removeCandidate = (id) => {
    setNPC((p) => {
      const prev = p.portrait_candidates || [];
      const c = prev.find((x) => x.id === id);
      const next = prev.filter((x) => x.id !== id);
      const update = { portrait_candidates: next };
      if (c && c.url === p.portrait_url) {
        update.portrait_url = next.find((x) => x.approved)?.url || next[0]?.url || p.approved_portrait_url || '';
      }
      return { ...p, ...update };
    });
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const item = { id: newId(), url: file_url, created_date: new Date().toISOString(), approved: false };
      setNPC((p) => {
        if (p.approved_portrait_url) {
          return { ...p, portrait_variants: [...(p.portrait_variants || []), item], portrait_url: file_url };
        }
        return { ...p, portrait_candidates: [...(p.portrait_candidates || []), item], portrait_url: file_url };
      });
    } catch { setError('Upload failed. Please try again.'); }
    finally { setBusy(false); }
  };

  const openLightbox = (idx) => { setLightbox(idx); setZoom(1); };
  const closeLightbox = () => setLightbox(null);

  // ── DISPLAY LISTS ──
  // Post-approval: show Approved + Variants only (old candidates archived/hidden).
  // Pre-approval: show Candidates.
  const approvedCard = approved ? { id: '_approved', url: approved, approved: true, label: 'Approved' } : null;
  const variantCards = variants.map((v, i) => ({ ...v, label: `Variant ${i + 1}`, approved: false, canApprove: false }));
  const candidateCards = candidates.map((c, i) => ({ ...c, label: `Candidate ${i + 1}`, approved: c.approved, canApprove: true }));

  const gridCards = approved
    ? [...(approvedCard ? [approvedCard] : []), ...variantCards]
    : candidateCards;

  const lightboxImages = gridCards;
  const navLightbox = (dir) => { if (lightbox == null) return; const n = (lightbox + dir + lightboxImages.length) % lightboxImages.length; setLightbox(n); setZoom(1); };

  // "Current" card for legacy data where portrait_url isn't in any array
  const inCandidates = candidates.some((c) => c.url === current);
  const inVariants = variants.some((v) => v.url === current);
  const showCurrentCard = current && !inCandidates && !inVariants && current !== approved;

  const hasImages = gridCards.length > 0 || showCurrentCard;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-fantasy text-lg font-semibold">Portrait</h3>
        {approved && <span className="flex items-center gap-1 text-xs text-brand"><Lock size={12}/>Approved</span>}
      </div>

      {approved && (
        <div className="flex items-center gap-2 rounded-lg bg-brand/10 p-2 text-xs text-brand"><Lock size={12}/>This portrait defines the character's visual identity. Future variants will preserve it.</div>
      )}

      {error && <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle size={12}/>{error}</p>}

      {!hasImages ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border p-10 text-center">
          <ImageIcon className="mb-3 text-muted-foreground" size={28}/>
          <p className="mb-4 text-sm text-muted-foreground">No portrait approved yet.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={addCandidate} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground disabled:opacity-40"><Sparkles size={12}/>{busy ? 'Generating…' : 'Generate Portrait'}</button>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs text-foreground"><Upload size={12}/>Upload Portrait<input type="file" accept="image/*" onChange={upload} className="hidden"/></label>
          </div>
        </div>
      ) : (
        <>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{approved ? "Create variants that preserve this character's identity, or edit the portrait in place." : 'Compare candidates, then approve one as the permanent visual identity.'}</p>
          <div className="flex flex-wrap gap-2">
            {approved ? (
              <>
                <button onClick={createVariant} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-40"><Sparkles size={12}/>{busy ? 'Generating…' : 'Create Variant'}</button>
                <button onClick={() => { setEditMode((p) => !p); setEditInstruction(''); }} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground"><Pencil size={12}/>Edit Portrait</button>
              </>
            ) : (
              <>
                <button onClick={addCandidate} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-40"><Sparkles size={12}/>{busy ? 'Generating…' : 'Generate Portrait'}</button>
                {current && <button onClick={regenerateCurrent} disabled={busy} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground"><RefreshCw size={12}/>Regenerate Current</button>}
              </>
            )}
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground"><Upload size={12}/>Upload<input type="file" accept="image/*" onChange={upload} className="hidden"/></label>
            {gridCards.length > 1 && <button onClick={() => openLightbox(0)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground"><Maximize size={12}/>Compare Portraits</button>}
          </div>
        </div>

        {approved && editMode && (
          <div className="rounded-xl border border-border bg-input p-3">
            <p className="mb-2 text-xs font-semibold text-foreground">Edit instruction</p>
            <textarea rows={2} value={editInstruction} onChange={(e) => setEditInstruction(e.target.value)} placeholder="e.g., warm smile, dirt on cheek, torchlight, hands raised" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand/50"/>
            <div className="mt-2 flex gap-2">
              <button onClick={applyEdit} disabled={busy || !editInstruction.trim()} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-40"><Wand2 size={12}/>{busy ? 'Applying…' : 'Apply Edit'}</button>
              <button onClick={() => { setEditMode(false); setEditInstruction(''); }} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {showCurrentCard && (
            <CandidateCard url={current} label="Current" onApprove={() => approve(current)} onRemove={() => setNPC((p) => ({ ...p, portrait_url: '' }))} onOpen={() => openLightbox(-1)} approved={!!approved} isCurrent canApprove={!approved} />
          )}
          {gridCards.map((c, i) => (
            <CandidateCard
              key={c.id}
              url={c.url}
              label={c.label}
              onApprove={() => approve(c.url)}
              onRemove={() => (c.id === '_approved' ? null : approved ? removeVariant(c.id) : removeCandidate(c.id))}
              onOpen={() => openLightbox(i)}
              approved={c.approved}
              isCurrent={c.url === current}
              canApprove={c.canApprove !== false}
            />
          ))}
        </div>

        {approved && (
          <div className="pt-1">
            <button onClick={() => setShowReplace(true)} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">Replace Approved Portrait…</button>
          </div>
        )}
        </>
      )}

      {current && !approved && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => approve(current)} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground"><Check size={12}/>Approve This Portrait</button>
          <button onClick={keepCurrent} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground">Keep Current</button>
        </div>
      )}

      {showReplace && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
            <AlertTriangle className="mx-auto mb-4 text-brand" size={32}/>
            <p className="text-foreground">Replace {npc.name || 'this character'}'s permanent visual identity?</p>
            <p className="mt-2 text-xs text-muted-foreground">The current approved portrait will no longer be the identity baseline. Existing variants will be cleared. You'll choose a new portrait to approve.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setShowReplace(false)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Keep Current</button>
              <button onClick={replaceApproved} className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">Replace Portrait</button>
            </div>
          </div>
        </div>
      )}

      {lightbox !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4">
          <div className="flex items-center justify-between text-white">
            <button onClick={closeLightbox} className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm"><X size={16}/>Close</button>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="rounded-lg bg-white/10 p-2"><ZoomOut size={16}/></button>
              <button onClick={() => setZoom(1)} className="rounded-lg bg-white/10 px-3 py-2 text-xs">Fit</button>
              <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="rounded-lg bg-white/10 p-2"><ZoomIn size={16}/></button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navLightbox(-1)} className="rounded-lg bg-white/10 p-2"><ChevronLeft size={16}/></button>
              <span className="text-xs">{(lightbox < 0 ? 0 : lightbox) + 1} / {Math.max(1, lightboxImages.length)}</span>
              <button onClick={() => navLightbox(1)} className="rounded-lg bg-white/10 p-2"><ChevronRight size={16}/></button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <img src={lightbox < 0 ? current : lightboxImages[lightbox]?.url} alt="Portrait preview" style={{ transform: `scale(${zoom})`, maxHeight: '80vh', maxWidth: '85vw' }} className="object-contain transition-transform"/>
          </div>
          <div className="flex justify-center gap-2 pb-2">
            {!approved && <button onClick={() => approve(lightbox < 0 ? current : lightboxImages[lightbox]?.url)} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"><Check size={14}/>Approve This Portrait</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function CandidateCard({ url, label, onApprove, onRemove, onOpen, approved, isCurrent, canApprove = true }){
  return (
    <div className={`overflow-hidden rounded-xl border ${isCurrent ? 'border-brand ring-1 ring-brand' : 'border-border'}`}>
      <button onClick={onOpen} className="block w-full"><Image src={url} alt={label} className="aspect-square w-full"/></button>
      <div className="flex items-center justify-between gap-1 p-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <div className="flex gap-1">
          {!approved && canApprove && <button onClick={onApprove} className="text-green-600 dark:text-green-300" title="Approve"><Check size={14}/></button>}
          {!approved && <button onClick={onRemove} className="text-muted-foreground hover:text-destructive" title="Remove"><X size={14}/></button>}
        </div>
      </div>
    </div>
  );
}
