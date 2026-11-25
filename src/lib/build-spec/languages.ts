import type { LangId, OwnerFacts } from './types'
import { isIndianPrompt } from './locale'

/** The same cities the launch-ready language check looks for, plus an explicit ask. Hindi for all of them, Gujarati for Gujarat. */
// Gujarati only for a business in Gujarat. Nagpur, Pune, Mumbai and every other place get Hindi alone.
const GUJARAT = /\b(ahmedabad|surat|vadodara|baroda|rajkot|gandhinagar|bhavnagar|jamnagar|junagadh|bharuch|navsari|morbi|mehsana|bhuj|valsad|vapi|gujarat|gujarati)\b/i

// Marathi for a business in Maharashtra (Hindi stays alongside it: both are read there).
const MAHARASHTRA = /\b(mumbai|navi mumbai|thane|pune|nagpur|nashik|nasik|aurangabad|sambhajinagar|kolhapur|solapur|amravati|sangli|satara|latur|akola|jalgaon|nanded|ahmednagar|maharashtra|marathi)\b/i

export function languagesFor(prompt: string, facts: OwnerFacts): LangId[] {
  const text = `${prompt} ${facts.city ?? ''}`
  if (/\b(english only|only in english|no hindi|no translation)\b/i.test(text)) return ['en']
  const langs: LangId[] = ['en']
  if (isIndianPrompt(text) || /\b(hindi|bilingual|multilingual)\b/i.test(text)) langs.push('hi')
  if (GUJARAT.test(text)) langs.push('gu')
  if (MAHARASHTRA.test(text)) langs.push('mr')
  return langs
}

/** Languages a site can offer besides English: each has its fixed words (ui-strings), a script font (tokens) and a translate prompt. */
export const OFFERED_LANGS: Exclude<LangId, 'en'>[] = ['hi', 'mr', 'gu', 'ta', 'te', 'kn', 'bn']

export const LANG_LABELS: Record<Exclude<LangId, 'en'>, string> = {
  hi: 'Hindi', mr: 'Marathi', gu: 'Gujarati', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', bn: 'Bengali',
}

/** The question the model answers to choose the language toggles. It decides from the whole brief, not from a list of city names. */
export function buildLanguagePrompt(prompt: string): { system: string; user: string } {
  const options = OFFERED_LANGS.map(l => `${l} = ${LANG_LABELS[l]}`).join(', ')
  return {
    system: `You decide which language toggles a small-business website should offer next to English. Think about who the real visitors are: the local language of the place the business serves, a lingua franca they also read, and any language the owner asks for. Offer a language only when a real share of visitors would rather read it; an export business, a SaaS for a global audience or a site for another country needs none. At most three. Choose only from: ${options}. Reply with one JSON object and nothing else: {"languages": ["code", ...], "why": "one short sentence"}. An empty list is a valid answer.`,
    user: `Brief:\n${prompt.slice(0, 1500)}`,
  }
}

/** Checks the model's answer: only offered codes, no repeats, at most three. Returns the problems (empty when fine). */
export function validateLanguageReply(v: unknown): string[] {
  const o = v as { languages?: unknown }
  if (!o || !Array.isArray(o.languages)) return ['languages must be an array of codes']
  const bad = o.languages.filter(x => !OFFERED_LANGS.includes(x as Exclude<LangId, 'en'>))
  if (bad.length) return ['unknown language codes: ' + bad.join(', ') + '. Use only: ' + OFFERED_LANGS.join(', ')]
  if (o.languages.length > 3) return ['at most three languages']
  return []
}

/** English first, then what the model chose (deduplicated, in the order given). */
export function languagesFromReply(v: { languages: unknown }): LangId[] {
  const picked = (v.languages as Exclude<LangId, 'en'>[]).filter((l, i, a) => a.indexOf(l) === i)
  return ['en', ...picked]
}
