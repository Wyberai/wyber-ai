import { describe, it, expect } from 'vitest'
import {
  computeTotal, lineTotal, toUsd, formatMoney, newToken, isToken, validateQuoteInput, isExpired, canAccept, statusAfterView,
  validateAcceptName, shareMessage, DEFAULT_INR_PER_USD,
} from './quote'

const good = { title: 'GST reconciliation tool', currency: 'INR', items: [{ description: 'Build: upload, match, chase list', qty: 1, unit_price: 80000 }, { description: 'Setup and training', qty: 2, unit_price: 2500.5 }] }

describe('totals', () => {
  it('multiplies quantity by price and rounds to paise/cents without float drift', () => {
    expect(lineTotal({ description: 'x', qty: 3, unit_price: 0.1 })).toBe(0.3)
    expect(computeTotal([{ description: 'a', qty: 1, unit_price: 0.1 }, { description: 'b', qty: 1, unit_price: 0.2 }])).toBe(0.3)
    expect(computeTotal(good.items)).toBe(85001)
    expect(computeTotal([])).toBe(0)
  })

  it('converts INR to dollars only for the pipeline, with a safe fallback rate', () => {
    expect(toUsd(100, 'USD')).toBe(100)
    expect(toUsd(8500, 'INR')).toBe(8500 / DEFAULT_INR_PER_USD)
    expect(toUsd(8500, 'INR', 100)).toBe(85)
    expect(toUsd(8500, 'INR', 0)).toBe(100) // a bad rate falls back to the default
  })

  it('formats money for each currency', () => {
    expect(formatMoney(85000, 'INR')).toBe('₹85,000')
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50')
    expect(formatMoney(2500000, 'INR')).toBe('₹25,00,000')
  })
})

describe('tokens', () => {
  it('are long, unique and URL-safe, and the validator rejects anything else', () => {
    const a = newToken(), b = newToken()
    expect(a).not.toBe(b)
    expect(isToken(a)).toBe(true)
    expect(a).toMatch(/^[A-Za-z0-9_-]{32}$/)
    for (const bad of ['', 'short', 'a'.repeat(31), 'a'.repeat(33), '../etc/passwd'.padEnd(32, 'x'), 12, null]) expect(isToken(bad)).toBe(false)
  })
})

describe('validateQuoteInput', () => {
  it('accepts a good quote and normalises it', () => {
    const r = validateQuoteInput({ ...good, scope: '  What we build  ', terms: '50% upfront', valid_until: '2026-12-15' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toMatchObject({ title: 'GST reconciliation tool', currency: 'INR', scope: 'What we build', terms: '50% upfront', valid_until: '2026-12-15' })
  })

  it.each([
    ['no title', { ...good, title: '  ' }],
    ['bad currency', { ...good, currency: 'EUR' }],
    ['no items', { ...good, items: [] }],
    ['items not a list', { ...good, items: 'x' }],
    ['empty description', { ...good, items: [{ description: '', qty: 1, unit_price: 5 }] }],
    ['zero quantity', { ...good, items: [{ description: 'a', qty: 0, unit_price: 5 }] }],
    ['negative price', { ...good, items: [{ description: 'a', qty: 1, unit_price: -5 }] }],
    ['text price', { ...good, items: [{ description: 'a', qty: 1, unit_price: 'free' }] }],
    ['zero total', { ...good, items: [{ description: 'a', qty: 1, unit_price: 0 }] }],
    ['bad date', { ...good, valid_until: '30/11/2026' }],
    ['impossible date', { ...good, valid_until: '2026-13-45' }],
    ['too many lines', { ...good, items: Array.from({ length: 31 }, () => ({ description: 'a', qty: 1, unit_price: 1 })) }],
  ])('rejects %s', (_n, body) => { expect(validateQuoteInput(body as Record<string, unknown>).ok).toBe(false) })

  it('does not accept a total from the client', () => {
    const r = validateQuoteInput({ ...good, total: 1 } as Record<string, unknown>)
    expect(r.ok && 'total' in r.value).toBe(false)
  })
})

describe('expiry and acceptance', () => {
  const NOW = new Date('2026-11-30T12:00:00Z') // 17:30 IST on 30 Nov
  it('"valid until 30 Nov" still includes the whole of 30 Nov in India time', () => {
    expect(isExpired({ valid_until: '2026-11-30', status: 'sent' }, NOW)).toBe(false)
    expect(isExpired({ valid_until: '2026-11-29', status: 'sent' }, NOW)).toBe(true)
    expect(isExpired({ valid_until: '2026-11-30', status: 'sent' }, new Date('2026-11-30T18:30:00Z'))).toBe(true) // 00:00 IST on 1 Dec
    expect(isExpired({ valid_until: null, status: 'sent' }, NOW)).toBe(false)
  })

  it('an accepted quote never expires retroactively', () => {
    expect(isExpired({ valid_until: '2026-01-01', status: 'accepted' }, NOW)).toBe(false)
  })

  it('only sent or viewed, unexpired quotes can be accepted', () => {
    expect(canAccept({ status: 'sent', valid_until: '2026-12-31' }, NOW).ok).toBe(true)
    expect(canAccept({ status: 'viewed', valid_until: null }, NOW).ok).toBe(true)
    for (const status of ['draft', 'accepted', 'declined', 'expired'] as const) expect(canAccept({ status, valid_until: null }, NOW).ok, status).toBe(false)
    expect(canAccept({ status: 'sent', valid_until: '2026-11-01' }, NOW)).toMatchObject({ ok: false, reason: expect.stringMatching(/expired/) })
  })

  it('opening a sent quote marks it viewed; nothing else changes on a view', () => {
    expect(statusAfterView('sent')).toBe('viewed')
    for (const s of ['viewed', 'accepted', 'declined', 'expired', 'draft'] as const) expect(statusAfterView(s)).toBe(s)
  })

  it('needs a typed name to accept', () => {
    expect(validateAcceptName('  Asha   Patel ')).toEqual({ ok: true, name: 'Asha Patel' })
    expect(validateAcceptName('A').ok).toBe(false)
    expect(validateAcceptName('').ok).toBe(false)
    expect(validateAcceptName(undefined).ok).toBe(false)
  })
})

describe('shareMessage', () => {
  it('names the client, the total in their currency, the deadline and the link', () => {
    const m = shareMessage({ title: 'GST tool', total: 85001, currency: 'INR', valid_until: '2026-12-15' }, 'https://wyberai.com/quote/abc', 'Asha Patel')
    expect(m).toContain('Hi Asha,')
    expect(m).toContain('₹85,001')
    expect(m).toContain('valid until 2026-12-15')
    expect(m).toContain('https://wyberai.com/quote/abc')
    expect(shareMessage({ title: 'T', total: 10, currency: 'USD', valid_until: null }, 'u')).toBe('Hi, here is the quote for "T": $10. You can read it and accept it here: u')
  })
})
