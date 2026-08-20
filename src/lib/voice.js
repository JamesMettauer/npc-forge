import { base44 } from '@/api/base44Client';

export const VOICE_FIELDS = [
  { key: 'speaking_style', label: 'Speaking style', desc: 'Overall manner of speech.' },
  { key: 'vocabulary', label: 'Vocabulary level', desc: 'Simple, common, educated, archaic, etc.' },
  { key: 'accent', label: 'Accent or dialect influence', desc: 'Regional, cultural, or species accent.' },
  { key: 'expressions', label: 'Common expressions', desc: 'Catchphrases, idioms, verbal tics.' },
  { key: 'avoided_topics', label: 'Topics avoided', desc: 'Subjects the NPC steers away from.' },
  { key: 'conditional_information', label: 'Conditions for revealing information', desc: 'When the NPC shares sensitive details.' },
];

export const VOICE_PROFILE_FIELDS = [
  'speaking_style', 'vocabulary', 'accent', 'expressions', 'avoided_topics', 'conditional_information',
];

const clean = (v) => (v == null || typeof v === 'object' ? '' : String(v).trim());
const has = (v) => !!clean(v);

const BOUNDARY_KEYS = ['avoided_topics', 'conditional_information'];

const FACT_PRIORITY = `FACT PRIORITY (highest to lowest — generated content must be consistent with and must not contradict higher-priority facts):
1. Guild Master decisions
2. Locked character facts
3. Approved Character Contract facts
4. Accepted Personality / Traits
5. Homeland
6. Culture
7. Established occupation / role
8. Character-specific generated flavor`;

const SPECIES_GUARDRAIL = `SPECIES GUARDRAIL: Species is background information only. Do NOT infer profession, education, accent, speech texture, culture, personality, or life history from Species. Only use species-derived details if they were separately established for this individual. For example, a species with gray stone-like skin and a dense build does NOT imply stonemasonry, mining knowledge, subterranean ancestry, gravelly speech, emotional stoicism, or particular vocabulary.`;

const COMMUNICATION_LATITUDE = `COMMUNICATION FLAVOR (speaking_style, vocabulary, accent, expressions): These fields may contain modest character-specific flavor consistent with established facts. Homeland + Culture may inform vocabulary, idioms, cadence, social conventions, and common regional/professional references (e.g., a coastal merchant culture may support harbor-trade vocabulary, merchant idioms, and references to tides, cargo, schedules, and prices). An established personality trait may inform speech patterns (e.g., a punctual character may reference schedules, hours, tides, bells). Homeland and Culture must NOT establish a specific occupation, job history, rank, organization membership, or biography unless that fact already exists in the Character Contract — "coastal merchant culture" does NOT automatically make someone a ship's quartermaster, sailor, dockmaster, naval officer, or former ship crew. Do NOT present invented cultural or species lore as established fact.`;

const DIALECT_GUARDRAIL = `DIALECT & INFLUENCE: Use Homeland, Culture, profession, social environment, and education/status when established. Prefer cadence, idioms, word choice, and professional terminology. AVOID unsupported biological voice qualities, invented ancestry, phonetic caricature, and species-derived accents. Do NOT use exaggerated phonetic spelling unless explicitly requested.`;

const BOUNDARY_GUARDRAIL = `CONVERSATION BOUNDARIES (avoided_topics, conditional_information): These are behavioral rules that may affect future roleplay and social checks, so they require STRONGER evidence than ordinary dialogue flavor. Do NOT invent trauma, secrets, taboos, fears, distrust, sensitive subjects, bribery triggers, trust conditions, reveal thresholds, or relationship requirements unless supported by established Character Contract facts. If insufficient established information exists, LEAVE THE FIELD EMPTY (return an empty string). An empty boundary is valid — do not generate content merely because the field exists. A boundary may be suggested only when an established fact clearly supports it (e.g., an established bond to protect a hidden family member → "Reluctant to discuss the family member's location"). Reveal conditions should describe meaningful social or relationship circumstances (established trust, proven loyalty, shared faction membership, successful relevant social interaction, a particular relationship state, or direct Guild Master instruction) — do NOT invent arbitrary transactional triggers such as "give him a sundial and he reveals information."`;

const buildProfile = (npc) => {
  const n = npc || {};
  const lines = [];
  if (n.homeland) lines.push(`Homeland: ${n.homeland}`);
  if (n.region) lines.push(`Region: ${n.region}`);
  if (n.culture) lines.push(`Culture: ${n.culture}`);
  if (n.occupation) lines.push(`Role/Occupation: ${n.occupation}`);
  if (n.class_name) lines.push(`Class: ${n.class_name}`);
  if (n.age) lines.push(`Age: ${n.age}`);
  if (n.personality_traits) lines.push(`Primary personality: ${n.personality_traits}`);
  if (n.faction) lines.push(`Faction: ${n.faction}`);
  if (n.campaign) lines.push(`Campaign setting: ${n.campaign}`);
  if (n.species) lines.push(`Species (background only — do not infer profession, accent, speech texture, culture, personality, or life history from this): ${n.species}`);
  return lines.join('\n');
};

export const generateVoiceField = async (npc, fieldKey) => {
  const f = VOICE_FIELDS.find((x) => x.key === fieldKey);
  if (!f) return null;
  const isBoundary = BOUNDARY_KEYS.includes(fieldKey);
  const guardrails = isBoundary
    ? `${FACT_PRIORITY}\n${SPECIES_GUARDRAIL}\n${BOUNDARY_GUARDRAIL}`
    : `${FACT_PRIORITY}\n${SPECIES_GUARDRAIL}\n${COMMUNICATION_LATITUDE}\n${DIALECT_GUARDRAIL}`;
  const emptyInstruction = isBoundary
    ? ' If insufficient established information supports this boundary, return an empty string ("").'
    : '';
  const prompt = `Generate the "${f.label}" for a fantasy tabletop RPG NPC. ${f.desc} Make it specific to this NPC's homeland, region, culture, role, personality, and campaign setting. Keep it concise (one short paragraph or a few phrases). Write in third person.${emptyInstruction}\n\n${guardrails}\n\nNPC profile:\n${buildProfile(npc) || 'A generic fantasy NPC'}\n\nReturn JSON with key "${fieldKey}" (string; may be empty if this is a boundary field with no supporting evidence).`;
  const schema = { type: 'object', properties: { [fieldKey]: { type: 'string' } }, required: [fieldKey] };
  try {
    const data = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    return data?.[fieldKey] || null;
  } catch { return null; }
};

export const generateCompleteVoiceProfile = async (npc) => {
  const prompt = `Generate a complete, internally consistent Communication Profile for a fantasy tabletop RPG NPC. Produce values for: speaking_style, vocabulary, accent (dialect & influence), expressions (signature expressions), avoided_topics (topics avoided), conditional_information (conditions for revealing information).

${FACT_PRIORITY}

${SPECIES_GUARDRAIL}

${COMMUNICATION_LATITUDE}

${DIALECT_GUARDRAIL}

${BOUNDARY_GUARDRAIL}

Keep each field concise. Write in third person. For avoided_topics and conditional_information, return an empty string ("") if no established fact supports them — an empty boundary is valid and preferred over invention.

NPC profile:
${buildProfile(npc) || 'A generic fantasy NPC'}

Return JSON with keys: speaking_style, vocabulary, accent, expressions, avoided_topics, conditional_information (all strings; boundary fields may be empty).`;
  const schema = {
    type: 'object',
    properties: Object.fromEntries(VOICE_PROFILE_FIELDS.map((k) => [k, { type: 'string' }])),
    required: VOICE_PROFILE_FIELDS,
  };
  try {
    return await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
  } catch { return null; }
};

export const TEST_SAMPLES = {
  neutral: 'Welcome, traveler. What brings you here?',
  friendly: 'You look like you could use a warm meal and better company.',
  suspicious: 'That is an unusual question. Why do you need to know?',
  urgent: 'Move now. We can argue once we are out of danger.',
};

// Browser speech synthesis fallback. Returns a controller with stop().
export const speak = (text, opts = {}) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (opts.rate) u.rate = Math.max(0.5, Math.min(2, opts.rate));
  if (opts.pitch) u.pitch = Math.max(0, Math.min(2, opts.pitch));
  if (opts.voice) {
    const voices = synth.getVoices();
    const match = voices.find((v) => v.name === opts.voice);
    if (match) u.voice = match;
  }
  if (typeof opts.onEnd === 'function') u.onend = opts.onEnd;
  synth.speak(u);
  return { stop: () => synth.cancel() };
};

export const getVoices = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().map((v) => v.name);
};

export const voiceAvailable = () => typeof window !== 'undefined' && !!window.speechSynthesis;

// The installed Base44 SDK has no speech-generation integration. Keep the
// capability truthful and let the UI fall back to browser speech synthesis.
export const generateStudioSpeech = async () => null;
