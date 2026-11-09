import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const alerts: { subject: string; text: string }[] = []
let state: { status: string; since: string; last_alert_at: string | null } | null = null
let tableMissing = false
const upserts: unknown[] = []

vi.mock('@/lib/email', () => ({ sendHealthAlert: vi.fn(async (a: { subject: string; text: string }) => { alerts.push(a) }) }))
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: async () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => (tableMissing ? { data: null, error: { message: 'relation does not exist' } } : { data: state, error: null }) }) }),
      upsert: async (row: unknown) => { upserts.push(row); return { error: null } },
    }),
  }),
}))

import { GET } from './route'

const req = (qs = '', secret = 'sek') => new NextRequest(`https://wyberai.com/api/cron/uptime${qs}`, { headers: { authorization: `Bearer ${secret}` } })
const health = (status: number) => vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status })))

describe('GET /api/cron/uptime', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'sek'
    delete process.env.UPTIME_DISABLED
    alerts.length = 0; upserts.length = 0; state = null; tableMissing = false
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

  async function run(qs = '') {
    const p = GET(req(qs))
    await vi.runAllTimersAsync()
    return (await p).json()
  }

  it('rejects a wrong secret', async () => {
    const res = await GET(req('', 'wrong'))
    expect(res.status).toBe(401)
  })

  it('stays silent when the service is up', async () => {
    health(200)
    const body = await run()
    expect(body.action).toBe('none')
    expect(alerts).toHaveLength(0)
  })

  it('emails once when the service first fails, and records the state', async () => {
    health(502)
    const body = await run()
    expect(body.action).toBe('alert-down')
    expect(alerts).toHaveLength(1)
    expect(alerts[0].subject).toMatch(/DOWN/)
    expect(upserts).toHaveLength(1)
    expect(upserts[0]).toMatchObject({ key: 'continuum', status: 'down' })
  })

  it('does not repeat the alert on the next check', async () => {
    state = { status: 'down', since: new Date(Date.now() - 5 * 60_000).toISOString(), last_alert_at: new Date(Date.now() - 5 * 60_000).toISOString() }
    health(502)
    const body = await run()
    expect(body.action).toBe('none')
    expect(alerts).toHaveLength(0)
  })

  it('says recovered when it comes back', async () => {
    state = { status: 'down', since: new Date(Date.now() - 47 * 60_000).toISOString(), last_alert_at: new Date(Date.now() - 47 * 60_000).toISOString() }
    health(200)
    const body = await run()
    expect(body.action).toBe('alert-recovered')
    expect(alerts[0].subject).toMatch(/Recovered/)
    expect(alerts[0].text).toMatch(/4[67] minutes/)
  })

  it('dry run reports and sends nothing', async () => {
    health(502)
    const body = await run('?dry=1')
    expect(body.ok).toBe(false)
    expect(alerts).toHaveLength(0)
    expect(upserts).toHaveLength(0)
  })

  it('still works when the state table does not exist yet', async () => {
    tableMissing = true
    health(200)
    const body = await run()
    expect(body.stateful).toBe(false)
    expect(body.action).toBe('none')
  })

  it('can be switched off', async () => {
    process.env.UPTIME_DISABLED = 'true'
    const res = await GET(req())
    expect((await res.json()).skipped).toBe(true)
  })
})
