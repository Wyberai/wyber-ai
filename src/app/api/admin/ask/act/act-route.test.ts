import { describe, it, expect, vi, beforeEach } from 'vitest'

let isAdmin = true
const exec = vi.fn()
vi.mock('@/lib/crm/admin-auth', () => ({ getCrmAdmin: async () => (isAdmin ? { user: { email: 'hello@wyberai.com' }, admin: {} } : { user: null, admin: null }) }))
vi.mock('@/lib/ops/ask/actions', async (orig) => ({ ...(await orig<typeof import('@/lib/ops/ask/actions')>()), executeAction: (...a: unknown[]) => exec(...a) }))
vi.mock('@/lib/ops/agents/llm', () => ({ anthropicCaller: () => async () => ({}) }))

import { POST } from './route'
import { NextRequest } from 'next/server'

const CID = '11111111-1111-1111-1111-111111111111'
const call = (body: unknown) => POST(new NextRequest('http://localhost/api/admin/ask/act', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }))

beforeEach(() => { isAdmin = true; process.env.ANTHROPIC_API_KEY = 'k'; delete process.env.OPS_AGENTS_DISABLED; exec.mockReset().mockResolvedValue({ ok: true, message: 'Done.' }) })

describe('POST /api/admin/ask/act', () => {
  it('refuses a non-admin and runs nothing', async () => {
    isAdmin = false
    expect((await call({ action: { kind: 'add_note', contact_id: CID, text: 'x' } })).status).toBe(401)
    expect(exec).not.toHaveBeenCalled()
  })
  it('re-validates the action itself: unknown kinds, send-like kinds and bad ids are refused', async () => {
    for (const action of [{ kind: 'send_message', contact_id: CID, text: 'hi' }, { kind: 'add_note', contact_id: 'bad', text: 'x' }, { kind: 'run_agent', agent: 'nope' }, null]) {
      expect((await call({ action })).status).toBe(400)
    }
    expect(exec).not.toHaveBeenCalled()
  })
  it('runs a valid action once and returns its message', async () => {
    const r = await call({ action: { kind: 'add_note', contact_id: CID, text: 'Prefers WhatsApp' } })
    expect(await r.json()).toEqual({ ok: true, message: 'Done.' })
    expect(exec).toHaveBeenCalledTimes(1)
  })
  it('running an agent needs the key and respects the global off switch', async () => {
    delete process.env.ANTHROPIC_API_KEY
    expect((await call({ action: { kind: 'run_agent', agent: 'followup' } })).status).toBe(503)
    process.env.ANTHROPIC_API_KEY = 'k'; process.env.OPS_AGENTS_DISABLED = 'true'
    expect((await call({ action: { kind: 'run_agent', agent: 'followup' } })).status).toBe(409)
    expect(exec).not.toHaveBeenCalled()
  })
  it('a refused action is a clear 409 and a crash says nothing was changed', async () => {
    exec.mockResolvedValue({ ok: false, error: 'That quote is already marked paid' })
    expect((await call({ action: { kind: 'mark_quote_paid', quote_id: '22222222-2222-2222-2222-222222222222' } })).status).toBe(409)
    exec.mockRejectedValue(new Error('secret db detail'))
    const r = await call({ action: { kind: 'add_note', contact_id: CID, text: 'x' } })
    expect(r.status).toBe(500)
    const j = JSON.stringify(await r.json())
    expect(j).toContain('Nothing was changed')
    expect(j).not.toContain('secret db detail')
  })
})
