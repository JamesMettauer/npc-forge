// Maps kinds of conversation-revealed information to the NPC's actual structured
// fields, and marks which fields are rules-sensitive (never auto-applied).
export const PROFILE_FIELDS = [
  { key: 'nicknames', label: 'Nicknames / Titles' },
  { key: 'pronouns', label: 'Pronouns' },
  { key: 'age', label: 'Age' },
  { key: 'species', label: 'Species / Lineage', sensitive: true },
  { key: 'homeland', label: 'Homeland' },
  { key: 'region', label: 'Region' },
  { key: 'culture', label: 'Culture' },
  { key: 'languages', label: 'Languages' },
  { key: 'accent', label: 'Accent / Dialect' },
  { key: 'speaking_style', label: 'Speech Patterns' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'role', label: 'NPC Role' },
  { key: 'faction', label: 'Faction / Affiliation' },
  { key: 'class_name', label: 'Adventuring Class', sensitive: true },
  { key: 'subclass', label: 'Subclass', sensitive: true },
  { key: 'level', label: 'Class Level', sensitive: true },
  { key: 'alignment', label: 'Alignment', sensitive: true },
  { key: 'physical_description', label: 'Appearance' },
  { key: 'clothing_equipment', label: 'Clothing' },
  { key: 'distinguishing_features', label: 'Distinguishing Features / Scars' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'personality_traits', label: 'Personality Traits' },
  { key: 'ideals', label: 'Ideals' },
  { key: 'bonds', label: 'Bonds' },
  { key: 'flaws', label: 'Flaws' },
  { key: 'mannerisms', label: 'Habits & Mannerisms' },
  { key: 'likes_dislikes', label: 'Likes / Dislikes' },
  { key: 'fears', label: 'Fears' },
  { key: 'goals', label: 'Motivations / Goals' },
  { key: 'objectives', label: 'Short-term Objectives' },
  { key: 'current_problems', label: 'Current Needs' },
  { key: 'secrets', label: 'Secrets' },
  { key: 'relationships', label: 'Relationships' },
  { key: 'backstory', label: 'Backstory' },
  { key: 'world_knowledge', label: 'Knowledge / Locations' },
  { key: 'services', label: 'Services Offered' },
  { key: 'quests_rumors', label: 'Quest Hooks' },
  { key: 'location', label: 'Current Location' },
];

export const FIELD_LABEL = (key) => PROFILE_FIELDS.find(f => f.key === key)?.label || key;
export const isSensitive = (key) => !!PROFILE_FIELDS.find(f => f.key === key)?.sensitive;

export const UPDATE_MODES = [
  { id: 'review', label: 'Review Every Update' },
  { id: 'auto_fill', label: 'Automatically Fill Empty Fields' },
  { id: 'auto_safe', label: 'Automatically Apply Safe Updates' },
  { id: 'notes_only', label: 'Conversation Notes Only' },
  { id: 'disabled', label: 'Disabled' },
];

export const DEFAULT_MODE = 'auto_fill';