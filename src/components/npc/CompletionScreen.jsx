import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, User, Pencil, Plus, Library, Sparkles, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

export default function CompletionScreen({ npc, onCreateAnother }){
  const [current, setCurrent] = useState(npc);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (current.portrait_url || !current.image_prompt) return;
    let cancelled = false;
    setGenerating(true); setError('');
    (async () => {
      try {
        const { url } = await base44.integrations.Core.GenerateImage({ prompt: current.image_prompt });
        if (cancelled) return;
        const updated = await base44.entities.NPC.update(current.id, { portrait_url: url });
        if (!cancelled) { setCurrent(updated); setGenerating(false); }
      } catch {
        if (!cancelled) { setError('Portrait could not be generated. You can create one from Edit NPC.'); setGenerating(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [current.id]);

  return <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-10">
    <div className="mx-auto mb-6 grid h-40 w-40 place-items-center overflow-hidden rounded-2xl bg-muted">
      {current.portrait_url ? <Image src={current.portrait_url} alt={current.name} className="h-40 w-40 rounded-2xl"/>
        : generating ? <div className="flex flex-col items-center gap-2 text-muted-foreground"><Sparkles size={20} className="animate-pulse"/><span className="text-xs">Painting portrait…</span></div>
        : error ? <div className="flex flex-col items-center gap-1 px-3 text-center text-xs text-muted-foreground"><AlertCircle size={16}/>{error}</div>
        : <User size={28} className="text-muted-foreground"/>}
    </div>
    <p className="text-xs uppercase tracking-[.22em] text-brand/70">Character saved</p>
    <h2 className="mt-2 font-serif text-3xl">{current.name}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{[current.species,current.class_name,current.role].filter(Boolean).join(' · ')}</p>
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Link to={`/roleplay/${current.id}`} className="flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground"><MessageCircle size={16}/>Chat with NPC</Link>
      <Link to={`/npc/${current.id}`} className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-foreground hover:bg-muted"><User size={16}/>View NPC Profile</Link>
      <Link to={`/edit/${current.id}`} className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-foreground hover:bg-muted"><Pencil size={16}/>Edit NPC</Link>
      <button onClick={onCreateAnother} className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-foreground hover:bg-muted"><Plus size={16}/>Create Another NPC</button>
      <Link to="/library" className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-foreground hover:bg-muted"><Library size={16}/>Return to NPC Library</Link>
    </div>
  </div>;
}