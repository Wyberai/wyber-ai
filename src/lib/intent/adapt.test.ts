import { describe, it, expect, beforeEach } from 'vitest'
import { HOME_HIDE } from './adapt'
import { DOORS } from './types'
import { getVariant } from './client'

describe('what each kind of visitor is spared', () => {
  it('covers every door', () => {
    for (const d of DOORS) expect(HOME_HIDE[d]).toBeDefined()
  })
  it('never hides the parts every visitor needs: the hero, products, pricing, FAQ and the final call to action are not hideable at all', () => {
    const hideable = new Set(Object.values(HOME_HIDE).flat())
    expect([...hideable].sort()).toEqual(['byos', 'mcp', 'websites'])
  })
  it('a business owner does not see the developer section; a developer does not see the shop-website strip', () => {
    expect(HOME_HIDE.business).toContain('mcp')
    expect(HOME_HIDE.business).not.toContain('websites')
    expect(HOME_HIDE.software).toContain('websites')
    expect(HOME_HIDE.software).not.toContain('mcp')
  })
  it('a student sees neither business strip nor the developer section', () => {
    expect(HOME_HIDE.student.sort()).toEqual(['byos', 'mcp', 'websites'])
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
  it('ignores any other value and falls back to the normal 70/30 draw', () => {
    expect(getVariant(() => 0.1, '?xp=evil')).toBe('intent')
    store.clear()
    expect(getVariant(() => 0.9, '?xp=')).toBe('control')
  })
})

import { INTENT_COPY } from './copy'
import { INTENT_LANGS } from './types'

describe('the two big choices', () => {
  it('every language has a label and a one-line hint for every door, and the hints are different from the labels', () => {
    for (const l of INTENT_LANGS) {
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
    for (const l of INTENT_LANGS) {
      expect(INTENT_COPY[l].chips.software.map(c => c.id)).toEqual(['saas-plans', 'marketplace', 'mobile-idea'])
    }
    for (const c of INTENT_COPY.en.chips.software) expect(/page|screen/i.test(c.prompt), c.id).toBe(true)
  })
  it('keeps the rules: nothing about where the company is based or that it is one person', () => {
    for (const l of INTENT_LANGS) {
      const all = JSON.stringify(INTENT_COPY[l])
      expect(all).not.toMatch(/bidar|wyoming|\bsolo\b|just me|one[- ]person/i)
    }
  })
})
