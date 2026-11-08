import { describe, it, expect, beforeEach } from 'vitest'
import { HOME_HIDE } from './adapt'
import { PERSONAS } from './persona'
import { DOORS } from './types'
import { getVariant } from './client'
import { INTENT_COPY } from './copy'
import { INTENT_LANGS } from './types'

describe('what each kind of visitor is spared', () => {
  it('covers every door', () => {
    for (const d of DOORS) expect(HOME_HIDE[d]).toBeDefined()
  })
  it('every persona keeps the six blocks every visitor needs: hero, how it works, examples, pricing, FAQ and the closing call to action', () => {
    for (const d of DOORS) for (const id of ['hero', 'how', 'examples', 'pricing', 'faq', 'final'] as const) expect(PERSONAS[d].sections, d + ': ' + id).toContain(id)
  })
  it('everyone is spared the developer section, the shop-website strip, the stats bar and the Free Apps strips', () => {
    for (const d of DOORS) for (const id of ['mcp', 'websites', 'telemetry', 'gallery', 'userbuilds'] as const) expect(HOME_HIDE[d], `${d}: ${id}`).toContain(id)
  })
  it('the six focused blocks are never hidden', () => {
    for (const d of DOORS) for (const id of ['hero', 'how', 'examples', 'pricing', 'faq', 'final'] as const) expect(HOME_HIDE[d], `${d}: ${id}`).not.toContain(id)
  })
})

describe('getVariant: the owner can pick a side on purpose', () => {
  const store = new Map<string, string>()
  beforeEach(() => {
    store.clear()
    ;(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) }
  })
  it('?xp=intent and ?xp=control override the random draw and stick', () => {
    expect(getVariant(() => 0.99, '?xp=intent')).toBe('intent')
    expect(getVariant(() => 0.99, '')).toBe('intent') // remembered
    expect(getVariant(() => 0.0, '?xp=control')).toBe('control')
    expect(getVariant(() => 0.0, '')).toBe('control')
  })
  it('ignores any other value and falls back to the normal 90/10 draw', () => {
    expect(getVariant(() => 0.1, '?xp=evil')).toBe('intent')
    store.clear()
    expect(getVariant(() => 0.95, '?xp=')).toBe('control')
  })
})

describe('the two big choices', () => {
  it('every language has a label, a one-line hint and a promise line for every door', () => {
    for (const l of INTENT_LANGS) {
      expect(INTENT_COPY[l].askSub.trim().length).toBeGreaterThan(10)
      for (const d of DOORS) {
        expect(INTENT_COPY[l].doors[d].trim(), `${l}.doors.${d}`).not.toBe('')
        expect(INTENT_COPY[l].doorHints[d].trim(), `${l}.doorHints.${d}`).not.toBe('')
        expect(INTENT_COPY[l].doorHints[d]).not.toBe(INTENT_COPY[l].doors[d])
      }
    }
  })
  it('English says it plainly: fix a problem in a business, or build a new app or product', () => {
    expect(INTENT_COPY.en.doors.business).toBe('Fix a problem in my business')
    expect(INTENT_COPY.en.doors.software).toBe('Build a new app or product')
    expect(INTENT_COPY.en.label).toBe('What brings you here?')
  })
  it('the build-something-new door offers idea starters that name concrete screens', () => {
    for (const l of INTENT_LANGS) expect(INTENT_COPY[l].chips.software.map(c => c.id)).toEqual(['saas-plans', 'marketplace', 'mobile-idea'])
    for (const c of INTENT_COPY.en.chips.software) expect(/page|screen/i.test(c.prompt), c.id).toBe(true)
  })
  it('keeps the rules: nothing about where the company is based or that it is one person', () => {
    for (const l of INTENT_LANGS) expect(JSON.stringify(INTENT_COPY[l])).not.toMatch(/bidar|wyoming|\bsolo\b|just me|one[- ]person/i)
  })
})
