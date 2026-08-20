import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTemplateData, extractTemplateData } from '../src/lib/npcTemplate.js';

const prohibited = {
  id: 'npc-1', name: 'Unique Name', nicknames: 'Unique Nickname', pronouns: 'she/her', age: '47',
  campaign: 'Campaign Name', campaign_id: 'campaign-1', current_expression: 'afraid', current_injury: 'wounded',
  portrait_url: 'portrait.png', portrait_candidates: [{ url: 'candidate.png' }], portrait_variants: [{ url: 'variant.png' }],
  profile_history: [{ id: 'history-1' }], profile_backups: [{ id: 'backup-1' }], default_snapshot: { name: 'Old Name' },
  original_creation_prompt: 'private provenance', prompt_sources: { source: 'private' }, prompt_meta: { generated: ['name'] },
  temporary: true, archived: true, created_by_id: 'user-1', created_date: 'yesterday', updated_date: 'today',
};

test('template extraction retains reusable fields and rejects instance fields', () => {
  const payload = extractTemplateData({ ...prohibited, mode: 'combat', species: 'Elf', class_name: 'Ranger', tactics: 'Ambush' });
  assert.deepEqual(payload, { mode: 'combat', species: 'Elf', class_name: 'Ranger', tactics: 'Ambush' });
  for (const field of Object.keys(prohibited)) assert.equal(field in payload, false, `${field} must not enter a template`);
});

test('template application preserves fresh identity defaults and filters unsafe legacy data', () => {
  const fresh = { name: '', pronouns: '', campaign: '', campaign_id: '', archived: false, temporary: false, mode: 'roleplay' };
  const created = applyTemplateData(fresh, { ...prohibited, mode: 'combat', species: 'Dwarf', armor_class: 16 });
  assert.equal(created.name, '');
  assert.equal(created.pronouns, '');
  assert.equal(created.campaign_id, '');
  assert.equal(created.archived, false);
  assert.equal(created.temporary, false);
  assert.equal(created.portrait_url, undefined);
  assert.equal(created.profile_history, undefined);
  assert.equal(created.mode, 'combat');
  assert.equal(created.species, 'Dwarf');
  assert.equal(created.armor_class, 16);
});

test('blank creation defaults are unchanged when no template data is supplied', () => {
  const fresh = { name: '', mode: 'roleplay', archived: false };
  assert.deepEqual(applyTemplateData(fresh, null), fresh);
});
