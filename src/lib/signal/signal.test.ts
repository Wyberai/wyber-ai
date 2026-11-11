import { describe, it, expect } from 'vitest'
import { TOPICS, sketchFor, pickIdeaKind, kindForType } from './guide'
import { saveCtx, readCtx, clearCtx, clearPending, briefBelongsTo, pendingIsStale, projectTypeFor, composeGuidePrompt, stashPending, CTX_KEY, PROMPT_LIMIT } from './handoff'
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

describe('the plan follows what the visitor chose and said', () => {
  const idea = 'A booking app for my salon with reminders on WhatsApp'

  it('maps the type buttons to a kind, and none to nothing', () => {
    expect(kindForType('app')).toBe('Web app')
    expect(kindForType('mobile')).toBe('Mobile app')
    expect(kindForType('website')).toBe('Website')
    expect(kindForType('saas')).toBe('SaaS')
    expect(kindForType(null)).toBeNull()
    expect(kindForType('agent')).toBeNull()
  })

  it('a booking idea gets a booking plan on the Build apps door, not the blank generic one', () => {
    const s = sketchFor('idea', idea)
    expect(s.title).toBe('Booking and appointments manager')
    expect(s.screens.map(x => x[0])).toContain('Calendar')
    expect(s.kind).toBe('Web app')
  })

  it('the type they press wins: Mobile makes it a mobile app, with the same booking screens', () => {
    const s = sketchFor('idea', idea, 'mobile')
    expect(s.kind).toBe('Mobile app')
    expect(s.title).toBe('Booking and appointments manager')
    expect(s.why).toContain('You chose a mobile app')
  })

  it('their choice beats a guess from the words', () => {
    expect(sketchFor('idea', 'a mobile app where tutors list classes', 'app').kind).toBe('Web app')
    expect(sketchFor('idea', 'a mobile app where tutors list classes').kind).toBe('Mobile app')
  })

  it('a website for a salon is a website plan, not the booking manager', () => {
    for (const s of [sketchFor('idea', 'a website for my salon'), sketchFor('idea', idea, 'website')]) {
      expect(s.kind).toBe('Website')
      expect(s.title).not.toBe('Booking and appointments manager')
      expect(s.screens.map(x => x[0])).toContain('Contact or booking')
    }
  })

  it('SaaS keeps its own screens', () => {
    const s = sketchFor('idea', idea, 'saas')
    expect(s.kind).toBe('SaaS')
    expect(s.screens.map(x => x[0])).toContain('Plans and billing')
  })

  it('an idea that only mentions payments or classes is NOT turned into an invoice tracker or a schedule', () => {
    expect(sketchFor('idea', 'a marketplace where sellers take payments').title).toBe('Your first version')
    expect(sketchFor('idea', 'a place where tutors list classes and students pay').title).toBe('Your first version')
  })

  it('the problem door honours the type too, and still matches on its wider words', () => {
    const s = sketchFor('problem', 'I have too many invoices and nothing to track them', 'mobile')
    expect(s.title).toBe('Invoice and payment tracker')
    expect(s.kind).toBe('Mobile app')
    expect(sketchFor('problem', 'people phone to book appointments').kind).toBe('Web app')
  })

  it('every combination still gives a usable sketch: 4 or 5 screens, a first win, three questions', () => {
    const texts = ['', 'a thing', idea, 'invoices', 'a marketplace with payments', 'stock and expiry', 'drivers and deliveries', 'leads and follow-ups', 'staff attendance']
    for (const door of ['problem', 'idea'] as const) for (const t of texts) for (const chosen of [null, 'app', 'mobile', 'website', 'saas']) {
      const s = sketchFor(door, t, chosen)
      expect(s.screens.length, `${door} ${t} ${chosen}`).toBeGreaterThanOrEqual(4)
      expect(s.screens.length).toBeLessThanOrEqual(5)
      expect(s.win.length).toBeGreaterThan(5)
      expect(s.qs.length).toBeGreaterThanOrEqual(3)
      expect(s.why.length).toBeGreaterThan(5)
    }
  })
})

describe('a brief from one door never follows someone through another', () => {
  it('belongs only to a sign-in headed for the builder', () => {
    for (const ok of [null, undefined, '', '/dashboard', '/dashboard?new=mobile', '/dashboard/x']) expect(briefBelongsTo(ok), String(ok)).toBe(true)
    for (const no of ['/clients', '/clients?welcome=1', '/settings', '/project/abc', '/dashboardx', '/pricing']) expect(briefBelongsTo(no), no).toBe(false)
  })

  it('clearPending forgets the build that would start after sign-in, and clearCtx the saved plan', () => {
    const s = fakeStore()
    saveCtx({ src: 'guide', title: 'Invoice tracker', kindLabel: 'Web app', chips: [], answers: [], idea: 'invoices', cost: 30 }, s)
    stashPending('build an invoice tracker', 'app', 'Invoice tracker', s)
    expect(s.getItem('wyber-pending-prompt')).toBeTruthy()
    clearPending(s); clearCtx(s)
    expect(s.getItem('wyber-pending-prompt')).toBeNull()
    expect(s.getItem('wyber-pending-type')).toBeNull()
    expect(s.getItem('wyber-pending-project-label')).toBeNull()
    expect(readCtx(s)).toBeNull()
  })
})

describe('a saved build expires with the plan it came from', () => {
  const DAY = 24 * 60 * 60 * 1000
  it('is stale after a week, fresh inside it, and untimed ones are left alone', () => {
    const now = Date.now()
    expect(pendingIsStale(String(now - 6 * DAY), now)).toBe(false)
    expect(pendingIsStale(String(now - 8 * DAY), now)).toBe(true)
    expect(pendingIsStale(null, now)).toBe(false)
    expect(pendingIsStale('not a number', now)).toBe(false)
  })
  it('stashPending stamps the time, and clearPending removes it', () => {
    const s = fakeStore()
    stashPending('build a booking app', 'app', 'Booking', s)
    expect(Number(s.getItem('wyber-pending-at'))).toBeGreaterThan(Date.now() - 5000)
    clearPending(s)
    expect(s.getItem('wyber-pending-at')).toBeNull()
  })
})
