import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getTheme, themeStyles } from '@/lib/dashboardThemes';
import { loadDashboardState, saveDashboardState, getLayout, setLayout, deriveAttention, DEFAULT_ORDER, DEFAULT_STATE } from '@/lib/dashboardState';
import AmbientLayer from '@/components/dashboard/AmbientLayer';
import DashboardThemePicker from '@/components/dashboard/DashboardThemePicker';
import DMAttention from '@/components/dashboard/DMAttention';
import CampaignLedger from '@/components/dashboard/CampaignLedger';
import NpcCardStack from '@/components/dashboard/NpcCardStack';
import ActiveConversations from '@/components/dashboard/ActiveConversations';
import QuickActions from '@/components/dashboard/QuickActions';
import NewsPanel from '@/components/dashboard/NewsPanel';
import GlobalSearch from '@/components/dashboard/GlobalSearch';
import DiceModal from '@/components/dashboard/DiceModal';
import InviteModal from '@/components/dashboard/InviteModal';
import DeskScene from '@/components/dashboard/DeskScene';
import CompactDashboard from '@/components/dashboard/CompactDashboard';
import { Layout, Eye, EyeOff, Volume2, VolumeX, Sparkles, Save, RotateCcw, X, GripVertical, Library, Search } from 'lucide-react';

export default function Dashboard() {
  const [npcs, setNpcs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [arrange, setArrange] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const [snoozed, setSnoozed] = useState([]);
  const [showInventory, setShowInventory] = useState(false);
  const savedRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [n, c, cv, st] = await Promise.all([
          base44.entities.NPC.filter({ archived: false }, '-updated_date', 50),
          base44.entities.Campaign.list('-updated_date'),
          base44.entities.Conversation.filter({}, '-updated_date', 50),
          loadDashboardState(),
        ]);
        setNpcs(n); setCampaigns(c); setConversations(cv); setState(st); savedRef.current = st;
      } catch {}
      setLoading(false);
    })();
  }, []);

  const theme = getTheme(state.theme_id);
  const styles = themeStyles(theme);
  const layout = getLayout(state, state.theme_id);
  const attention = deriveAttention({ conversations, npcs, campaigns });

  const persist = (next) => { setState(next); saveDashboardState(next); savedRef.current = next; };

  const onThemeChange = (id) => persist({ ...state, theme_id: id });
  const onMobileView = (v) => persist({ ...state, mobile_view: v });
  const onReduceMotion = (v) => persist({ ...state, reduce_motion: v });
  const onAmbience = (v) => persist({ ...state, ambience_enabled: v });
  const onMarkNewsRead = (ids) => persist({ ...state, read_news: [...new Set([...(state.read_news || []), ...ids])] });
  const onHideNews = () => persist({ ...state, news_hidden: true });
  const onRestoreNews = () => persist({ ...state, news_hidden: false });

  const enterArrange = () => { setSnapshot(state); setArrange(true); };
  const cancelArrange = () => { if (snapshot) { setState(snapshot); } setArrange(false); };
  const saveArrange = () => { persist(state); setArrange(false); };
  const onReorder = (order) => setState((s) => setLayout(s, s.theme_id, { order }));
  const onToggleHide = (id) => {
    setState((s) => {
      const lay = getLayout(s, s.theme_id);
      const hidden = lay.hidden.includes(id) ? lay.hidden.filter((x) => x !== id) : [...lay.hidden, id];
      return setLayout(s, s.theme_id, { hidden });
    });
  };
  const onToggleLock = (id) => {
    setState((s) => {
      const lay = getLayout(s, s.theme_id);
      const locked = lay.locked.includes(id) ? lay.locked.filter((x) => x !== id) : [...lay.locked, id];
      return setLayout(s, s.theme_id, { locked });
    });
  };
  const onResetLayout = () => {
    const next = setLayout(state, state.theme_id, { order: DEFAULT_ORDER, hidden: [], locked: [] });
    setState(next);
  };

  const reloadConversations = async () => {
    try { setConversations(await base44.entities.Conversation.filter({}, '-updated_date', 50)); } catch {}
  };

  // Build object nodes. News respects news_hidden unless in arrange mode.
  const objects = {
    attention: { label: 'DM Attention', node: <DMAttention items={attention} dismissed={dismissed} snoozed={snoozed} onSnooze={(id) => setSnoozed((s) => [...s, id])} onResolve={(id) => setDismissed((d) => [...d, id])} theme={theme} styles={styles} /> },
    ledger: { label: 'Campaign Ledger', node: <CampaignLedger campaigns={campaigns} npcs={npcs} conversations={conversations} theme={theme} styles={styles} /> },
    npcs: { label: 'NPC Cards', node: <NpcCardStack npcs={npcs} theme={theme} styles={styles} /> },
    conversations: { label: 'Active Conversations', node: <ActiveConversations conversations={conversations} npcs={npcs} theme={theme} styles={styles} onUpdated={reloadConversations} /> },
    quickactions: { label: 'Desk Tools', node: <QuickActions onInvite={() => setInviteOpen(true)} onDice={() => setDiceOpen(true)} theme={theme} styles={styles} /> },
    news: { label: 'News & Updates', node: <NewsPanel state={state} onMarkRead={onMarkNewsRead} onHide={onHideNews} theme={theme} styles={styles} /> },
    search: { label: 'Global Search', node: <SearchSummon theme={theme} styles={styles} onOpen={() => setSearchOpen(true)} /> },
  };

  // Hide news if news_hidden (unless arrange mode so it can be restored).
  const effectiveHidden = (!arrange && state.news_hidden) ? [...layout.hidden, 'news'] : layout.hidden;

  if (loading) {
    return <div className="grid min-h-screen place-items-center" style={styles.backdrop}><div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" /></div>;
  }

  const isCompact = state.mobile_view === 'compact';

  return (
    <div className="min-h-screen">
      {/* Top control bar — fixed, predictable location */}
      <div className="sticky top-0 z-40 border-b backdrop-blur" style={{ background: 'rgba(0,0,0,0.55)', borderColor: theme.panelBorder }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
          <h1 className="flex items-center gap-2 text-sm font-bold text-white"><Sparkles size={16} style={{ color: theme.accent }} /> DM Command Center</h1>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <DashboardThemePicker themeId={state.theme_id} onChange={onThemeChange} />
            <button onClick={() => onMobileView(isCompact ? 'scene' : 'compact')} title="Toggle view" className="flex items-center gap-1 rounded-md border border-white/20 px-2 py-1 text-xs text-white"><Layout size={12}/>{isCompact ? 'Scene' : 'Compact'}</button>
            <button onClick={() => onReduceMotion(!state.reduce_motion)} title="Reduce motion" className="grid h-7 w-7 place-items-center rounded-md border border-white/20 text-white" aria-pressed={state.reduce_motion}><Eye size={13}/></button>
            <button onClick={() => onAmbience(!state.ambience_enabled)} title="Ambience" className="grid h-7 w-7 place-items-center rounded-md border border-white/20 text-white">{state.ambience_enabled ? <Volume2 size={13}/> : <VolumeX size={13}/>}</button>
            {!arrange ? (
              <button onClick={enterArrange} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold" style={styles.accentBtn}><GripVertical size={12}/>Arrange</button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="rounded-md bg-amber-500 px-2 py-1 text-xs font-bold text-black">Arrange Mode</span>
                <button onClick={onResetLayout} className="flex items-center gap-1 rounded-md border border-white/20 px-2 py-1 text-xs text-white"><RotateCcw size={12}/>Reset</button>
                <button onClick={() => setShowInventory((s) => !s)} className="flex items-center gap-1 rounded-md border border-white/20 px-2 py-1 text-xs text-white"><Library size={12}/>Inventory</button>
                <button onClick={cancelArrange} className="flex items-center gap-1 rounded-md border border-white/20 px-2 py-1 text-xs text-white"><X size={12}/>Cancel</button>
                <button onClick={saveArrange} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold" style={styles.accentBtn}><Save size={12}/>Save</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desk Inventory (arrange mode) */}
      {arrange && showInventory && (
        <div className="sticky top-[49px] z-30 border-b bg-black/70 px-4 py-2">
          <p className="mb-1 text-xs font-semibold text-white">Desk Inventory — restore hidden objects</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_ORDER.map((id) => {
              const isHidden = layout.hidden.includes(id) || (id === 'news' && state.news_hidden);
              return (
                <button key={id} onClick={() => { if (id === 'news' && state.news_hidden) onRestoreNews(); else onToggleHide(id); }}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-white" style={{ borderColor: isHidden ? theme.accent : 'rgba(255,255,255,0.2)', opacity: isHidden ? 1 : 0.5 }}>
                  {isHidden ? <Eye size={11}/> : <EyeOff size={11}/>}{objects[id]?.label || id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scene or Compact */}
      {isCompact ? (
        <CompactDashboard objects={objects} order={layout.order} hidden={effectiveHidden} theme={theme} styles={styles} onSearch={() => setSearchOpen(true)} />
      ) : (
        <div className={`relative ${state.reduce_motion ? 'desk-reduce-motion' : ''}`}>
          <AmbientLayer theme={theme} reduceMotion={state.reduce_motion || !state.ambience_enabled} />
          <DeskScene theme={theme} styles={styles} reduceMotion={state.reduce_motion} arrange={arrange} order={layout.order} hidden={effectiveHidden} locked={layout.locked} objects={objects} onReorder={onReorder} onToggleHide={onToggleHide} onToggleLock={onToggleLock} />
        </div>
      )}

      {/* Modals */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} npcs={npcs} campaigns={campaigns} conversations={conversations} />
      <DiceModal open={diceOpen} onClose={() => setDiceOpen(false)} />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} campaigns={campaigns} />
    </div>
  );
}

const SEARCH_FLAVOR = {
  guildmaster: 'Search the Guild Index',
  wizard: 'Consult the Spectral Librarian',
  warroom: 'Consult the Royal Archives',
  tavern: 'Ask the Informant',
};

function SearchSummon({ theme, styles, onOpen }) {
  return (
    <section aria-label="Global search" className="rounded-xl p-4" style={styles.panel}>
      <h2 className="mb-2 text-lg font-bold" style={{ color: theme.ink }}>Search</h2>
      <button onClick={onOpen} aria-label="Search NPC Forge" title="Search NPC Forge"
        className="flex w-full items-center justify-center gap-2 rounded-lg p-4 text-sm font-semibold transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand"
        style={styles.accentBtn}>
        <Search size={16} aria-hidden="true" /> Search NPC Forge
      </button>
      {SEARCH_FLAVOR[theme.id] && (
        <p className="mt-1.5 text-center text-xs italic" style={{ color: theme.muted }}>{SEARCH_FLAVOR[theme.id]}</p>
      )}
      <p className="mt-2 text-center text-xs" style={{ color: theme.muted }}>Search NPCs, campaigns, players, quests, conversations, notes, and other NPC Forge content.</p>
    </section>
  );
}
