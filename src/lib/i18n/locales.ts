// India-only locale switcher. Gated entirely by the same IP-country signal
// that already decides INR vs USD (see lib/region.ts) — a non-India visitor
// never sees this, never renders these strings, and the switcher itself only
// mounts when the page is passed isIndia=true from the server.
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
