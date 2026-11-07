import { describe, it, expect, vi, beforeEach } from 'vitest'

let isAdmin = true
const fake = { from: vi.fn() }
const alert = vi.fn()

vi.mock('@/lib/crm/admin-auth', () => ({ getCrmAdmin: async () => (isAdmin ? { user: { email: 'hello@wyberai.com' }, admin: fake } : { user: null, admin: null }) }))
vi.mock('@/lib/supabase/server', () => ({ createAdminClient: async () => fake }))
vi.mock('@/lib/email', () => ({ sendQuoteAcceptedAlert: (...a: unknown[]) => alert(...a) }))

import { GET as listGet, POST as createPost } from './route'
import { PATCH as quotePatch } from './[id]/route'
import { POST as acceptPost } from '../../quote/[token]/accept/route'
import { NextRequest } from 'next/server'

const ID = '11111111-1111-1111-1111-111111111111'
const CID = '22222222-2222-2222-2222-222222222222'
const TOKEN = 'abcdefghijklmnopqrstuvwxyz012345' // 32 url-safe chars
const items = [{ description: 'Build the tool', qty: 1, unit_price: 80000 }, { description: 'Training', qty: 2, unit_price: 2500 }]
const body = { title: 'GST tool', currency: 'INR', items, valid_until: '2099-12-31' }

let n = 0
const req = (b?: unknown, method = 'POST', headers: Record<string, string> = {}) => {
  n++
  return new NextRequest('http://localhost/x', { method, headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.9.0.${n}`, ...headers }, body: b === undefined ? undefined : JSON.stringify(b) })
}
const ctx = (id = ID) => ({ params: Promise.resolve({ id }) })
const tctx = (token = TOKEN) => ({ params: Promise.resolve({ token }) })

const quoteRow = (o: Record<string, unknown> = {}) => ({
  id: ID, token: TOKEN, contact_id: CID, title: 'GST tool', currency: 'INR', items, total: 85000, scope: null, terms: null, valid_until: '2099-12-31',
  status: 'draft', sent_at: null, viewed_at: null, view_count: 0, accepted_at: null, accepted_by: null, ...o,
})

beforeEach(() => { isAdmin = true; fake.from.mockReset(); alert.mockReset().mockResolvedValue({ id: 'm' }); delete process.env.CRM_INR_PER_USD })

describe('admin auth', () => {
  it('refuses a non-admin on every admin quote route', async () => {
    isAdmin = false
    const rs = await Promise.all([listGet(req(undefined, 'GET')), createPost(req(body)), quotePatch(req({ action: 'send' }, 'PATCH'), ctx())])
    expect(rs.map(r => r.status)).toEqual([401, 401, 401])
  })
})

describe('POST /api/admin/quotes', () => {
  it('creates a draft with an unguessable token and a server-computed total (never the client one)', async () => {
    const insert = vi.fn().mockImplementation((row: Record<string, unknown>) => ({ select: () => ({ single: async () => ({ data: { id: ID, ...row }, error: null }) }) }))
    fake.from.mockReturnValue({ insert })
    const res = await createPost(req({ ...body, total: 1, contact_id: CID }))
    expect(res.status).toBe(200)
    const row = insert.mock.calls[0][0]
    expect(row).toMatchObject({ status: 'draft', total: 85000, contact_id: CID, currency: 'INR' })
    expect(row.token).toMatch(/^[A-Za-z0-9_-]{32}$/)
  })

  it('rejects bad input and a bad contact id', async () => {
    fake.from.mockReturnValue({ insert: vi.fn() })
    expect((await createPost(req({ ...body, items: [] }))).status).toBe(400)
    expect((await createPost(req({ ...body, currency: 'EUR' }))).status).toBe(400)
    expect((await createPost(req({ ...body, contact_id: 'nope' }))).status).toBe(400)
  })
})

describe('PATCH /api/admin/quotes/[id]', () => {
  function wire(q: unknown, contact: unknown = { id: CID, name: 'Asha Patel', stage: 'met' }) {
    const quoteUpdate = vi.fn()
    const contactUpdate = vi.fn()
    const activity = vi.fn().mockResolvedValue({ error: null })
    fake.from.mockImplementation((t: string) => {
      if (t === 'crm_quotes') return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: q, error: null }) }) }),
        update: (p: Record<string, unknown>) => { quoteUpdate(p); const chain: Record<string, unknown> = { eq: () => chain, select: () => ({ single: async () => ({ data: { ...(q as object), ...p }, error: null }) }) }; return chain },
      }
      if (t === 'crm_contacts') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: contact, error: null }) }) }), update: (p: unknown) => { contactUpdate(p); return { eq: async () => ({ error: null }) } } }
      return { insert: activity }
    })
    return { quoteUpdate, contactUpdate, activity }
  }

  it('only a draft can be edited, and the total is recomputed', async () => {
    const w = wire(quoteRow())
    const res = await quotePatch(req({ action: 'update', ...body, items: [{ description: 'x', qty: 2, unit_price: 100.5 }] }, 'PATCH'), ctx())
    expect(res.status).toBe(200)
    expect(w.quoteUpdate.mock.calls[0][0]).toMatchObject({ total: 201 })
    wire(quoteRow({ status: 'sent' }))
    expect((await quotePatch(req({ action: 'update', ...body }, 'PATCH'), ctx())).status).toBe(409)
  })

  it('sending marks it sent, moves the deal to proposal with its dollar value and a follow-up, and returns the link and a ready message', async () => {
    const w = wire(quoteRow())
    const res = await quotePatch(req({ action: 'send' }, 'PATCH'), ctx())
    const out = await res.json()
    expect(res.status).toBe(200)
    expect(w.quoteUpdate.mock.calls[0][0]).toMatchObject({ status: 'sent' })
    expect(w.contactUpdate.mock.calls[0][0]).toMatchObject({ stage: 'proposal', value_usd: 1000, next_action: 'Follow up on the quote' })
    expect(w.activity).toHaveBeenCalledWith(expect.objectContaining({ contact_id: CID, kind: 'system' }))
    expect(out.url).toBe(`https://wyberai.com/quote/${TOKEN}`)
    expect(out.message).toContain('Hi Asha,')
    expect(out.message).toContain('₹85,000')
  })

  it('sending does not drag a deal backwards or change a stage that is already further along', async () => {
    const w = wire(quoteRow(), { id: CID, name: 'Asha', stage: 'won' })
    await quotePatch(req({ action: 'send' }, 'PATCH'), ctx())
    expect(w.contactUpdate.mock.calls[0][0].stage).toBeUndefined()
  })

  it('uses the configured exchange rate for INR quotes and cannot send twice', async () => {
    process.env.CRM_INR_PER_USD = '100'
    const w = wire(quoteRow())
    await quotePatch(req({ action: 'send' }, 'PATCH'), ctx())
    expect(w.contactUpdate.mock.calls[0][0].value_usd).toBe(850)
    wire(quoteRow({ status: 'sent' }))
    expect((await quotePatch(req({ action: 'send' }, 'PATCH'), ctx())).status).toBe(409)
  })

  it('withdrawing marks it expired, but an accepted quote cannot be withdrawn', async () => {
    const w = wire(quoteRow({ status: 'sent' }))
    expect((await quotePatch(req({ action: 'withdraw' }, 'PATCH'), ctx())).status).toBe(200)
    expect(w.quoteUpdate.mock.calls[0][0]).toMatchObject({ status: 'expired' })
    wire(quoteRow({ status: 'accepted' }))
    expect((await quotePatch(req({ action: 'withdraw' }, 'PATCH'), ctx())).status).toBe(409)
  })

  it('rejects a bad id, a missing quote and an unknown action', async () => {
    expect((await quotePatch(req({ action: 'send' }, 'PATCH'), ctx('bad'))).status).toBe(400)
    wire(null)
    expect((await quotePatch(req({ action: 'send' }, 'PATCH'), ctx())).status).toBe(404)
    wire(quoteRow())
    expect((await quotePatch(req({ action: 'explode' }, 'PATCH'), ctx())).status).toBe(400)
  })
})

describe('PUBLIC POST /api/quote/[token]/accept', () => {
  function wire(q: unknown, opts: { updateRows?: unknown[]; crmFails?: boolean } = {}) {
    const quoteUpdate = vi.fn()
    const contactUpdate = vi.fn()
    const activity = vi.fn().mockResolvedValue({ error: null })
    fake.from.mockImplementation((t: string) => {
      if (t === 'crm_quotes') return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: q, error: null }) }) }),
        update: (p: unknown) => { quoteUpdate(p); const chain: Record<string, unknown> = { eq: () => chain, in: () => chain, select: async () => ({ data: opts.updateRows ?? [{ id: ID }], error: null }) }; return chain },
      }
      if (t === 'crm_contacts') {
        if (opts.crmFails) throw new Error('crm down')
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { name: 'Asha Patel' }, error: null }) }) }), update: (p: unknown) => { contactUpdate(p); return { eq: async () => ({ error: null }) } } }
      }
      return { insert: activity }
    })
    return { quoteUpdate, contactUpdate, activity }
  }
  const accept = (b: unknown = { name: 'Asha Patel', agree: true }, token = TOKEN) => acceptPost(req(b), tctx(token))

  it('rejects an invalid token, a missing name, and an unticked box before touching the database', async () => {
    expect((await accept(undefined, 'short')).status).toBe(404)
    wire(quoteRow({ status: 'sent' }))
    expect((await accept({ name: 'A', agree: true })).status).toBe(400)
    expect((await accept({ name: 'Asha Patel' })).status).toBe(400)
    expect((await accept({ name: 'Asha Patel', agree: 'yes' })).status).toBe(400)
  })

  it('404s for an unknown token and refuses a draft, an expired, a declined and an already-accepted quote', async () => {
    wire(null)
    expect((await accept()).status).toBe(404)
    for (const status of ['draft', 'declined', 'accepted', 'expired']) {
      const w = wire(quoteRow({ status }))
      const res = await accept()
      expect(res.status, status).toBe(409)
      expect(w.quoteUpdate).not.toHaveBeenCalled()
    }
    const w = wire(quoteRow({ status: 'sent', valid_until: '2020-01-01' }))
    expect((await accept()).status).toBe(409)
    expect(w.quoteUpdate).not.toHaveBeenCalled()
  })

  it('accepting records the typed name, marks the deal Won at its dollar value, logs it and alerts the founder', async () => {
    const w = wire(quoteRow({ status: 'viewed' }))
    const res = await accept()
    expect(res.status).toBe(200)
    expect(w.quoteUpdate.mock.calls[0][0]).toMatchObject({ status: 'accepted', accepted_by: 'Asha Patel' })
    expect(w.contactUpdate.mock.calls[0][0]).toMatchObject({ stage: 'won', value_usd: 1000 })
    expect(w.activity).toHaveBeenCalledWith(expect.objectContaining({ contact_id: CID, by: 'client' }))
    expect(w.activity.mock.calls[0][0].summary).toContain('85 INR per USD')
    expect(alert).toHaveBeenCalledWith(expect.objectContaining({ title: 'GST tool', totalLabel: '₹85,000', acceptedBy: 'Asha Patel', contactName: 'Asha Patel' }))
  })

  it('two accepts cannot both win: the loser is told it is already accepted and nothing else happens', async () => {
    const w = wire(quoteRow({ status: 'sent' }), { updateRows: [] })
    const res = await accept()
    expect(res.status).toBe(409)
    expect(w.contactUpdate).not.toHaveBeenCalled()
    expect(alert).not.toHaveBeenCalled()
  })

  it('a failure in the CRM or the email does not undo a real acceptance', async () => {
    wire(quoteRow({ status: 'sent' }), { crmFails: true })
    alert.mockRejectedValue(new Error('smtp down'))
    expect((await accept()).status).toBe(200)
  })

  it('rate-limits one address', async () => {
    wire(quoteRow({ status: 'sent' }), { updateRows: [] })
    let last = 0
    for (let i = 0; i < 12; i++) last = (await acceptPost(new NextRequest('http://localhost/x', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.8.7.6' }, body: JSON.stringify({ name: 'Asha Patel', agree: true }) }), tctx())).status
    expect(last).toBe(429)
  })
})
