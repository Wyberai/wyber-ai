import type { LangId, OwnerFacts } from './types'

/** The same cities the launch-ready language check looks for, plus an explicit ask. Hindi for all of them, Gujarati for Gujarat. */
const INDIAN = /\b(ahmedabad|surat|vadodara|rajkot|gandhinagar|pune|mumbai|delhi|bengaluru|bangalore|hyderabad|chennai|kolkata|jaipur|jodhpur|udaipur|lucknow|indore|bhopal|india)\b|₹|\+91/i
const GUJARAT = /\b(ahmedabad|surat|vadodara|rajkot|gandhinagar|gujarat|gujarati)\b/i

export function languagesFor(prompt: string, facts: OwnerFacts): LangId[] {
  const text = `${prompt} ${facts.city ?? ''}`
  if (/\b(english only|only in english|no hindi|no translation)\b/i.test(text)) return ['en']
  const langs: LangId[] = ['en']
  if (INDIAN.test(text) || /\b(hindi|bilingual|multilingual)\b/i.test(text)) langs.push('hi')
  if (GUJARAT.test(text)) langs.push('gu')
  return langs
}
