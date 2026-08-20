import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import IdentityStep from './IdentityStep';
import SuggestedTraits from './SuggestedTraits';
import BackgroundStep from './BackgroundStep';
import AppearanceStep from './AppearanceStep';
import PortraitStudio from './PortraitStudio';
import PersonalityStep from './PersonalityStep';
import VoiceStep from './VoiceStep';
import HistoryStep from './HistoryStep';
import CampaignRoleStep from './CampaignRoleStep';
import FinalReviewStep from './FinalReviewStep';
import SheetTab from './SheetTab';
import NavControls from '@/components/NavControls';
import StepContinue from './StepContinue';
import RegenerateMenu from './RegenerateMenu';
import { setNavigationGuard } from '@/lib/navigationGuard';
import { loadDraft, saveDraft } from '@/lib/npcDraft';

const STEPS = [
  { title: 'Identity', render: (npc, setNPC) => <IdentityStep npc={npc} setNPC={setNPC}/> },
  { title: 'Suggested Traits', render: (npc, setNPC) => <SuggestedTraits npc={npc} setNPC={setNPC}/> },
  { title: 'Background', render: (npc, setNPC) => <BackgroundStep npc={npc} setNPC={setNPC}/> },
  { title: 'Appearance & Portrait', render: (npc, setNPC) => <><AppearanceStep npc={npc} setNPC={setNPC}/><PortraitStudio npc={npc} setNPC={setNPC}/></> },
  { title: 'Personality', render: (npc, setNPC) => <PersonalityStep npc={npc} setNPC={setNPC}/> },
  { title: 'How Do They Speak?', render: (npc, setNPC) => <VoiceStep npc={npc} setNPC={setNPC}/> },
  { title: 'History & Motivation', render: (npc, setNPC) => <HistoryStep npc={npc} setNPC={setNPC}/> },
  { title: 'Campaign Role', render: (npc, setNPC) => <CampaignRoleStep npc={npc} setNPC={setNPC}/> },
  { title: 'Character Sheet', render: (npc, setNPC) => <SheetTab npc={npc} onChange={setNPC}/> },
  { title: 'Final Review', render: (npc, setNPC, onJump) => <FinalReviewStep npc={npc} setNPC={setNPC} onJumpToStep={onJump}/> },
];

export default function NPCWizard({ npc, setNPC, onSave, saving, onExit }){
  const [step, setStep] = useState(() => {
    const s = loadDraft()?.step ?? 0;
    console.log('[NPCWizard] init step from draft =', s);
    return s;
  });
  const [showExit, setShowExit] = useState(false);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const set = (key, value) => setNPC((p) => ({ ...p, [key]: value }));
  const hasData = Object.entries(npc).some(([k, v]) => !['mode', 'archived', 'ally_status', 'level'].includes(k) && v);
  const leave = () => { if (onExit) onExit(); else if (window.history.length > 1) navigate(-1); else navigate('/library'); };

  useEffect(() => setNavigationGuard(() => hasData), [hasData]);

  useEffect(() => { saveDraft({ step }); }, [step]);

  const scrollToTop = () => window.scrollTo(0, 0);
  const goBack = () => { if (step > 0) { const next = step - 1; setStep(next); saveDraft({ step: next }); scrollToTop(); } else if (hasData) setShowExit(true); else if (onExit) onExit(); else leave(); };
  const jumpTo = (i) => { setStep(i); saveDraft({ step: i }); scrollToTop(); };
  const isFinal = step === STEPS.length - 1;
  const canContinue = !!npc.name;
  const requiredMessage = !canContinue ? '1 required detail remaining' : '';

  const handleContinue = () => { if (!isFinal) { const next = step + 1; setStep(next); saveDraft({ step: next }); scrollToTop(); } else onSave(); };

  return (
    <div>
      <NavControls onClick={goBack}/>
      <div className="mb-6 flex gap-2">{STEPS.map((s, i) => <button key={s.title} onClick={() => jumpTo(i)} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? 'bg-brand' : 'bg-muted hover:bg-muted/70'}`}/>)}</div>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[.22em] text-brand/70">Step {step + 1} of {STEPS.length}</p>
            <h2 className="mt-2 font-fantasy text-2xl">{STEPS[step].title}</h2>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StepContinue variant="top" canContinue={canContinue} onContinue={handleContinue} isFinal={isFinal} saving={saving} generating={generating}/>
            {requiredMessage && <p className="text-xs text-muted-foreground">{requiredMessage}</p>}
            <RegenerateMenu npc={npc} setNPC={setNPC} onBusy={setGenerating}/>
          </div>
        </div>
        {STEPS[step].render(npc, setNPC, jumpTo)}
      </div>
      <div className="mt-5 flex justify-between">
        <button onClick={goBack} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted"><ChevronLeft size={16}/>Back</button>
        <StepContinue canContinue={canContinue} onContinue={handleContinue} isFinal={isFinal} saving={saving} generating={generating}/>
      </div>
      {showExit && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center"><AlertTriangle className="mx-auto mb-4 text-brand" size={32}/><p className="text-foreground">Leave the NPC creator? Unsaved information will be lost.</p><div className="mt-6 flex justify-center gap-3"><button onClick={() => setShowExit(false)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Stay</button><button onClick={leave} className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">Discard & Leave</button></div></div></div>}
    </div>
  );
}