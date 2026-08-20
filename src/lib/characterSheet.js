import { base44 } from '@/api/base44Client';
import { SKILLS } from './dice';

const ABILITY_SCORES = {
  Strength: 'str_score', Dexterity: 'dex_score', Constitution: 'con_score',
  Intelligence: 'int_score', Wisdom: 'wis_score', Charisma: 'cha_score',
};

export const abilityModifier = (score) => Math.floor((Number(score || 10) - 10) / 2);

export const getModifierForSkill = (character, skill) => {
  if (!character || !skill) return 0;
  const sd = character.skill_details;
  if (sd && sd[skill] && typeof sd[skill].modifier === 'number') return sd[skill].modifier;
  const ability = SKILLS[skill]?.ability;
  if (!ability) return 0;
  const scoreKey = ABILITY_SCORES[ability];
  const score = character[scoreKey];
  if (!score) return 0;
  const mod = abilityModifier(score);
  const proficiencies = (character.skill_proficiencies || '').toLowerCase();
  const profList = proficiencies.split(/[,\s]+/).filter(Boolean);
  const isProficient = profList.some(p => p === skill.toLowerCase());
  const profBonus = character.proficiency_bonus || 2;
  return mod + (isProficient ? profBonus : 0);
};

let _cache = null;
let _cacheTime = 0;

export const listCharacters = async (forceRefresh = false) => {
  const now = Date.now();
  if (_cache && !forceRefresh && now - _cacheTime < 30000) return _cache;
  try {
    _cache = await base44.entities.PlayerCharacter.list();
    _cacheTime = now;
    return _cache;
  } catch {
    return [];
  }
};

export const findCharacterByName = async (name) => {
  if (!name) return null;
  const list = await listCharacters();
  return list.find(c => c.name.toLowerCase() === name.toLowerCase().trim()) || null;
};

export const clearCache = () => { _cache = null; _cacheTime = 0; };