import { useState } from 'react';
import { SKILL_LIST } from '@/lib/dice';
import { abilityModifier } from '@/lib/characterSheet';
import { QUICK_SKILLS } from '@/lib/characterImport';

export default function ManualEntryForm({ initial, quickMode, onSave, onBack, busy }){
  const [form, setForm] = useState(() => ({
    name: '', player_name: '', race: '', character_class: '', level: 1,
    pronouns: '', background: '', alignment: '', appearance: '', equipment: '',
    str_score: 10, dex_score: 10, con_score: 10, int_score: 10, wis_score: 10, cha_score: 10,
    proficiency_bonus: 2, skill_proficiencies: '', passive_perception: 10,
    armor_class: 10, max_hp: 0, languages: '', notes: '', skill_details: {},
    ...initial,
  }));
  const [showMore, setShowMore] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleProf = (skill) => {
    const current = (form.skill_proficiencies || '').split(',').map(s => s.trim()).filter(Boolean);
    const has = current.some(s => s.toLowerCase() === skill.toLowerCase());
    const next = has ? current.filter(s => s.toLowerCase() !== skill.toLowerCase()) : [...current, skill];
    set('skill_proficiencies', next.join(', '));
  };

  const profList = (form.skill_proficiencies || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const handleSave = () => { if (!form.name?.trim()) return; onSave({ ...form, name: form.name.trim() }); };

  if (quickMode) {
    return (
      <div className="space-y-4">
        <h2 className="font-serif text-lg">Quick Character Import</h2>
        <p className="text-xs text-muted-foreground">Enter only what NPC Forge needs for roleplay. You can complete the full sheet later.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Character name" className="field"/>
          <input value={form.player_name} onChange={e => set('player_name', e.target.value)} placeholder="Player name" className="field"/>
          <input value={form.race} onChange={e => set('race', e.target.value)} placeholder="Species" className="field"/>
          <input value={form.character_class} onChange={e => set('character_class', e.target.value)} placeholder="Class" className="field"/>
          <input type="number" value={form.level} onChange={e => set('level', Number(e.target.value) || 1)} placeholder="Level" className="field"/>
          <input type="number" value={form.passive_perception} onChange={e => set('passive_perception', Number(e.target.value) || 10)} placeholder="Passive Perception" className="field"/>
        </div>
        <textarea value={form.appearance} onChange={e => set('appearance', e.target.value)} placeholder="Visible appearance" rows={2} className="field"/>
        <input value={form.equipment} onChange={e => set('equipment', e.target.value)} placeholder="Visible equipment" className="field"/>
        <p className="text-xs font-medium text-muted-foreground">Key Skill Modifiers</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {QUICK_SKILLS.map(skill => (
            <div key={skill}>
              <label className="text-[10px] text-muted-foreground">{skill}</label>
              <input
                type="number"
                value={form.skill_details?.[skill]?.modifier ?? ''}
                onChange={e => set('skill_details', { ...form.skill_details, [skill]: { modifier: Number(e.target.value) || 0, proficiency: 'none', confidence: 'confirmed' } })}
                placeholder="+0"
                className="field w-full"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={busy || !form.name?.trim()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-40">Save Character</button>
          <button onClick={onBack} disabled={busy} className="rounded-lg border border-border px-4 py-2 text-sm">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-lg">Manual Character Entry</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Character name" className="field"/>
        <input value={form.player_name} onChange={e => set('player_name', e.target.value)} placeholder="Player name" className="field"/>
        <input value={form.race} onChange={e => set('race', e.target.value)} placeholder="Species" className="field"/>
        <input value={form.character_class} onChange={e => set('character_class', e.target.value)} placeholder="Class" className="field"/>
        <input type="number" value={form.level} onChange={e => set('level', Number(e.target.value) || 1)} placeholder="Level" className="field"/>
        <input value={form.alignment} onChange={e => set('alignment', e.target.value)} placeholder="Alignment" className="field"/>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Ability Scores</p>
        <div className="grid grid-cols-6 gap-2">
          {[['str_score','STR'],['dex_score','DEX'],['con_score','CON'],['int_score','INT'],['wis_score','WIS'],['cha_score','CHA']].map(([key,label]) => (
            <div key={key}>
              <label className="text-[10px] text-muted-foreground">{label} ({abilityModifier(form[key]) >= 0 ? '+' : ''}{abilityModifier(form[key])})</label>
              <input type="number" value={form[key]} onChange={e => set(key, Number(e.target.value) || 10)} className="field w-full"/>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <input type="number" value={form.proficiency_bonus} onChange={e => set('proficiency_bonus', Number(e.target.value) || 2)} placeholder="Proficiency Bonus" className="field"/>
        <input type="number" value={form.armor_class} onChange={e => set('armor_class', Number(e.target.value) || 10)} placeholder="AC" className="field"/>
        <input type="number" value={form.max_hp} onChange={e => set('max_hp', Number(e.target.value) || 0)} placeholder="Max HP" className="field"/>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Skill Proficiencies</p>
        <div className="flex flex-wrap gap-1.5">
          {SKILL_LIST.map(s => (
            <button key={s} onClick={() => toggleProf(s)} className={`rounded-md px-2 py-1 text-[11px] ${profList.includes(s.toLowerCase()) ? 'bg-brand text-brand-foreground' : 'border border-border text-muted-foreground hover:text-foreground'}`}>{s}</button>
          ))}
        </div>
      </div>
      <button onClick={() => setShowMore(s => !s)} className="text-xs text-brand">{showMore ? 'Hide details' : 'Add More Character Details'}</button>
      {showMore && (
        <div className="space-y-2">
          <input value={form.background} onChange={e => set('background', e.target.value)} placeholder="Background" className="field"/>
          <input value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="Languages" className="field"/>
          <input value={form.equipment} onChange={e => set('equipment', e.target.value)} placeholder="Visible equipment" className="field"/>
          <textarea value={form.appearance} onChange={e => set('appearance', e.target.value)} placeholder="Appearance" rows={2} className="field"/>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes" rows={2} className="field"/>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={busy || !form.name?.trim()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-40">Save Character</button>
        <button onClick={onBack} disabled={busy} className="rounded-lg border border-border px-4 py-2 text-sm">Back</button>
      </div>
    </div>
  );
}