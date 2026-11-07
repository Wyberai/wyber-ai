import { describe, it, expect, vi, beforeEach } from 'vitest'

const send = vi.fn()
const loadContacts = vi.fn()
const syncIncoming = vi.fn()
const collectIncoming = vi.fn()

vi.mock('@/lib/supabase/server', () => ({ createAdminClient: async () => ({}) }))
vi.mock('@/lib/email', () => ({ sendCrmDailyBrief: (...a: unknown[]) => send(...a) }))
vi.mock('@/lib/crm/db', () => ({
  loadContacts: (...a: unknown[]) => loadContacts(...a),
  syncIncoming: (...a: unknown[]) => syncIncoming(...a),
  collectIncoming: (...a: unknown[]) => collectIncoming(...a),
}))

import { GET } from './route'
import { NextRequest } from 'next/server'

const call = (qs = '', auth: string | null = 'Bearer s3cret') =>
  GET(new NextRequest(`http://localhost/api/cron/crm-brief${qs}`, { headers: auth ? { authorization: auth } : {} }))

const contact = (o: Record<string, unknown> = {}) => ({
  id: 'c1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), name: 'Asha', stage: 'new', source: 'expo', score: 60,
  value_usd: 0, next_action: null, next_action_at: null, last_touch_at: null, closed_at: null, tags: [], ...o,
})

beforeEach(() => {
  process.env.CRON_SECRET = 's3cret'
  delete process.env.CRM_BRIEF_DISABLED
  send.mockReset().mockResolvedValue({ id: 'm1' })
  loadContacts.mockReset().mockResolvedValue([contact({ created_at: new Date(Date.now() - 6 * 3600_000).toISOString() })])
  collectIncoming.mockReset().mockResolvedValue({ incoming: [], counts: {}, warnings: [] })
  syncIncoming.mockReset().mockResolvedValue({ inserted: 2, updated: 1, skippedOwned: 0, skippedInvalid: 0, errors: [] })
})

describe('GET /api/cron/crm-brief', () => {
  it('rejects a missing or wrong secret', async () => {
    expect((await call('', null)).status).toBe(401)
    expect((await call('', 'Bearer nope')).status).toBe(401)
    expect(send).not.toHaveBeenCalled()
  })

  it('can be switched off', async () => {
    process.env.CRM_BRIEF_DISABLED = 'true'
    expect(await (await call()).json()).toMatchObject({ skipped: true, reason: 'CRM_BRIEF_DISABLED' })
    expect(send).not.toHaveBeenCalled()
  })

  it('refreshes the CRM, then emails the brief with the urgent lead on top', async () => {
    const body = await (await call()).json()
    expect(body).toMatchObject({ ok: true, synced: { inserted: 2, updated: 1 }, contacts: 1 })
    expect(syncIncoming).toHaveBeenCalledTimes(1)
    const arg = send.mock.calls[0][0]
    expect(arg.subject).toMatch(/Revenue brief/)
    expect(arg.text).toContain('Reply overdue')
  })

  it('dry run returns the text and sends nothing, and does not touch the data', async () => {
    const body = await (await call('?dry=1')).json()
    expect(body.dry).toBe(true)
    expect(body.text).toContain('Revenue brief')
    expect(send).not.toHaveBeenCalled()
    expect(syncIncoming).not.toHaveBeenCalled()
  })

  it('still sends the brief when the source sync fails', async () => {
    collectIncoming.mockRejectedValue(new Error('source down'))
    expect((await call()).status).toBe(200)
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('skips quietly when there are no contacts or the table is missing', async () => {
    loadContacts.mockResolvedValue([])
    expect(await (await call()).json()).toMatchObject({ skipped: true, reason: 'no contacts yet' })
    loadContacts.mockRejectedValue(new Error('relation "crm_contacts" does not exist'))
    expect(await (await call()).json()).toMatchObject({ skipped: true, reason: 'crm_contacts unavailable' })
    expect(send).not.toHaveBeenCalled()
  })

  it('reports a failed send without pretending it worked', async () => {
    send.mockRejectedValue(new Error('smtp down'))
    expect((await call()).status).toBe(502)
  })
})
