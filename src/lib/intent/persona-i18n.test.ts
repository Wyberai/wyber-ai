import { describe, it, expect } from 'vitest'
import { PERSONA_I18N, personaCopy } from './persona-i18n'
import { PERSONAS } from './persona'
import type { Door } from './types'

const DEVANAGARI = /[ऀ-ॿ]/
const GUJARATI = /[઀-૿]/
// "Just scrolling" keeps the page's own words, so only these two rewrite the headline.
const REWRITTEN: Door[] = ['business', 'software']

describe('persona copy in Hindi and Gujarati', () => {
  it('has every field for the two personas that rewrite the headline, with the same keys as English', () => {
    const en = Object.keys(personaCopy('business', 'en')!).sort()
    for (const lang of ['hi', 'gu'] as const) for (const d of REWRITTEN) {
      const c = PERSONA_I18N[lang][d]!
      expect(Object.keys(c).sort(), `${lang}.${d}`).toEqual(en)
      for (const [k, v] of Object.entries(c)) expect(v.trim().length, `${lang}.${d}.${k}`).toBeGreaterThan(3)
    }
  })

  it('is written in the right script', () => {
    for (const d of REWRITTEN) {
      for (const v of Object.values(PERSON_HI(d))) expect(DEVANAGARI.test(v), `hi.${d}: ${v}`).toBe(true)
      for (const v of Object.values(PERSONA_I18N.gu[d]!)) expect(GUJARATI.test(v), `gu.${d}: ${v}`).toBe(true)
    }
  })

  it('keeps the rules: no prices, no guarantees, nothing about where the company is or who runs it', () => {
    const all = JSON.stringify(PERSONA_I18N)
    expect(all).not.toMatch(/guarantee|\$\s?\d|₹\s?\d|bidar|wyoming|solo/i)
    expect(all).not.toMatch(/गारंटी|ગેરંટી|बीदर|બીદર|अकेला|એકલા/)
  })

  it('English comes from the persona itself; "Just scrolling" keeps the page\'s own text in every language', () => {
    expect(personaCopy('software', 'en')!.heroLine1).toBe(PERSONAS.software.hero!.heroLine1)
    expect(personaCopy('software', 'en')!.finalCtaLine1).toBe(PERSONAS.software.finalCta!.finalCtaLine1)
    for (const lang of ['en', 'hi', 'gu'] as const) expect(personaCopy('student', lang), lang).toBeNull()
  })

  it('the two rewritten personas read differently in each language', () => {
    for (const lang of ['hi', 'gu'] as const) expect(new Set(REWRITTEN.map(d => PERSONA_I18N[lang][d]!.heroLine1)).size).toBe(2)
  })
})

function PERSON_HI(d: Door) { return PERSONA_I18N.hi[d]! }
