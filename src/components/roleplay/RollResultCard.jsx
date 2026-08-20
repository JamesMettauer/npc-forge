import { useState } from 'react';
import { NotebookPen, ChevronDown, ChevronUp, Check, Undo2, Sparkles } from 'lucide-react';

const FOLLOWUPS = {
  Medicine: ['Ask about these symptoms', 'Offer treatment', 'Request a closer examination', 'Ask how long this has been happening', 'Ask about exposure to chemicals, poisons, magic, or disease', 'Share findings with the party'],
  Insight: ['Ask why they seem uneasy', 'Press for the truth', 'Share your read of them', 'Ask what they want in return'],
  Investigation: ['Search the area more closely', 'Ask about what you found', 'Examine the mechanism'],
  Perception: ['Mention what you noticed', 'Look around more', 'Ask about the movement'],
  Arcana: ['Ask about the arcane signs', 'Examine the effect closely'],
  Persuasion: ['Continue pressing your case', 'Offer something in return', 'Make a better offer'],
  Intimidation: ['Continue applying pressure', 'Back off and reassure'],
  Deception: ['Continue the bluff', 'Change the subject'],
};

const DEGREE_COLOR = {
  critical_failure: 'text-destructive', major_failure: 'text-destructive', failure: 'text-destructive',
  success: 'text-green-600 dark:text-green-300', strong_success: 'text-green-600 dark:text-green-300',
  exceptional_success: 'text-brand', critical_success: 'text-brand',
};

export default function RollResultCard({ result, npcName, onApply, onUndoApply, onFollowUp, onAddNote }){
  const [showFollowups, setShowFollowups] = useState(false);
  const [applying, setApplying] = useState(false);
  const r = result;
  const followups = FOLLOWUPS[r.skill] || [];
  const advOrDis = r.mode === 'advantage' || r.mode === 'disadvantage';
  const applied = !!r.applied;
  const degreeColor = DEGREE_COLOR[r.degree] || 'text-muted-foreground';

  const handleApply = async () => {
    if (applied || applying) return;
    setApplying(true);
    try { await onApply?.(r); } finally { setApplying(false); }
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{r.skill} Check — {r.character || (r.roller === 'player' ? 'Player' : 'NPC')}{r.roller === 'player' && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Player</span>}</p>
        {r.degree_label && <span className={`text-xs font-medium ${degreeColor}`}>{r.degree_label}</span>}
      </div>
      {r.d20s ? (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            d20: {r.d20s.join(advOrDis ? ' and ' : ', ')}
            {advOrDis ? ` (kept ${r.kept})` : ''}
            {r.bonus_die ? ` · bonus d${r.bonus_die.sides}: ${r.bonus_die.value}` : ''}
            {r.temp_mod ? ` · temp ${r.temp_mod >= 0 ? '+' : ''}${r.temp_mod}` : ''}
            {' · modifier '}{r.modifier >= 0 ? '+' : ''}{r.modifier}
            {' = '}<span className="font-semibold text-foreground">{r.total}</span>
          </p>
          {r.final_dc != null && !r.hide_dc && <p className="mt-1 text-xs text-muted-foreground">DC: {r.final_dc} {r.difficulty ? `· ${r.difficulty}` : ''} · margin {r.total - r.final_dc >= 0 ? '+' : ''}{r.total - r.final_dc}</p>}
        </>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">Player rolled <span className="font-semibold text-foreground">{r.total}</span>{r.final_dc != null && !r.hide_dc ? ` vs DC ${r.final_dc} · margin ${r.total - r.final_dc >= 0 ? '+' : ''}${r.total - r.final_dc}` : ''}</p>
      )}

      {r.findings?.length > 0 ? (
        <div className="mt-2">
          <p className="text-xs font-medium text-brand">What you determine</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-foreground">{r.findings.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </div>
      ) : !applied && r.observed?.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground">Preliminary observation</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-foreground">{r.observed.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </div>
      )}
      {applied && r.npc_reaction && (
        <div className="mt-2 rounded-lg bg-muted p-2">
          <p className="text-xs font-medium text-muted-foreground">{npcName || 'The NPC'} notices</p>
          <p className="mt-0.5 text-xs italic text-foreground">{r.npc_reaction}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!applied ? (
          <button onClick={handleApply} disabled={applying} className="flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-brand-foreground disabled:opacity-40">
            {applying ? <><Sparkles size={12} className="animate-pulse"/>Applying…</> : <><Sparkles size={12}/>Use Result in Roleplay</>}
          </button>
        ) : (
          <span className="flex items-center gap-1 rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"><Check size={12}/>Result Applied</span>
        )}
        {applied && <button onClick={() => onUndoApply?.(r)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground"><Undo2 size={12}/>Undo</button>}
        {(r.findings?.length > 0 || r.revealed_to_player?.length > 0) && <button onClick={() => onFollowUp(`${npcName || 'The NPC'}, I noticed ${(r.revealed_to_player?.length ? r.revealed_to_player : r.findings).join('; ')}. Can you tell me more?`)} className="rounded-lg border border-border px-2.5 py-1 text-xs text-foreground">Ask About This</button>}
        <button onClick={() => onAddNote(r.findings || r.observed || [])} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-foreground"><NotebookPen size={12}/>Add to Notes</button>
        {followups.length > 0 && <button onClick={() => setShowFollowups((s) => !s)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground">{showFollowups ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}Follow-up</button>}
      </div>
      {showFollowups && (
        <div className="mt-2 flex flex-wrap gap-2">
          {followups.map((f) => <button key={f} onClick={() => onFollowUp(f)} className="rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground">{f}</button>)}
        </div>
      )}
    </div>
  );
}