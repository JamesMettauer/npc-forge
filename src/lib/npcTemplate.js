// NPC templates are reusable character-building foundations, not copies of
// character instances. Keep this allowlist shared by extraction and application
// so identity, campaign, runtime, portrait, provenance, and audit state cannot
// silently cross the template boundary.
export const NPC_TEMPLATE_FIELDS = Object.freeze([
  'mode',
  'species',
  'custom_species_data',
  'homeland',
  'region',
  'culture',
  'class_name',
  'subclass',
  'level',
  'alignment',
  'occupation',
  'faction',
  'physical_description',
  'clothing_equipment',
  'distinguishing_features',
  'art_style',
  'personality_traits',
  'ideals',
  'bonds',
  'flaws',
  'likes_dislikes',
  'fears',
  'mannerisms',
  'humor',
  'temperament',
  'social_behavior',
  'speaking_style',
  'vocabulary',
  'accent',
  'expressions',
  'avoided_topics',
  'conditional_information',
  'role',
  'services',
  'world_knowledge',
  'initial_attitude',
  'ally_status',
  'armor_class',
  'hit_points',
  'speed',
  'ability_scores',
  'saving_throws',
  'skills',
  'senses',
  'languages',
  'proficiency_bonus',
  'challenge_rating',
  'actions',
  'bonus_actions',
  'reactions',
  'traits',
  'spells',
  'equipment',
  'damage_defenses',
  'morale',
  'tactics',
  'npc_build_type',
  'power_level',
  'ruleset',
  'voice_profile',
  'primary_traits',
]);

const cloneValue = (value) => {
  if (value == null || typeof value !== 'object') return value;
  return structuredClone(value);
};

export const extractTemplateData = (npc) => {
  const source = npc && typeof npc === 'object' ? npc : {};
  return Object.fromEntries(
    NPC_TEMPLATE_FIELDS
      .filter((field) => source[field] !== undefined)
      .map((field) => [field, cloneValue(source[field])]),
  );
};

export const applyTemplateData = (baseNpc, templateData) => ({
  ...(baseNpc && typeof baseNpc === 'object' ? baseNpc : {}),
  ...extractTemplateData(templateData),
});
