import { describe, it, expect, beforeEach } from 'vitest'
import { suggestPages, DEFAULT_SLUGS } from './suggest'
import { PERSONAS } from './persona'
import { getSavedIntent } from './client'
import { BUILD_PAGES } from '@/app/build/data'
import { DOORS } from './types'

const s = (door: 'business' | 'software' | 'student', industry: string | null, pain: string, text = '') => suggestPages(BUILD_PAGES, door, { industry, pain }, text).map(x => x.slug)

describe('suggestPages', () => {
  it('points at pages that match what the visitor wrote', () => {
    expect(s('business', 'logistics', 'delivery copies with signed proof come back late', 'which deliveries have no signed proof')[0]).toBe('proof-of-delivery-tracker-app')
    expect(s('business', 'pharma stockist', 'tracking medicine expiry dates by batch')).toContain('expiry-batch-tracker-app')
    expect(s('business', null, 'customers owe us money and we track it in a notebook')).toContain('customer-credit-ledger-app')
  })
  it('always returns up to three real pages, filling from the door defaults when little matches', () => {
    for (const d of DOORS) {
      const out = suggestPages(BUILD_PAGES, d, { industry: null, pain: 'something unrelated xyzzy' }, 'qwerty')
      expect(out).toHaveLength(3)
      for (const p of out) expect(BUILD_PAGES.some(b => b.slug === p.slug)).toBe(true)
    }
  })
  it('never repeats a page, and puts matches before defaults', () => {
    const out = s('business', 'transport', 'delivery proof', 'delivery tracker')
    expect(new Set(out).size).toBe(out.length)
    expect(out[0]).toBe('proof-of-delivery-tracker-app')
  })
  it('every default page exists (a renamed or removed page would otherwise break the guides)', () => {
    for (const d of DOORS) for (const slug of DEFAULT_SLUGS[d]) expect(BUILD_PAGES.some(b => b.slug === slug), `${d}: ${slug}`).toBe(true)
  })
  it('handles empty input without crashing', () => {
    expect(suggestPages(BUILD_PAGES, 'business', null, '')).toHaveLength(3)
  })
})

describe('persona headlines', () => {
  it('A and B each have a headline, lead and example, and say nothing that is not true; C keeps the site\'s own', () => {
    for (const d of ['business', 'software'] as const) {
      const h = PERSONAS[d].hero!
      for (const v of Object.values(h)) expect(v.trim().length).toBeGreaterThan(5)
      expect(JSON.stringify(h)).not.toMatch(/guarantee|100\s?%|bidar|wyoming|solo|\$\s?\d|₹\s?\d/i)
    }
    expect(PERSONAS.student.hero).toBeNull()
  })
})

describe('getSavedIntent', () => {
  const store = new Map<string, string>()
  beforeEach(() => {
    store.clear()
    ;(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) }
  })
  it('remembers a recent visit and ignores old, malformed or tampered ones', () => {
    expect(getSavedIntent()).toBeNull()
    store.set('wyber-intent', JSON.stringify({ door: 'software', intent: { pain: 'A marketplace for tutors' }, at: Date.now() - 86400_000 }))
    expect(getSavedIntent()).toMatchObject({ door: 'software', pain: 'A marketplace for tutors' })
    store.set('wyber-intent', JSON.stringify({ door: 'software', at: Date.now() - 40 * 86400_000 }))
    expect(getSavedIntent()).toBeNull()
    store.set('wyber-intent', JSON.stringify({ door: 'admin', at: Date.now() }))
    expect(getSavedIntent()).toBeNull()
    store.set('wyber-intent', 'not json')
    expect(getSavedIntent()).toBeNull()
    store.set('wyber-intent', JSON.stringify({ door: 'business', intent: { pain: 'x'.repeat(500) }, at: Date.now() }))
    expect(getSavedIntent()).toMatchObject({ door: 'business', pain: null })
  })
})
