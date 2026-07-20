'use client';
import { createContext, useContext, useState } from 'react';
import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, LOCALE_STORAGE_KEY, isLocale, type Locale } from './locales';

const LocaleCtx = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

// One-year cookie so a returning visit resolves the locale server-side
// (see layout.tsx) without waiting on a client tick or a DB round-trip.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// Mirrors ThemeProvider (src/lib/theme.tsx): a plain, Supabase-unaware
// context. Callers that know a Supabase profile exists (Settings, Dashboard)
// persist to profiles.preferred_locale themselves alongside calling setLocale.
export function LocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale && isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l);
      document.cookie = `${LOCALE_COOKIE_KEY}=${l};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
    } catch {}
  };

  return <LocaleCtx.Provider value={{ locale, setLocale }}>{children}</LocaleCtx.Provider>;
}

export const useLocale = () => useContext(LocaleCtx);
