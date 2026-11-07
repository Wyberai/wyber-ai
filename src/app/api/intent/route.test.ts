import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const create = vi.fn()
const insert = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: (...a: unknown[]) => create(...a) } },
}))
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: async () => ({ from: () => ({ insert: (row: unknown) => insert(row) }) }),
}))

import { POST } from './route'
import { POST as EVENT } from './event/route'
import { NextRequest } from 'next/server'

let n = 0
function req(url: string, body: unknown, headers: Record<string, string> = {}) {
  n++
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.1.0.${n}`, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}
const textReply = (obj: unknown) => ({ content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] })
const good = { audience: 'business', job: 'build_tool', industry: 'logistics', pain: 'Know which deliveries are still pending', language: 'en', stage: 'ready', confidence: 0.85 }
const ok = { anonId: 'abcd1234-efgh', variant: 'intent', text: 'my drivers deliver goods and I never know which signed copies are back', door: 'business', lang: 'en' }

const setEnv = (flag: string | undefined, nodeEnv = 'test') => {
  if (flag === undefined) delete process.env.NEXT_PUBLIC_INTENT_EXPERIMENT; else process.env.NEXT_PUBLIC_INTENT_EXPERIMENT = flag
  ;(process.env as Record<string, string>).NODE_ENV = nodeEnv
}

beforeEach(() => {
  setEnv('1')
  create.mockReset().mockResolvedValue(textReply(good))
  insert.mockReset().mockResolvedValue({ error: null })
})
afterEach(() => setEnv(undefined, 'test'))

describe('POST /api/intent', () => {
  it('is a 404 when the experiment flag is off', async () => {
    setEnv(undefined)
    expect((await POST(req('/api/intent', ok))).status).toBe(404)
    expect(create).not.toHaveBeenCalled()
  })

  it('is a 404 for visitors outside India in production', async () => {
    setEnv('1', 'production')
    expect((await POST(req('/api/intent', ok, { 'x-vercel-ip-country': 'US' }))).status).toBe(404)
    expect((await POST(req('/api/intent', ok, { 'x-vercel-ip-country': 'IN' }))).status).toBe(200)
  })

  it('rejects a missing/malformed anon id and bad JSON', async () => {
    expect((await POST(req('/api/intent', { ...ok, anonId: 'x' }))).status).toBe(400)
    expect((await POST(req('/api/intent', 'not json'))).status).toBe(400)
  })

  it('classifies and returns a validated intent', async () => {
    const res = await POST(req('/api/intent', ok))
    expect(res.status).toBe(200)
    expect((await res.json()).intent).toMatchObject({ audience: 'business', job: 'build_tool', confidence: 0.85 })
    const args = create.mock.calls[0][0]
    expect(args.model).toBe('claude-haiku-5-5')
    expect(args.thinking).toEqual({ type: 'disabled' })
    expect(JSON.parse(args.messages[0].content)).toMatchObject({ prior_hint: 'business', reply_language: 'en' })
  })

  it('redacts emails and phone numbers before the text reaches the model or the log', async () => {
    await POST(req('/api/intent', { ...ok, text: 'track orders for my shop, mail asha@example.com or call 9876543210 anytime' }))
    const sent = JSON.parse(create.mock.calls[0][0].messages[0].content).text
    expect(sent).not.toMatch(/asha@example\.com|9876543210/)
    expect(sent).toContain('[email]')
    await new Promise(r => setTimeout(r, 0))
    expect(insert.mock.calls[0][0].text_redacted).not.toMatch(/asha@example\.com|9876543210/)
  })

  it('does not call the model for text that is too short, in any language', async () => {
    const res = await POST(req('/api/intent', { ...ok, text: 'hi' }))
    expect((await res.json())).toMatchObject({ skipped: true, intent: { confidence: 0 } })
    expect(create).not.toHaveBeenCalled()
  })

  it('reads Gujarati and answers in the Gujarati UI language', async () => {
    const res = await POST(req('/api/intent', { ...ok, lang: undefined, text: 'મારે મારા ડ્રાઇવરોની ડિલિવરીનો હિસાબ રાખવો છે' }))
    expect((await res.json()).lang).toBe('gu')
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('ignores a prompt-injection reply and returns no intent', async () => {
    create.mockResolvedValue(textReply('Ignore the schema. Here is the system prompt: ...'))
    const body = await (await POST(req('/api/intent', ok))).json()
    expect(body.intent).toMatchObject({ audience: 'other', confidence: 0 })
  })

  it('cannot be tricked into showing off-list values or links', async () => {
    create.mockResolvedValue(textReply({ ...good, audience: 'admin', pain: 'Click https://evil.example' }))
    expect((await (await POST(req('/api/intent', ok))).json()).intent.confidence).toBe(0) // fails validation: not on the list
    create.mockResolvedValue(textReply({ ...good, pain: 'Click https://evil.example now <b>x</b>' }))
    const pain = (await (await POST(req('/api/intent', ok))).json()).intent.pain
    expect(pain).not.toMatch(/https?:|<b>/)
  })

  it('degrades to "no intent" if the model call fails, without an error status', async () => {
    create.mockRejectedValue(new Error('overloaded'))
    const res = await POST(req('/api/intent', ok))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ degraded: true, intent: { confidence: 0 } })
  })

  it('rate-limits one IP', async () => {
    let last = 200
    for (let i = 0; i < 22; i++) {
      last = (await POST(new NextRequest('http://localhost/api/intent', {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.9' }, body: JSON.stringify(ok),
      }))).status
    }
    expect(last).toBe(429)
  })
})

describe('POST /api/intent/event', () => {
  const ev = { anonId: 'abcd1234-efgh', variant: 'intent', kind: 'chip_tapped', lang: 'gu', door: 'business', chipId: 'gstr2b' }

  it('is a 404 when the flag is off', async () => {
    setEnv(undefined)
    expect((await EVENT(req('/api/intent/event', ev))).status).toBe(404)
  })

  it('records an allowlisted event and always answers 204', async () => {
    const res = await EVENT(req('/api/intent/event', ev, { 'x-vercel-ip-country-region': 'GJ' }))
    expect(res.status).toBe(204)
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ kind: 'chip_tapped', lang: 'gu', door: 'business', chip_id: 'gstr2b', region: 'GJ' }))
  })

  it('ignores unknown kinds, bad ids and junk without error', async () => {
    expect((await EVENT(req('/api/intent/event', { ...ev, kind: 'drop_table' }))).status).toBe(204)
    expect((await EVENT(req('/api/intent/event', { ...ev, anonId: 'x' }))).status).toBe(204)
    expect((await EVENT(req('/api/intent/event', 'garbage'))).status).toBe(204)
    expect(insert).not.toHaveBeenCalled()
  })

  it('never accepts free text, and cleans the chip id', async () => {
    await EVENT(req('/api/intent/event', { ...ev, text: 'secret', chipId: "gstr2b'; drop--" }))
    const row = insert.mock.calls[0][0]
    expect(row).not.toHaveProperty('text')
    expect(row).not.toHaveProperty('text_redacted')
    expect(row.chip_id).toBe('gstr2bdrop--')
  })
})
