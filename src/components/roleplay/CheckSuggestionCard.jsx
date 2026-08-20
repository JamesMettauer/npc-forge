import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { SKILL_LIST } from '@/lib/dice';

export default function CheckSuggestionCard({ evaluation, onPickSkill, onNoCheck, onDmDetermine, onBack }){
  const [showPicker, setShowPicker] = useState(false);
  const [pickedSkill, setPickedSkill] = useState('');

  if (evaluation.checkRequired === 'none') {
    return (
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">No check required</p>
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ChevronLeft size={12}/>Back</button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{evaluation.reasoning}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={onNoCheck} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground">Continue Roleplay</button>
          <button onClick={onDmDetermine} className="rounded-lg border border-border px-3 py-1.5 text-xs">DM Determines Outcome</button>
        </div>
      </div>
    );
  }

  const requiredLabel = evaluation.checkRequired === 'required' ? 'Check Recommended' : 'Optional Check';
  const diffLabel = evaluation.primaryDifficulty === 'easy' ? 'Easy (DC 10)' : evaluation.primaryDifficulty === 'hard' ? 'Hard (DC 20)' : 'Medium (DC 15)';

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">{requiredLabel}</span>
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ChevronLeft size={12}/>Back</button>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{evaluation.reasoning}</p>
      {evaluation.actingCharacter && (
        <p className="text-xs text-foreground">Acting character: <span className="font-medium">{evaluation.actingCharacter}</span></p>
      )}

      {evaluation.primarySkill && (
        <div className="mt-2.5 rounded-lg border border-brand/20 bg-brand/5 p-2.5">
          <p className="text-sm font-semibold text-foreground">{evaluation.primarySkill}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{evaluation.primaryReason}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Suggested: {diffLabel}</p>
          {evaluation.opposedCheck && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">Opposed by NPC {evaluation.opposedCheck.skill}</p>
          )}
        </div>
      )}

      {evaluation.alternatives?.length > 0 && (
        <div className="mt-2 space-y-1">
          {evaluation.alternatives.map(alt => (
            <button key={alt.skill} onClick={() => onPickSkill({ skill: alt.skill, reason: alt.reason, difficulty: 'medium', adjustments: [], opposed: null })} className="block w-full text-left text-xs hover:bg-muted rounded-lg p-1.5">
              <span className="font-medium text-foreground">{alt.skill}</span>
              <span className="text-muted-foreground"> — {alt.reason}</span>
            </button>
          ))}
        </div>
      )}

      {showPicker && (
        <div className="mt-2 flex gap-2">
          <select value={pickedSkill} onChange={e => setPickedSkill(e.target.value)} className="field flex-1 text-xs">
            <option value="">Select a skill…</option>
            {SKILL_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => pickedSkill && onPickSkill({ skill: pickedSkill, reason: 'DM-selected', difficulty: 'medium', adjustments: [], opposed: null })} disabled={!pickedSkill} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-40">Use</button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {evaluation.primarySkill && (
          <button onClick={() => onPickSkill({ skill: evaluation.primarySkill, reason: evaluation.primaryReason, difficulty: evaluation.primaryDifficulty, adjustments: evaluation.adjustments, opposed: evaluation.opposedCheck })} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground"><Check size={12}/>Use {evaluation.primarySkill}</button>
        )}
        <button onClick={() => setShowPicker(s => !s)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Choose Another</button>
        <button onClick={onNoCheck} className="rounded-lg border border-border px-3 py-1.5 text-xs">No Roll</button>
        <button onClick={onDmDetermine} className="rounded-lg border border-border px-3 py-1.5 text-xs">DM Determines</button>
      </div>
    </div>
  );
}