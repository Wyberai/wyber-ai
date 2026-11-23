import type { LangId, OwnerFacts } from './types'
import { isIndianPrompt } from './locale'

/** The same cities the launch-ready language check looks for, plus an explicit ask. Hindi for all of them, Gujarati for Gujarat. */
// Gujarati only for a business in Gujarat. Nagpur, Pune, Mumbai and every other place get Hindi alone.
const GUJARAT = /\b(ahmedabad|surat|vadodara|baroda|rajkot|gandhinagar|bhavnagar|jamnagar|junagadh|bharuch|navsari|morbi|mehsana|bhuj|valsad|vapi|gujarat|gujarati)\b/i

export function languagesFor(prompt: string, facts: OwnerFacts): LangId[] {
  const text = `${prompt} ${facts.city ?? ''}`
  if (/\b(english only|only in english|no hindi|no translation)\b/i.test(text)) return ['en']
  const langs: LangId[] = ['en']
  if (isIndianPrompt(text) || /\b(hindi|bilingual|multilingual)\b/i.test(text)) langs.push('hi')
  if (GUJARAT.test(text)) langs.push('gu')
  return langs
}
