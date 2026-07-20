// India-only locale switcher. Gated entirely by the same IP-country signal
// that already decides INR vs USD (see lib/region.ts) — a non-India visitor
// never sees this, never renders these strings, and the switcher itself only
// mounts when the page is passed isIndia=true from the server.

// Temporary kill switch: the hi/kn/te/ta translations aren't fully wired
// through every surface yet, so the toggle is hidden and locale is pinned to
// English everywhere until the remaining work resumes. Flip back to `true`
// to re-enable — all the translation infra/dictionaries stay intact either
// way, this only gates visibility + whether a stored locale is honored.
export const I18N_ENABLED = false;

export const LOCALES = ['en', 'hi', 'kn', 'te', 'ta'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  kn: 'ಕನ್ನಡ',
  te: 'తెలుగు',
  ta: 'தமிழ்',
};

// BCP-47 codes for the Web Speech API (VoiceButton) — same locale keys used
// for text, so picking a language once covers typing and voice input both.
export const LOCALE_SPEECH_CODE: Record<Locale, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  kn: 'kn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
};

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'wyber-locale';
// Same key doubles as the cookie name — one identifier, two storage layers
// (localStorage for instant client reads, cookie so server components can
// resolve the locale for SSR without a DB round-trip).
export const LOCALE_COOKIE_KEY = LOCALE_STORAGE_KEY;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

// The locale-prefixed static routes (app/[locale]/...) only ever generate
// hi/kn/te/ta — English keeps its existing unprefixed URLs (/blog/x, not
// /en/blog/x) so there's zero disruption to current backlinks/SEO equity.
// See src/app/[locale]/README or the vs/[competitor] route for the pattern.
export const NON_ENGLISH_LOCALES = LOCALES.filter(l => l !== 'en') as Exclude<Locale, 'en'>[];
