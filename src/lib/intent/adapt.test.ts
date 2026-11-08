import { describe, it, expect, beforeEach } from 'vitest'
import { HOME_HIDE } from './adapt'
import { PERSONAS } from './persona'
import { DOORS, INTENT_LANGS } from './types'
import { getVariant } from './client'
import { INTENT_COPY } from './copy'

describe('what each answer is spared', () => {
  it('covers every door', () => {
    for (const d of DOORS) expect(HOME_HIDE[d]).toBeDefined()
  })
  it('every answer is spared the Free Apps and Your Builds strips, the shop-website strip and the stats bar', () => {
    for (const d of DOORS) for (const id of ['gallery', 'userbuilds', 'websites', 'telemetry'] as const) expect(HOME_HIDE[d], `${d}: ${id}`).toContain(id)
  })
  it('A and B are also spared the developer section and the long product tour; C keeps both', () => {
    for (const d of ['business', 'software'] as const) for (const id of ['mcp', 'products', 'mission', 'proof'] as const) expect(HOME_HIDE[d], `${d}: ${id}`).toContain(id)
    for (const id of ['mcp', 'products', 'mission', 'proof'] as const) expect(HOME_HIDE.student, id).not.toContain(id)
  })
  it('the blocks every page needs are never hidden: hero, pricing, FAQ and the closing call to action', () => {
    for (const d of DOORS) for (const id of ['hero', 'pricing', 'faq', 'final'] as const) expect(HOME_HIDE[d], `${d}: ${id}`).not.toContain(id)
    for (const d of ['business', 'software'] as const) for (const id of ['projects', 'examples'] as const) expect(HOME_HIDE[d], `${d}: ${id}`).not.toContain(id)
    expect(PERSONAS.business.sections).toContain('projects')
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

describe('the question and its three answers', () => {
  it('every language has the question, a promise line, and a label and hint for each answer', () => {
    for (const l of INTENT_LANGS) {
      expect(INTENT_COPY[l].label.trim().length).toBeGreaterThan(5)
      expect(INTENT_COPY[l].askSub.trim().length).toBeGreaterThan(10)
      for (const d of DOORS) {
        expect(INTENT_COPY[l].doors[d].trim(), `${l}.doors.${d}`).not.toBe('')
        expect(INTENT_COPY[l].doorHints[d].trim(), `${l}.doorHints.${d}`).not.toBe('')
        expect(INTENT_COPY[l].doorHints[d]).not.toBe(INTENT_COPY[l].doors[d])
      }
    }
  })
  it('English asks it exactly as you wrote it: what are you looking to do? A solve a problem, B build apps, C just scrolling', () => {
    expect(INTENT_COPY.en.label).toBe('What are you looking to do?')
    expect(INTENT_COPY.en.doors.business).toBe('Solve a problem')
    expect(INTENT_COPY.en.doors.software).toBe('Build apps')
    expect(INTENT_COPY.en.doors.student).toBe('Just scrolling')
  })
  it('the build-something-new door offers idea starters that name concrete screens', () => {
    for (const l of INTENT_LANGS) expect(INTENT_COPY[l].chips.software.map(c => c.id)).toEqual(['saas-plans', 'marketplace', 'mobile-idea'])
    for (const c of INTENT_COPY.en.chips.software) expect(/page|screen/i.test(c.prompt), c.id).toBe(true)
  })
  it('keeps the rules: nothing about where the company is based or that it is one person', () => {
    for (const l of INTENT_LANGS) expect(JSON.stringify(INTENT_COPY[l])).not.toMatch(/bidar|wyoming|\bsolo\b|just me|one[- ]person/i)
  })
})
