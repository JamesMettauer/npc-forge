import { base44 } from '@/api/base44Client';
import { arrayOf, isRecord, isString, stringValue } from '@/lib/runtimeTypes';
import { SKILLS, degreeOfOutcome, generateCheckNarrative } from './dice';

const rollD20 = () => 1 + Math.floor(Math.random() * 20);

export const npcSkillModifier = (npc, skill) => {
  const ability = SKILLS[skill]?.ability;
  if (!ability) return 0;
  const sheet = npc?.sheet || {};
  const scoreMap = {
    Strength: sheet.str_score, Dexterity: sheet.dex_score, Constitution: sheet.con_score,
    Intelligence: sheet.int_score, Wisdom: sheet.wis_score, Charisma: sheet.cha_score,
  };
  const score = scoreMap[ability];
  if (!score) return 0;
  const mod = Math.floor((score - 10) / 2);
  const skillsStr = (npc?.skills || sheet?.skill_proficiencies || '').toLowerCase();
  const isProficient = skillsStr.includes(skill.toLowerCase());
  const profBonus = npc?.proficiency_bonus || 2;
  return mod + (isProficient ? profBonus : 0);
};

export const evaluateAction = async ({ npc, convo, actionText, mode, recentContext }) => {
  const profile = JSON.stringify({
    name: npc?.name, personality_traits: npc?.personality_traits, ideals: npc?.ideals,
    bonds: npc?.bonds, flaws: npc?.flaws, fears: npc?.fears, goals: npc?.goals,
    secrets: npc?.secrets, observable_symptoms: npc?.observable_symptoms,
    hidden_condition: npc?.hidden_condition, temperament: npc?.temperament,
    social_behavior: npc?.social_behavior,
  });
  const social = JSON.stringify({
    trust: convo?.trust, fear: convo?.fear, respect: convo?.respect,
    hostility: convo?.hostility, attitude: convo?.attitude, mood: convo?.mood,
  });
  const scene = convo?.scene || npc?.location || '';
  const prompt = `You are a D&D 5e Dungeon Master's assistant. A player described an action. Analyze whether a skill check is appropriate and suggest the most relevant skill.

NPC: ${profile}
Social state: ${social}
Scene: ${scene}
Player action (${mode}): "${actionText}"
Recent context: ${recentContext || ''}

Determine:
- actingCharacter: the name of the player character performing the action, extracted from the action text (e.g., "John tells Millie..." → "John"). Empty string if no specific character name is mentioned.
- checkRequired: "none" (the action simply works — normal conversation, buying ordinary goods, asking a simple question — no meaningful failure possible), "optional" (a check could reveal extra info but is not necessary), or "required" (success/failure meaningfully matters)
- If a check is needed, suggest the ONE most relevant skill (primarySkill) with a reason
- Suggest 0-2 genuinely relevant alternatives — do NOT include generic Perception/Investigation unless specifically warranted by the action
- For the primary skill, suggest base difficulty: "easy" (10), "medium" (15), or "hard" (20)
- List situational DC adjustments (e.g., {label:"Visible symptoms", value:-2})
- If the NPC would actively resist or evaluate the player's action (Deception vs Insight, Stealth vs Perception, SleightOfHand vs Perception), set opposedCheck to {skill, reason}. Do NOT set opposedCheck for normal conversation, simple questions, or routine transactions — only when the NPC has a reason to actively scrutinize or resist.
- npcShouldNotice: true if the NPC would plausibly notice
- reasoning: one sentence

Important: Do not suggest checks or NPC rolls for routine social interactions (greetings, basic questions, buying goods at listed prices). Only suggest checks when the outcome is uncertain and meaningful. NPC Forge never rolls dice for player characters — the DM always supplies the player's result.

Valid skills: ${Object.keys(SKILLS).join(', ')}

Return JSON matching the schema.`;

  const schema = {
    type: 'object',
    properties: {
      actingCharacter: { type: 'string' },
      checkRequired: { type: 'string', enum: ['none', 'optional', 'required'] },
      primarySkill: { type: 'string' },
      primaryReason: { type: 'string' },
      primaryDifficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
      adjustments: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'number' } } } },
      alternatives: { type: 'array', items: { type: 'object', properties: { skill: { type: 'string' }, reason: { type: 'string' } } } },
      opposedCheck: { type: 'object', properties: { skill: { type: 'string' }, reason: { type: 'string' } } },
      npcShouldNotice: { type: 'boolean' },
      reasoning: { type: 'string' },
    },
    required: ['checkRequired', 'reasoning'],
  };
  try {
    return await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
  } catch {
    return { actingCharacter: '', checkRequired: 'optional', primarySkill: '', primaryReason: '', reasoning: 'Could not analyze action.', adjustments: [], alternatives: [] };
  }
};

export const resolveCheck = async ({ npc, convo, skill, character, modifier, d20s, kept, total, advantage, disadvantage, finalDc, difficulty, hideDc, opposedCheck, recentContext }) => {
  let opposedResult = null;
  let effectiveDc = finalDc;
  if (opposedCheck) {
    const npcMod = npcSkillModifier(npc, opposedCheck.skill);
    const npcD20 = rollD20();
    const npcTotal = npcD20 + npcMod;
    opposedResult = { skill: opposedCheck.skill, modifier: npcMod, d20: npcD20, total: npcTotal, won: total >= npcTotal };
    if (effectiveDc == null) {
      effectiveDc = npcTotal;
    }
  }
  const degree = effectiveDc != null ? degreeOfOutcome(total, effectiveDc, d20s, null) : { degree: 'narrative', label: 'Narrative' };
  const narrativeResult = await generateCheckNarrative({
    npc, convo, skill, total, dc: effectiveDc || 0, degree, character, recentContext,
  });
  const narrative = isRecord(narrativeResult) ? narrativeResult : {};
  return {
    skill, character: character || '', modifier: modifier || 0,
    d20s: d20s || [], kept: kept ?? total, total,
    advantage: !!advantage, disadvantage: !!disadvantage,
    final_dc: effectiveDc, difficulty, degree: degree.degree, degree_label: degree.label,
    findings: arrayOf(narrative.findings, isString), revealed_to_player: arrayOf(narrative.revealedToPlayer, isString),
    npc_reaction: stringValue(narrative.npcReaction), social_changes: isRecord(narrative.socialChanges) ? narrative.socialChanges : {},
    opposed_result: opposedResult, hide_dc: !!hideDc, visibility: 'DM Only', timestamp: new Date().toISOString(),
  };
};
