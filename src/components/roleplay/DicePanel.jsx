import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Dices, Eye, EyeOff, Plus, X } from 'lucide-react';
import { SKILL_LIST, SKILLS, rollCheck, observedForTier, suggestedDC, defaultDifficulty, baseDCFor, DIFFICULTY_OPTIONS, SITUATIONAL_PRESETS, computeFinalDC, CRIT_SETTINGS, degreeOfOutcome, DC_MODES } from '@/lib/dice';

export default function DicePanel({ open, onOpenChange, npc, prefillSkill, onResult, latestExchangeId }){
  const [skill, setSkill] = useState(prefillSkill || 'Medicine');
  const [character, setCharacter] = useState('');
  const [abilityMod, setAbilityMod] = useState(0);
  const [profBonus, setProfBonus] = useState(0);
  const [expertise, setExpertise] = useState(false);
  const [mode, setMode] = useState('normal');
  const [tempMod, setTempMod] = useState(0);
  const [bonusDie, setBonusDie] = useState(0);
  const roller = 'npc';
  const [dcMode, setDcMode] = useState('Suggested DC with DM Approval');
  const [difficulty, setDifficulty] = useState(defaultDifficulty(prefillSkill) || 'medium');
  const [modifiers, setModifiers] = useState([]);
  const [finalDC, setFinalDC] = useState(baseDCFor(defaultDifficulty(prefillSkill) || 'medium'));
  const [hideDc, setHideDc] = useState(false);
  const [critSetting, setCritSetting] = useState(CRIT_SETTINGS[0]);
  const [error, setError] = useState('');

  useEffect(() => { if (prefillSkill) { setSkill(prefillSkill); setDifficulty(defaultDifficulty(prefillSkill)); } }, [prefillSkill]);
  useEffect(() => { const b = baseDCFor(difficulty); setFinalDC(computeFinalDC(b, modifiers)); }, [difficulty, modifiers]);
  useEffect(() => { if (open) setCharacter(npc?.name || ''); }, [open, npc]);

  const ability = SKILLS[skill]?.ability || 'Strength';
  const proficiency = profBonus > 0;
  const modifier = abilityMod + (expertise ? 2 * profBonus : profBonus);
  const baseDC = baseDCFor(difficulty);
  const usesDC = dcMode === 'DM Sets DC' || dcMode === 'Suggested DC with DM Approval' || dcMode === 'Automatic DC';

  const addModifier = (label, value) => setModifiers((m) => [...m, { label, value: Number(value) || 0, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
  const removeModifier = (id) => setModifiers((m) => m.filter((x) => x.id !== id));

  const doRoll = () => {
    setError('');
    try {
      const roll = rollCheck({ modifier, advantage: mode === 'advantage', disadvantage: mode === 'disadvantage', bonusDie, tempMod });
      const dc = usesDC ? finalDC : null;
      const degree = dc != null ? degreeOfOutcome(roll.total, dc, roll.d20s, critSetting) : null;
      const tierLabel = degree ? degree.label : 'No DC';
      const observed = [observedForTier(npc, skill, Math.min(4, Math.max(0, Math.floor((roll.total - 5) / 5))))];
      onResult?.({
        skill, ability, character: character || 'Unassigned',
        abilityMod, profBonus, expertise, proficiency, modifier, mode,
        d20s: roll.d20s, kept: roll.kept, bonus_die: roll.bonusDie, temp_mod: roll.tempMod,
        total: roll.total,         roller, visibility: 'DM Only', dc_mode: dcMode,
        difficulty, base_dc: baseDC, situational_modifiers: modifiers, final_dc: dc, hide_dc: hideDc, crit_setting: critSetting,
        degree: degree?.degree || null, degree_label: tierLabel, observed, exchange_id: latestExchangeId,
      });
    } catch {
      setError('The check could not be completed. No result was recorded.');
    }
  };

  const inputCls = 'mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-brand/50';
  const labelCls = 'text-xs font-medium text-muted-foreground';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Dices size={18}/>Skill Check</SheetTitle>
          <SheetDescription>Roll a hidden skill check for this NPC. Players roll their own dice at the table.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className={labelCls}>Check type</label>
            <select value={skill} onChange={(e) => { setSkill(e.target.value); setDifficulty(defaultDifficulty(e.target.value)); }} className={inputCls}>
              {SKILL_LIST.map((s) => <option key={s} value={s}>{s} — {SKILLS[s].ability}</option>)}
              <option value="Custom Ability Check">Custom Ability Check</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Acting NPC</label>
            <input value={character} onChange={(e) => setCharacter(e.target.value)} placeholder="NPC name" className={inputCls}/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{ability} modifier</label>
              <input type="number" value={abilityMod} onChange={(e) => setAbilityMod(Number(e.target.value) || 0)} className={inputCls}/>
            </div>
            <div>
              <label className={labelCls}>Proficiency bonus</label>
              <input type="number" value={profBonus} onChange={(e) => setProfBonus(Number(e.target.value) || 0)} className={inputCls}/>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-foreground">
            <input type="checkbox" checked={expertise} onChange={(e) => setExpertise(e.target.checked)}/>
            Expertise (double proficiency)
          </label>

          <div className="rounded-lg bg-muted p-2 text-sm text-foreground">
            {skill} modifier: {modifier >= 0 ? '+' : ''}{modifier}
            {proficiency && <span className="ml-2 text-xs text-muted-foreground">(proficient{expertise ? ' · expertise' : ''})</span>}
          </div>

          <div>
            <label className={labelCls}>Roll mode</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {[['normal', 'Normal'], ['advantage', 'Advantage'], ['disadvantage', 'Disadvantage']].map(([v, l]) => (
                <button key={v} onClick={() => setMode(v)} className={`rounded-lg border px-2 py-1.5 text-xs ${mode === v ? 'border-brand bg-brand/10 text-foreground' : 'border-border text-muted-foreground'}`}>{l}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Temporary modifier</label>
              <input type="number" value={tempMod} onChange={(e) => setTempMod(Number(e.target.value) || 0)} className={inputCls}/>
            </div>
            <div>
              <label className={labelCls}>Bonus die (sides)</label>
              <input type="number" value={bonusDie} onChange={(e) => setBonusDie(Number(e.target.value) || 0)} placeholder="e.g. 4 for Guidance" className={inputCls}/>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-foreground">DM Difficulty</p>
            <label className={labelCls}>DC mode</label>
            <select value={dcMode} onChange={(e) => setDcMode(e.target.value)} className={inputCls}>
              {DC_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            {usesDC && <>
              <label className={`mt-3 block ${labelCls}`}>Base difficulty</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {DIFFICULTY_OPTIONS.map(([v, l]) => (
                  <button key={v} onClick={() => setDifficulty(v)} className={`rounded-lg border px-2 py-1.5 text-xs ${difficulty === v ? 'border-brand bg-brand/10 text-foreground' : 'border-border text-muted-foreground'}`}>{l}</button>
                ))}
              </div>

              <div className="mt-3">
                <p className={labelCls}>Situational adjustments</p>
                <div className="mt-1 space-y-1">
                  {modifiers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1 text-xs">
                      <span className="flex-1 text-foreground">{m.label}</span>
                      <span className={m.value < 0 ? 'text-green-600 dark:text-green-300' : 'text-destructive'}>{m.value >= 0 ? '+' : ''}{m.value}</span>
                      <button onClick={() => removeModifier(m.id)} className="text-muted-foreground hover:text-destructive"><X size={12}/></button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-1">
                    {SITUATIONAL_PRESETS.filter((p) => p.value !== 0).map((p) => (
                      <button key={p.label} onClick={() => addModifier(p.label, p.value)} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground"><Plus size={10}/>{p.label} ({p.value >= 0 ? '+' : ''}{p.value})</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-muted/50 p-2 text-xs">
                <p className="text-muted-foreground">Base DC: <span className="text-foreground">{baseDC}</span> ({difficulty})</p>
                {modifiers.map((m) => <p key={m.id} className="text-muted-foreground">{m.label}: <span className={m.value < 0 ? 'text-green-600 dark:text-green-300' : 'text-destructive'}>{m.value >= 0 ? '+' : ''}{m.value}</span></p>)}
                <p className="mt-1 font-medium text-foreground">Final DC: {computeFinalDC(baseDC, modifiers)}</p>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className={labelCls}>Override DC</label>
                <input type="number" value={finalDC} onChange={(e) => setFinalDC(Number(e.target.value) || 0)} className="w-20 rounded-lg border border-border bg-input px-2 py-1 text-sm"/>
                <button onClick={() => setFinalDC(computeFinalDC(baseDC, modifiers))} className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground">Reset</button>
                <button onClick={() => setHideDc((h) => !h)} className="ml-auto flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs">{hideDc ? <EyeOff size={12}/> : <Eye size={12}/>}{hideDc ? 'Hidden' : 'Visible'}</button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Players {hideDc ? 'will not' : 'will'} see the DC before rolling.</p>

              <label className={`mt-3 block ${labelCls}`}>Critical skill checks</label>
              <select value={critSetting} onChange={(e) => setCritSetting(e.target.value)} className={inputCls}>
                {CRIT_SETTINGS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </>}
          </div>

          {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">{error}</p>}
        </div>

        <SheetFooter className="mt-4 gap-2">
          <Button onClick={() => onOpenChange(false)} variant="outline">Cancel</Button>
          <Button onClick={doRoll}><Dices size={14}/>Roll {skill}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}