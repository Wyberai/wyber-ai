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

export function localePath(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  return locale === 'en' ? clean : `/${locale}${clean}`
}
