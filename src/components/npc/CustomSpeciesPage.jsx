import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

const TYPE_OPTIONS = ['Species', 'Lineage', 'Ancestry', 'Heritage', 'Subspecies', 'Creature Type', 'Other'];
const PARENT_OPTIONS = ['None', 'Human', 'Dwarf', 'Elf', 'Halfling', 'Custom / Other'];
const SIZE_OPTIONS = ['Tiny', 'Small', 'Medium', 'Large', 'Varies', 'Custom'];

const ADVANCED_FIELDS = [
  { key: 'creature_type', label: 'Creature Type' },
  { key: 'base_speed', label: 'Base Walking Speed' },
  { key: 'languages', label: 'Languages' },
  { key: 'darkvision', label: 'Darkvision' },
  { key: 'resistances', label: 'Resistances' },
  { key: 'proficiencies', label: 'Proficiencies' },
  { key: 'special_traits', label: 'Special Traits' },
  { key: 'other_features', label: 'Other Features' },
];

const inputCls = 'w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-brand/50';
const labelCls = 'text-xs font-medium text-muted-foreground';
const taCls = 'w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-brand/50 resize-none';

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-5">
      <h3 className="font-fantasy text-lg font-semibold">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

export default function CustomSpeciesPage({ onSave, onCancel, onDelete, initial }) {
  const d = initial || {};
  const [type, setType] = useState(d.type || 'Species');
  const [customType, setCustomType] = useState(d.custom_type || '');
  const [name, setName] = useState(d.name || '');
  const [description, setDescription] = useState(d.description || '');
  const [parent, setParent] = useState(d.parent_species || 'None');
  const [size, setSize] = useState(d.size || '');
  const [lifespan, setLifespan] = useState(d.lifespan || '');
  const [physicalTraits, setPhysicalTraits] = useState(d.physical_traits || '');
  const [distinguishingFeatures, setDistinguishingFeatures] = useState(d.distinguishing_features || '');
  const [namingStyle, setNamingStyle] = useState(d.naming_style || '');
  const [exampleNames, setExampleNames] = useState(d.example_names || '');
  const [culturalAssociations, setCulturalAssociations] = useState(d.cultural_associations || '');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advanced, setAdvanced] = useState(d.advanced || {});
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canSave = type && name.trim();

  const handleSave = () => {
    if (!canSave) { setError('Type and Name are required.'); return; }
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      type: type === 'Other' ? (customType.trim() || 'Other') : type,
      custom_type: type === 'Other' ? customType.trim() : '',
      name: name.trim(),
      description,
      parent_species: parent,
      size,
      lifespan,
      physical_traits: physicalTraits,
      distinguishing_features: distinguishingFeatures,
      naming_style: namingStyle,
      example_names: exampleNames,
      cultural_associations: culturalAssociations,
      advanced,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background tavern-ambient">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="flex items-start justify-between border-b border-border/60 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-brand/70">NPC Forge</p>
            <h1 className="mt-2 font-fantasy text-3xl font-semibold">Custom Species / Lineage</h1>
            <p className="mt-2 text-sm text-muted-foreground">Define a custom ancestry for this Character Contract.</p>
          </div>
          <button onClick={onCancel} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"><X size={18}/></button>
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className={`mt-1.5 ${inputCls}`}>
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {type === 'Other' && (
              <div>
                <label className={labelCls}>Custom Type Name</label>
                <input value={customType} onChange={e => setCustomType(e.target.value)} className={`mt-1.5 ${inputCls}`} placeholder="e.g., Archfey"/>
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Name <span className="text-destructive">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} className={`mt-1.5 ${inputCls}`} placeholder="e.g., Stoneborn, Ash Elf, Mousefolk, Fey-Touched"/>
          </div>

          <div>
            <label className={labelCls}>Short Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={`mt-1.5 ${taCls}`} placeholder="Descendants of mountain settlers altered by generations of elemental earth exposure."/>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Parent Species / Lineage</label>
              <select value={parent} onChange={e => setParent(e.target.value)} className={`mt-1.5 ${inputCls}`}>
                {PARENT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <SectionCard title="Physical Characteristics">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Typical Size</label>
                <select value={size} onChange={e => setSize(e.target.value)} className={`mt-1.5 ${inputCls}`}>
                  <option value="">Select Size</option>
                  {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Typical Lifespan</label>
                <input value={lifespan} onChange={e => setLifespan(e.target.value)} className={`mt-1.5 ${inputCls}`} placeholder="e.g., Approximately 300 years"/>
              </div>
            </div>
            <div>
              <label className={labelCls}>Physical Traits</label>
              <textarea value={physicalTraits} onChange={e => setPhysicalTraits(e.target.value)} rows={2} className={`mt-1.5 ${taCls}`} placeholder="e.g., Gray stone-like skin, broad build, dense bone structure."/>
            </div>
            <div>
              <label className={labelCls}>Distinguishing Features</label>
              <textarea value={distinguishingFeatures} onChange={e => setDistinguishingFeatures(e.target.value)} rows={2} className={`mt-1.5 ${taCls}`} placeholder="e.g., Mineral-colored markings appear naturally across the face and arms."/>
            </div>
          </SectionCard>

          <SectionCard title="Naming Guidance">
            <div>
              <label className={labelCls}>Naming Style</label>
              <textarea value={namingStyle} onChange={e => setNamingStyle(e.target.value)} rows={2} className={`mt-1.5 ${taCls}`} placeholder="e.g., Short given names with family names derived from mountains, minerals, or ancestral trades."/>
            </div>
            <div>
              <label className={labelCls}>Example Names</label>
              <input value={exampleNames} onChange={e => setExampleNames(e.target.value)} className={`mt-1.5 ${inputCls}`} placeholder="e.g., Dorrin, Mara, Torvek, Stonehand, Embervein"/>
            </div>
          </SectionCard>

          <div>
            <label className={labelCls}>Cultural Associations</label>
            <textarea value={culturalAssociations} onChange={e => setCulturalAssociations(e.target.value)} rows={2} className={`mt-1.5 ${taCls}`} placeholder="Optional cultural suggestions. Species and Culture remain independent."/>
          </div>

          <div className="rounded-xl border border-border bg-card/50">
            <button onClick={() => setAdvancedOpen(o => !o)} className="flex w-full items-center justify-between p-5">
              <h3 className="font-fantasy text-lg font-semibold">Advanced Mechanics</h3>
              <ChevronDown size={18} className={`text-muted-foreground transition-transform ${advancedOpen ? 'rotate-180' : ''}`}/>
            </button>
            {advancedOpen && (
              <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
                {ADVANCED_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label}</label>
                    <input value={advanced[f.key] || ''} onChange={e => setAdvanced(a => ({ ...a, [f.key]: e.target.value }))} className={`mt-1.5 ${inputCls}`}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
          <div>
            {onDelete && initial?.id && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)} className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5">Delete from Library</button>
            )}
            {onDelete && initial?.id && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Delete from your library?</span>
                <button onClick={() => onDelete(initial.id)} className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground">Yes, Delete</button>
                <button onClick={() => setConfirmDelete(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Cancel</button>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
            <button onClick={handleSave} disabled={!canSave} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-40">Save Custom Species</button>
          </div>
        </div>
      </div>
    </div>
  );
}