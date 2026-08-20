import { base44 } from '@/api/base44Client';

export const DEFAULT_ORDER = ['attention', 'ledger', 'npcs', 'conversations', 'quickactions', 'news', 'search'];

export const DEFAULT_STATE = {
  theme_id: 'guildmaster',
  mobile_view: 'scene',
  reduce_motion: false,
  ambience_enabled: true,
  volume: 0.3,
  layouts: {},
  news_hidden: false,
  read_news: [],
  tutorial_dismissed: false,
};

export async function loadDashboardState() {
  try {
    const list = await base44.entities.DashboardState.filter({}, '-updated_date', 1);
    if (list.length) return { ...DEFAULT_STATE, ...list[0] };
    const created = await base44.entities.DashboardState.create(DEFAULT_STATE);
    return { ...DEFAULT_STATE, ...created };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveDashboardState(state) {
  try {
    const payload = { ...state };
    delete payload.id; delete payload.created_date; delete payload.updated_date; delete payload.created_by_id;
    if (state.id) return await base44.entities.DashboardState.update(state.id, payload);
    const created = await base44.entities.DashboardState.create(payload);
    return { ...DEFAULT_STATE, ...created };
  } catch {
    return state;
  }
}

export function getLayout(state, themeId) {
  const t = themeId || state.theme_id;
  const lay = state.layouts?.[t] || {};
  return {
    order: lay.order && lay.order.length ? lay.order : DEFAULT_ORDER,
    hidden: lay.hidden || [],
    locked: lay.locked || [],
  };
}

export function setLayout(state, themeId, partial) {
  const t = themeId || state.theme_id;
  const current = getLayout(state, t);
  const next = { ...current, ...partial };
  return { ...state, layouts: { ...(state.layouts || {}), [t]: next } };
}

const PRIORITY_RANK = { urgent: 0, needs_review: 1, informational: 2 };

// Derive DM attention items from real data (no new entities required yet).
export function deriveAttention({ conversations, npcs, campaigns }) {
  const items = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const npcIds = new Set((npcs || []).map((n) => n.id));
  for (const c of conversations || []) {
    if (!c.active) continue;
    if (!npcIds.has(c.npc_id)) continue;
    const pending = (c.pending_updates || []).filter((u) => u.status !== 'rejected').length;
    if (pending > 0) {
      items.push({
        id: `pending-${c.id}`,
        type: 'profile_updates',
        priority: 'urgent',
        title: `${c.npc_name || 'NPC'}: ${pending} pending profile update${pending > 1 ? 's' : ''}`,
        description: 'Review conversation-extracted profile changes before they pile up.',
        to: `/roleplay/${c.npc_id}`,
        actionLabel: 'Review Updates',
      });
    }
    const age = c.updated_date ? now - new Date(c.updated_date).getTime() : 0;
    if (!c.summary && (pending > 0 || age > dayMs)) {
      items.push({
        id: `summary-${c.id}`,
        type: 'summary',
        priority: 'needs_review',
        title: `${c.npc_name || 'NPC'}: conversation needs a summary`,
        description: 'This conversation has run without a summary. Generate notes for your campaign.',
        to: `/roleplay/${c.npc_id}`,
        actionLabel: 'Summarize',
      });
    }
  }
  const activeCount = (conversations || []).filter((c) => c.active).length;
  if (activeCount > 0) {
    items.push({
      id: 'active-conversations',
      type: 'info',
      priority: 'informational',
      title: `${activeCount} active conversation${activeCount > 1 ? 's' : ''}`,
      description: 'NPCs are ready to continue roleplay.',
      to: '/conversations',
      actionLabel: 'Open Conversations',
    });
  }
  const npcCount = (npcs || []).filter((n) => !n.archived).length;
  if (npcCount === 0) {
    items.push({
      id: 'no-npcs',
      type: 'onboarding',
      priority: 'informational',
      title: 'Your desk is empty',
      description: 'Forge your first NPC to begin populating the world.',
      to: '/create',
      actionLabel: 'Create NPC',
    });
  }
  return items.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

export function timeSince(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}