import { base44 } from '@/api/base44Client';
import { PROFILE_FIELDS, isSensitive } from './profileFields';
import { PERSONALITY_FIELDS, addEntryToField } from './personality';

const PLACEHOLDER = /^(unknown|none|not set|n\/a|unspecified|\s*)$/i;

export const isEmptyValue = (v) => v == null || String(v).trim() === '' || PLACEHOLDER.test(String(v).trim());

const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const dedupKey = (u) => `${u.field}::${(u.proposed_value || '').toLowerCase().trim()}`;

export const tagUpdates = (raw, source) => (raw || []).map((u) => ({
  ...u,
  id: newId(),
  source: source || '',
  status: 'pending',
  created_date: new Date().toISOString(),
}));

// Ask the LLM to propose structured profile updates from a single exchange.
export const extractProfileUpdates = async (npc, exchange) => {
  const fieldList = PROFILE_FIELDS.map((f) => `${f.key}${f.sensitive ? ' (rules-sensitive)' : ''}`).join(', ');
  const profileSnapshot = PROFILE_FIELDS.map((f) => `${f.key}: ${npc[f.key] ?? ''}`).join('\n');
  let data;
  try {
    data = await base44.integrations.Core.InvokeLLM({
      prompt: `You analyze a D&D roleplay exchange and propose structured updates to the NPC's profile fields. Only propose updates based on what the NPC reveals or confirms about ITSELF.

NPC current profile:
${profileSnapshot}

Latest exchange:
${exchange}

Valid target field keys: ${fieldList}

Rules:
- Player claims, accusations, jokes, or assumptions are NOT NPC facts; classify them "player_claim" or "unconfirmed" and do not propose them as confirmed.
- Map each detail to the single best field key. One statement may yield several updates.
- Never propose changes to rules-sensitive fields (species, class_name, subclass, level, alignment) as confirmed; if mentioned, classify "unconfirmed".
- Avoid duplicates: if the field already holds the information, propose "expand"/"refine" only with genuine new detail, else omit.
- temporary=true for current mood, current injury, weapon drawn, current location, short-term goal, current scene. temporary=false for homeland, occupation, family, lasting scar, long-term motivation, established trait, faction, permanent equipment, backstory event.
- update_type: fill (empty field), add (new detail to existing list), expand, refine, correct, replace, move.
- confidence: high | medium | low.
- classification: confirmed_fact | likely_fact | temporary | opinion | player_claim | rumor | contradiction | unconfirmed | dm_instruction.
- proposed_value: concise profile entry text, not dialogue.

Return JSON { "updates": [ { "field": "<key>", "field_label": "<label>", "current_value": "<existing or empty>", "proposed_value": "<value>", "update_type": "<type>", "confidence": "<level>", "classification": "<class>", "reason": "<short>", "temporary": <bool> } ] }. If nothing useful, return { "updates": [] }.`,
      response_json_schema: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' }, field_label: { type: 'string' },
                current_value: { type: 'string' }, proposed_value: { type: 'string' },
                update_type: { type: 'string' }, confidence: { type: 'string' },
                classification: { type: 'string' }, reason: { type: 'string' },
                temporary: { type: 'boolean' },
              },
            },
          },
        },
      },
    });
  } catch { return null; }
  return (data && data.updates) || [];
};

// Fields that track the live conversation state — always kept current automatically.
const CURRENT_STATE_FIELDS = ['location', 'objectives', 'current_problems', 'current_expression', 'current_pose', 'current_visible_equipment', 'current_background', 'current_lighting', 'current_injury'];

// Decide whether an update auto-applies under the current mode.
export const autoApplyDecision = (update, mode) => {
  if (!mode || mode === 'disabled' || mode === 'notes_only' || mode === 'review') return null;
  if (isSensitive(update.field)) return null;
  const cls = update.classification;
  const isCurrentState = !!update.temporary || CURRENT_STATE_FIELDS.includes(update.field);
  // Live conversation state (current location, short-term goal, current need, injury) tracks automatically.
  if (isCurrentState && ['confirmed_fact', 'likely_fact', 'temporary'].includes(cls)) return 'apply';
  if (!['confirmed_fact', 'likely_fact'].includes(cls)) return null;
  // Confirmed/likely facts about the NPC (including refinements to existing fields) apply automatically.
  if (mode === 'auto_fill') return update.confidence === 'high' ? 'apply' : null;
  if (mode === 'auto_safe') return 'apply';
  return null;
};

// Apply an update to the NPC entity and record a profile-history entry.
export const applyUpdateToNpc = async (npc, update, approvedBy = 'DM') => {
  const prev = npc[update.field] ?? '';
  const raw = update.proposed_value;
  const val = (raw == null || String(raw).trim() === '' || ['null', 'undefined'].includes(String(raw).trim().toLowerCase())) ? '' : String(raw).trim();
  let next;
  if (PERSONALITY_FIELDS.includes(update.field)) {
    if ((update.update_type === 'add' || update.update_type === 'expand') && !isEmptyValue(prev)) {
      next = addEntryToField(prev, val);
    } else {
      next = val;
    }
  } else if ((update.update_type === 'add' || update.update_type === 'expand') && !isEmptyValue(prev)) {
    next = `${prev}\n${val}`;
  } else {
    next = val;
  }
  const entry = {
    id: newId(), field: update.field, field_label: update.field_label, previous_value: String(prev),
    new_value: next, update_type: update.update_type, source: update.source || '',
    confidence: update.confidence, date: new Date().toISOString(), approved_by: approvedBy,
    temporary: !!update.temporary,
  };
  const updated = await base44.entities.NPC.update(npc.id, {
    [update.field]: next,
    profile_history: [...(npc.profile_history || []), entry],
  });
  return { npc: updated, entry };
};

// Undo a history entry by restoring its previous value.
export const undoHistoryEntry = async (npc, entryId) => {
  const history = npc.profile_history || [];
  const entry = history.find((h) => h.id === entryId);
  if (!entry) return npc;
  const undoEntry = {
    id: newId(), field: entry.field, field_label: entry.field_label,
    previous_value: entry.new_value, new_value: entry.previous_value,
    update_type: 'undo', source: 'DM undo', confidence: 'high',
    date: new Date().toISOString(), approved_by: 'DM', temporary: false,
  };
  return base44.entities.NPC.update(npc.id, {
    [entry.field]: entry.previous_value || '',
    profile_history: [...history, undoEntry],
  });
};