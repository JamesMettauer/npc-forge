/**
 * SheetTab — editable character sheet fields embedded inside the NPC editor.
 * Each stat area is its own collapsible section. A one-click generator fills
 * the whole block coherently from the NPC's species/class/level/role.
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { abilityMod, fmtMod } from '@/lib/sheetUtils';
import { generateSheetStats, mergeGeneratedStats } from '@/lib/sheetGenerator';

const ABILITIES = [
  { key: 'str', label: 'Strength', abbr: 'STR' },
  { key: 'dex', label: 'Dexterity', abbr: 'DEX' },
  { key: 'con', label: 'Constitution', abbr: 'CON' },
  { key: 'int', label: 'Intelligence', abbr: 'INT' },
  { key: 'wis', label: 'Wisdom', abbr: 'WIS' },
  { key: 'cha', label: 'Charisma', abbr: 'CHA' },
];

const inp = 'w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50';
const ta = `${inp} resize-y`;

function Section({ title, open, onToggle, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <h3 className="font-serif text-lg text-brand">{title}</h3>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      {open && <div className="border-t border-border px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function SheetTab({ npc, onChange }) {
  const [open, setOpen] = useState({
    identity: true, combat: true, abilities: true, skills: true, senses: false,
    resistances: false, attacks: false, actions: false, features: false,
    spellcasting: false, equipment: false, notes: false,
  });
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const sheet = npc.sheet || {};
  const set = (key, value) => onChange({ ...npc, sheet: { ...sheet, [key]: value } });
  const setTop = (key, value) => onChange({ ...npc, [key]: value });

  const prof = npc.proficiency_bonus || 2;
  const calcSave = (scoreKey, profKey) => {
    const sc = sheet[scoreKey];
    if (sc == null) return '—';
    const m = abilityMod(sc);
    return fmtMod(sheet[profKey] ? m + prof : m);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    try {
      const result = await generateSheetStats(npc);
      onChange(mergeGeneratedStats(npc, result));
    } catch (e) {
      setGenError('Could not generate stats. You can still fill fields manually.');
      console.error(e);
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      {/* Generator */}
      <div className="flex flex-col gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Auto-generate stat block</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Fills ability scores, combat stats, proficiencies, attacks, features, and equipment from this NPC's species, class/role, and level. Edit anything afterward.</p>
          {genError && <p className="mt-1 text-xs text-destructive">{genError}</p>}
        </div>
        <button onClick={handleGenerate} disabled={generating} className="flex shrink-0 items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50">
          <Sparkles size={14} /> {generating ? 'Generating…' : 'Generate Stats'}
        </button>
      </div>

      {/* Identity */}
      <Section title="Identity" open={open.identity} onToggle={() => toggle('identity')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Size / Creature Type"><input value={sheet.size_type || ''} onChange={(e) => set('size_type', e.target.value)} placeholder="Medium Humanoid" className={inp} /></Field>
          <Field label="Background / Occupation"><input value={sheet.background_role || ''} onChange={(e) => set('background_role', e.target.value)} placeholder="Blacksmith" className={inp} /></Field>
          <Field label="Disposition">
            <select value={sheet.disposition || ''} onChange={(e) => set('disposition', e.target.value)} className={inp}>
              <option value="">—</option>
              {['Friendly','Helpful','Neutral','Suspicious','Unfriendly','Hostile','Terrified','Loyal','Indifferent'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* Combat */}
      <Section title="Combat Statistics" open={open.combat} onToggle={() => toggle('combat')}>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Armor Class"><input type="number" value={npc.armor_class ?? ''} onChange={(e) => setTop('armor_class', Number(e.target.value) || '')} className={inp} /></Field>
          <Field label="Max HP"><input type="number" value={npc.hit_points ?? ''} onChange={(e) => setTop('hit_points', Number(e.target.value) || '')} className={inp} /></Field>
          <Field label="Current HP"><input type="number" value={sheet.hp_current ?? ''} onChange={(e) => set('hp_current', Number(e.target.value) || '')} className={inp} /></Field>
          <Field label="Speed"><input value={npc.speed ?? ''} onChange={(e) => setTop('speed', e.target.value)} placeholder="30 ft." className={inp} /></Field>
          <Field label="Initiative (override)"><input type="number" value={sheet.initiative ?? ''} onChange={(e) => set('initiative', Number(e.target.value) || '')} placeholder="auto" className={inp} /></Field>
          <Field label="Proficiency Bonus"><input type="number" value={npc.proficiency_bonus ?? ''} onChange={(e) => setTop('proficiency_bonus', Number(e.target.value) || '')} className={inp} /></Field>
          <Field label="Passive Perception"><input type="number" value={sheet.passive_perception ?? ''} onChange={(e) => set('passive_perception', Number(e.target.value) || '')} placeholder="auto" className={inp} /></Field>
        </div>
      </Section>

      {/* Ability Scores */}
      <Section title="Ability Scores & Saving Throws" open={open.abilities} onToggle={() => toggle('abilities')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-muted-foreground">{['Ability','Score','Mod','Save','Prof?'].map((h) => <th key={h} className="pb-2 text-left font-medium pr-3">{h}</th>)}</tr></thead>
            <tbody>
              {ABILITIES.map(({ key, label }) => {
                const scoreKey = `${key}_score`, profKey = `${key}_save_prof`;
                const score = sheet[scoreKey];
                const mod = score != null ? fmtMod(abilityMod(score)) : '—';
                return (
                  <tr key={key} className="border-t border-border/50">
                    <td className="py-2 pr-3 font-medium text-foreground">{label}</td>
                    <td className="py-2 pr-3"><input type="number" value={score ?? ''} onChange={(e) => set(scoreKey, e.target.value === '' ? undefined : Number(e.target.value))} className="w-16 rounded-lg border border-border bg-input px-2 py-1.5 text-sm outline-none focus:border-brand/50" /></td>
                    <td className="py-2 pr-3 text-brand font-semibold">{mod}</td>
                    <td className="py-2 pr-3 text-foreground">{calcSave(scoreKey, profKey)}</td>
                    <td className="py-2"><input type="checkbox" checked={!!sheet[profKey]} onChange={(e) => set(profKey, e.target.checked)} className="accent-brand h-4 w-4 cursor-pointer" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Skills */}
      <Section title="Skills" open={open.skills} onToggle={() => toggle('skills')}>
        <Field label="Skill Proficiencies / Expertise"><textarea rows={3} value={sheet.skill_proficiencies || ''} onChange={(e) => set('skill_proficiencies', e.target.value)} placeholder="Perception +5, Stealth +6, Investigation +4…" className={ta} /></Field>
      </Section>

      {/* Languages & Senses */}
      <Section title="Languages & Senses" open={open.senses} onToggle={() => toggle('senses')}>
        <Field label="Languages / Senses"><textarea rows={3} value={sheet.languages_senses || ''} onChange={(e) => set('languages_senses', e.target.value)} placeholder="Common, Elvish · Darkvision 60 ft." className={ta} /></Field>
      </Section>

      {/* Resistances & Immunities */}
      <Section title="Resistances & Immunities" open={open.resistances} onToggle={() => toggle('resistances')}>
        <Field label="Resistances / Immunities / Vulnerabilities"><textarea rows={3} value={sheet.resistances_immunities || ''} onChange={(e) => set('resistances_immunities', e.target.value)} placeholder="Resistance to fire; Immune to poison" className={ta} /></Field>
      </Section>

      {/* Attacks */}
      <Section title="Attacks" open={open.attacks} onToggle={() => toggle('attacks')}>
        {[1, 2, 3].map((n) => (
          <div key={n} className="mb-3 rounded-xl border border-border p-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Attack {n}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Name"><input value={sheet[`attack_${n}_name`] || ''} onChange={(e) => set(`attack_${n}_name`, e.target.value)} placeholder="Longsword" className={inp} /></Field>
              <Field label="Attack Bonus"><input value={sheet[`attack_${n}_bonus`] || ''} onChange={(e) => set(`attack_${n}_bonus`, e.target.value)} placeholder="+5" className={inp} /></Field>
              <Field label="Damage"><input value={sheet[`attack_${n}_damage`] || ''} onChange={(e) => set(`attack_${n}_damage`, e.target.value)} placeholder="1d8+3 slashing" className={inp} /></Field>
              <Field label="Notes"><input value={sheet[`attack_${n}_notes`] || ''} onChange={(e) => set(`attack_${n}_notes`, e.target.value)} placeholder="Versatile 1d10" className={inp} /></Field>
            </div>
          </div>
        ))}
      </Section>

      {/* Actions & Reactions */}
      <Section title="Actions & Reactions" open={open.actions} onToggle={() => toggle('actions')}>
        <Field label="Special Actions / Bonus Actions / Reactions"><textarea rows={4} value={sheet.actions_reactions || ''} onChange={(e) => set('actions_reactions', e.target.value)} placeholder="Multiattack, Reaction: Parry…" className={ta} /></Field>
      </Section>

      {/* Features & Traits */}
      <Section title="Features & Traits" open={open.features} onToggle={() => toggle('features')}>
        <Field label="Racial Traits / Class Abilities / Special Features"><textarea rows={4} value={sheet.features_traits || ''} onChange={(e) => set('features_traits', e.target.value)} placeholder="Darkvision, Pack Tactics, Second Wind…" className={ta} /></Field>
      </Section>

      {/* Spellcasting */}
      <Section title="Spellcasting" open={open.spellcasting} onToggle={() => toggle('spellcasting')}>
        <Field label="Spellcasting / Innate Powers (leave blank if not a spellcaster)"><textarea rows={4} value={sheet.spellcasting || ''} onChange={(e) => set('spellcasting', e.target.value)} placeholder="Spellcasting Ability: INT · Save DC 15 · Attack +7&#10;Cantrips: Fire Bolt, Mage Hand&#10;1st: Shield, Magic Missile" className={ta} /></Field>
      </Section>

      {/* Equipment */}
      <Section title="Equipment" open={open.equipment} onToggle={() => toggle('equipment')}>
        <Field label="Equipment / Treasure"><textarea rows={4} value={sheet.equipment || ''} onChange={(e) => set('equipment', e.target.value)} placeholder="Longsword, Chain Shirt, Shield, 12 gp" className={ta} /></Field>
      </Section>

      {/* Notes */}
      <Section title="Notes" open={open.notes} onToggle={() => toggle('notes')}>
        <Field label="Notes / Secrets / Plot Hooks"><textarea rows={4} value={sheet.notes || ''} onChange={(e) => set('notes', e.target.value)} placeholder="DM-only secrets, hooks, relationships…" className={ta} /></Field>
      </Section>
    </div>
  );
}