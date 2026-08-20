import { base44 } from '@/api/base44Client';

const SHEET_KEYS = [
  'size_type', 'disposition', 'hp_current', 'initiative', 'passive_perception',
  'str_score', 'dex_score', 'con_score', 'int_score', 'wis_score', 'cha_score',
  'str_save_prof', 'dex_save_prof', 'con_save_prof', 'int_save_prof', 'wis_save_prof', 'cha_save_prof',
  'skill_proficiencies', 'languages_senses', 'resistances_immunities',
  'attack_1_name', 'attack_1_bonus', 'attack_1_damage', 'attack_1_notes',
  'attack_2_name', 'attack_2_bonus', 'attack_2_damage', 'attack_2_notes',
  'attack_3_name', 'attack_3_bonus', 'attack_3_damage', 'attack_3_notes',
  'actions_reactions', 'features_traits', 'spellcasting', 'equipment',
];

const TOP_KEYS = ['armor_class', 'hit_points', 'speed', 'proficiency_bonus'];

/** Generate a coherent D&D 5e stat block from the NPC's identity info. */
export async function generateSheetStats(npc) {
  const ctx = {
    name: npc.name, species: npc.species, class_name: npc.class_name, subclass: npc.subclass,
    level: npc.level, challenge_rating: npc.challenge_rating,
    occupation: npc.occupation || npc.role, alignment: npc.alignment, faction: npc.faction,
    background_role: npc.sheet?.background_role, size_type: npc.sheet?.size_type,
    npc_build_type: npc.npc_build_type, power_level: npc.power_level,
    existing_ability_scores: npc.ability_scores, existing_equipment: npc.equipment,
  };

  const prompt = `Generate a complete, internally consistent D&D 5e NPC stat block. Every field must be consistent with the character's species, class or role, level/challenge rating, and background. Use standard D&D 5e rules.

Rules:
- Ability scores are integers from 3 to 20. A commoner/farmer/merchant should have scores around 8-12; a trained soldier 12-16; an elite hero 16-20.
- Proficiency bonus by level: 1-4 = +2, 5-8 = +3, 9-12 = +4, 13-16 = +5, 17-20 = +6. For CR-based monsters, use CR (CR 0-3 ≈ +2, CR 4-7 ≈ +3, etc.).
- Saving throw proficiencies should match the class (Fighter: STR/CON, Wizard: INT/WIS, Rogue: DEX/INT, Cleric: WIS/CHA, etc.). Non-classed NPCs get 0-1 save proficiencies.
- skill_proficiencies: a readable list like "Perception +5, Stealth +6, Investigation +4". Give 2-4 skills appropriate to the role.
- languages_senses: like "Common, Goblin; Darkvision 60 ft." Include species-appropriate senses.
- resistances_immunities: only if the species/role warrants it (e.g. fire resistance for a fire creature). Otherwise empty string.
- Attacks: 1-3 attacks with name, bonus (e.g. "+5"), damage (e.g. "1d8+3 slashing"), and notes. A commoner may have 0-1 attacks; a soldier 1-2; a monster 2-3. Leave unused attack slots as empty strings.
- actions_reactions: special actions, bonus actions, reactions as multiline text. Empty string if none.
- features_traits: racial traits, class abilities, special features as multiline text.
- spellcasting: ONLY if the class/role casts spells (Wizard, Cleric, Warlock, Druid, Bard, Sorcerer, Paladin, Ranger, or a monster with innate spellcasting). Include spellcasting ability, save DC, attack bonus, cantrips, and a few spells by level. Empty string otherwise.
- equipment: a readable inventory list appropriate to the role and wealth. A farmer has simple tools; a soldier has weapons and armor; a noble has fine clothes and money.
- Do NOT generate notes (those are DM-only and manual).

Character context: ${JSON.stringify(ctx)}`;

  const schema = {
    type: 'object',
    properties: {
      armor_class: { type: 'number' },
      hit_points: { type: 'number' },
      speed: { type: 'string' },
      proficiency_bonus: { type: 'number' },
      size_type: { type: 'string' },
      disposition: { type: 'string' },
      str_score: { type: 'number' }, dex_score: { type: 'number' }, con_score: { type: 'number' },
      int_score: { type: 'number' }, wis_score: { type: 'number' }, cha_score: { type: 'number' },
      str_save_prof: { type: 'boolean' }, dex_save_prof: { type: 'boolean' }, con_save_prof: { type: 'boolean' },
      int_save_prof: { type: 'boolean' }, wis_save_prof: { type: 'boolean' }, cha_save_prof: { type: 'boolean' },
      skill_proficiencies: { type: 'string' },
      languages_senses: { type: 'string' },
      resistances_immunities: { type: 'string' },
      attack_1_name: { type: 'string' }, attack_1_bonus: { type: 'string' }, attack_1_damage: { type: 'string' }, attack_1_notes: { type: 'string' },
      attack_2_name: { type: 'string' }, attack_2_bonus: { type: 'string' }, attack_2_damage: { type: 'string' }, attack_2_notes: { type: 'string' },
      attack_3_name: { type: 'string' }, attack_3_bonus: { type: 'string' }, attack_3_damage: { type: 'string' }, attack_3_notes: { type: 'string' },
      actions_reactions: { type: 'string' },
      features_traits: { type: 'string' },
      spellcasting: { type: 'string' },
      equipment: { type: 'string' },
    },
    required: ['str_score', 'dex_score', 'con_score', 'int_score', 'wis_score', 'cha_score', 'skill_proficiencies', 'languages_senses', 'features_traits', 'equipment'],
  };

  return await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
}

/** Merge generated stats into an NPC record, preserving any manually-set notes. */
export function mergeGeneratedStats(npc, result) {
  if (!result) return npc;
  const newSheet = { ...(npc.sheet || {}) };
  for (const k of SHEET_KEYS) {
    const v = result[k];
    if (v !== undefined && v !== null && v !== '') newSheet[k] = v;
  }
  const newNpc = { ...npc, sheet: newSheet };
  for (const k of TOP_KEYS) {
    const v = result[k];
    if (v !== undefined && v !== null && v !== '') newNpc[k] = v;
  }
  return newNpc;
}