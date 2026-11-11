import { describe, it, expect } from 'vitest'
import { stageFor, sortByNeed } from './stage'
import { buildFixPrompt } from './feedback-prompt'
import { validateBrief, briefToPrompt, buildTypeFor, QUESTIONS } from './brief'
import { validateItems, validatePaymentUrl, nextQuoteNumber, formatMoney, ownerCan, clientCanRespond } from './quote'
import { toCsv } from './csv'

const del = (review_status: string | null, delivered_at: string | null = null, is_visible = true) => ({ is_visible, review_status, delivered_at })

describe('stage', () => {
  const base = { status: 'active', openFeedback: 0 }
  it('walks a job from nothing to delivered', () => {
    expect(stageFor({ ...base, deliverables: [] }).key).toBe('not_started')
    expect(stageFor({ ...base, brief_token: 'b_1', deliverables: [] }).key).toBe('brief_waiting')
    expect(stageFor({ ...base, brief_token: 'b_1', brief_submitted_at: 'x', deliverables: [] })).toMatchObject({ key: 'brief_ready', needsYou: true })
    expect(stageFor({ ...base, deliverables: [del('pending')] }).key).toBe('in_review')
    expect(stageFor({ ...base, deliverables: [del('approved'), del('pending')] }).key).toBe('in_review')
    expect(stageFor({ ...base, deliverables: [del('approved'), del('approved')] })).toMatchObject({ key: 'approved', needsYou: true })
    expect(stageFor({ ...base, deliverables: [del('approved', 'd'), del('approved', 'd')] }).key).toBe('delivered')
  })
  it('changes requested needs you; once every note is done it says send it back', () => {
    expect(stageFor({ ...base, openFeedback: 2, deliverables: [del('changes_requested')] })).toMatchObject({ key: 'changes', needsYou: true })
    expect(stageFor({ ...base, openFeedback: 0, deliverables: [del('changes_requested')] }).key).toBe('fixed')
  })
  it('inactive clients show their status, whatever else is true', () => {
    for (const s of ['lead', 'paused', 'archived']) expect(stageFor({ status: s, openFeedback: 3, deliverables: [del('changes_requested')] }).key).toBe(s)
  })
  it('hidden projects do not count', () => {
    expect(stageFor({ ...base, deliverables: [del('pending', null, false)] }).key).toBe('not_started')
  })
  it('puts clients that need you first', () => {
    const rows = [
      { id: 'a', created_at: '2026-01-03', _stage: stageFor({ ...base, deliverables: [del('pending')] }) },
      { id: 'b', created_at: '2026-01-01', _stage: stageFor({ ...base, openFeedback: 1, deliverables: [del('changes_requested')] }) },
      { id: 'c', created_at: '2026-01-02', _stage: stageFor({ ...base, deliverables: [del('approved')] }) },
    ]
    expect(sortByNeed(rows).map(r => r.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('fix prompt', () => {
  it('quotes each item with where it came from', () => {
    const p = buildFixPrompt([
      { source: 'client', project: 'Booking portal', author: 'Asha', text: 'Make the book button larger on phones' },
      { source: 'pin', project: 'Booking portal', author: 'Raj', text: 'Typo in the header', page: '/contact' },
    ], { clientName: 'Northwind' })
    expect(p).toContain('my client Northwind')
    expect(p).toContain('1. [Booking portal] Asha: "Make the book button larger on phones"')
    expect(p).toContain('2. [Booking portal] (pinned on /contact) Raj: "Typo in the header"')
    expect(p).toContain("don't rebuild from scratch")
  })
  it('is empty when there is nothing to fix', () => {
    expect(buildFixPrompt([])).toBe('')
    expect(buildFixPrompt([{ source: 'client', project: 'x', text: '   ' }])).toBe('')
  })
  it('caps the prompt and says how much was left out', () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ source: 'client' as const, project: 'P', text: `change number ${i} ` + 'x'.repeat(300) }))
    const p = buildFixPrompt(items)
    expect(p.length).toBeLessThanOrEqual(4100)
    expect(p).toMatch(/\(\d+ more not shown/)
  })
  it('strips control characters and collapses whitespace', () => {
    const p = buildFixPrompt([{ source: 'client', project: 'P', text: 'a\u0000b\n\n  c' }])
    expect(p).toContain('"ab c"')
  })
})

describe('brief', () => {
  const ok = { kind: 'Website', business: 'Northwind Interiors', about: 'We design homes.', goal: 'Get enquiries' }
  it('accepts a minimal brief and drops unknown fields', () => {
    const r = validateBrief({ ...ok, evil: '<script>' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(Object.keys(r.answers).sort()).toEqual(['about', 'business', 'goal', 'kind'])
  })
  it('names what is missing and rejects an option that is not offered', () => {
    const r = validateBrief({ kind: 'Spaceship', business: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['about', 'business', 'goal', 'kind'])
  })
  it('caps long answers', () => {
    const r = validateBrief({ ...ok, about: 'x'.repeat(5000) })
    if (r.ok) expect(r.answers.about.length).toBe(QUESTIONS.find(q => q.id === 'about')!.max)
  })
  it('maps the kind to a build type', () => {
    expect(buildTypeFor({ kind: 'Website' })).toBe('website')
    expect(buildTypeFor({ kind: 'Mobile app' })).toBe('mobile')
    expect(buildTypeFor({ kind: 'Web app' })).toBe('app')
    expect(buildTypeFor({ kind: 'Not sure yet' })).toBe('app')
  })
  it('writes a prompt that uses only what was said and tells the builder not to invent facts', () => {
    const p = briefToPrompt('Northwind', { ...ok, content: 'No, I need help' })
    expect(p).toContain('Build a website for Northwind Interiors.')
    expect(p).toContain('We design homes.')
    expect(p).toContain('not ready')
    expect(p).toContain('obvious placeholder instead of inventing it')
    expect(p).not.toContain('undefined')
  })
})

describe('quote', () => {
  it('totals in whole cents, never floats', () => {
    const r = validateItems([{ description: 'Design', qty: 3, unit: 0.1 }, { description: 'Build', qty: 1, unit: 0.2 }])
    expect(r).toMatchObject({ ok: true, total: 0.5 })
    const big = validateItems([{ description: 'Site', qty: 1, unit: 45000 }, { description: 'Hosting', qty: 12, unit: 499.5 }])
    expect(big).toMatchObject({ ok: true, total: 50994 })
  })
  it('rejects empty, negative, zero-quantity and oversized quotes', () => {
    expect(validateItems([]).ok).toBe(false)
    expect(validateItems([{ description: 'x', qty: 0, unit: 5 }]).ok).toBe(false)
    expect(validateItems([{ description: 'x', qty: 1, unit: -5 }]).ok).toBe(false)
    expect(validateItems([{ description: '', qty: 1, unit: 5 }]).ok).toBe(false)
    expect(validateItems(Array.from({ length: 31 }, () => ({ description: 'x', qty: 1, unit: 1 }))).ok).toBe(false)
    expect(validateItems([{ description: 'x', qty: 1, unit: Infinity }]).ok).toBe(false)
  })
  it('allows only https payment links without credentials', () => {
    expect(validatePaymentUrl(undefined)).toEqual({ ok: true, url: null })
    expect(validatePaymentUrl('https://rzp.io/l/abc')).toMatchObject({ ok: true })
    for (const bad of ['http://x.com', 'javascript:alert(1)', 'https://user:pw@x.com', 'data:text/html,hi', 'not a url', 'x'.repeat(600)]) expect(validatePaymentUrl(bad).ok, bad).toBe(false)
  })
  it('numbers quotes per client', () => {
    expect(nextQuoteNumber([])).toBe('Q-001')
    expect(nextQuoteNumber(['Q-001', 'Q-003'])).toBe('Q-004')
    expect(nextQuoteNumber(['junk'])).toBe('Q-001')
  })
  it('formats money, and does not crash on an odd currency', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50')
    expect(formatMoney(1000, 'INR')).toContain('1,000')
    expect(formatMoney(5, 'ZZZZ')).toContain('5.00')
  })
  it('only lets the right side act at each stage', () => {
    expect(ownerCan('draft')).toMatchObject({ edit: true, send: true, markPaid: false })
    expect(ownerCan('sent')).toMatchObject({ edit: false, withdraw: true })
    expect(ownerCan('accepted')).toMatchObject({ markPaid: true, remove: false })
    expect(ownerCan('paid').markPaid).toBe(false)
    expect(clientCanRespond('sent')).toBe(true)
    for (const s of ['draft', 'accepted', 'declined', 'paid'] as const) expect(clientCanRespond(s)).toBe(false)
  })
})

describe('csv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(toCsv([['a,b', 'say "hi"', 'x\ny']])).toBe('"a,b","say ""hi""","x\ny"\r\n')
  })
  it('neutralises spreadsheet formulas typed by a client', () => {
    expect(toCsv([['=HYPERLINK("http://evil")', '+1', '-2', '@x', 'fine']])).toBe(`"'=HYPERLINK(""http://evil"")",'+1,'-2,'@x,fine\r\n`)
  })
})
