import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mocks ────────────────────────────────────────────────────────────────────
const sync = vi.fn()
let isAdmin = true
const fake = { from: vi.fn() }

vi.mock('@/lib/crm/admin-auth', () => ({ getCrmAdmin: async () => (isAdmin ? { user: { email: 'hello@wyberai.com' }, admin: fake } : { user: null, admin: null }) }))
vi.mock('@/lib/crm/db', () => ({
  loadContacts: async () => [{ id: 'x' }],
  syncIncoming: (...a: unknown[]) => sync(...a),
  collectIncoming: async () => ({ incoming: [{ name: 'A', source: 'expo' }], counts: { expo: 1, consult: 0, signups: 0 }, warnings: [] }),
}))

import { GET as listGet, POST as createPost } from './contacts/route'
import { PATCH } from './contacts/[id]/route'
import { GET as actGet, POST as actPost } from './activities/route'
import { POST as syncPost } from './sync/route'
import { POST as importPost } from './import/route'
import { NextRequest } from 'next/server'

const ID = '11111111-1111-1111-1111-111111111111'
const req = (url: string, body?: unknown, method = 'POST') =>
  new NextRequest(`http://localhost${url}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
const ok = { inserted: 1, updated: 0, skippedOwned: 0, skippedInvalid: 0, errors: [] as string[] }

const contact = { id: ID, name: 'Asha', email: 'asha@example.com', phone: null, phone_norm: null, company: null, title: null, country: null, segment: 'business', source: 'expo', source_ref: 'e1', stage: 'new', value_usd: 0, score: 50, tags: [], next_action: null, next_action_at: null, last_touch_at: null, closed_at: null, lost_reason: null, notes: null, created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:00:00Z' }

beforeEach(() => { isAdmin = true; sync.mockReset().mockResolvedValue(ok); fake.from.mockReset() })

describe('auth', () => {
  it('every CRM route refuses a non-admin', async () => {
    isAdmin = false
    const rs = await Promise.all([
      listGet(), createPost(req('/api/admin/crm/contacts', { name: 'x' })),
      PATCH(req('/api/admin/crm/contacts/' + ID, { stage: 'won' }, 'PATCH'), { params: Promise.resolve({ id: ID }) }),
      actGet(req('/api/admin/crm/activities?contactId=' + ID, undefined, 'GET')), actPost(req('/api/admin/crm/activities', { contactId: ID, summary: 'x' })),
      syncPost(), importPost(req('/api/admin/crm/import', { csv: 'Name\nA' })),
    ])
    expect(rs.map(r => r.status)).toEqual([401, 401, 401, 401, 401, 401, 401])
    expect(sync).not.toHaveBeenCalled()
  })
})

describe('POST /contacts', () => {
  it('needs a name, syncs through the de-duplicating path, and refuses the founder own address', async () => {
    expect((await createPost(req('/x', { name: '  ' }))).status).toBe(400)
    expect((await createPost(req('/x', { name: 'Asha', email: 'asha@example.com', segment: 'business' }))).status).toBe(200)
    expect(sync.mock.calls[0][1][0]).toMatchObject({ name: 'Asha', source: 'manual', segment: 'business' })
    sync.mockResolvedValue({ ...ok, inserted: 0, skippedOwned: 1 })
    expect((await createPost(req('/x', { name: 'Me', email: 'hello@wyberai.com' }))).status).toBe(400)
  })
})

describe('PATCH /contacts/[id]', () => {
  const patch = (body: unknown, id = ID) => PATCH(req('/x', body, 'PATCH'), { params: Promise.resolve({ id }) })
  const wire = (existing: unknown) => {
    const updateSingle = vi.fn().mockResolvedValue({ data: { ...contact, stage: 'contacted' }, error: null })
    const insert = vi.fn().mockResolvedValue({ error: null })
    fake.from.mockImplementation((t: string) => t === 'crm_contacts'
      ? {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existing, error: null }) }) }),
          update: (p: unknown) => ({ eq: () => ({ select: () => ({ single: () => { updateSingle(p); return updateSingle.mock.results[0].value } }) }) }),
        }
      : { insert })
    return { updateSingle, insert }
  }

  it('rejects a bad id, an unknown contact and invalid values', async () => {
    expect((await patch({ stage: 'won' }, 'nope')).status).toBe(400)
    wire(null)
    expect((await patch({ stage: 'won' })).status).toBe(404)
    wire(contact)
    expect((await patch({ stage: 'closed-ish' })).status).toBe(400)
    expect((await patch({ value_usd: -1 })).status).toBe(400)
  })

  it('applies a stage change and writes a system note to the activity log', async () => {
    const w = wire(contact)
    const res = await patch({ stage: 'contacted' })
    expect(res.status).toBe(200)
    expect(w.updateSingle.mock.calls[0][0]).toMatchObject({ stage: 'contacted' })
    expect(w.insert).toHaveBeenCalledWith(expect.objectContaining({ contact_id: ID, kind: 'system', summary: 'Stage: New → Contacted' }))
  })

  it('does not log an activity for a plain field edit', async () => {
    const w = wire(contact)
    await patch({ next_action: 'Call Asha' })
    expect(w.insert).not.toHaveBeenCalled()
  })
})

describe('/activities', () => {
  it('validates the contact id and the text', async () => {
    expect((await actGet(req('/x?contactId=bad', undefined, 'GET'))).status).toBe(400)
    expect((await actPost(req('/x', { contactId: ID, summary: ' ' }))).status).toBe(400)
    expect((await actPost(req('/x', { contactId: 'bad', summary: 'hi' }))).status).toBe(400)
  })

  it('a call counts as a touch on the contact; a private note does not', async () => {
    const update = vi.fn().mockReturnValue({ eq: async () => ({ error: null }) })
    fake.from.mockImplementation((t: string) => t === 'crm_activities'
      ? { insert: () => ({ select: () => ({ single: async () => ({ data: { id: 1, kind: 'call', summary: 'x', created_at: '', by: 'admin' }, error: null }) }) }) }
      : { update })
    expect((await actPost(req('/x', { contactId: ID, kind: 'note', summary: 'private' }))).status).toBe(200)
    expect(update).not.toHaveBeenCalled()
    expect((await actPost(req('/x', { contactId: ID, kind: 'call', summary: 'Spoke for 10 min' }))).status).toBe(200)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ last_touch_at: expect.any(String) }))
  })
})

describe('/activities: they replied', () => {
  const wire = (stage: string, tags: string[] = []) => {
    const update = vi.fn().mockReturnValue({ eq: async () => ({ error: null }) })
    const insert = vi.fn().mockReturnValue({ select: () => ({ single: async () => ({ data: { id: 1, kind: 'whatsapp', summary: 'Replied: x', created_at: '', by: 'admin' }, error: null }) }) })
    fake.from.mockImplementation((t: string) => t === 'crm_activities' ? { insert }
      : { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: ID, stage, tags }, error: null }) }) }), update })
    return { update, insert }
  }

  it('records the reply, moves the deal to Replied and sets an answer task', async () => {
    const { update, insert } = wire('contacted')
    const r = await actPost(req('/x', { contactId: ID, reply: true, channel: 'whatsapp', summary: 'Can you also track job workers?' }))
    expect(r.status).toBe(200)
    expect(await r.json()).toMatchObject({ optedOut: false, stage: 'replied' })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Replied: Can you also track job workers?' }))
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ stage: 'replied', next_action: 'Answer their reply' }))
  })

  it('a request to stop tags the contact so no agent writes to them again', async () => {
    const { update } = wire('contacted')
    const body = await (await actPost(req('/x', { contactId: ID, reply: true, summary: 'Please stop messaging me' }))).json()
    expect(body.optedOut).toBe(true)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ tags: ['do-not-contact'], next_action_at: null }))
  })

  it('never drags a deal backwards: a reply from someone at Proposal keeps their stage', async () => {
    const { update } = wire('proposal')
    await actPost(req('/x', { contactId: ID, reply: true, summary: 'Looks good, one question' }))
    expect(update.mock.calls[0][0]).not.toHaveProperty('stage')
  })

  it('needs text and a real contact', async () => {
    wire('new')
    expect((await actPost(req('/x', { contactId: ID, reply: true, summary: '  ' }))).status).toBe(400)
    expect((await actPost(req('/x', { contactId: 'bad', reply: true, summary: 'hi' }))).status).toBe(400)
  })
})

describe('POST /sync', () => {
  it('collects from every source and merges, reporting what was found and changed', async () => {
    const body = await (await syncPost()).json()
    expect(body).toMatchObject({ ok: true, found: { expo: 1 }, inserted: 1 })
    expect(sync).toHaveBeenCalledTimes(1)
  })
})

describe('POST /import', () => {
  const csv = 'First Name,Last Name,Email,Company Name\nAsha,Patel,asha@acme.in,Acme\nRavi,Shah,ravi@acme.in,Beta\n'
  it('needs CSV text with a header row and at least one row', async () => {
    expect((await importPost(req('/x', { csv: '' }))).status).toBe(400)
    expect((await importPost(req('/x', { csv: 'Name,Email\n' }))).status).toBe(400)
  })

  it('maps the columns, tags the source, and reports unmapped columns', async () => {
    const res = await importPost(req('/x', { csv: csv + '', source: 'Apollo!!', segment: 'business', country: 'India', tags: ['expo-batch1'] }))
    const body = await res.json()
    expect(body).toMatchObject({ ok: true, rows: 2 })
    const rows = sync.mock.calls[0][1]
    expect(rows[0]).toMatchObject({ name: 'Asha Patel', email: 'asha@acme.in', company: 'Acme', source: 'Apollo', segment: 'business', country: 'India', tags: ['expo-batch1'] })
  })

  it('refuses an oversized file and ignores an invalid segment', async () => {
    expect((await importPost(req('/x', { csv: 'a'.repeat(5_000_001) }))).status).toBe(413)
    await importPost(req('/x', { csv, segment: 'enterprise' }))
    expect(sync.mock.calls[0][1][0].segment).toBeNull()
  })

  it('surfaces a database error from the sync', async () => {
    sync.mockResolvedValue({ ...ok, inserted: 0, errors: ['insert: boom'] })
    const body = await (await importPost(req('/x', { csv }))).json()
    expect(body.ok).toBe(false)
    expect(body.errors).toEqual(['insert: boom'])
  })
})
