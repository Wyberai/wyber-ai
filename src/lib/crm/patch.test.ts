import { describe, it, expect } from 'vitest'
import { buildPatch, validateActivity } from './patch'
import type { Contact } from './contact'

const NOW = new Date('2026-11-10T06:00:00Z')
const base: Contact = {
  id: '11111111-1111-1111-1111-111111111111', created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:00:00Z', name: 'Asha',
  email: 'asha@example.com', phone: null, phone_norm: null, company: null, title: null, country: null, segment: 'business',
  source: 'expo', source_ref: 'e1', stage: 'new', value_usd: 0, score: 50, tags: [], next_action: null, next_action_at: null,
  last_touch_at: null, closed_at: null, lost_reason: null, notes: null,
}

describe('buildPatch', () => {
  it('moves a stage, stamps the touch, logs the move and re-scores', () => {
    const r = buildPatch(base, { stage: 'contacted' }, NOW)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.patch).toMatchObject({ stage: 'contacted', last_touch_at: NOW.toISOString(), updated_at: NOW.toISOString() })
    expect(typeof r.patch.score).toBe('number')
    expect(r.activity).toBe('Stage: New → Contacted')
    expect(r.patch.closed_at).toBeUndefined()
  })

  it('closes a deal on won/lost and reopens it cleanly', () => {
    const won = buildPatch(base, { stage: 'won', value_usd: 2500 }, NOW)
    if (!won.ok) throw new Error('expected ok')
    expect(won.patch).toMatchObject({ stage: 'won', closed_at: NOW.toISOString(), value_usd: 2500 })
    const reopened = buildPatch({ ...base, stage: 'lost', closed_at: '2026-11-05T00:00:00Z', lost_reason: 'price' }, { stage: 'replied' }, NOW)
    if (!reopened.ok) throw new Error('expected ok')
    expect(reopened.patch).toMatchObject({ closed_at: null, lost_reason: null })
  })

  it('validates input and rejects bad values', () => {
    for (const body of [{ stage: 'closed' }, { segment: 'enterprise' }, { value_usd: -5 }, { value_usd: 'lots' }, { email: 'nope' }, { next_action_at: 'tomorrow-ish' }, { name: '   ' }, { tags: 'a,b' }, {}]) {
      expect(buildPatch(base, body, NOW).ok, JSON.stringify(body)).toBe(false)
    }
  })

  it('normalises phone, email and tags, and clears fields sent as null or empty', () => {
    const r = buildPatch({ ...base, company: 'Old' }, { phone: '+91 98765 43210', email: ' ASHA@Example.com ', tags: ['VIP', 'vip', ' Hot '], company: '', next_action_at: '' }, NOW)
    if (!r.ok) throw new Error('expected ok')
    expect(r.patch).toMatchObject({ phone_norm: '9876543210', email: 'asha@example.com', tags: ['vip', 'hot'], company: null, next_action_at: null })
  })

  it('stores an ISO date for the next action and ignores an unchanged stage', () => {
    const r = buildPatch(base, { stage: 'new', next_action: 'Call', next_action_at: '2026-11-12T09:30:00+05:30' }, NOW)
    if (!r.ok) throw new Error('expected ok')
    expect(r.patch.next_action_at).toBe('2026-11-12T04:00:00.000Z')
    expect(r.patch.stage).toBeUndefined()
    expect(r.activity).toBeNull()
  })

  it('a bigger deal value raises the score', () => {
    const lo = buildPatch(base, { value_usd: 0.01 }, NOW)
    const hi = buildPatch(base, { value_usd: 8000 }, NOW)
    if (!lo.ok || !hi.ok) throw new Error('expected ok')
    expect(hi.patch.score as number).toBeGreaterThan(lo.patch.score as number)
  })
})

describe('validateActivity', () => {
  const id = '11111111-1111-1111-1111-111111111111'
  it('accepts a note and defaults unknown kinds to note', () => {
    expect(validateActivity({ contactId: id, kind: 'call', summary: ' Spoke to Asha ' })).toEqual({ ok: true, contactId: id, kind: 'call', summary: 'Spoke to Asha' })
    expect(validateActivity({ contactId: id, kind: 'fax', summary: 'x' })).toMatchObject({ ok: true, kind: 'note' })
  })
  it('rejects a bad id or empty text, and caps length', () => {
    expect(validateActivity({ contactId: 'nope', summary: 'x' }).ok).toBe(false)
    expect(validateActivity({ contactId: id, summary: '  ' }).ok).toBe(false)
    const r = validateActivity({ contactId: id, summary: 'a'.repeat(5000) })
    expect(r.ok && r.summary.length).toBe(1000)
  })
})
