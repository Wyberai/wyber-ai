import { describe, it, expect, vi, beforeEach } from 'vitest'

let isAdmin = true
const askFn = vi.fn()
vi.mock('@/lib/crm/admin-auth', () => ({ getCrmAdmin: async () => (isAdmin ? { user: { email: 'hello@wyberai.com' }, admin: {} } : { user: null, admin: null }) }))
vi.mock('@/lib/ops/ask/run', async (orig) => ({ ...(await orig<typeof import('@/lib/ops/ask/run')>()), ask: (...a: unknown[]) => askFn(...a), anthropicStep: () => async () => ({}) }))

import { POST } from './route'
import { NextRequest } from 'next/server'

const call = (body: unknown) => POST(new NextRequest('http://localhost/api/admin/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }))

beforeEach(() => { isAdmin = true; process.env.ANTHROPIC_API_KEY = 'k'; askFn.mockReset().mockResolvedValue({ reply: 'Five deals.', toolsUsed: ['pipeline_summary', 'pipeline_summary'], steps: 2 }) })

describe('POST /api/admin/ask', () => {
  it('refuses anyone who is not the admin, before doing any work', async () => {
    isAdmin = false
    expect((await call({ messages: [{ role: 'user', content: 'hi' }] })).status).toBe(401)
    expect(askFn).not.toHaveBeenCalled()
  })
  it('says plainly when the AI key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY
    expect((await call({ messages: [{ role: 'user', content: 'hi' }] })).status).toBe(503)
  })
  it('rejects a body that is not a list of user/assistant text turns', async () => {
    expect((await call({ messages: [{ role: 'system', content: 'x' }] })).status).toBe(400)
    expect((await call({})).status).toBe(400)
    expect(askFn).not.toHaveBeenCalled()
  })
  it('returns the answer and which data it looked at, without duplicates', async () => {
    const r = await call({ messages: [{ role: 'user', content: 'How many deals?' }] })
    expect(await r.json()).toEqual({ reply: 'Five deals.', toolsUsed: ['pipeline_summary'] })
  })
  it('a model failure is a clean error, not a stack trace', async () => {
    askFn.mockRejectedValue(new Error('upstream 500 secret detail'))
    const r = await call({ messages: [{ role: 'user', content: 'hi' }] })
    expect(r.status).toBe(502)
    expect(JSON.stringify(await r.json())).not.toContain('secret detail')
  })
})
