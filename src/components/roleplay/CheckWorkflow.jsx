import { useState, useEffect } from 'react';
import { Sparkles, Send, Dices, X, Loader2 } from 'lucide-react';
import { evaluateAction, resolveCheck } from '@/lib/actionEvaluation';
import { DC_BASELINES, computeFinalDC } from '@/lib/dice';
import { findCharacterByName, getModifierForSkill } from '@/lib/characterSheet';
import CheckSuggestionCard from './CheckSuggestionCard';
import CheckDcCard from './CheckDcCard';
import CheckRollCard from './CheckRollCard';
import CheckOutcomeCard from './CheckOutcomeCard';

const MODES = [
  { key: 'say', label: 'Say' },
  { key: 'do', label: 'Do' },
  { key: 'say_do', label: 'Say + Do' },
];

const kindForMode = (mode) => (mode === 'do' ? 'action' : 'dialogue');

export default function CheckWorkflow({ npc, convo, busy, onSend, onOpenNpcCheck, text, onText, recentContext }){
  const [stage, setStage] = useState('intent');
  const [mode, setMode] = useState('say_do');
  const [evaluation, setEvaluation] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [dc, setDc] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [characterModifier, setCharacterModifier] = useState(null);

  useEffect(() => {
    if (text && stage !== 'intent') {
      setStage('intent'); setEvaluation(null); setSelectedSkill(null); setDc(null); setOutcome(null);
    }
  }, [text]);

  const reset = () => {
    setStage('intent'); setEvaluation(null); setSelectedSkill(null); setDc(null); setOutcome(null);
    onText?.('');
  };

  const handleEvaluate = async () => {
    if (!text?.trim() || busy) return;
    setStage('evaluating');
    const result = await evaluateAction({ npc, convo, actionText: text, mode, recentContext });
    setEvaluation(result);
    setStage('suggestion');
  };

  const handleSendWithoutCheck = () => {
    if (!text?.trim() || busy) return;
    onSend(text.trim(), { kind: kindForMode(mode), checkResult: null });
    onText?.('');
    setStage('intent'); setEvaluation(null); setSelectedSkill(null); setDc(null); setOutcome(null);
  };

  const handlePickSkill = async (skillData) => {
    setSelectedSkill(skillData);
    const baseDc = DC_BASELINES[skillData.difficulty] || 15;
    const adjustments = (skillData.adjustments || []).map(a => ({ label: a.label, value: a.value }));
    const isOpposed = !!skillData.opposed;
    setDc({ base: baseDc, difficulty: skillData.difficulty || 'medium', adjustments, final: isOpposed ? null : computeFinalDC(baseDc, adjustments), opposed: skillData.opposed || null, hideDc: isOpposed });
    if (evaluation?.actingCharacter) {
      const char = await findCharacterByName(evaluation.actingCharacter);
      setCharacterModifier(char ? getModifierForSkill(char, skillData.skill) : null);
    } else {
      setCharacterModifier(null);
    }
    setStage('dc');
  };

  const handleDmDetermine = () => {
    setOutcome({
      skill: selectedSkill?.skill || evaluation?.primarySkill || 'Narrative',
      character: '', total: 0, final_dc: null, degree: 'narrative', degree_label: 'DM Determined',
      findings: [], revealed_to_player: [], npc_reaction: '', social_changes: {},
      hide_dc: true, dm_determined: true,
    });
    setStage('outcome');
  };

  const handleResolve = async (rollData) => {
    setStage('resolving');
    const result = await resolveCheck({
      npc, convo, skill: selectedSkill.skill, character: rollData.character,
      modifier: rollData.modifier, d20s: rollData.d20s, kept: rollData.kept,
      total: rollData.total, advantage: rollData.advantage, disadvantage: rollData.disadvantage,
      finalDc: dc.final, difficulty: dc.difficulty, hideDc: dc.hideDc,
      opposedCheck: dc.opposed, recentContext,
    });
    setOutcome(result);
    setStage('outcome');
  };

  const handleApply = () => {
    if (!text?.trim() || busy) return;
    onSend(text.trim(), { kind: kindForMode(mode), checkResult: outcome });
    onText?.('');
    setStage('intent'); setEvaluation(null); setSelectedSkill(null); setDc(null); setOutcome(null);
  };

  if (stage === 'intent') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">What does the player say or do?</span>
          <div className="ml-auto flex rounded-lg border border-border p-0.5">
            {MODES.map(m => (
              <button key={m.key} onClick={() => setMode(m.key)} className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${mode === m.key ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{m.label}</button>
            ))}
          </div>
        </div>
        <textarea rows={2} value={text || ''} disabled={busy} onChange={e => onText?.(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEvaluate(); } }} placeholder="Describe the player's action…" className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-brand/40 disabled:opacity-50"/>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleEvaluate} disabled={busy || !text?.trim()} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground disabled:opacity-40"><Sparkles size={14}/>Evaluate Action</button>
          <button onClick={handleSendWithoutCheck} disabled={busy || !text?.trim()} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground disabled:opacity-40"><Send size={14}/>Send Without Check</button>
          <button onClick={onOpenNpcCheck} disabled={busy} className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"><Dices size={14}/>NPC Check</button>
        </div>
      </div>
    );
  }

  if (stage === 'evaluating' || stage === 'resolving') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin text-brand"/>
        {stage === 'evaluating' ? "Analyzing the player's action…" : 'Resolving the check…'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2">
        <p className="flex-1 text-xs italic text-muted-foreground">{text}</p>
        <button onClick={reset} className="text-muted-foreground hover:text-foreground"><X size={14}/></button>
      </div>
      {stage === 'suggestion' && (
        <CheckSuggestionCard evaluation={evaluation} onPickSkill={handlePickSkill} onNoCheck={handleSendWithoutCheck} onDmDetermine={handleDmDetermine} onBack={reset}/>
      )}
      {stage === 'dc' && (
        <CheckDcCard skill={selectedSkill?.skill} dc={dc} onAccept={() => setStage('roll')} onChange={setDc} onBack={() => setStage('suggestion')}/>
      )}
      {stage === 'roll' && (
        <CheckRollCard skill={selectedSkill?.skill} dc={dc} npc={npc} actingCharacter={evaluation?.actingCharacter} autoModifier={characterModifier} onResolve={handleResolve} onBack={() => setStage('dc')}/>
      )}
      {stage === 'outcome' && (
        <CheckOutcomeCard outcome={outcome} busy={busy} onApply={handleApply} onOverride={setOutcome} onBack={() => setStage('roll')}/>
      )}
    </div>
  );
}