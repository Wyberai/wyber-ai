import type { IntentLang } from './types'

/** Browser Accept-Language / Vercel region -> a language to offer first. */
export function suggestLang(acceptLanguage: string | null | undefined, region: string | null | undefined): IntentLang {
  const tags = (acceptLanguage ?? '')
    .split(',')
    .map(p => p.trim().split(';')[0].toLowerCase())
    .filter(Boolean)
  // Browser preference wins over geography: a Gujarati speaker in Mumbai asked for Gujarati.
  for (const t of tags) {
    if (t === 'gu' || t.startsWith('gu-')) return 'gu'
    if (t === 'hi' || t.startsWith('hi-')) return 'hi'
  }
  if ((region ?? '').toUpperCase() === 'GJ') return 'gu'
  return 'en'
}

const RANGES: [IntentLang, RegExp][] = [
  ['gu', /[઀-૿]/g], // Gujarati
  ['hi', /[ऀ-ॿ]/g], // Devanagari (Hindi/Marathi)
]

/**
 * Which script a piece of text is written in. Used to answer in the visitor's
 * language without waiting on the model. Latin text (including Hinglish and
 * Gujarati typed in English letters) is reported as 'en'.
 */
export function detectScriptLang(text: string): IntentLang {
  let best: IntentLang = 'en'
  let bestCount = 0
  for (const [lang, re] of RANGES) {
    const n = (text.match(re) ?? []).length
    if (n > bestCount) { best = lang; bestCount = n }
  }
  // A couple of stray characters in an otherwise Latin sentence is not "Hindi".
  const letters = (text.match(/\p{L}/gu) ?? []).length || 1
  return bestCount / letters >= 0.3 ? best : 'en'
}

export function isIntentLang(v: unknown): v is IntentLang {
  return v === 'en' || v === 'hi' || v === 'gu'
}
