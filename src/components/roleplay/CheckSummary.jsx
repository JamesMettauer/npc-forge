import { useState } from 'react';
import { Dices, ChevronDown, ChevronUp, Check, Undo2, Sparkles, NotebookPen, X, XCircle, AlertOctagon, Zap } from 'lucide-react';

const DEGREE_STYLES = {
  critical_failure: { accent: 'border-l-destructive', tint: 'bg-destructive/5', pill: 'bg-destructive text-destructive-foreground', icon: AlertOctagon },
  major_failure: { accent: 'border-l-destructive', tint: 'bg-destructive/5', pill: 'bg-destructive/90 text-destructive-foreground', icon: XCircle },
  failure: { accent: 'border-l-destructive', tint: 'bg-destructive/5', pill: 'bg-destructive/15 text-destructive', icon: X },
  success: { accent: 'border-l-green-500', tint: 'bg-green-500/5', pill: 'bg-green-500/15 text-green-700 dark:text-green-300', icon: Check },
  strong_success: { accent: 'border-l-green-500', tint: 'bg-green-500/5', pill: 'bg-green-500 text-white', icon: Check },
  exceptional_success: { accent: 'border-l-brand', tint: 'bg-brand/5', pill: 'bg-brand/15 text-brand', icon: Sparkles },
  critical_success: { accent: 'border-l-brand', tint: 'bg-brand/5', pill: 'bg-brand text-brand-foreground', icon: Zap },
  narrative: { accent: 'border-l-border', tint: '', pill: 'bg-muted text-muted-foreground', icon: Dices },
};

const PASS_DEGREES = new Set(['success', 'strong_success', 'exceptional_success', 'critical_success']);

export default function CheckSummary({ result, npcName, onApply, onUndoApply, onFollowUp, onAddNote }){
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);
  const r = result;
  const applied = !!r.applied;
  const style = DEGREE_STYLES[r.degree] || DEGREE_STYLES.narrative;
  const DegreeIcon = style.icon;
  const isPass = PASS_DEGREES.has(r.degree);
  const hasDetails = !!(r.d20s || r.findings?.length || r.npc_reaction || (r.social_changes && Object.values(r.social_changes).some(v => v !== 0)));

  const totalBadge = isPass
    ? 'bg-green-500/15 text-green-700 dark:text-green-300'
    : r.degree === 'narrative'
      ? 'bg-muted text-foreground'
      : 'bg-destructive/15 text-destructive';

  const handleApply = async () => {
    if (applied || applying) return;
    setApplying(true);
    try { await onApply?.(r); } finally { setApplying(false); }
  };

  return (
    <div className={`my-2 rounded-lg border border-border border-l-4 ${style.accent} ${style.tint} px-3 py-2.5 text-xs`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <Dices size={13} className="text-brand"/>
          {r.skill}
        </span>
        {r.degree_label && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${style.pill}`}>
            <DegreeIcon size={11}/>
            {r.degree_label}
          </span>
        )}
        {hasDetails && (
          <button onClick={() => setExpanded(e => !e)} className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground">
            {expanded ? <><ChevronUp size={12}/>Hide</> : <><ChevronDown size={12}/>Details</>}
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">{r.character || 'Player'}</span>
        <span className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-base font-bold tabular-nums ${totalBadge}`}>
          {r.total}
        </span>
        {r.opposed_result ? (
          <>
            <span className="text-muted-foreground">vs</span>
            <span className="text-muted-foreground">{npcName || 'NPC'} {r.opposed_result.skill}</span>
            <span className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-muted px-2 text-base font-bold tabular-nums text-foreground">
              {r.opposed_result.total}
            </span>
          </>
        ) : r.final_dc != null && !r.hide_dc ? (
          <>
            <span className="text-muted-foreground">vs DC</span>
            <span className="flex h-9 min-w-9 items-center justify-center rounded-lg border-2 border-border bg-background px-2 text-base font-bold tabular-nums text-foreground">
              {r.final_dc}
            </span>
          </>
        ) : null}
      </div>

      {expanded && (
        <div className="mt-2.5 space-y-1.5 border-t border-border pt-2">
          {r.d20s && (
            <p className="text-muted-foreground">
              d20: {r.d20s.join(', ')}
              {r.bonus_die ? ` · bonus d${r.bonus_die.sides}: ${r.bonus_die.value}` : ''}
              {r.temp_mod ? ` · temp ${r.temp_mod >= 0 ? '+' : ''}${r.temp_mod}` : ''}
              {' · mod '}{r.modifier >= 0 ? '+' : ''}{r.modifier}
              {' = '}<span className="font-semibold text-foreground">{r.total}</span>
            </p>
          )}
          {r.opposed_result && (
            <p className="text-muted-foreground">
              {npcName || 'NPC'} {r.opposed_result.skill}:
              {r.opposed_result.d20 ? ` d20 ${r.opposed_result.d20}` : ''}
              {' · mod '}{r.opposed_result.modifier >= 0 ? '+' : ''}{r.opposed_result.modifier}
              {' = '}<span className="font-semibold text-foreground">{r.opposed_result.total}</span>
            </p>
          )}
          {r.findings?.length > 0 && (
            <div>
              <p className="font-medium text-brand">Findings</p>
              <ul className="list-disc space-y-0.5 pl-5 text-foreground">{r.findings.map((o, i) => <li key={i}>{o}</li>)}</ul>
            </div>
          )}
          {applied && r.npc_reaction && (
            <div className="rounded-lg bg-muted p-2">
              <p className="font-medium text-muted-foreground">{npcName || 'The NPC'} notices</p>
              <p className="mt-0.5 italic text-foreground">{r.npc_reaction}</p>
            </div>
          )}
          {r.social_changes && Object.entries(r.social_changes).some(([, v]) => v !== 0) && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(r.social_changes).map(([k, v]) => v !== 0 && (
                <span key={k} className={`rounded px-1.5 py-0.5 ${v > 0 ? 'bg-green-500/10 text-green-600 dark:text-green-300' : 'bg-destructive/10 text-destructive'}`}>
                  {k} {v > 0 ? '+' : ''}{v}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {!applied ? (
          <button onClick={handleApply} disabled={applying} className="flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-brand-foreground disabled:opacity-40">
            {applying ? <><Sparkles size={11} className="animate-pulse"/>Applying…</> : <><Sparkles size={11}/>Apply</>}
          </button>
        ) : (
          <span className="flex items-center gap-1 rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"><Check size={11}/>Applied</span>
        )}
        {applied && <button onClick={() => onUndoApply?.(r)} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground"><Undo2 size={11}/>Undo</button>}
        {(r.findings?.length > 0 || r.revealed_to_player?.length > 0) && <button onClick={() => onFollowUp?.(`${npcName || 'The NPC'}, I noticed ${(r.revealed_to_player?.length ? r.revealed_to_player : r.findings).join('; ')}. Can you tell me more?`)} className="rounded-lg border border-border px-2.5 py-1 text-xs text-foreground">Ask About This</button>}
        <button onClick={() => onAddNote?.(r.findings || r.observed || [])} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-foreground"><NotebookPen size={11}/>Note</button>
      </div>
    </div>
  );
}