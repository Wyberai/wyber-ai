import { describe, it, expect } from 'vitest'
import { DIRECTIONS } from './design-directions'
import { hasBusinessName, dealDirections } from './direction-brief'
import { buildClassifierSystem } from './direction-classifier'

// 18 Nov 2026: "Website for a small law firm in Pune..." was dealt Giant wordmark, which enlarges the firm's NAME. No name was given,
// so the model enlarged the category word and the page looked like a school poster.
describe('name-led directions', () => {
  const nameLed = DIRECTIONS.filter(d => d.needsName).map(d => d.id)
  it('marks the wordmark directions', () => {
    expect(nameLed).toEqual(expect.arrayContaining(['lg-wordmark', 'br-saturated']))
  })
  it('a place or a trade is not a name', () => {
    for (const p of ['Website for a small law firm in Pune that handles property and family cases', 'A website for a gym in Mumbai', 'bakery in Pune']) {
      expect(hasBusinessName(p), p).toBe(false)
    }
  })
  it('recognises an actual name', () => {
    for (const p of ['Website for a law firm called Kulkarni & Deshpande Advocates', 'Site for "Pune Property Law" in Pune', 'Business name: Mehta LLP', 'Website for mehtalaw.in']) {
      expect(hasBusinessName(p), p).toBe(true)
    }
  })
  it('the keyword deal never offers one without a name, over many random draws', () => {
    for (let i = 0; i < 200; i++) {
      const picked = dealDirections('Website for a small law firm in Pune', 1, { rnd: Math.random })[0]
      expect(nameLed).not.toContain(picked.id)
    }
  })
  it('the classifier is not shown name-led directions when there is no name, and is when there is', () => {
    const without = buildClassifierSystem('website', false)
    const withName = buildClassifierSystem('website', true)
    for (const id of nameLed) { expect(without).not.toContain(id + ' |'); expect(withName).toContain(id + ' |') }
  })
})
