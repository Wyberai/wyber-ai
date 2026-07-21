import { LOCALES, type Locale } from './locales'

const SITE = 'https://wyberai.com'

// Builds the `alternates.languages` map Next's generateMetadata expects, so
// Google sees every language variant of a page as intentional translations
// of each other (not duplicate content) — required alongside `canonical` for
// correct hreflang signaling. `path` is the UNPREFIXED path (e.g. "/vs/lovable");
// English resolves to that same unprefixed URL, every other locale gets the
// /{locale} prefix. Include an "x-default" pointing at English, per Google's
// own hreflang guidance, so a visitor whose browser locale doesn't match any
// of ours still lands somewhere sane.
export function localeAlternates(path: string): Record<string, string> {
  const clean = path.startsWith('/') ? path : `/${path}`
  const languages: Record<string, string> = { 'x-default': `${SITE}${clean}` }
  for (const l of LOCALES) {
    languages[l] = l === 'en' ? `${SITE}${clean}` : `${SITE}/${l}${clean}`
  }
  return languages
}

// Only these path SHAPES have a real src/app/[locale]/... route — every other
// page (home, pricing, signup, dashboard, login, …) has no locale-prefixed
// variant and translates client-side via LocaleProvider on its plain English
// URL instead. Prefixing a path outside this list produces a 404 — this bit
// everyone the first time: lp('/pricing'), lp('/signup'), and lp('/') were all
// being blindly prefixed on the locale build/use-cases/vs pages, breaking the
// nav Pricing link, the primary "Try free" signup CTA, and the logo/home link
// on every single non-English page. Keep in sync with the directories under
// src/app/[locale]/.
const LOCALE_ROUTE_PATTERNS: RegExp[] = [
  /^\/about\/?$/,
  /^\/build\/[^/]+\/?$/,
  /^\/use-cases\/[^/]+\/?$/,
  /^\/vs\/?$/,
  /^\/vs\/[^/]+\/?$/,
]

export function localePath(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === 'en') return clean
  const [pathname] = clean.split('?')
  const hasLocaleRoute = LOCALE_ROUTE_PATTERNS.some(re => re.test(pathname))
  return hasLocaleRoute ? `/${locale}${clean}` : clean
}
