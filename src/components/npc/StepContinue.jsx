import { ChevronRight, Save } from 'lucide-react';

/**
 * Shared Continue / Complete-NPC button used at both the top and bottom
 * of the wizard step card. Both instances receive the same props so they
 * can never disagree on enabled/disabled, validation, or loading state.
 */
export default function StepContinue({ canContinue, onContinue, isFinal, saving, generating, variant = 'bottom' }) {
  const disabled = !canContinue || saving || generating;
  const label = isFinal ? (saving ? 'Saving…' : 'Complete NPC') : 'Continue';
  const isTop = variant === 'top';
  return (
    <button
      onClick={onContinue}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-lg bg-brand font-semibold text-brand-foreground disabled:opacity-40 disabled:cursor-not-allowed ${isTop ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'}`}
    >
      {isFinal ? <Save size={isTop ? 14 : 16}/> : <ChevronRight size={isTop ? 14 : 16}/>}
      {label}
    </button>
  );
}