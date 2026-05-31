'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Always default to dark — Wyber AI is a dark product
    // Only respect explicit user choice stored in localStorage
    const saved = localStorage.getItem('wyber-theme') as Theme | null;
    const initial: Theme = saved === 'light' ? 'light' : 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
    // Never follow system preference — it causes unexpected theme switches
  }, []);

  const toggle = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('wyber-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
