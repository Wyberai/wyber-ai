import { describe, it, expect, vi, beforeEach } from 'vitest'

const send = vi.fn()
vi.mock('@/lib/supabase/server', () => ({ createAdminClient: async () => ({ from: () => { throw new Error('tables unavailable') } }) }))
vi.mock('@/lib/email', () => ({ sendWeeklyReport: (...a: unknown[]) => send(...a) }))
vi.mock('@/lib/crm/db', () => ({ loadContacts: async () => { throw new Error('no crm') } }))

import { GET } from './route'
import { NextRequest } from 'next/server'

const call = (qs = '', auth: string | null = 'Bearer s3cret') => GET(new NextRequest(`http://localhost/api/cron/weekly-report${qs}`, { headers: auth ? { authorization: auth } : {} }))

beforeEach(() => { process.env.CRON_SECRET = 's3cret'; delete process.env.WEEKLY_REPORT_DISABLED; send.mockReset().mockResolvedValue({ id: 'm' }) })

describe('GET /api/cron/weekly-report', () => {
  it('rejects a missing or wrong secret and sends nothing', async () => {
    expect((await call('', null)).status).toBe(401)
    expect((await call('', 'Bearer nope')).status).toBe(401)
    expect(send).not.toHaveBeenCalled()
  })
  it('can be switched off', async () => {
    process.env.WEEKLY_REPORT_DISABLED = 'true'
    expect(await (await call()).json()).toMatchObject({ skipped: true })
    expect(send).not.toHaveBeenCalled()
  })
  it('still produces a report when every data source fails, and says what it could not read', async () => {
    const body = await (await call('?dry=1')).json()
    expect(body.dry).toBe(true)
    expect(body.text).toContain('Signup numbers could not be read')
    expect(send).not.toHaveBeenCalled()
  })
  it('sends the report by email, and a send failure is a clean 502', async () => {
    expect(await (await call()).json()).toEqual({ ok: true })
    expect(send).toHaveBeenCalledTimes(1)
    send.mockRejectedValue(new Error('smtp secret detail'))
    const r = await call()
    expect(r.status).toBe(502)
    expect(JSON.stringify(await r.json())).not.toContain('secret detail')
  })
})
