import { Image } from '@/components/ui/image';

// Maps conversation emotional state to a visual treatment applied over the portrait.
// The portrait itself stays the same image, but the overlay/filter shifts to reflect
// how the NPC feels right now — so it visibly changes as the conversation evolves.
const MOOD_STYLES = {
  hostile:  { label: 'Hostile',  ring: 'ring-red-500/50',    glow: 'shadow-[0_0_40px_-8px_rgba(239,68,68,0.6)]',  filter: 'saturate(1.3) contrast(1.1)', tint: 'bg-red-500/15',    chip: 'bg-red-500/15 text-destructive' },
  fearful:  { label: 'Fearful',  ring: 'ring-indigo-400/40', glow: 'shadow-[0_0_40px_-8px_rgba(129,140,248,0.5)]', filter: 'saturate(0.7) brightness(0.9)', tint: 'bg-indigo-500/15', chip: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-200' },
  warm:     { label: 'Warm',     ring: 'ring-brand/50',  glow: 'shadow-[0_0_40px_-8px_rgba(252,211,77,0.5)]', filter: 'saturate(1.15) contrast(1.05)', tint: 'bg-brand/10',  chip: 'bg-brand/15 text-brand' },
  cold:     { label: 'Cold',     ring: 'ring-sky-300/40',    glow: 'shadow-[0_0_40px_-8px_rgba(125,211,252,0.4)]', filter: 'saturate(0.85) contrast(1.05)', tint: 'bg-sky-300/10',    chip: 'bg-sky-300/15 text-sky-700 dark:text-sky-200' },
  neutral:  { label: 'Neutral',  ring: 'ring-border',     glow: 'shadow-none',                                 filter: 'none',           tint: 'bg-transparent',   chip: 'bg-muted text-muted-foreground' }
};

function resolveStyle(convo){
  if(!convo) return MOOD_STYLES.neutral;
  const hostility=convo.hostility||0, fear=convo.fear||0, trust=convo.trust||0;
  if(hostility>=40) return MOOD_STYLES.hostile;
  if(fear>=40) return MOOD_STYLES.fearful;
  if(trust>=60) return MOOD_STYLES.warm;
  if(trust<=15) return MOOD_STYLES.cold;
  return MOOD_STYLES.neutral;
}

export default function PortraitStage({ npc, convo, busy }){
  if(!npc) return null;
  const style=resolveStyle(convo);
  const moodLabel=convo?`${style.label} · ${convo.attitude||'neutral'}`:'No active session';
  return (
    <div className="flex flex-col items-center gap-3 p-5">
      <div className={`relative rounded-2xl ring-2 ${style.ring} ${style.glow} transition-all duration-700`}>
        {npc.portrait_url?(
          <div className="relative h-44 w-44 overflow-hidden rounded-2xl sm:h-52 sm:w-52">
            <Image src={npc.portrait_url} alt={npc.name} fittingType="fill" className={`h-full w-full transition-all duration-700 ${busy?'animate-pulse':''}`} style={{ filter: style.filter }}/>
            <div className={`pointer-events-none absolute inset-0 ${style.tint} transition-colors duration-700`} />
          </div>
        ):(
          <div className="grid h-44 w-44 place-items-center rounded-2xl border border-border bg-muted text-muted-foreground sm:h-52 sm:w-52"><span className="text-xs">No portrait</span></div>
        )}
        {busy&&<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-foreground/90 px-3 py-1 text-[10px] uppercase tracking-widest text-brand/80">listening…</div>}
      </div>
      <div className="text-center">
        <h1 className="font-serif text-2xl">{npc.name}</h1>
        <p className="mt-1 text-xs uppercase tracking-widest text-brand/70">In conversation</p>
        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${style.chip} transition-colors duration-700`}>{moodLabel}</span>
      </div>
    </div>
  );
}