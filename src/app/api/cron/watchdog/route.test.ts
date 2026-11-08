import { describe, it, expect, vi, beforeEach } from 'vitest'

const send = vi.fn()
const load = vi.fn()
vi.mock('@/lib/supabase/server', () => ({ createAdminClient: async () => ({}) }))
vi.mock('@/lib/email', () => ({ sendHealthAlert: (...a: unknown[]) => send(...a) }))
vi.mock('@/lib/ops/health-load', () => ({ loadHealth: (...a: unknown[]) => load(...a) }))

import { GET } from './route'
import { NextRequest } from 'next/server'

const call = (qs = '', auth: string | null = 'Bearer s3cret') => GET(new NextRequest(`http://localhost/api/cron/watchdog${qs}`, { headers: auth ? { authorization: auth } : {} }))
const issue = { id: 'ai_key', severity: 'error', what: 'ANTHROPIC_API_KEY is not set.', fix: 'Add it.' }

beforeEach(() => { process.env.CRON_SECRET = 's3cret'; delete process.env.WATCHDOG_DISABLED; send.mockReset().mockResolvedValue({ id: 'm' }); load.mockReset().mockResolvedValue([]) })

describe('GET /api/cron/watchdog', () => {
  it('rejects a missing or wrong secret', async () => {
    expect((await call('', null)).status).toBe(401)
    expect((await call('', 'Bearer nope')).status).toBe(401)
    expect(load).not.toHaveBeenCalled()
  })
  it('can be switched off', async () => {
    process.env.WATCHDOG_DISABLED = 'true'
    expect(await (await call()).json()).toMatchObject({ skipped: true })
    expect(load).not.toHaveBeenCalled()
  })
  it('stays silent when healthy: no email', async () => {
    expect(await (await call()).json()).toMatchObject({ ok: true, issues: [] })
    expect(send).not.toHaveBeenCalled()
  })
  it('emails only when something is wrong, with a problem subject for errors', async () => {
    load.mockResolvedValue([issue])
    expect(await (await call()).json()).toEqual({ ok: true, alerted: 1 })
    expect(send.mock.calls[0][0].subject).toBe('Problem: 1 thing needs attention in WyberAi')
    expect(send.mock.calls[0][0].text).toContain('What to do: Add it.')
    load.mockResolvedValue([{ ...issue, severity: 'warn' }, { ...issue, id: 'x', severity: 'warn' }])
    await call()
    expect(send.mock.calls[1][0].subject).toBe('Check: 2 things need attention in WyberAi')
  })
  it('dry run reports findings and sends nothing; a send failure is a clean 502', async () => {
    load.mockResolvedValue([issue])
    expect(await (await call('?dry=1')).json()).toMatchObject({ dry: true, issues: [issue] })
    expect(send).not.toHaveBeenCalled()
    send.mockRejectedValue(new Error('smtp secret detail'))
    const r = await call()
    expect(r.status).toBe(502)
    expect(JSON.stringify(await r.json())).not.toContain('secret detail')
  })
})
