'use client';
import { createContext, useContext, useEffect, useState } from 'react';
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
//
// `initialLocale` is NOT read from a cookie in the root layout — calling
// cookies() there forced every marketing/blog/docs page in the app into
// dynamic rendering (Next's app router treats any cookies()/headers() read
// in the render tree as opting the whole route out of static generation),
// which regressed dozens of static pages that have nothing to do with the
// authenticated app's locale. Instead this stays static-friendly: SSR always
// starts from DEFAULT_LOCALE, and a client-only effect reconciles from
// localStorage right after mount — a one-frame flash to English for a
// returning India user who picked hi/kn/te/ta, in exchange for every
// anonymous/marketing page staying statically prerendered.
export function LocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale && isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE);

  useEffect(() => {
    if (initialLocale) return; // caller already knows the right locale server-side (Dashboard/Settings/Editor)
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(stored) && stored !== locale) setLocaleState(stored);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
