import { base44 } from '@/api/base44Client';

const EXCLUDE = ['id', 'created_date', 'updated_date', 'created_by_id', 'profile_history', 'profile_backups', 'default_snapshot'];

const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const snapshotProfile = (npc) => {
  const snap = {};
  for (const k of Object.keys(npc || {})) if (!EXCLUDE.includes(k)) snap[k] = npc[k];
  return snap;
};

const cleanSnapshot = (snap) => {
  const out = { ...snap };
  for (const k of EXCLUDE) delete out[k];
  return out;
};

const fetchConversations = (npcId) => base44.entities.Conversation.filter({ npc_id: npcId }, '-created_date');

export const saveDefaultSnapshot = async (npc) => {
  const snap = snapshotProfile(npc);
  return base44.entities.NPC.update(npc.id, { default_snapshot: snap });
};

export const createBackup = async (npc, scope, by = 'DM') => {
  const backup = { id: newId(), date: new Date().toISOString(), scope, by, snapshot: snapshotProfile(npc) };
  return base44.entities.NPC.update(npc.id, { profile_backups: [...(npc.profile_backups || []), backup] });
};

export const resetConversationOnly = async (convoId) => {
  if (!convoId) return;
  await base44.entities.Message.deleteMany({ conversation_id: convoId });
  await base44.entities.Conversation.update(convoId, { learned_information: [], revealed_secrets: [], pending_updates: [], rejected_updates: [], check_results: [], summary: '', mood: 'neutral', attitude: 'neutral', scene: '', objective: '', relationship_score: 0, trust: 20, fear: 0, respect: 10, hostility: 0, intelligence: {} });
};

export const resetMoodRelationship = async (npc) => {
  const list = await fetchConversations(npc.id);
  for (const c of list) {
    await base44.entities.Conversation.update(c.id, { mood: 'neutral', attitude: 'neutral', scene: '', objective: '', relationship_score: 0, trust: 20, fear: 0, respect: 10, hostility: 0 });
  }
};

export const resetLearnedDetails = async (npc) => {
  const list = await fetchConversations(npc.id);
  for (const c of list) {
    await base44.entities.Conversation.update(c.id, { learned_information: [], revealed_secrets: [], pending_updates: [], rejected_updates: [] });
  }
};

export const resetPortraitScene = async (npc) => {
  const snap = npc.default_snapshot || {};
  const updates = {};
  if (snap.portrait_url !== undefined) updates.portrait_url = snap.portrait_url;
  if (snap.image_prompt !== undefined) updates.image_prompt = snap.image_prompt;
  let updatedNpc = npc;
  if (Object.keys(updates).length) updatedNpc = await base44.entities.NPC.update(npc.id, updates);
  const list = await fetchConversations(npc.id);
  for (const c of list) await base44.entities.Conversation.update(c.id, { mood: 'neutral', scene: '', attitude: 'neutral' });
  return updatedNpc;
};

export const completeReset = async (npc) => {
  const snap = npc.default_snapshot;
  if (!snap) throw new Error('No default snapshot');
  const updatedNpc = await base44.entities.NPC.update(npc.id, cleanSnapshot(snap));
  const list = await fetchConversations(npc.id);
  for (const c of list) {
    await base44.entities.Message.deleteMany({ conversation_id: c.id });
    await base44.entities.Conversation.update(c.id, { learned_information: [], revealed_secrets: [], pending_updates: [], rejected_updates: [], check_results: [], summary: '', mood: 'neutral', attitude: 'neutral', scene: '', objective: '', relationship_score: 0, trust: 20, fear: 0, respect: 10, hostility: 0, intelligence: {} });
  }
  return updatedNpc;
};

export const restoreBackup = async (npc, backupId) => {
  const backup = (npc.profile_backups || []).find((b) => b.id === backupId);
  if (!backup) throw new Error('Backup not found');
  return base44.entities.NPC.update(npc.id, cleanSnapshot(backup.snapshot));
};