import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// sendEmail uses next/server's after(), which only exists inside a request; the transport already tolerates that.
vi.mock('next/server', () => ({ after: () => { throw new Error('not in a request') } }))

const INPUT = { from: 'WyberAi <hello@wyberai.com>', to: 'asha@example.com', subject: 'Hello', html: '<p>Hi</p>', text: 'Hi' }

type Call = { url: string; init: RequestInit }
let calls: Call[]

function mockFetch(handlers: { continuum: () => Response | Promise<Response>; resend?: () => Response | Promise<Response> }) {
  calls = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    if (String(url).includes('api.resend.com')) {
      if (!handlers.resend) throw new Error('unexpected Resend call')
      return handlers.resend()
    }
    return handlers.continuum()
  }))
}
const ok = (body: object) => new Response(JSON.stringify(body), { status: 200 })
const bad = (status: number) => new Response('nope', { status })

async function load() {
  vi.resetModules()
  return (await import('./transport')).sendEmail
}

describe('sendEmail fallback', () => {
  beforeEach(() => {
    process.env.CONTINUUM_API_KEY = 'ck_test'
    process.env.RESEND_API_KEY = 're_test'
    delete process.env.EMAIL_FALLBACK_DISABLED
    delete process.env.ALERT_WEBHOOK_URL
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('uses Continuum only when it works', async () => {
    mockFetch({ continuum: () => ok({ id: 'c1' }) })
    const send = await load()
    expect(await send(INPUT)).toEqual({ id: 'c1' })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toContain('continuumapi.com')
  })

  it('falls back to Resend when Continuum answers 502 (the November outage)', async () => {
    mockFetch({ continuum: () => bad(502), resend: () => ok({ id: 'r1' }) })
    const send = await load()
    expect(await send(INPUT)).toEqual({ id: 'r1' })
    const resend = calls.find(c => c.url.includes('api.resend.com'))!
    const body = JSON.parse(String(resend.init.body))
    expect(body).toMatchObject({ from: INPUT.from, to: ['asha@example.com'], subject: 'Hello', html: '<p>Hi</p>', text: 'Hi' })
    expect((resend.init.headers as Record<string, string>).Authorization).toBe('Bearer re_test')
  })

  it('falls back when Continuum cannot be reached at all', async () => {
    mockFetch({ continuum: () => { throw new Error('connect ETIMEDOUT') }, resend: () => ok({ id: 'r2' }) })
    const send = await load()
    expect(await send(INPUT)).toEqual({ id: 'r2' })
  })

  it('falls back when the Continuum key is missing', async () => {
    delete process.env.CONTINUUM_API_KEY
    mockFetch({ continuum: () => ok({ id: 'never' }), resend: () => ok({ id: 'r3' }) })
    const send = await load()
    expect(await send(INPUT)).toEqual({ id: 'r3' })
    expect(calls.every(c => c.url.includes('api.resend.com'))).toBe(true)
  })

  it('also falls back on a 4xx from Continuum (for example an unverified domain)', async () => {
    mockFetch({ continuum: () => bad(400), resend: () => ok({ id: 'r4' }) })
    const send = await load()
    expect(await send(INPUT)).toEqual({ id: 'r4' })
  })

  it('throws a message naming both routes when both fail', async () => {
    mockFetch({ continuum: () => bad(502), resend: () => bad(403) })
    const send = await load()
    await expect(send(INPUT)).rejects.toThrow(/Continuum send failed.*Resend fallback failed.*403/)
  })

  it('behaves as before when there is no Resend key', async () => {
    delete process.env.RESEND_API_KEY
    mockFetch({ continuum: () => bad(502) })
    const send = await load()
    await expect(send(INPUT)).rejects.toThrow(/Continuum send failed: HTTP 502/)
    expect(calls.some(c => c.url.includes('api.resend.com'))).toBe(false)
  })

  it('can be switched off with EMAIL_FALLBACK_DISABLED=true', async () => {
    process.env.EMAIL_FALLBACK_DISABLED = 'true'
    mockFetch({ continuum: () => bad(502) })
    const send = await load()
    await expect(send(INPUT)).rejects.toThrow(/Continuum send failed/)
    expect(calls.some(c => c.url.includes('api.resend.com'))).toBe(false)
  })

  it('sends each recipient on whichever route works for it', async () => {
    let n = 0
    mockFetch({ continuum: () => (++n === 1 ? ok({ id: 'c1' }) : bad(502)), resend: () => ok({ id: 'r5' }) })
    const send = await load()
    await send({ ...INPUT, to: ['a@example.com', 'b@example.com'] })
    expect(calls.filter(c => c.url.includes('continuumapi.com')).length).toBeGreaterThanOrEqual(2)
    expect(calls.filter(c => c.url.includes('api.resend.com'))).toHaveLength(1)
  })
})
