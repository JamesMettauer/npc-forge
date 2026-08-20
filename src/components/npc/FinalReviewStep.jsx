import { Star, Lock, Pencil, AlertCircle, Check } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { parseEntries } from '@/lib/personality';
import { isStandalone, STANDALONE_NOTE } from '@/lib/campaignRole';

const has = (v) => !!(v && String(v).trim());
const clean = (v) => (v == null || typeof v === 'object' ? '' : String(v));

function Row({ label, value, empty = 'Not set' }) {
  return (
    <div className="flex gap-2 py-1 text-sm">
      <span className="w-40 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`flex-1 ${has(value) ? 'text-foreground' : 'italic text-muted-foreground'}`}>{has(value) ? value : empty}</span>
    </div>
  );
}

export default function FinalReviewStep({ npc, setNPC, onJumpToStep }){
  const primary = npc.primary_traits || [];
  const traits = parseEntries(npc.personality_traits);
  const standalone = isStandalone(npc);

  const issues = [];
  if (!has(npc.name)) issues.push('A character name is required.');
  if (!has(npc.species)) issues.push('Species is recommended.');
  if (npc.npc_build_type === 'Adventuring Class' || npc.npc_build_type === 'Hybrid NPC') {
    if (!has(npc.class_name)) issues.push('Build type requires an adventuring class.');
  }
  if (!has(npc.portrait_url) && !has(npc.approved_portrait_url)) issues.push('No portrait approved (optional but recommended).');
  if (primary.length === 0 && traits.length > 0) issues.push('No Primary Personality Traits selected (recommended 3–5).');

  return (
    <div className="mt-6 space-y-5">
      {issues.length > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
          {issues.map((w, i) => <p key={i} className="flex items-start gap-1.5 text-xs text-foreground"><AlertCircle size={12} className="mt-0.5 shrink-0 text-yellow-600"/>{w}</p>)}
        </div>
      )}

      <Section title="Basic Information" onEdit={() => onJumpToStep?.(0)}>
        <Row label="Name" value={npc.name}/>
        <Row label="Build type" value={npc.npc_build_type || 'Custom'}/>
        <Row label="Power level" value={npc.power_level}/>
        <Row label="Species" value={npc.species}/>
        <Row label="Age" value={npc.age}/>
        <Row label="Pronouns" value={npc.pronouns}/>
        <Row label="Role" value={npc.occupation}/>
        <Row label="Class" value={npc.class_name} empty={npc.npc_build_type === 'NPC Role' ? 'Not required' : 'Not set'}/>
        <Row label="Subclass" value={npc.subclass} empty={npc.npc_build_type === 'NPC Role' ? 'Not required' : 'Not set'}/>
        <Row label="Level" value={npc.level} empty={npc.npc_build_type === 'NPC Role' ? 'Not required' : 'Not set'}/>
        <Row label="Alignment" value={npc.alignment}/>
        <Row label="Faction" value={npc.faction || 'Independent'}/>
        <Row label="Campaign" value={npc.campaign || 'Standalone/Test NPC'}/>
      </Section>

      <Section title="Background" onEdit={() => onJumpToStep?.(2)}>
        <Row label="Campaign" value={npc.campaign || 'No Campaign / Standalone'}/>
        <Row label="Homeland" value={npc.homeland}/>
        <Row label="Culture" value={npc.culture}/>
      </Section>

      <Section title="Appearance & Portrait" onEdit={() => onJumpToStep?.(3)}>
        <div className="flex gap-4">
          {(npc.approved_portrait_url || npc.portrait_url) ? (
            <Image src={npc.approved_portrait_url || npc.portrait_url} alt={npc.name} className="h-32 w-32 rounded-xl"/>
          ) : <div className="grid h-32 w-32 place-items-center rounded-xl bg-muted text-xs text-muted-foreground">No portrait</div>}
          <div className="flex-1">
            <Row label="Art style" value={npc.art_style || 'Fantasy tabletop RPG — painterly realism'}/>
            <Row label="Physical" value={npc.physical_description}/>
            <Row label="Clothing" value={npc.clothing_equipment}/>
            <Row label="Features" value={npc.distinguishing_features}/>
            {npc.approved_portrait_url && <p className="mt-1 flex items-center gap-1 text-xs text-brand"><Lock size={11}/>Portrait approved and locked</p>}
          </div>
        </div>
      </Section>

      <Section title="Primary Personality Traits" onEdit={() => onJumpToStep?.(4)}>
        {primary.length === 0 ? <p className="text-sm italic text-muted-foreground">No primary traits selected.</p> :
          <div className="space-y-1">{primary.map((t) => <p key={t} className="flex items-center gap-1.5 text-sm text-foreground"><Star size={12} className="text-brand" fill="currentColor"/>{t}</p>)}</div>}
        <p className="mt-2 text-xs text-muted-foreground">Primary traits are locked by default after completion and survive conversation resets.</p>
      </Section>

      <Section title="Voice Profile" onEdit={() => onJumpToStep?.(5)}>
        <Row label="Speaking style" value={npc.speaking_style}/>
        <Row label="Vocabulary" value={npc.vocabulary}/>
        <Row label="Accent" value={npc.accent}/>
        {npc.voice_profile && <p className="mt-1 flex items-center gap-1 text-xs text-brand"><Check size={11}/>Voice profile saved</p>}
      </Section>

      <Section title="History & Motivation" onEdit={() => onJumpToStep?.(6)}>
        <Row label="Backstory" value={npc.backstory}/>
        <Row label="Core motivation" value={npc.goals}/>
        <Row label="Short-term goal" value={npc.objectives}/>
        <Row label="Secret" value={npc.secrets} empty="None"/>
      </Section>

      <Section title="Campaign Role" onEdit={() => onJumpToStep?.(7)}>
        {standalone ? <p className="text-sm text-muted-foreground">{STANDALONE_NOTE}</p> :
          <><Row label="Role" value={npc.role}/><Row label="Location" value={npc.location}/><Row label="Attitude" value={npc.initial_attitude}/></>}
      </Section>

      {(npc.major_life_events || []).length > 0 && (
        <Section title="Major Life Events">
          <div className="space-y-1">{npc.major_life_events.map((e) => <p key={e.id} className="text-xs text-foreground">{e.change_type}: {e.existing_trait} → {e.proposed_trait} ({e.life_event})</p>)}</div>
        </Section>
      )}
    </div>
  );
}

/**
 * @param {{ title: string, onEdit?: (() => void) | null, children: import('react').ReactNode }} props
 */
function Section({ title, onEdit = null, children }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-serif text-lg">{title}</h3>
        {onEdit && <button onClick={onEdit} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Pencil size={12}/>Edit</button>}
      </div>
      {children}
    </div>
  );
}
