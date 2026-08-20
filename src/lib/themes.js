export const THEMES = [
  { id: 'tavern', name: 'Tavern', dark: true, swatch: ['#241e16', '#3a2c1c', '#c9a227'] },
  { id: 'guild-hall', name: 'Guild Hall', dark: false, swatch: ['#f3ecdd', '#e6dcc4', '#9c6b3f'] },
  { id: 'arcane-library', name: 'Arcane Library', dark: true, swatch: ['#1a1d2e', '#26304a', '#8b7cf6'] },
  { id: 'royal-court', name: 'Royal Court', dark: true, swatch: ['#2a1620', '#3a2230', '#d4a843'] },
  { id: 'wilderness-camp', name: 'Wilderness Camp', dark: true, swatch: ['#1a2418', '#243024', '#c2823a'] },
  { id: 'classic-dark', name: 'Classic Dark', dark: true, swatch: ['#1c1916', '#25221e', '#d9b455'] },
  { id: 'classic-light', name: 'Classic Light', dark: false, swatch: ['#f6f2ea', '#fdfbf6', '#b07a2c'] },
];

export const DEFAULT_THEME = 'classic-dark';

export const getTheme = (id) => THEMES.find(t => t.id === id) || THEMES.find(t => t.id === DEFAULT_THEME);