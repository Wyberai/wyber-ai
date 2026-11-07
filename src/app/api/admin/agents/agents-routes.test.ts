import { describe, it, expect, vi, beforeEach } from 'vitest'

let isAdmin = true
const fake = { from: vi.fn() }
const runAgent = vi.fn()
const runAll = vi.fn()

vi.mock('@/lib/crm/admin-auth', () => ({ getCrmAdmin: async () => (isAdmin ? { user: { email: 'hello@wyberai.com' }, admin: fake } : { user: null, admin: null }) }))
vi.mock('@/lib/ops/agents/llm', () => ({ anthropicCaller: () => async () => ({ text: '', inputTokens: 0, outputTokens: 0, model: 'm' }) }))
vi.mock('@/lib/ops/agents/run', () => ({ runAgent: (...a: unknown[]) => runAgent(...a), runAll: (...a: unknown[]) => runAll(...a), pickCandidates: () => [] }))

import { GET as stateGet } from './state/route'
import { PATCH as draftPatch } from './drafts/[id]/route'
import { POST as runPost } from './run/route'
import { PATCH as settingsPatch } from './settings/route'
import { NextRequest } from 'next/server'

const ID = '11111111-1111-1111-1111-111111111111'
const CID = '22222222-2222-2222-2222-222222222222'
const req = (body?: unknown, method = 'POST') => new NextRequest('http://localhost/x', { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
const ctx = (id = ID) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  isAdmin = true
  fake.from.mockReset(); runAgent.mockReset(); runAll.mockReset()
  process.env.ANTHROPIC_API_KEY = 'sk-test'
  delete process.env.OPS_AGENTS_DISABLED
})

describe('auth', () => {
  it('every agents route refuses a non-admin', async () => {
    isAdmin = false
    const rs = await Promise.all([stateGet(), draftPatch(req({ action: 'approve' }, 'PATCH'), ctx()), runPost(req({})), settingsPatch(req({ agent: 'outreach', enabled: false }, 'PATCH'))])
    expect(rs.map(r => r.status)).toEqual([401, 401, 401, 401])
    expect(runAgent).not.toHaveBeenCalled()
  })
})

describe('POST /run', () => {
  it('refuses when all agents are off or the AI key is missing', async () => {
    process.env.OPS_AGENTS_DISABLED = 'true'
    expect((await runPost(req({}))).status).toBe(409)
    delete process.env.OPS_AGENTS_DISABLED
    delete process.env.ANTHROPIC_API_KEY
    const r = await runPost(req({}))
    expect(r.status).toBe(409)
    expect((await r.json()).error).toMatch(/ANTHROPIC_API_KEY/)
    expect(runAgent).not.toHaveBeenCalled()
  })

  it('runs one named agent, or all of them, and rejects an unknown name', async () => {
    runAgent.mockResolvedValue({ agent: 'outreach', created: 3 })
    runAll.mockResolvedValue([{ agent: 'outreach' }, { agent: 'followup' }])
    expect((await (await runPost(req({ agent: 'outreach' }))).json()).results).toEqual([{ agent: 'outreach', created: 3 }])
    expect(runAgent.mock.calls[0][0]).toBe('outreach')
    expect((await (await runPost(req({}))).json()).results).toHaveLength(2)
    expect((await runPost(req({ agent: 'hacker' }))).status).toBe(400)
  })
})

describe('PATCH /settings', () => {
  it('validates the agent and the flag, then upserts', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    fake.from.mockReturnValue({ upsert })
    expect((await settingsPatch(req({ agent: 'nope', enabled: true }, 'PATCH'))).status).toBe(400)
    expect((await settingsPatch(req({ agent: 'outreach', enabled: 'yes' }, 'PATCH'))).status).toBe(400)
    expect((await settingsPatch(req({ agent: 'outreach', enabled: false }, 'PATCH'))).status).toBe(200)
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ agent: 'outreach', enabled: false }))
  })
})

describe('PATCH /drafts/[id]', () => {
  const draft = { id: ID, agent: 'outreach', contact_id: CID, channel: 'whatsapp', body: 'Hi Asha, I am at booth S23. Want a free slot?', status: 'pending' }
  const contact = { id: CID, name: 'Asha', stage: 'new', phone: '9876543210', source: 'expo' }

  function wire(d: unknown) {
    const draftUpdate = vi.fn()
    const contactUpdate = vi.fn()
    const activityInsert = vi.fn().mockResolvedValue({ error: null })
    fake.from.mockImplementation((t: string) => {
      if (t === 'ops_agent_drafts') return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: d, error: null }) }) }),
        update: (p: unknown) => { draftUpdate(p); return { eq: () => ({ select: () => ({ single: async () => ({ data: { ...(d as object), ...(p as object) }, error: null }) }) }) } },
      }
      if (t === 'crm_contacts') return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: contact, error: null }) }) }),
        update: (p: unknown) => { contactUpdate(p); return { eq: async () => ({ error: null }) } },
      }
      return { insert: activityInsert }
    })
    return { draftUpdate, contactUpdate, activityInsert }
  }

  it('rejects a bad id, an unknown action, a missing draft, and a rejection with no reason', async () => {
    expect((await draftPatch(req({ action: 'approve' }, 'PATCH'), ctx('bad'))).status).toBe(400)
    wire(draft)
    expect((await draftPatch(req({ action: 'explode' }, 'PATCH'), ctx())).status).toBe(400)
    expect((await draftPatch(req({ action: 'reject', reason: ' ' }, 'PATCH'), ctx())).status).toBe(400)
    wire(null)
    expect((await draftPatch(req({ action: 'approve' }, 'PATCH'), ctx())).status).toBe(404)
  })

  it('marking sent updates the draft, moves the lead to contacted with a follow-up, and logs the activity', async () => {
    const w = wire(draft)
    const res = await draftPatch(req({ action: 'sent' }, 'PATCH'), ctx())
    expect(res.status).toBe(200)
    expect(w.draftUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'sent' }))
    expect(w.contactUpdate).toHaveBeenCalledWith(expect.objectContaining({ stage: 'contacted', next_action: 'Follow up' }))
    expect(w.activityInsert).toHaveBeenCalledWith(expect.objectContaining({ contact_id: CID, kind: 'whatsapp' }))
  })

  it('approving or editing touches only the draft', async () => {
    const w = wire(draft)
    await draftPatch(req({ action: 'approve' }, 'PATCH'), ctx())
    await draftPatch(req({ action: 'edit', body: 'Hi Asha, edited text goes here.' }, 'PATCH'), ctx())
    expect(w.draftUpdate).toHaveBeenCalledTimes(2)
    expect(w.contactUpdate).not.toHaveBeenCalled()
    expect(w.activityInsert).not.toHaveBeenCalled()
  })

  it('will not act on a draft that is already finished', async () => {
    wire({ ...draft, status: 'sent' })
    expect((await draftPatch(req({ action: 'approve' }, 'PATCH'), ctx())).status).toBe(400)
  })
})

describe('GET /state', () => {
  it('reports when the tables are not there yet, instead of failing', async () => {
    fake.from.mockReturnValue({ select: () => ({ in: () => ({ order: () => ({ limit: async () => ({ data: null, error: { message: 'relation "ops_agent_drafts" does not exist' } }) }) }) }) })
    const body = await (await stateGet()).json()
    expect(body).toMatchObject({ tablesMissing: true })
  })

  it('returns drafts with their contact, each agent switch and last run, and whether the key is set', async () => {
    const draft = { id: ID, agent: 'outreach', contact_id: CID, status: 'pending', created_at: '2026-11-10T00:00:00Z' }
    fake.from.mockImplementation((t: string) => {
      if (t === 'ops_agent_drafts') return { select: () => ({ gte: () => ({ limit: async () => ({ data: [{ agent: 'outreach', status: 'sent', edited: false, created_at: new Date().toISOString() }], error: null }) }), in: (_c: string, st: string[]) => ({ order: () => ({ limit: async () => ({ data: st.includes('pending') ? [draft] : [], error: null }) }) }) }) }
      if (t === 'crm_contacts') return { select: () => ({ in: async () => ({ data: [{ id: CID, name: 'Asha' }], error: null }) }) }
      if (t === 'ops_agent_settings') return { select: async () => ({ data: [{ agent: 'followup', enabled: false }], error: null }) }
      return { select: () => ({ order: () => ({ limit: async () => ({ data: [{ agent: 'outreach', started_at: 'x', created: 2 }], error: null }) }) }) }
    })
    const body = await (await stateGet()).json()
    expect(body.drafts[0].contact).toMatchObject({ name: 'Asha' })
    expect(body.agents.find((a: { id: string }) => a.id === 'followup').enabled).toBe(false)
    expect(body.agents.find((a: { id: string }) => a.id === 'outreach').enabled).toBe(true)
    expect(body.agents.find((a: { id: string }) => a.id === 'outreach').lastRun).toMatchObject({ created: 2 })
    expect(body.results).toMatchObject({ totalMade: 1, totalUsed: 1 })
    expect(body.aiConfigured).toBe(true)
  })
})
