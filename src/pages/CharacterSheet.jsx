import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Pencil, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import NavControls from '@/components/NavControls';
import { buildSheetData, exportToPDF, downloadPDF, abilityMod, fmtMod } from '@/lib/sheetUtils';
import { Image } from '@/components/ui/image';

const ABILITIES = [
  { key: 'str', label: 'STR', full: 'Strength' },
  { key: 'dex', label: 'DEX', full: 'Dexterity' },
  { key: 'con', label: 'CON', full: 'Constitution' },
  { key: 'int', label: 'INT', full: 'Intelligence' },
  { key: 'wis', label: 'WIS', full: 'Wisdom' },
  { key: 'cha', label: 'CHA', full: 'Charisma' },
];

function AbilityBlock({ label, score, mod, save, saveProf }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-card px-3 py-3 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="mt-1 text-2xl font-bold text-foreground">{score ?? '—'}</span>
      <span className="text-sm font-medium text-brand">{score != null ? fmtMod(abilityMod(score)) : '—'}</span>
      <div className="mt-2 border-t border-border pt-2 w-full text-center">
        <span className="text-[10px] text-muted-foreground">SAVE</span>
        <p className="text-xs font-semibold text-foreground">{mod != null ? save : '—'} {saveProf && <span className="text-brand">●</span>}</p>
      </div>
    </div>
  );
}

function StatPill({ label, value }) {
  if (value === '' || value == null) return null;
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-card px-4 py-3 text-center min-w-[80px]">
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-serif text-lg text-brand">{title}</h2>
      {children}
    </section>
  );
}

function TextField({ label, value }) {
  if (!value) return null;
  return (
    <div className="mb-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  );
}

function AttackRow({ name, bonus, damage, notes }) {
  if (!name) return null;
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-lg border border-border px-3 py-2 text-sm mb-2">
      <span className="font-medium text-foreground">{name}</span>
      <span className="text-brand font-semibold">{bonus}</span>
      <span className="text-muted-foreground">{damage}{notes ? ` · ${notes}` : ''}</span>
    </div>
  );
}

export default function CharacterSheet() {
  const { id } = useParams();
  const [npc, setNpc] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => { base44.entities.NPC.get(id).then(setNpc); }, [id]);

  const handleExport = async (flatten) => {
    if (!npc) return;
    setExporting(true);
    setExportError('');
    setShowExportMenu(false);
    try {
      const bytes = await exportToPDF(npc, flatten);
      downloadPDF(bytes, `${npc.name}_NPC`);
    } catch (e) {
      setExportError('Unable to generate the NPC PDF. Your character has been saved. Please try exporting again.');
      console.error(e);
    }
    setExporting(false);
  };

  if (!npc) return <div className="p-8 text-muted-foreground">Loading character sheet…</div>;

  const d = buildSheetData(npc);
  const s = npc.sheet || {};

  return (
    <div className="mx-auto max-w-5xl p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <NavControls fallback={`/npc/${id}`} />
        <div className="ml-auto flex flex-wrap gap-2">
          <Link to={`/edit/${id}`} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            <Pencil size={14} /> Edit NPC
          </Link>
          <Link to={`/roleplay/${id}`} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            <MessageCircle size={14} /> Enter Roleplay
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50"
            >
              <FileDown size={14} />
              {exporting ? 'Exporting…' : 'Export PDF'}
              {!exporting && (showExportMenu ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-border bg-card shadow-lg">
                <button onClick={() => handleExport(false)} className="w-full rounded-t-xl px-4 py-2.5 text-left text-sm hover:bg-muted">Editable PDF</button>
                <button onClick={() => handleExport(true)} className="w-full rounded-b-xl px-4 py-2.5 text-left text-sm hover:bg-muted border-t border-border">Printable PDF</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {exportError && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {exportError}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex gap-5">
          {npc.portrait_url && (
            <Image src={npc.portrait_url} alt={npc.name} className="h-24 w-24 shrink-0 rounded-xl border border-border object-cover" />
          )}
          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-bold text-foreground">{npc.name}</h1>
            <p className="mt-1 text-muted-foreground">{[npc.species, d.role_class, d.level_cr].filter(Boolean).join(' · ')}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {npc.alignment && <span>{npc.alignment}</span>}
              {s.size_type && <span>{s.size_type}</span>}
              {npc.faction && <span className="text-brand">{npc.faction}</span>}
              {s.disposition && <span className="rounded-full border border-border px-2 py-0.5">{s.disposition}</span>}
              {npc.pronouns && <span>{npc.pronouns}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Combat summary */}
      <div className="mb-6 flex flex-wrap gap-3">
        <StatPill label="AC" value={d.armor_class} />
        <StatPill label="Max HP" value={d.hp_max} />
        <StatPill label="Curr HP" value={d.hp_current !== d.hp_max ? d.hp_current : null} />
        <StatPill label="Speed" value={d.speed} />
        <StatPill label="Initiative" value={d.initiative} />
        <StatPill label="Prof" value={d.proficiency_bonus} />
        <StatPill label="Pass Perc" value={d.passive_perception} />
      </div>

      {/* Ability scores */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {ABILITIES.map((a) => (
          <AbilityBlock
            key={a.key}
            label={a.label}
            score={s[`${a.key}_score`]}
            mod={s[`${a.key}_score`] != null ? abilityMod(s[`${a.key}_score`]) : null}
            save={d[`${a.key}_save`]}
            saveProf={s[`${a.key}_save_prof`]}
          />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Skills & Senses */}
        {(d.skill_proficiencies || d.languages_senses || d.resistances_immunities) && (
          <Section title="Proficiencies & Senses">
            <TextField label="Skill Proficiencies" value={d.skill_proficiencies} />
            <TextField label="Languages / Senses" value={d.languages_senses} />
            <TextField label="Resistances / Immunities" value={d.resistances_immunities} />
          </Section>
        )}

        {/* Roleplay profile */}
        {(d.personality || d.motivation || d.appearance) && (
          <Section title="Roleplay Profile">
            <TextField label="Personality / Mannerisms" value={d.personality} />
            <TextField label="Motivation / Goal" value={d.motivation} />
            <TextField label="Appearance" value={d.appearance} />
          </Section>
        )}

        {/* Attacks */}
        {(d.attack_1_name || d.attack_2_name || d.attack_3_name || d.actions_reactions) && (
          <Section title="Attacks & Actions">
            <AttackRow name={d.attack_1_name} bonus={d.attack_1_bonus} damage={d.attack_1_damage} notes={d.attack_1_notes} />
            <AttackRow name={d.attack_2_name} bonus={d.attack_2_bonus} damage={d.attack_2_damage} notes={d.attack_2_notes} />
            <AttackRow name={d.attack_3_name} bonus={d.attack_3_bonus} damage={d.attack_3_damage} notes={d.attack_3_notes} />
            <TextField label="Other Actions / Reactions" value={d.actions_reactions} />
          </Section>
        )}

        {/* Features & Spellcasting */}
        {(d.features_traits || d.spellcasting) && (
          <Section title="Features, Traits & Spellcasting">
            <TextField label="Features / Traits" value={d.features_traits} />
            <TextField label="Spellcasting" value={d.spellcasting} />
          </Section>
        )}

        {/* Equipment */}
        {d.equipment && (
          <Section title="Equipment">
            <TextField label="Equipment / Inventory" value={d.equipment} />
          </Section>
        )}

        {/* DM Notes */}
        {d.notes && (
          <Section title="DM Notes">
            <TextField label="Notes / Secrets / Hooks" value={d.notes} />
          </Section>
        )}
      </div>
    </div>
  );
}