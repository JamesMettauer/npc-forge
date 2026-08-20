import { useState, useRef, useEffect } from 'react';
import { Wand2, RefreshCw, AlertTriangle } from 'lucide-react';
import { fillMissingAllSteps, regenerateAllGenerated } from '@/lib/stepGeneration';

/**
 * Global Regenerate Details control for the Character Contract header.
 * Offers two actions:
 *   1. Fill Missing Details — safe blank-fill across all steps.
 *   2. Regenerate All Generated Details — broad recovery with confirmation.
 * Page-specific generators are untouched; this is an additional global option.
 */
export default function RegenerateMenu({ npc, setNPC, onBusy }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onPointerDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const runFill = async () => {
    setOpen(false);
    setBusy(true); onBusy?.(true); setMsg('');
    try {
      const updates = await fillMissingAllSteps(npc);
      if (Object.keys(updates).length) setNPC((p) => ({ ...p, ...updates }));
      setMsg(Object.keys(updates).length ? 'Missing details filled.' : 'No blank generatable fields found.');
    } catch { setMsg('Generation failed. Please try again.'); }
    setBusy(false); onBusy?.(false);
  };

  const runRegenerate = async () => {
    setConfirm(false);
    setBusy(true); onBusy?.(true); setMsg('');
    try {
      const updates = await regenerateAllGenerated(npc);
      if (Object.keys(updates).length) setNPC((p) => ({ ...p, ...updates }));
      setMsg('Generated details regenerated.');
    } catch { setMsg('Regeneration failed. Please try again.'); }
    setBusy(false); onBusy?.(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button onClick={() => setOpen((o) => !o)} disabled={busy} className="flex items-center gap-1 text-xs text-brand hover:underline disabled:opacity-40">
        <Wand2 size={12}/>{busy ? 'Working…' : 'Regenerate Details'}
      </button>
      {msg && !open && !confirm && <p className="mt-1 text-[11px] text-muted-foreground">{msg}</p>}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-border bg-popover p-1.5 shadow-xl">
          <button onClick={runFill} disabled={busy} className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-muted disabled:opacity-40">
            <RefreshCw size={14} className="mt-0.5 shrink-0 text-brand"/>
            <div>
              <p className="text-xs font-semibold text-foreground">Fill Missing Details</p>
              <p className="text-[11px] leading-snug text-muted-foreground">Fill blank generatable fields without replacing established details.</p>
            </div>
          </button>
          <button onClick={() => { setOpen(false); setConfirm(true); }} disabled={busy} className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-muted disabled:opacity-40">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-brand"/>
            <div>
              <p className="text-xs font-semibold text-foreground">Regenerate All Generated Details</p>
              <p className="text-[11px] leading-snug text-muted-foreground">Replace generated, unlocked character details while preserving Guild Master decisions and protected identity.</p>
            </div>
          </button>
        </div>
      )}
      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
            <AlertTriangle className="mx-auto mb-4 text-brand" size={32}/>
            <h3 className="font-fantasy text-lg">Regenerate all generated details?</h3>
            <p className="mt-2 text-sm text-muted-foreground">This will replace AI-generated, unlocked Character Contract details across the character. Guild Master edits, locked facts, approved identity, and other protected decisions will be preserved.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setConfirm(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">Cancel</button>
              <button onClick={runRegenerate} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Regenerate All Generated Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}