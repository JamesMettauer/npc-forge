import { useState } from 'react';
import { ChevronLeft, Check, Edit3, Sparkles } from 'lucide-react';

const DEGREE_COLOR = {
  critical_failure: 'text-destructive', major_failure: 'text-destructive', failure: 'text-destructive',
  narrative: 'text-muted-foreground',
  success: 'text-green-600 dark:text-green-300', strong_success: 'text-green-600 dark:text-green-300',
  exceptional_success: 'text-brand', critical_success: 'text-brand',
};

export default function CheckOutcomeCard({ outcome, busy, onApply, onOverride, onBack }){
  const r = outcome || {};
  const [editing, setEditing] = useState(r.dm_determined || false);
  const [editFindings, setEditFindings] = useState((r.findings || []).join('\n'));
  const [editReaction, setEditReaction] = useState(r.npc_reaction || '');

  const degreeColor = DEGREE_COLOR[r.degree] || 'text-muted-foreground';
  const opposed = r.opposed_result;

  const handleSaveEdit = () => {
    const findings = editFindings.split('\n').filter(Boolean);
    onOverride({ ...r, findings, npc_reaction: editReaction, revealed_to_player: findings });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{r.skill}</p>
          <span className={`text-xs font-medium ${degreeColor}`}>{r.degree_label}</span>
        </div>
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ChevronLeft size={12}/>Back</button>
      </div>

      {r.total != null && r.final_dc != null && !r.hide_dc && (
        <p className="mt-1 text-xs text-muted-foreground">{r.character || 'Player'}: <span className="font-semibold text-foreground">{r.total}</span> vs DC {r.final_dc}</p>
      )}
      {r.d20s?.length > 0 && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">d20: {r.d20s.join(', ')}{r.advantage || r.disadvantage ? ` (kept ${r.kept})` : ''}{r.modifier ? ` · mod ${r.modifier >= 0 ? '+' : ''}${r.modifier}` : ''}</p>
      )}

      {opposed && (
        <div className="mt-2 rounded-lg bg-muted p-2 text-xs">
          <p className="font-medium text-foreground">Opposed: NPC {opposed.skill}</p>
          <p className="text-muted-foreground">NPC rolled {opposed.d20} + {opposed.modifier} = {opposed.total} → {opposed.won ? 'NPC wins' : 'Player wins'}</p>
        </div>
      )}

      {!editing ? (
        <>
          {r.findings?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-brand">What the player learns</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-foreground">{r.findings.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
          )}
          {r.npc_reaction && (
            <div className="mt-2 rounded-lg bg-muted p-2">
              <p className="text-xs font-medium text-muted-foreground">NPC notices</p>
              <p className="mt-0.5 text-xs italic text-foreground">{r.npc_reaction}</p>
            </div>
          )}
          {r.social_changes && Object.values(r.social_changes).some(v => v !== 0) && (
            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
              {Object.entries(r.social_changes).filter(([, v]) => v !== 0).map(([k, v]) => (
                <span key={k} className="rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">{k} {v >= 0 ? '+' : ''}{v}</span>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={onApply} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground disabled:opacity-40"><Sparkles size={14}/>Apply and Continue</button>
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs"><Edit3 size={12}/>Override</button>
          </div>
        </>
      ) : (
        <div className="mt-2 space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Findings (one per line)</label>
            <textarea rows={3} value={editFindings} onChange={e => setEditFindings(e.target.value)} className="mt-1 w-full resize-none rounded-lg border border-border bg-input p-2 text-xs"/>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">NPC reaction</label>
            <textarea rows={2} value={editReaction} onChange={e => setEditReaction(e.target.value)} className="mt-1 w-full resize-none rounded-lg border border-border bg-input p-2 text-xs"/>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground"><Check size={12}/>Save</button>
            <button onClick={() => setEditing(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}