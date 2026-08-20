import { useState } from 'react';
import { Zap, Loader2, UserPlus, ArrowRightCircle, Save, RotateCcw, Swords } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { requireRecord, stringValue } from '@/lib/runtimeTypes';
import QuantityStepper from '@/components/npc/QuantityStepper';
import EncounterMoreOptions from '@/components/npc/EncounterMoreOptions';

const TYPES = ['Humanoid', 'Creature', 'Beast', 'Undead', 'Construct', 'Other'];
const DISPOSITIONS = ['Enemy', 'Neutral', 'Ally', 'Unknown'];
const ROLES = ['Minion', 'Standard', 'Veteran', 'Elite', 'Leader', 'Boss', 'Custom'];
const DISPOSITION_MAP = { Enemy: 'enemy', Neutral: 'neutral', Ally: 'ally', Unknown: 'unknown' };
const ROLE_CR = { Minion: 'CR 1/8 or lower', Standard: 'CR 1/4 to 1', Veteran: 'CR 2-4', Elite: 'CR 5-10', Leader: 'CR 3-6 with command abilities', Boss: 'CR 8+', Custom: 'use description' };

const inputCls = 'w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-brand/50';
const labelCls = 'text-xs font-medium text-muted-foreground';

function StatBlock({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-fantasy text-lg font-semibold text-foreground">{value ?? '—'}</p>
    </div>
  );
}

function FieldRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

export default function QuickEncounter({ setNPC, onPromote, onSave, saving, campaigns, campaignId, setCampaignId }) {
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [disposition, setDisposition] = useState('Unknown');
  const [role, setRole] = useState('Standard');
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [nameBusy, setNameBusy] = useState(false);
  const [options, setOptions] = useState({ species: '', unitStructure: 'Individuals', encounterFunction: 'Auto', faction: '', currentSituation: '', environment: 'Auto', difficulty: 'Auto', mixedUnits: [] });

  const generate = async () => {
    if (!description.trim() || busy) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const campaign = campaignId ? await base44.entities.Campaign.get(campaignId) : null;
      const opt = [];
      if (options.species) opt.push(`Species / Kind: ${options.species}`);
      if (options.unitStructure && options.unitStructure !== 'Individuals') opt.push(`Unit Structure: ${options.unitStructure}`);
      if (options.encounterFunction && options.encounterFunction !== 'Auto') opt.push(`Encounter Function: ${options.encounterFunction}`);
      if (options.faction) opt.push(`Faction: ${options.faction}`);
      if (options.currentSituation) opt.push(`Current Situation: ${options.currentSituation}`);
      if (options.environment && options.environment !== 'Auto') opt.push(`Environment: ${options.environment}`);
      if (options.difficulty && options.difficulty !== 'Auto') opt.push(`Encounter Difficulty: ${options.difficulty}`);
      if (options.unitStructure === 'Mixed Group' && options.mixedUnits.length > 0) {
        opt.push('Mixed Group Units:');
        options.mixedUnits.forEach((u, i) => opt.push(`  Unit ${i+1}: ${u.creature || 'Unspecified'} — Qty ${u.quantity} — Role ${u.role} — Function ${u.func}`));
      }
      const optionalContext = opt.length ? '\n' + opt.join('\n') : '';
      const prompt = `Create a D&D 5e quick encounter stat block. Generate ONLY information needed during active play — no history, voice, portrait, or long-term motivation.

Encounter: ${description}
Creature Category: ${type || 'infer from description'}
Disposition toward party: ${disposition}
Encounter Role (importance/capability): ${role} (${ROLE_CR[role]})
Quantity: ${quantity}
${campaign ? `Campaign context — ${campaign.name}: ${campaign.setting || ''}. ${campaign.description || ''}` : ''}${optionalContext}

Generate a JSON object with these fields:
- name: generic designation (e.g., "Goblin Scout", "Royal Soldier", "Bandit Archer"). Do NOT invent a personal name.
- species: creature type or lineage
- physical_description: 1-2 sentences of basic appearance
- armor_class: integer
- hit_points: integer
- speed: string like "30 ft."
- initiative: modifier like "+2" or "-1"
- actions: primary attacks with attack bonus and damage, newline-separated
- saving_throws: relevant saving throw modifiers
- skills: relevant skill modifiers
- senses: passive perception and special senses
- languages: languages known
- traits: special abilities or features
- tactics: 1-2 sentences of simple combat tactics
- morale: when they flee or surrender
- objectives: immediate objective (1 sentence)
- personality_traits: 1-2 personality cues
- challenge_rating: CR string like "1/2" or "2"

Scale stats to the Encounter Role. If a campaign context is provided, favor established factions, equipment, names, and terminology.`;

      const data = requireRecord(await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            species: { type: 'string' },
            physical_description: { type: 'string' },
            armor_class: { type: 'number' },
            hit_points: { type: 'number' },
            speed: { type: 'string' },
            initiative: { type: 'string' },
            actions: { type: 'string' },
            saving_throws: { type: 'string' },
            skills: { type: 'string' },
            senses: { type: 'string' },
            languages: { type: 'string' },
            traits: { type: 'string' },
            tactics: { type: 'string' },
            morale: { type: 'string' },
            objectives: { type: 'string' },
            personality_traits: { type: 'string' },
            challenge_rating: { type: 'string' },
          },
          required: ['name', 'armor_class', 'hit_points'],
        },
      }), 'Quick encounter response');

      const encounter = {
        ...data,
        species: options.species || stringValue(data.species),
        faction: options.faction || stringValue(data.faction),
        mode: 'combat',
        ally_status: DISPOSITION_MAP[disposition] || 'unknown',
        power_level: role,
        quantity: quantity,
        campaign_id: campaignId || '',
        campaign: campaign?.setting || campaign?.name || '',
        temporary: true,
        original_creation_prompt: description,
      };
      setResult(encounter);
      setNPC(p => ({ ...p, ...encounter }));
    } catch (e) {
      setError('Could not generate encounter. Please try again.');
    }
    setBusy(false);
  };

  const generateName = async () => {
    if (!result || nameBusy) return;
    setNameBusy(true);
    try {
      const data = requireRecord(await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a unique fantasy name for this D&D NPC: ${result.name} (${result.species}). Return just the name, nothing else.`,
        response_json_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
      }), 'Encounter name response');
      const generatedName = stringValue(data.name);
      if (generatedName) {
        const updated = { ...result, name: generatedName };
        setResult(updated);
        setNPC(p => ({ ...p, name: generatedName }));
      }
    } catch {}
    setNameBusy(false);
  };

  const reset = () => { setResult(null); setDescription(''); setType(''); setDisposition('Unknown'); setRole('Standard'); setQuantity(1); setOptions({ species: '', unitStructure: 'Individuals', encounterFunction: 'Auto', faction: '', currentSituation: '', environment: 'Auto', difficulty: 'Auto', mixedUnits: [] }); };

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <h3 className="font-fantasy text-2xl font-semibold">{result.name}</h3>
            <p className="text-xs text-muted-foreground">{result.species} · {disposition} · {role}{quantity > 1 ? ` ×${quantity}` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={generateName} disabled={nameBusy} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40"><UserPlus size={12}/>{nameBusy ? 'Generating…' : 'Generate Name'}</button>
            <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"><RotateCcw size={12}/>New Encounter</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <StatBlock label="AC" value={result.armor_class}/>
          <StatBlock label="HP" value={result.hit_points}/>
          <StatBlock label="Speed" value={result.speed}/>
          <StatBlock label="Init" value={result.initiative}/>
          <StatBlock label="CR" value={result.challenge_rating}/>
          <StatBlock label="Qty" value={quantity}/>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <FieldRow label="Appearance" value={result.physical_description}/>
          <FieldRow label="Languages" value={result.languages}/>
          <FieldRow label="Senses" value={result.senses}/>
          <FieldRow label="Saving Throws" value={result.saving_throws}/>
          <FieldRow label="Skills" value={result.skills}/>
          <FieldRow label="Personality Cues" value={result.personality_traits}/>
        </div>
        <FieldRow label="Actions" value={result.actions}/>
        <FieldRow label="Traits" value={result.traits}/>
        <div className="grid gap-2 sm:grid-cols-2">
          <FieldRow label="Tactics" value={result.tactics}/>
          <FieldRow label="Morale" value={result.morale}/>
        </div>
        <FieldRow label="Immediate Objective" value={result.objectives}/>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <button onClick={onPromote} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"><ArrowRightCircle size={16}/>Promote to Full NPC</button>
          <button onClick={onSave} disabled={saving} className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground disabled:opacity-40"><Save size={16}/>{saving ? 'Saving…' : 'Save Encounter'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div>
          <label className={labelCls}>What did the party encounter?</label>
          <input autoFocus value={description} onChange={e => setDescription(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') generate(); }} placeholder="Search or describe…" className={`mt-1.5 ${inputCls}`}/>
          <p className="mt-1.5 text-xs text-muted-foreground">Examples: Goblin Scout · Royal Soldier · Wounded Ogre · Three nervous town guards</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Creature Category</label>
            <select value={type} onChange={e => setType(e.target.value)} className={`mt-1.5 ${inputCls}`}>
              <option value="">Auto-detect</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Disposition</label>
            <select value={disposition} onChange={e => setDisposition(e.target.value)} className={`mt-1.5 ${inputCls}`}>
              {DISPOSITIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Encounter Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className={`mt-1.5 ${inputCls}`}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Quantity</label>
            <QuantityStepper value={quantity} onChange={setQuantity}/>
          </div>
        </div>

        <div className="mt-3">
          <label className={labelCls}>Campaign (optional)</label>
          <select value={campaignId} onChange={e => setCampaignId(e.target.value)} className={`mt-1.5 ${inputCls}`}>
            <option value="">No campaign</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <EncounterMoreOptions options={options} setOptions={setOptions} />

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button onClick={generate} disabled={!description.trim() || busy} className="mt-5 flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-40">
          {busy ? <Loader2 size={16} className="animate-spin"/> : <Zap size={16}/>}
          {busy ? 'Generating encounter…' : 'Generate Encounter'}
        </button>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
        <div className="flex items-start gap-2">
          <Swords size={14} className="mt-0.5 shrink-0 text-brand/60"/>
          <p className="text-xs leading-5 text-muted-foreground">Quick Encounter generates only what you need at the table — stats, attacks, tactics, and morale. No history, voice, or portrait unless you later promote to a Full NPC.</p>
        </div>
      </div>
    </div>
  );
}
