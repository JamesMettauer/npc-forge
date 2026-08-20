import { useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import TextCombobox from '@/components/npc/TextCombobox';

const SPECIES_SUGGESTIONS = ['Human', 'Dwarf', 'Elf', 'Halfling', 'Goblin', 'Hobgoblin', 'Orc', 'Kobold', 'Skeleton', 'Zombie', 'Wolf', 'Ogre', 'Other / Custom'];
const UNIT_STRUCTURES = ['Individuals', 'Pair', 'Patrol', 'Squad', 'Warband', 'Horde', 'Swarm', 'Mounted Unit', 'Leader + Followers', 'Mixed Group', 'Custom'];
const ENCOUNTER_FUNCTIONS = ['Auto', 'Frontline', 'Ranged', 'Scout', 'Guard', 'Support', 'Healer', 'Controller', 'Ambusher', 'Leader', 'Brute', 'Spellcaster', 'Mounted', 'Custom'];
const FACTION_SUGGESTIONS = ['Auto / None', 'Unknown', 'Custom'];
const ENVIRONMENTS = ['Auto', 'Urban', 'Dungeon', 'Forest', 'Mountains', 'Swamp', 'Desert', 'Coast', 'Underground', 'Arctic', 'Plains', 'Ruins', 'Other / Custom'];
const DIFFICULTIES = ['Auto', 'Trivial', 'Easy', 'Moderate', 'Hard', 'Deadly', 'Custom'];
const ROLES = ['Minion', 'Standard', 'Veteran', 'Elite', 'Leader', 'Boss', 'Custom'];

const inputCls = 'w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-brand/50';
const labelCls = 'text-xs font-medium text-muted-foreground';

export default function EncounterMoreOptions({ options, setOptions }) {
  const [open, setOpen] = useState(false);
  const set = (key, value) => setOptions(prev => ({ ...prev, [key]: value }));
  const isMixed = options.unitStructure === 'Mixed Group';

  const addUnit = () => setOptions(prev => ({
    ...prev,
    mixedUnits: [...prev.mixedUnits, { id: `${Date.now()}`, creature: '', quantity: 1, role: 'Standard', func: 'Auto' }],
  }));
  const updateUnit = (id, field, value) => setOptions(prev => ({
    ...prev,
    mixedUnits: prev.mixedUnits.map(u => u.id === id ? { ...u, [field]: value } : u),
  }));
  const removeUnit = (id) => setOptions(prev => ({
    ...prev,
    mixedUnits: prev.mixedUnits.filter(u => u.id !== id),
  }));

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-input px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
      >
        <span>More Options</span>
        <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`}/>
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/20 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Species / Kind</label>
              <div className="mt-1.5"><TextCombobox value={options.species} onChange={v => set('species', v)} suggestions={SPECIES_SUGGESTIONS} placeholder="Search or enter species…"/></div>
            </div>
            <div>
              <label className={labelCls}>Unit Structure</label>
              <select value={options.unitStructure} onChange={e => set('unitStructure', e.target.value)} className={`mt-1.5 ${inputCls}`}>
                {UNIT_STRUCTURES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Encounter Function</label>
              <select value={options.encounterFunction} onChange={e => set('encounterFunction', e.target.value)} className={`mt-1.5 ${inputCls}`}>
                {ENCOUNTER_FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Faction</label>
              <div className="mt-1.5"><TextCombobox value={options.faction} onChange={v => set('faction', v)} suggestions={FACTION_SUGGESTIONS} placeholder="Auto / None"/></div>
            </div>
            <div>
              <label className={labelCls}>Environment</label>
              <select value={options.environment} onChange={e => set('environment', e.target.value)} className={`mt-1.5 ${inputCls}`}>
                {ENVIRONMENTS.map(en => <option key={en} value={en}>{en}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Encounter Difficulty</label>
              <select value={options.difficulty} onChange={e => set('difficulty', e.target.value)} className={`mt-1.5 ${inputCls}`}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Current Situation</label>
            <input type="text" value={options.currentSituation} onChange={e => set('currentSituation', e.target.value)} placeholder="Why are they here or what are they doing?" className={`mt-1.5 ${inputCls}`}/>
          </div>

          {isMixed && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Mixed Group Units</p>
                <button type="button" onClick={addUnit} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"><Plus size={12}/>Add Unit</button>
              </div>
              {options.mixedUnits.length === 0 && <p className="text-xs text-muted-foreground">No units added. Click "Add Unit" to define encounter composition.</p>}
              {options.mixedUnits.map((u, idx) => (
                <div key={u.id} className="space-y-2 rounded-lg border border-border bg-card/50 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Unit {idx + 1}</span>
                    <button type="button" onClick={() => removeUnit(u.id)} className="text-destructive hover:text-destructive/80"><X size={14}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] text-muted-foreground">Unit / Creature</label>
                      <input type="text" value={u.creature} onChange={e => updateUnit(u.id, 'creature', e.target.value)} placeholder="e.g., Goblin Archer" className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand/50"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Qty</label>
                      <input type="number" min={1} value={u.quantity} onChange={e => updateUnit(u.id, 'quantity', Math.max(1, Number(e.target.value) || 1))} className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand/50"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Role</label>
                      <select value={u.role} onChange={e => updateUnit(u.id, 'role', e.target.value)} className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand/50">
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Function</label>
                      <select value={u.func} onChange={e => updateUnit(u.id, 'func', e.target.value)} className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand/50">
                        {ENCOUNTER_FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}