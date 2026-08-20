import { useState } from 'react';
import { Check, AlertTriangle, Save, ChevronDown, ChevronUp } from 'lucide-react';
import ReviewField from './ReviewField';

const SECTIONS = [
  { title: 'Identity', fields: [
    ['name', 'Character Name'], ['player_name', 'Player Name'], ['pronouns', 'Pronouns'],
    ['race', 'Species'], ['background', 'Background'], ['alignment', 'Alignment'],
    ['level', 'Level'], ['experience', 'Experience'], ['character_class', 'Class'],
    ['subclass', 'Subclass'], ['multiclass', 'Multiclass'],
  ]},
  { title: 'Ability Scores', fields: [
    ['str_score', 'STR'], ['dex_score', 'DEX'], ['con_score', 'CON'],
    ['int_score', 'INT'], ['wis_score', 'WIS'], ['cha_score', 'CHA'],
  ]},
  { title: 'Combat', fields: [
    ['armor_class', 'AC'], ['initiative', 'Initiative'], ['speed', 'Speed'],
    ['max_hp', 'Max HP'], ['current_hp', 'Current HP'], ['hit_dice', 'Hit Dice'],
  ]},
  { title: 'Other', fields: [
    ['passive_perception', 'Passive Perception'], ['passive_insight', 'Passive Insight'],
    ['languages', 'Languages'], ['equipment', 'Equipment'], ['weapons', 'Weapons'],
    ['armor', 'Armor'], ['spells', 'Spells'], ['feats', 'Feats'],
  ]},
  { title: 'Personal', fields: [
    ['personality_traits', 'Personality Traits'], ['ideals', 'Ideals'],
    ['bonds', 'Bonds'], ['flaws', 'Flaws'], ['appearance', 'Appearance'],
    ['backstory', 'Backstory'], ['allies_organizations', 'Allies & Organizations'],
  ]},
];

const findChanged = (existing, form) => {
  if (!existing) return new Set();
  const changed = new Set();
  for (const [key, val] of Object.entries(form)) {
    if (val == null || val === '') continue;
    if (String(existing[key] ?? '') !== String(val)) changed.add(key);
  }
  return changed;
};

export default function ImportReview({ data, existingCharacter, onSave, onBack, busy }){
  const [form, setForm] = useState({ ...data });
  const [ignored, setIgnored] = useState(new Set());
  const [showSkills, setShowSkills] = useState(true);

  const conf = form.import_confidence || {};
  const isUpdate = !!existingCharacter;
  const poorQuality = form.page_quality === 'poor';
  const changedFields = findChanged(existingCharacter, form);
  const uncertainCount = Object.entries(conf).filter(([, c]) => c === 'needs_review' || c === 'unreadable').length;

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const ignoreField = (key) => setIgnored(s => new Set([...s, key]));

  const handleSave = () => {
    const cleaned = { ...form };
    for (const key of ignored) {
      if (typeof cleaned[key] !== 'object') delete cleaned[key];
    }
    onSave(cleaned);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg">{isUpdate ? 'Update Review' : 'Character Import Review'}</h2>
        <span className={`rounded px-2 py-0.5 text-xs ${poorQuality ? 'bg-destructive/15 text-destructive' : 'bg-brand/15 text-brand'}`}>{poorQuality ? 'Low Quality' : 'Extracted'}</span>
      </div>

      {poorQuality && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle size={16} className="mt-0.5 text-amber-600 dark:text-amber-400"/>
          <div className="text-xs">
            <p className="font-medium text-foreground">This page is difficult to read.</p>
            <p className="text-muted-foreground">{form.notes || 'Some fields may be inaccurate. Review carefully, retake the photo, or add missing info manually.'}</p>
          </div>
        </div>
      )}

      {isUpdate && changedFields.size > 0 && (
        <div className="rounded-lg border border-brand/30 bg-brand/10 p-3 text-xs">
          <p className="font-medium text-brand">{changedFields.size} field(s) changed from existing character</p>
        </div>
      )}

      {uncertainCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle size={14}/>
          <span>{uncertainCount} field(s) need review</span>
        </div>
      )}

      {SECTIONS.map(section => (
        <div key={section.title}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {section.fields.map(([key, label]) => (
              <ReviewField
                key={key}
                label={label}
                value={form[key]}
                confidence={conf[key] || (form[key] != null && form[key] !== '' ? 'likely' : 'missing')}
                onChange={v => setField(key, v)}
                onIgnore={() => ignoreField(key)}
                changed={isUpdate && changedFields.has(key)}
              />
            ))}
          </div>
        </div>
      ))}

      <div>
        <button onClick={() => setShowSkills(s => !s)} className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {showSkills ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}Skills ({Object.keys(form.skill_details || {}).length})
        </button>
        {showSkills && form.skill_details && (
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(form.skill_details).map(([skill, detail]) => (
              <ReviewField
                key={skill}
                label={`${skill} (${detail.proficiency})`}
                value={detail.modifier}
                confidence={detail.confidence}
                onChange={v => setForm(f => ({ ...f, skill_details: { ...f.skill_details, [skill]: { ...detail, modifier: Number(v) || 0 } } }))}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button onClick={handleSave} disabled={busy || !form.name?.trim()} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-40"><Save size={14}/>Save Character</button>
        <button onClick={() => setIgnored(new Set())} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs"><Check size={12}/>Accept All High Confidence</button>
        <button onClick={onBack} disabled={busy} className="rounded-lg border border-border px-4 py-2 text-sm">Back</button>
      </div>
      {!form.name?.trim() && <p className="text-xs text-destructive">Character name is required to save.</p>}
    </div>
  );
}