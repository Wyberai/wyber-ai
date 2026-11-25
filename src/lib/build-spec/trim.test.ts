import { describe, expect, it } from 'vitest'
import { repairLengths, trimToLimit } from './trim'

describe('trimming text that is a little too long', () => {
  it('cuts at a word boundary and never leaves a dangling comma', () => {
    const s = 'A woman filling jars of mango pickle in a bright kitchen, with wooden shelves behind her, in soft morning light'
    const t = trimToLimit(s, 60)
    expect(t.length).toBeLessThanOrEqual(60)
    expect(t).not.toMatch(/[\s,;:]$/)
    expect(s.startsWith(t)).toBe(true)
  })
  it('prefers ending on a full sentence when that keeps most of the text', () => {
    const s = 'We explain every step before we begin. You can ask anything at any time. Questions are always welcome here today.'
    expect(trimToLimit(s, 80)).toBe('We explain every step before we begin. You can ask anything at any time.')
  })
  it('leaves short text alone', () => { expect(trimToLimit('short', 40)).toBe('short') })
})

describe('repairing what a validator called too long', () => {
  const copy = { hero: { imageAlt: 'x'.repeat(5) + ' a long description that runs past the limit by a couple of characters only', headline: 'Fine' }, sections: { faq: { faq: [{ question: 'Q?', answer: 'Short answer.' }, { question: 'Q2?', answer: 'This answer is a bit longer than allowed. It carries on for a while with more words than the limit.' }] } } }

  it('trims the reported fields, by dotted and indexed path, and does not touch the original', () => {
    const before = structuredClone(copy)
    const fixed = repairLengths(copy, [
      { path: 'hero.imageAlt', message: `too long (${copy.hero.imageAlt.length} > ${copy.hero.imageAlt.length - 4})` },
      { path: 'sections.faq.faq[1].answer', message: 'too long (101 > 90)' },
    ])
    expect(fixed.hero.imageAlt.length).toBeLessThanOrEqual(copy.hero.imageAlt.length - 4)
    expect(fixed.sections.faq.faq[1].answer.length).toBeLessThanOrEqual(90)
    expect(fixed.hero.headline).toBe('Fine')
    expect(copy).toEqual(before)
  })
  it('does not butcher text that is far too long: that is left to the model to repair', () => {
    const fixed = repairLengths(copy, [{ path: 'hero.imageAlt', message: 'too long (400 > 140)' }])
    expect(fixed.hero.imageAlt).toBe(copy.hero.imageAlt)
  })
  it('ignores other problems and unknown paths without throwing', () => {
    expect(() => repairLengths(copy, [{ path: 'hero.accent', message: 'must be 1 to 3 words' }, { path: 'nope.nothing[3].x', message: 'too long (10 > 9)' }])).not.toThrow()
    expect(repairLengths(null, [])).toBeNull()
  })
})
