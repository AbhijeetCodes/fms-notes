import { useState, useEffect, useCallback } from 'react';

// The inline script in index.html applies the theme before first paint;
// this hook keeps it in sync afterwards. No saved choice = follow the OS.
const KEY = 'theme';
const query = window.matchMedia('(prefers-color-scheme: dark)');
const THEME_COLOR = { light: '#66001f', dark: '#17100f' };

function systemTheme() {
  return query.matches ? 'dark' : 'light';
}

function savedTheme() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLOR[theme];
}

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || savedTheme() || systemTheme());

  useEffect(() => { apply(theme); }, [theme]);

  // Follow OS changes while the user hasn't picked a theme themselves
  useEffect(() => {
    const onChange = () => { if (!savedTheme()) setTheme(systemTheme()); };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      // Toggling back to the OS theme clears the override, so OS changes apply again
      try {
        if (next === systemTheme()) localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, next);
      } catch { /* private mode — theme just won't persist */ }
      return next;
    });
  }, []);

  return { theme, toggle };
}
