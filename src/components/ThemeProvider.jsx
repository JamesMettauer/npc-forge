import { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { THEMES, DEFAULT_THEME, getTheme } from '@/lib/themes';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }){
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    return localStorage.getItem('lorekeeper_theme') || DEFAULT_THEME;
  });

  useEffect(() => {
    const t = getTheme(theme);
    const root = document.documentElement;
    root.dataset.theme = theme;
    if (t.dark) root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('lorekeeper_theme', theme);
  }, [theme]);

  // Restore a logged-in user's saved theme on first load.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ok = await base44.auth.isAuthenticated();
        if (!ok) return;
        const u = await base44.auth.me();
        if (mounted && u && u.theme && u.theme !== theme) setTheme(u.theme);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const changeTheme = async (id) => {
    setTheme(id);
    try {
      const ok = await base44.auth.isAuthenticated();
      if (ok) await base44.auth.updateMe({ theme: id });
    } catch {}
  };

  return <ThemeContext.Provider value={{ theme, setTheme: changeTheme, themes: THEMES }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
