import { describe, it, expect } from 'vitest'
import { TOPICS, sketchFor, pickIdeaKind } from './guide'
import { saveCtx, readCtx, clearCtx, projectTypeFor, composeGuidePrompt, stashPending, CTX_KEY, PROMPT_LIMIT } from './handoff'
import { BANNED_COPY } from '@/lib/customer-copy-rules'

function fakeStore() {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m }
}

describe('guide sketches', () => {
  it('matches the problems people actually describe', () => {
    expect(sketchFor('problem', 'I have too many invoices and nothing to track them').title).toBe('Invoice and payment tracker')
    expect(sketchFor('problem', 'we keep running out of stock and expiry dates get missed').title).toBe('Stock and inventory tracker')
    expect(sketchFor('problem', 'drivers deliver but the signed copies come back late').title).toBe('Order and delivery tracker')
    expect(sketchFor('problem', 'people phone to book appointments').title).toBe('Booking and appointments manager')
  })

  it('always returns a usable sketch: 3 to 6 screens and exactly three questions with options', () => {
    for (const text of ['', 'asdf qwer', 'my cousin wants something for his farm', ...TOPICS.map(t => t.title)]) {
      for (const door of ['problem', 'idea'] as const) {
        const s = sketchFor(door, text)
        expect(s.screens.length).toBeGreaterThanOrEqual(3)
        expect(s.screens.length).toBeLessThanOrEqual(6)
        expect(s.qs).toHaveLength(3)
        for (const [q, opts] of s.qs) { expect(q.endsWith('?')).toBe(true); expect(opts.length).toBeGreaterThanOrEqual(2) }
      }
    }
  })

  it('picks the project kind for an idea from the words used', () => {
    expect(pickIdeaKind('a mobile app where tutors list classes')).toBe('Mobile app')
    expect(pickIdeaKind('a portfolio site for my studio')).toBe('Website')
    expect(pickIdeaKind('a tool with plans and billing')).toBe('SaaS')
    expect(pickIdeaKind('a marketplace for tutors')).toBe('Web app')
  })

  it('says nothing the product cannot back: no prices, no promises, no AI talk, no banned phrasing', () => {
    const all = [...TOPICS.map(({ match: _m, ...s }) => (void _m, s)), sketchFor('idea', ''), sketchFor('problem', '')]
    for (const s of all) {
      const text = JSON.stringify(s)
      expect(text).not.toMatch(/\$\s?\d|₹\s?\d|guarantee|\bAI\b|100\s?%/i)
      for (const [re] of BANNED_COPY) expect(re.test(text)).toBe(false)
    }
  })
})

describe('handoff', () => {
  it('round-trips the context and drops it after a week', () => {
    const s = fakeStore()
    saveCtx({ src: 'guide', title: 'Invoice tracker', kindLabel: 'Web app', chips: ['Dashboard'], answers: ['a'], idea: 'x', cost: 30 }, s)
    expect(readCtx(s)?.title).toBe('Invoice tracker')
    expect(readCtx(s, Date.now() + 8 * 86400_000)).toBeNull()
    clearCtx(s)
    expect(readCtx(s)).toBeNull()
  })

  it('survives tampering and bad input', () => {
    const s = fakeStore()
    expect(readCtx(s)).toBeNull()
    s.setItem(CTX_KEY, 'not json'); expect(readCtx(s)).toBeNull()
    s.setItem(CTX_KEY, JSON.stringify({ title: 5, at: Date.now() })); expect(readCtx(s)).toBeNull()
    s.setItem(CTX_KEY, JSON.stringify({ src: 'evil', title: 'x'.repeat(500), at: Date.now(), cost: 'NaN', chips: 'no', answers: [1, 2] }))
    const c = readCtx(s)!
    expect(c.src).toBe('quick'); expect(c.title.length).toBeLessThanOrEqual(120); expect(c.chips).toEqual([]); expect(c.cost).toBe(30)
  })

  it('maps kinds to the four dashboard project types', () => {
    expect(projectTypeFor('Web app')).toBe('app'); expect(projectTypeFor('Web app with a phone view')).toBe('app')
    expect(projectTypeFor('Mobile app')).toBe('mobile'); expect(projectTypeFor('Website')).toBe('website'); expect(projectTypeFor('SaaS')).toBe('saas')
  })

  it('composes a capped prompt and stashes it under the dashboard contract', () => {
    const sk = sketchFor('problem', 'invoices')
    const p = composeGuidePrompt('too many invoices', sk, ['How do invoices reach you today? WhatsApp'])
    expect(p).toContain('too many invoices'); expect(p).toContain('Invoice and payment tracker'); expect(p).toContain('WhatsApp')
    expect(composeGuidePrompt('x'.repeat(5000), sk, []).length).toBeLessThanOrEqual(PROMPT_LIMIT)
    const s = fakeStore(); stashPending(p, 'app', 'Invoice tracker', s)
    expect(s.getItem('wyber-pending-prompt')).toBe(p); expect(s.getItem('wyber-pending-type')).toBe('app'); expect(s.getItem('wyber-pending-project-label')).toBe('Invoice tracker')
  })
})
