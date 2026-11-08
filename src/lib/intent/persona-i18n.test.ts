import { describe, it, expect } from 'vitest'
import { PERSONA_I18N, personaCopy } from './persona-i18n'
import { PERSONAS } from './persona'
import { DOORS } from './types'

const DEVANAGARI = /[ऀ-ॿ]/
const GUJARATI = /[઀-૿]/

describe('persona copy in Hindi and Gujarati', () => {
  it('has every field for every persona, with the same keys as English', () => {
    const en = Object.keys(personaCopy('business', 'en')!).sort()
    for (const lang of ['hi', 'gu'] as const) for (const d of DOORS) {
      const c = PERSONA_I18N[lang][d]
      expect(Object.keys(c).sort(), `${lang}.${d}`).toEqual(en)
      for (const [k, v] of Object.entries(c)) expect(v.trim().length, `${lang}.${d}.${k}`).toBeGreaterThan(3)
    }
  })

  it('is written in the right script', () => {
    for (const d of DOORS) {
      for (const v of Object.values(PERSONA_I18N.hi[d])) expect(DEVANAGARI.test(v), `hi.${d}: ${v}`).toBe(true)
      for (const v of Object.values(PERSONA_I18N.gu[d])) expect(GUJARATI.test(v), `gu.${d}: ${v}`).toBe(true)
    }
  })

  it('keeps the rules: no prices, no guarantees, nothing about where the company is or who runs it', () => {
    const all = JSON.stringify(PERSONA_I18N)
    expect(all).not.toMatch(/guarantee|\$\s?\d|₹\s?\d|bidar|wyoming|solo/i)
    expect(all).not.toMatch(/गारंटी|ગેરંટી|बीदर|બીદર|अकेला|એકલા/)
  })

  it('English comes from the persona itself and an unknown language gets nothing to overlay', () => {
    expect(personaCopy('software', 'en')!.heroLine1).toBe(PERSONAS.software.hero.heroLine1)
    expect(personaCopy('software', 'en')!.finalCtaLine1).toBe(PERSONAS.software.finalCta.finalCtaLine1)
    expect(personaCopy('student', 'hi')).toBe(PERSONA_I18N.hi.student)
  })

  it('the three personas read differently in each language', () => {
    for (const lang of ['hi', 'gu'] as const) expect(new Set(DOORS.map(d => PERSONA_I18N[lang][d].heroLine1)).size).toBe(3)
  })
})
