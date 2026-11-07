import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const deliver = vi.fn()
let disabled = false
let leadsResult: { data: unknown[] | null; error: { message: string } | null }
let sentResult: { data: unknown[] | null; error: { message: string } | null }

vi.mock('@/lib/expo-sequence-send', () => ({
  deliverExpoEmail: (...a: unknown[]) => deliver(...a),
  expoSequenceDisabled: () => disabled,
}))
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: async () => ({
    from: (table: string) => table === 'expo_leads'
      ? { select: () => ({ not: () => ({ eq: () => ({ neq: () => ({ gte: () => ({ limit: async () => leadsResult }) }) }) }) }) }
      : { select: () => ({ in: async () => sentResult }) },
  }),
}))

import { GET } from './route'
import { NextRequest } from 'next/server'

const call = (qs = '', auth: string | null = 'Bearer s3cret') =>
  GET(new NextRequest(`http://localhost/api/cron/expo-sequence${qs}`, { headers: auth ? { authorization: auth } : {} }))

const lead = (id: string, over: Record<string, unknown> = {}) => ({
  id, name: 'Asha', email: `${id}@example.com`, preferred_day: '28 Nov', pain_point: 'invoices',
  status: 'new', email_opt_out: false, created_at: '2026-11-10T06:00:00Z', ...over,
})

beforeEach(() => {
  process.env.CRON_SECRET = 's3cret'
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-27T05:00:00Z')) // 27 Nov IST: reminder day for a "28 Nov" lead
  deliver.mockReset().mockResolvedValue('sent')
  disabled = false
  leadsResult = { data: [lead('a')], error: null }
  sentResult = { data: [{ lead_id: 'a', kind: 'confirmation' }], error: null }
})
afterEach(() => vi.useRealTimers())

describe('GET /api/cron/expo-sequence', () => {
  it('rejects a missing or wrong secret', async () => {
    expect((await call('', null)).status).toBe(401)
    expect((await call('', 'Bearer nope')).status).toBe(401)
    expect(deliver).not.toHaveBeenCalled()
  })

  it('does nothing when switched off', async () => {
    disabled = true
    expect(await (await call()).json()).toMatchObject({ skipped: true, reason: 'EXPO_SEQUENCE_DISABLED' })
    expect(deliver).not.toHaveBeenCalled()
  })

  it('sends the due reminder, one email per lead', async () => {
    const body = await (await call()).json()
    expect(body).toMatchObject({ sent: 1, due: 1 })
    expect(deliver).toHaveBeenCalledTimes(1)
    expect(deliver).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 'a' }), 'reminder')
  })

  it('catches up a missing confirmation first', async () => {
    sentResult = { data: [], error: null }
    await call()
    expect(deliver).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 'a' }), 'confirmation')
  })

  it('dry run lists what would go out and sends nothing', async () => {
    const body = await (await call('?dry=1')).json()
    expect(body).toMatchObject({ dry: true, due: 1, plan: [{ id: 'a', kind: 'reminder' }] })
    expect(deliver).not.toHaveBeenCalled()
  })

  it('skips leads with nothing due and counts skipped/failed outcomes', async () => {
    leadsResult = { data: [lead('a'), lead('b', { preferred_day: '29 Nov' })], error: null } // b is reminded 28 Nov, not today
    sentResult = { data: [{ lead_id: 'a', kind: 'confirmation' }, { lead_id: 'b', kind: 'confirmation' }], error: null }
    deliver.mockResolvedValue('failed')
    const body = await (await call()).json()
    expect(body).toMatchObject({ due: 1, failed: 1, sent: 0 })
  })

  it('stops, rather than risk re-sending, when send tracking is unavailable', async () => {
    sentResult = { data: null, error: { message: 'relation "expo_lead_emails" does not exist' } }
    expect(await (await call()).json()).toMatchObject({ skipped: true, reason: 'expo_lead_emails unavailable' })
    expect(deliver).not.toHaveBeenCalled()
  })

  it('skips quietly when the leads table is not there yet', async () => {
    leadsResult = { data: null, error: { message: 'relation "expo_leads" does not exist' } }
    expect(await (await call()).json()).toMatchObject({ skipped: true })
  })
})
