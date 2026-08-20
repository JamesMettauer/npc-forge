import { base44 } from '@/api/base44Client';

export const SKILLS = {
  Medicine: { ability: 'Wisdom' },
  Insight: { ability: 'Wisdom' },
  Perception: { ability: 'Wisdom' },
  Survival: { ability: 'Wisdom' },
  AnimalHandling: { ability: 'Wisdom' },
  Persuasion: { ability: 'Charisma' },
  Deception: { ability: 'Charisma' },
  Intimidation: { ability: 'Charisma' },
  Performance: { ability: 'Charisma' },
  Investigation: { ability: 'Intelligence' },
  Arcana: { ability: 'Intelligence' },
  History: { ability: 'Intelligence' },
  Nature: { ability: 'Intelligence' },
  Religion: { ability: 'Intelligence' },
  SleightOfHand: { ability: 'Dexterity' },
  Acrobatics: { ability: 'Dexterity' },
  Stealth: { ability: 'Dexterity' },
  Athletics: { ability: 'Strength' },
};

export const SKILL_LIST = Object.keys(SKILLS);

const LABELS = {
  Medicine: 'Examine physical symptoms',
  Insight: "Read the NPC's intent",
  Investigation: 'Search for clues',
  Perception: 'Notice details',
  Persuasion: 'Persuade the NPC',
  Intimidation: 'Pressure the NPC',
  Deception: 'Mislead the NPC',
  Arcana: 'Interpret arcane signs',
  Religion: 'Identify religious elements',
  Nature: 'Read natural details',
  Survival: 'Read wilderness signs',
  AnimalHandling: 'Calm or direct an animal',
  History: 'Recall history',
  SleightOfHand: 'Act unseen',
  Performance: 'Perform',
  Athletics: 'Attempt a feat of strength',
  Acrobatics: 'Attempt an acrobatic feat',
  Stealth: 'Hide or move quietly',
};

const REASONS = {
  Medicine: 'Observable physical symptoms may reveal additional information to someone trained in Medicine.',
  Insight: "The NPC's behavior may hide something an Insight check could pick up.",
  Investigation: 'Physical clues in the scene may reward an Investigation check.',
  Perception: 'Subtle details may be caught with a Perception check.',
  Persuasion: 'A Persuasion check could help convince the NPC.',
  Intimidation: 'An Intimidation check could pressure the NPC.',
  Deception: 'A Deception check could let you mislead the NPC.',
  Arcana: 'Arcane signs in the scene may be understood with an Arcana check.',
  Religion: 'Religious elements may be identified with a Religion check.',
  Nature: 'Natural details may be read with a Nature check.',
  Survival: 'Wilderness signs may be read with a Survival check.',
  AnimalHandling: "An animal's behavior may be influenced with an Animal Handling check.",
  History: 'Historical references may be recalled with a History check.',
  SleightOfHand: 'A Sleight of Hand check could let you act unseen.',
};

const KEYWORDS = {
  Medicine: ['tremor', 'tremors', 'cough', 'coughing', 'wound', 'injur', 'bleed', 'sick', 'illness', 'disease', 'fever', 'pale', 'exhaust', 'fatigue', 'faint', 'dizzy', 'nausea', 'scar', 'limp', 'shak', 'wheez', 'sweat', 'clammy', 'vomit', 'poison', 'struggl to focus', 'difficulty focus'],
  Insight: ['lie', 'lying', 'liar', 'deceiv', 'evasiv', 'hide', 'hiding', 'truth', 'suspicious', 'nervous', 'twitch', 'avoid eye', 'secretive', 'hesitat', 'deflect', 'dodge'],
  Investigation: ['hidden', 'clue', 'search', 'examine', 'sign', 'scratch', 'note', 'letter', 'document', 'symbol', 'rune', 'trap', 'mechanism', 'lock', 'drawer', 'chest'],
  Perception: ['notice', 'spot', 'glimpse', 'shadow', 'movement', 'sound', 'noise', 'whisper', 'footstep', 'faint', 'barely', 'overlook'],
  Persuasion: ['convince', 'persuade', 'please', 'bargain', 'negotiate', 'appeal', 'sway', 'talk into'],
  Intimidation: ['threat', 'frighten', 'scare', 'intimidate', 'pressure', 'coerce', 'menace', 'demand', 'bully'],
  Deception: ['deceive', 'bluff', 'mislead', 'pretend', 'fabricate', 'false'],
  Arcana: ['arcane', 'magic', 'magical', 'spell', 'enchant', 'glyph', 'ward', 'portal', 'familiar', 'sorcer', 'wizard'],
  Religion: ['religious', 'holy', 'divine', 'sacred', 'prayer', 'blessing', 'rite', 'ritual', 'deity', 'temple', 'shrine', 'sermon', 'censer'],
  Nature: ['plant', 'herb', 'flower', 'tree', 'spore', 'fungus', 'bloom', 'moss', 'vine'],
  Survival: ['track', 'tracks', 'trail', 'wilderness', 'forage', 'hunt', 'camp', 'terrain', 'navigate'],
  AnimalHandling: ['animal', 'beast', 'mount', 'horse', 'hound', 'wolf', 'creature', 'tame', 'spook', 'buck'],
  History: ['ancient', 'ruin', 'legend', 'chronicle', 'archive', 'lineage', 'heraldry', 'bygone'],
  SleightOfHand: ['sleight', 'palm', 'pickpocket', 'pocket', 'steal', 'trinket', 'swap'],
};

const rollDie = (sides) => 1 + Math.floor(Math.random() * sides);

export const rollCheck = ({ modifier = 0, advantage = false, disadvantage = false, bonusDie = 0, tempMod = 0 }) => {
  const d20s = [rollDie(20)];
  if (advantage || disadvantage) d20s.push(rollDie(20));
  const kept = advantage ? Math.max(...d20s) : disadvantage ? Math.min(...d20s) : d20s[0];
  const bonus = bonusDie > 0 ? rollDie(bonusDie) : 0;
  const total = kept + modifier + bonus + tempMod;
  return { d20s, kept, modifier, bonusDie: bonusDie > 0 ? { sides: bonusDie, value: bonus } : null, tempMod, total };
};

export const tierForResult = (total) => {
  if (total < 10) return { label: 'Basic observation', tier: 0 };
  if (total <= 14) return { label: 'Useful observation', tier: 1 };
  if (total <= 19) return { label: 'Strong insight', tier: 2 };
  if (total <= 24) return { label: 'Detailed analysis', tier: 3 };
  return { label: 'Exceptional insight', tier: 4 };
};

const GENERIC_TIERS = [
  'You notice basic observable details, but the cause is unclear.',
  'You pick up useful details that suggest a pattern.',
  'You gain a strong insight into what is happening.',
  'You perform a detailed analysis of the situation.',
  'You gain exceptional insight, including likely causes and next steps.',
];

export const observedForTier = (npc, skill, tier) => {
  const tiers = npc?.information_tiers;
  if (tiers) {
    const parts = tiers.split(/\n|\||\*/).map((s) => s.trim()).filter(Boolean);
    if (parts[tier]) return parts[tier].replace(/^\d+(-\d+)?\s*:?\s*/, '');
    if (parts.length) return parts[Math.min(tier, parts.length - 1)].replace(/^\d+(-\d+)?\s*:?\s*/, '');
  }
  return GENERIC_TIERS[tier] || GENERIC_TIERS[0];
};

export const suggestChecks = (npc, latestNpcText) => {
  const text = `${npc?.observable_symptoms || ''} ${latestNpcText || ''}`.toLowerCase();
  if (!text.trim()) return [];
  const out = [];
  const seen = new Set();
  for (const [skill, words] of Object.entries(KEYWORDS)) {
    if (seen.has(skill)) continue;
    if (words.some((w) => text.includes(w))) {
      out.push({ skill, ability: SKILLS[skill].ability, label: LABELS[skill] || skill, reason: REASONS[skill] || 'A check may reveal more here.' });
      seen.add(skill);
    }
  }
  return out.slice(0, 3);
};

export const DC_MODES = ['Suggested DC with DM Approval', 'DM Sets DC', 'Automatic DC', 'Information Tiers Without a Single DC', 'Narrative Roll Without DC'];

export const VISIBILITY_MODES = ['Public', 'Player and DM', 'DM Only', 'Blind Roll'];

export const DC_BASELINES = { easy: 10, medium: 15, hard: 20 };
export const DIFFICULTY_OPTIONS = [['easy', 'Easy — DC 10'], ['medium', 'Medium — DC 15'], ['hard', 'Hard — DC 20']];
const DIFFICULTY_BY_SKILL = { Medicine: 'easy', Perception: 'easy', AnimalHandling: 'easy', Survival: 'easy', Insight: 'medium', Persuasion: 'medium', Deception: 'medium', Intimidation: 'medium', Performance: 'medium', Nature: 'medium', Religion: 'medium', Investigation: 'hard', Arcana: 'hard', History: 'hard', SleightOfHand: 'hard', Athletics: 'medium', Acrobatics: 'medium', Stealth: 'medium' };
export const defaultDifficulty = (skill) => DIFFICULTY_BY_SKILL[skill] || 'medium';
export const baseDCFor = (difficulty) => DC_BASELINES[difficulty] || 15;
export const suggestedDC = (skill) => baseDCFor(defaultDifficulty(skill));

export const SITUATIONAL_PRESETS = [
  { label: 'Very favorable', value: -5 },
  { label: 'Favorable', value: -2 },
  { label: 'Neutral', value: 0 },
  { label: 'Unfavorable', value: 2 },
  { label: 'Very unfavorable', value: 5 },
];

export const computeFinalDC = (base, modifiers) => base + (modifiers || []).reduce((s, m) => s + (Number(m.value) || 0), 0);

export const CRIT_SETTINGS = ['Natural 1 and 20 Affect Degree of Outcome', 'Natural 1 and 20 Are Normal Results', 'Use Campaign Rules'];

export const degreeOfOutcome = (total, dc, d20s, critSetting) => {
  const nat1 = d20s && d20s.includes(1);
  const nat20 = d20s && d20s.includes(20);
  const crits = !critSetting || critSetting === 'Natural 1 and 20 Affect Degree of Outcome';
  if (crits && nat1) return { degree: 'critical_failure', label: 'Critical Failure' };
  if (crits && nat20) return { degree: 'critical_success', label: 'Critical Success' };
  const margin = total - dc;
  if (margin <= -5) return { degree: 'major_failure', label: 'Major Failure' };
  if (margin < 0) return { degree: 'failure', label: 'Failure' };
  if (margin >= 10) return { degree: 'exceptional_success', label: 'Exceptional Success' };
  if (margin >= 5) return { degree: 'strong_success', label: 'Strong Success' };
  return { degree: 'success', label: 'Success' };
};

export const generateCheckNarrative = async ({ npc, convo, skill, total, dc, degree, character, recentContext }) => {
  const profile = JSON.stringify({
    name: npc?.name, species: npc?.species, personality_traits: npc?.personality_traits, ideals: npc?.ideals,
    bonds: npc?.bonds, flaws: npc?.flaws, fears: npc?.fears, mannerisms: npc?.mannerisms, goals: npc?.goals,
    secrets: npc?.secrets, observable_symptoms: npc?.observable_symptoms, hidden_condition: npc?.hidden_condition,
    information_tiers: npc?.information_tiers, temperament: npc?.temperament, social_behavior: npc?.social_behavior,
  });
  const social = JSON.stringify({ trust: convo?.trust, fear: convo?.fear, respect: convo?.respect, hostility: convo?.hostility, relationship_score: convo?.relationship_score });
  const prompt = `A D&D skill check was rolled against this NPC. Generate the concrete narrative outcome.

NPC profile: ${profile}
Current social state: ${social}
Skill: ${skill} | Roll total: ${total} | DC: ${dc} | Degree: ${degree?.label || ''}
Acting character: ${character || 'Unassigned'}
Recent context: ${recentContext || ''}

Rules:
- The Degree (${degree?.label || 'Narrative'}) determines the NPC's reaction: Critical/Major Failure means the NPC notices the attempt and reacts negatively (suspicion, anger, dismissal, or the action backfires); Failure means the NPC may sense something is off; Success means the action goes unnoticed or works as intended; Strong/Exceptional/Critical Success means the NPC is fully convinced, impressed, or caught off guard. The npcReaction MUST be consistent with this degree AND the NPC's current social state (trust ${convo?.trust ?? '?'}, fear ${convo?.fear ?? '?'}, respect ${convo?.respect ?? '?'}, hostility ${convo?.hostility ?? '?'}). A hostile or fearful NPC reacts differently than a trusting one to the same result.
- Reveal concrete findings specific to THIS NPC's established profile, motivations, fears, bonds, symptoms, and hidden information. Do NOT use generic text like "You perform a detailed analysis."
- Do not invent facts that contradict the NPC profile.
- The NPC's dialogue stays in character; a successful check reveals what the acting character learns, not necessarily what the NPC says aloud.
- For social skills (Persuasion, Intimidation, Deception, Performance), propose social-state changes (trust/fear/respect/hostility, each between -20 and +20) that reflect the degree: a critical failure on Deception increases hostility/fear; a strong success on Persuasion increases trust/respect. For non-social skills (Insight, Medicine, Investigation, Perception, Arcana, etc.), return zero changes unless the NPC notices and objects to the action.
- npcReaction: a short in-character reaction (1-2 sentences) showing how the NPC responds to the action, consistent with the degree and their current social state. Empty string ONLY if the check is fully covert AND successful.
- findings: 2-4 concise points of what the acting character learns.
- revealedToPlayer: the subset of findings safe to surface to the player.

Return JSON: { findings:[strings], npcReaction:string, revealedToPlayer:[strings], socialChanges:{trust:number,fear:number,respect:number,hostility:number} }`;
  const schema = {
    type: 'object',
    properties: {
      findings: { type: 'array', items: { type: 'string' } },
      npcReaction: { type: 'string' },
      revealedToPlayer: { type: 'array', items: { type: 'string' } },
      socialChanges: { type: 'object', properties: { trust: { type: 'number' }, fear: { type: 'number' }, respect: { type: 'number' }, hostility: { type: 'number' } } },
    },
    required: ['findings', 'npcReaction'],
  };
  try { return await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema }); }
  catch { return null; }
};