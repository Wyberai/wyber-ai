import type { Locale } from './locales'

type Dict = Record<string, Record<string, string>>

// Server-safe counterpart to useT (useT.ts) — no hook/context, because these
// callers (locale-prefixed SEO pages under app/[locale]/...) get their locale
// from a static route param known at build time, not from LocaleProvider's
// client context. Same fallback chain: current locale -> English -> the raw
// key itself, so a missing/partial translation never renders blank.
export function getT<D extends Dict>(dict: D, locale: Locale) {
  return (key: keyof D['en'] & string): string => dict[locale]?.[key] ?? dict.en[key] ?? key
}
