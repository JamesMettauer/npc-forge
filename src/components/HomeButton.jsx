import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { hasUnsavedChanges } from '@/lib/navigationGuard';
import { clearDraft } from '@/lib/npcDraft';

export default function HomeButton(){
  const navigate = useNavigate();
  const [warn, setWarn] = useState(false);
  const go = () => { if (hasUnsavedChanges()) setWarn(true); else navigate('/'); };
  return (
    <>
      <button onClick={go} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted" title="Home" aria-label="Home">
        <Home size={16}/><span className="hidden sm:inline">Home</span>
      </button>
      {warn && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-foreground">You have unsaved changes. Return Home and discard them?</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setWarn(false)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Stay on Page</button>
              <button onClick={() => { clearDraft(); setWarn(false); navigate('/'); }} className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">Discard & Return Home</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}