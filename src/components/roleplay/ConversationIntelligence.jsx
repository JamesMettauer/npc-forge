/**
 * ConversationIntelligence — DM-only panel showing dynamically calculated
 * check DCs (with social-state breakdown), suggested checks, information
 * tiers, and existing learned info / secrets / summary.
 */
import { useState } from 'react';
import { BookOpen, KeyRound, ScrollText, Dices, ChevronDown, Lock, Unlock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { INTEL_SKILLS, DIFFICULTIES, BASE_DC } from '@/lib/conversationIntelligence';

const DIFF_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

function DCBadge({ skill, diff, breakdown, onLock }) {
  if (!breakdown) return null;
  const { base, modifiers, final, locked } = breakdown;
  const adj = final - base;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground w-10">{DIFF_LABELS[diff]}</span>
      <span className={`font-semibold text-xs ${locked ? 'text-brand' : 'text-foreground'}`}>DC {final}</span>
      {adj !== 0 && !locked && <span className={`text-[10px] ${adj < 0 ? 'text-green-600 dark:text-green-300' : 'text-destructive'}`}>{adj > 0 ? '+' : ''}{adj}</span>}
      <button onClick={() => onLock(skill, diff, locked, final)} title={locked ? 'Unlock' : 'Lock DC'} className="text-muted-foreground hover:text-brand">
        {locked ? <Lock size={10} /> : <Unlock size={10} />}
      </button>
    </div>
  );
}

export default function ConversationIntelligence({ convo, npc, onUpdateIntel, onRegenerate, busy }) {
  const [expanded, setExpanded] = useState(null);
  const intel = convo?.intelligence || {};
  const breakdowns = intel.dcBreakdowns || {};
  const suggested = intel.suggestedChecks || [];
  const tiers = intel.informationTiers || {};
  const learned = convo?.learned_information || [];
  const secrets = convo?.revealed_secrets || [];
  const summary = convo?.summary;

  const lockDC = (skill, diff, isLocked, currentFinal) => {
    const lockedDCs = { ...(intel.lockedDCs || {}) };
    if (isLocked) {
      // Unlock
      if (lockedDCs[skill]) { delete lockedDCs[skill][diff]; if (!Object.keys(lockedDCs[skill]).length) delete lockedDCs[skill]; }
    } else {
      lockedDCs[skill] = { ...(lockedDCs[skill] || {}), [diff]: currentFinal };
    }
    onUpdateIntel?.({ lockedDCs });
  };

  return (
    <section className="text-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-lg">Conversation Intelligence</h2>
        <button onClick={onRegenerate} disabled={busy} title="Regenerate from current state" className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-40">
          <Sparkles size={10} /> {busy ? 'Updating…' : 'Regenerate'}
        </button>
      </div>

      {/* Current Check Difficulty */}
      <div className="mb-3 rounded-xl border border-border p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Dices size={12} />Current Check Difficulty</p>
        <div className="space-y-1.5">
          {INTEL_SKILLS.map((skill) => {
            const isOpen = expanded === skill;
            return (
              <div key={skill} className="rounded-lg border border-border/60">
                <button onClick={() => setExpanded(isOpen ? null : skill)} className="flex w-full items-center justify-between px-2.5 py-1.5">
                  <span className="text-xs font-medium text-foreground">{skill}</span>
                  <div className="flex items-center gap-3">
                    {DIFFICULTIES.map((d) => (
                      <span key={d} className="text-[10px]">
                        <span className="text-muted-foreground">{DIFF_LABELS[d][0]}:</span>{' '}
                        <span className="font-semibold text-foreground">{breakdowns[skill]?.[d]?.final ?? BASE_DC[d]}</span>
                      </span>
                    ))}
                    <ChevronDown size={12} className={`text-muted-foreground transition ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-border/60 px-2.5 py-2">
                    {DIFFICULTIES.map((d) => (
                      <div key={d} className="mb-1.5">
                        <DCBadge skill={skill} diff={d} breakdown={breakdowns[skill]?.[d]} onLock={lockDC} />
                        {breakdowns[skill]?.[d]?.modifiers?.length > 0 && (
                          <div className="ml-10 flex flex-wrap gap-1">
                            {breakdowns[skill][d].modifiers.map((m, i) => (
                              <span key={i} className={`rounded px-1 py-0.5 text-[9px] ${m.value < 0 ? 'bg-green-500/10 text-green-600 dark:text-green-300' : m.value > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                {m.label} {m.value > 0 ? '+' : ''}{m.value}
                              </span>
                            ))}
                          </div>
                        )}
                        {breakdowns[skill]?.[d] && (
                          <p className="ml-10 text-[9px] text-muted-foreground">Base {breakdowns[skill][d].base} → Final {breakdowns[skill][d].final}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Checks */}
      {suggested.length > 0 && (
        <div className="mb-3 rounded-xl border border-border p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Eye size={12} />Suggested Checks</p>
          <ul className="space-y-1">
            {suggested.map((s, i) => (
              <li key={i} className="rounded-lg bg-muted/40 px-2 py-1 text-xs">
                <span className="font-medium text-foreground">{s.skill}</span>
                <span className="text-muted-foreground"> — {s.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Information Tiers — DM Only */}
      {Object.keys(tiers).length > 0 && (
        <div className="mb-3 rounded-xl border border-border bg-muted/20 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><KeyRound size={12} />Information Tiers <span className="text-destructive">— DM Only</span></p>
          <div className="space-y-2">
            {Object.entries(tiers).map(([skill, t]) => (
              <div key={skill} className="rounded-lg border border-border/60 p-2">
                <p className="mb-1 text-xs font-semibold text-brand">{skill}</p>
                <div className="space-y-1">
                  {DIFFICULTIES.map((d) => (
                    <div key={d} className="flex gap-1.5 text-[11px]">
                      <span className="w-12 shrink-0 text-muted-foreground">{DIFF_LABELS[d]} DC{breakdowns[skill]?.[d]?.final ?? BASE_DC[d]}:</span>
                      <span className="text-foreground">{t[d]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learned Information */}
      <div className="grid gap-3">
        <div className="rounded-xl border border-border p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><BookOpen size={12}/>Learned Information</p>
          {learned.length ? (
            <ul className="space-y-1">{learned.map((l, i) => <li key={i} className="rounded-lg bg-muted/40 px-2 py-1 text-xs text-foreground">{l}</li>)}</ul>
          ) : <p className="text-xs italic text-muted-foreground">Nothing recorded yet.</p>}
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><KeyRound size={12}/>Revealed Secrets</p>
          {secrets.length ? (
            <ul className="space-y-1">{secrets.map((s, i) => <li key={i} className="rounded-lg bg-muted/40 px-2 py-1 text-xs text-foreground">{s}</li>)}</ul>
          ) : <p className="text-xs italic text-muted-foreground">None revealed.</p>}
        </div>
        {summary && (
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><ScrollText size={12}/>Session Summary</p>
            <p className="text-xs leading-6 text-foreground">{summary}</p>
          </div>
        )}
      </div>
    </section>
  );
}