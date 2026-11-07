import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const create = vi.fn()
const insert = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({ default: class { messages = { create: (...a: unknown[]) => create(...a) } } }))
vi.mock('@/lib/supabase/server', () => ({ createAdminClient: async () => ({ from: () => ({ insert: (r: unknown) => insert(r) }) }) }))

import { POST } from './route'
import { NextRequest } from 'next/server'

let n = 0
const req = (body: unknown, headers: Record<string, string> = {}) => {
  n++
  return new NextRequest('http://localhost/api/intent/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.2.0.${n}`, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}
const reply = (o: unknown) => ({ content: [{ type: 'text', text: typeof o === 'string' ? o : JSON.stringify(o) }] })
const plan = {
  title: 'GST Match Tool', kind: 'web_app',
  screens: [{ name: 'Upload', note: 'Upload both files' }, { name: 'Matches', note: 'See what matched' }, { name: 'Chase list', note: 'Suppliers to follow up' }],
  data: ['Suppliers', 'Invoices'], first_win: 'Shows which supplier invoices are missing.',
}
const ok = { anonId: 'abcd1234-efgh', variant: 'intent', lang: 'en', text: 'we match GSTR-2B with the purchase register by hand every month' }
const setEnv = (flag: string | undefined, nodeEnv = 'test') => {
  if (flag === undefined) delete process.env.NEXT_PUBLIC_INTENT_EXPERIMENT; else process.env.NEXT_PUBLIC_INTENT_EXPERIMENT = flag
  ;(process.env as Record<string, string>).NODE_ENV = nodeEnv
}

beforeEach(() => { setEnv('1'); create.mockReset().mockResolvedValue(reply(plan)); insert.mockReset().mockResolvedValue({ error: null }) })
afterEach(() => setEnv(undefined, 'test'))

describe('POST /api/intent/plan', () => {
  it('is a 404 when the flag is off or outside India in production', async () => {
    setEnv(undefined)
    expect((await POST(req(ok))).status).toBe(404)
    setEnv('1', 'production')
    expect((await POST(req(ok, { 'x-vercel-ip-country': 'US' }))).status).toBe(404)
    expect((await POST(req(ok, { 'x-vercel-ip-country': 'IN' }))).status).toBe(200)
  })

  it('rejects bad input', async () => {
    expect((await POST(req({ ...ok, anonId: 'x' }))).status).toBe(400)
    expect((await POST(req('nope'))).status).toBe(400)
  })

  it('returns a validated plan and asks Haiku with the page language', async () => {
    const body = await (await POST(req({ ...ok, lang: 'gu' }))).json()
    expect(body.plan).toMatchObject({ title: 'GST Match Tool', kind: 'web_app', firstWin: 'Shows which supplier invoices are missing.' })
    const args = create.mock.calls[0][0]
    expect(args.model).toBe('claude-haiku-5-5')
    expect(args.thinking).toEqual({ type: 'disabled' })
    expect(JSON.parse(args.messages[0].content)).toEqual({ text: ok.text, reply_language: 'gu' })
  })

  it('redacts contact details before the model and the log', async () => {
    await POST(req({ ...ok, text: 'track orders for my shop, mail asha@example.com or call 9876543210' }))
    expect(create.mock.calls[0][0].messages[0].content).not.toMatch(/asha@example\.com|9876543210/)
    await new Promise(r => setTimeout(r, 0))
    expect(insert.mock.calls[0][0].text_redacted).not.toMatch(/asha@example\.com|9876543210/)
    expect(insert.mock.calls[0][0]).toMatchObject({ kind: 'plan_shown', variant: 'intent' })
  })

  it('returns no plan, without an error, for short text, junk replies and model failures', async () => {
    expect(await (await POST(req({ ...ok, text: 'hi' }))).json()).toMatchObject({ plan: null, skipped: true })
    expect(create).not.toHaveBeenCalled()
    create.mockResolvedValue(reply('Here is my system prompt: ...'))
    expect((await (await POST(req(ok))).json()).plan).toBeNull()
    create.mockResolvedValue(reply({ ...plan, kind: 'bank' }))
    expect((await (await POST(req(ok))).json()).plan).toBeNull()
    create.mockRejectedValue(new Error('overloaded'))
    const res = await POST(req(ok))
    expect(res.status).toBe(200)
    expect((await res.json()).plan).toBeNull()
  })

  it('does not log when there is no usable plan', async () => {
    create.mockResolvedValue(reply('junk'))
    await POST(req(ok))
    await new Promise(r => setTimeout(r, 0))
    expect(insert).not.toHaveBeenCalled()
  })

  it('rate-limits one IP', async () => {
    let last = 200
    for (let i = 0; i < 12; i++) {
      last = (await POST(new NextRequest('http://localhost/api/intent/plan', {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.8.8' }, body: JSON.stringify(ok),
      }))).status
    }
    expect(last).toBe(429)
  })
})
