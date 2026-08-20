// Dashboard launch themes — visual presets for the DM desk scene.
// Each theme provides inline-style strings so Tailwind's purge never strips them.

export const DASHBOARD_THEMES = [
  {
    id: 'guildmaster',
    name: "Guildmaster's Desk",
    description: 'Warm guild hall, heavy wooden desk, brass trim, parchment correspondence.',
    backdrop: 'radial-gradient(120% 90% at 50% 0%, #3a2a1c 0%, #241812 55%, #160f0a 100%)',
    desk: 'repeating-linear-gradient(90deg, #5a3f28 0px, #4d3520 2px, #5a3f28 4px), linear-gradient(180deg, #5a3f28, #3a2616)',
    deskShadow: '0 -8px 24px rgba(0,0,0,0.5), inset 0 2px 0 rgba(180,140,80,0.25)',
    panelBg: 'linear-gradient(180deg, #f3e6c8, #e8d6ad)',
    panelBorder: '#c9a96b',
    panelShadow: '0 6px 18px rgba(20,12,4,0.45), inset 0 0 0 1px rgba(180,140,80,0.4)',
    ink: '#3a2a1a',
    muted: '#7a6448',
    accent: '#b08d57',
    accentInk: '#1c130a',
    font: 'font-serif',
    ambient: { type: 'embers', label: 'Fireplace embers' },
    seal: '#9a2a2a',
  },
  {
    id: 'wizard',
    name: "Wizard's Tower",
    description: 'Arcane study, floating books, glowing runes, magical crystals, starry windows.',
    backdrop: 'radial-gradient(120% 100% at 50% 10%, #1a1a3a 0%, #12122e 50%, #08081a 100%)',
    desk: 'linear-gradient(180deg, #2a2a4a, #1a1a36)',
    deskShadow: '0 -8px 30px rgba(80,80,200,0.15), inset 0 2px 0 rgba(139,124,246,0.3)',
    panelBg: 'linear-gradient(180deg, rgba(30,30,60,0.92), rgba(22,22,46,0.92))',
    panelBorder: 'rgba(139,124,246,0.5)',
    panelShadow: '0 0 24px rgba(99,102,241,0.18), inset 0 0 0 1px rgba(139,124,246,0.35)',
    ink: '#d4d4f0',
    muted: '#9090c0',
    accent: '#8b7cf6',
    accentInk: '#0c0c20',
    font: 'font-display',
    ambient: { type: 'stars', label: 'Drifting arcane motes' },
    seal: '#6366f1',
  },
  {
    id: 'warroom',
    name: 'Royal War Room',
    description: 'Strategic map table, campaign banners, sealed military orders, noble materials.',
    backdrop: 'radial-gradient(120% 90% at 50% 0%, #3a1414 0%, #240c0c 55%, #140606 100%)',
    desk: 'linear-gradient(180deg, #4a2828, #2a1414)',
    deskShadow: '0 -8px 24px rgba(0,0,0,0.5), inset 0 2px 0 rgba(201,162,39,0.25)',
    panelBg: 'linear-gradient(180deg, #f5ecd6, #e8d8b0)',
    panelBorder: '#c9a227',
    panelShadow: '0 6px 18px rgba(20,8,8,0.5), inset 0 0 0 1px rgba(201,162,39,0.5)',
    ink: '#2a1a1a',
    muted: '#7a5a3a',
    accent: '#c9a227',
    accentInk: '#1a0c0c',
    font: 'font-serif',
    ambient: { type: 'dust', label: 'Tactical map dust' },
    seal: '#8a1a1a',
  },
  {
    id: 'tavern',
    name: 'Tavern Backroom',
    description: 'Private tavern office, candlelight, scratched wooden table, hidden ledgers.',
    backdrop: 'radial-gradient(120% 100% at 50% 0%, #2a1c10 0%, #1a1208 55%, #0e0904 100%)',
    desk: 'repeating-linear-gradient(90deg, #3a2818 0px, #321f10 3px, #3a2818 6px), linear-gradient(180deg, #3a2818, #241608)',
    deskShadow: '0 -8px 22px rgba(0,0,0,0.55), inset 0 2px 0 rgba(212,160,74,0.2)',
    panelBg: 'linear-gradient(180deg, #3a2818, #2a1c10)',
    panelBorder: '#5a3a20',
    panelShadow: '0 6px 16px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(212,160,74,0.25)',
    ink: '#f0e6d2',
    muted: '#a88a5a',
    accent: '#d4a04a',
    accentInk: '#1a1004',
    font: 'font-serif',
    ambient: { type: 'candle', label: 'Candlelight flicker' },
    seal: '#8a6a2a',
  },
];

export const DEFAULT_THEME_ID = 'guildmaster';

export function getTheme(id) {
  return DASHBOARD_THEMES.find((t) => t.id === id) || DASHBOARD_THEMES[0];
}

// Inline style objects for a given theme.
export function themeStyles(theme) {
  return {
    backdrop: { backgroundImage: theme.backdrop, backgroundAttachment: 'fixed' },
    desk: { backgroundImage: theme.desk, boxShadow: theme.deskShadow },
    panel: {
      backgroundImage: theme.panelBg,
      border: `1px solid ${theme.panelBorder}`,
      boxShadow: theme.panelShadow,
      color: theme.ink,
    },
    accentBtn: { background: theme.accent, color: theme.accentInk },
    sealBadge: { background: theme.seal },
  };
}