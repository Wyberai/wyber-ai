import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { makeFakeDb, type Tables } from '@/lib/agency/fake-db'
import { creditsSpentFor } from '@/lib/agency/shape'

// The freelancer's whole job, end to end: intake brief, feedback and "done", quotes the client answers, handover,
// emails to the client, and the approval log. Real route handlers over an in-memory database.

const tables: Tables = {}
let db = makeFakeDb(tables)
let currentUser: string | null = null
const portalMail: Array<Record<string, unknown>> = []
const eventMail: Array<Record<string, unknown>> = []
let allowRate = true

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: currentUser ? { id: currentUser } : null } }) } }),
  createAdminClient: async () => db,
  createServiceClient: () => db,
}))
vi.mock('@/lib/email', () => ({
  sendClientFeedbackAlert: async () => {},
  sendClientPortalEmail: async (a: Record<string, unknown>) => { portalMail.push(a) },
  sendClientEventAlert: async (a: Record<string, unknown>) => { eventMail.push(a) },
}))
vi.mock('@/lib/agency/limits', async (orig) => ({ ...(await orig<typeof import('@/lib/agency/limits')>()), hit: async () => allowRate }))

const req = (body?: unknown, method = 'POST') =>
  new NextRequest('http://localhost/x', { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
const ctx = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) })

// A owns cW (workspace W, active, has a contact email) and cL (a lead). M member and V viewer of W. X outsider.
beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k]
  Object.assign(tables, {
    clients: [
      { id: 'cW', owner_id: 'A', org_id: 'W', name: 'Northwind', slug: 'north-1', status: 'active', contact_email: 'asha@northwind.test', portal_passcode_hash: null, view_count: 0, brief_token: null },
      { id: 'cL', owner_id: 'A', org_id: null, name: 'Harbor Foods', slug: 'harbor-1', status: 'lead', contact_email: null, portal_passcode_hash: null, brief_token: null },
      { id: 'cX', owner_id: 'A', org_id: null, name: 'Old Co', slug: 'old-1', status: 'archived', contact_email: null, portal_passcode_hash: null, brief_token: 'b_archivedtoken123' },
    ],
    organization_members: [{ org_id: 'W', user_id: 'A', role: 'owner' }, { org_id: 'W', user_id: 'M', role: 'member' }, { org_id: 'W', user_id: 'V', role: 'viewer' }],
    organizations: [{ id: 'W', name: 'Northwind Studio', slug: 'nw' }],
    client_deliverables: [{ id: 'dW', client_id: 'cW', project_id: 'pA', is_visible: true, headline: 'Booking portal', review_status: 'pending', sort_order: 0 }],
    client_feedback: [{ id: 'fb1', client_id: 'cW', deliverable_id: 'dW', kind: 'changes_requested', author_name: 'Asha', body: '=HYPERLINK("http://evil","x")', resolved: false, created_at: '2026-11-01T10:00:00Z' },
      { id: 'fb2', client_id: 'cW', deliverable_id: 'dW', kind: 'approved', author_name: 'Asha', body: null, resolved: false, created_at: '2026-11-02T10:00:00Z' }],
    client_updates: [], client_quotes: [], projects: [{ id: 'pA', user_id: 'A' }],
    profiles: [{ id: 'A', email: 'freelancer@studio.test', full_name: 'Sam Rivera' }],
  })
  db = makeFakeDb(tables)
  currentUser = null; allowRate = true; portalMail.length = 0; eventMail.length = 0
})

describe('feedback: mark done', () => {
  it('the owner and a member can, a viewer and an outsider cannot', async () => {
    const { PATCH } = await import('./[id]/feedback/[feedbackId]/route')
    currentUser = 'V'
    expect((await PATCH(req({ resolved: true }, 'PATCH'), ctx({ id: 'cW', feedbackId: 'fb1' }))).status).toBe(403)
    currentUser = 'X'
    expect((await PATCH(req({ resolved: true }, 'PATCH'), ctx({ id: 'cW', feedbackId: 'fb1' }))).status).toBe(404)
    currentUser = 'M'
    expect((await PATCH(req({ resolved: true }, 'PATCH'), ctx({ id: 'cW', feedbackId: 'fb1' }))).status).toBe(200)
    expect(tables.client_feedback[0]).toMatchObject({ resolved: true })
    expect(tables.client_feedback[0].resolved_at).toBeTruthy()
  })
  it('needs a true or false, and cannot reach another client\'s feedback', async () => {
    const { PATCH } = await import('./[id]/feedback/[feedbackId]/route')
    currentUser = 'A'
    expect((await PATCH(req({}, 'PATCH'), ctx({ id: 'cW', feedbackId: 'fb1' }))).status).toBe(400)
    expect((await PATCH(req({ resolved: true }, 'PATCH'), ctx({ id: 'cL', feedbackId: 'fb1' }))).status).toBe(404)
  })
})

describe('intake brief', () => {
  it('the freelancer makes a link; the client reads the questions and sends answers; the freelancer is emailed', async () => {
    const { POST: make } = await import('./[id]/brief/route')
    const { GET, POST } = await import('../brief/[token]/route')
    currentUser = 'A'
    const token = (await (await make(req(), ctx({ id: 'cL' }))).json()).brief_token as string
    expect(token).toMatch(/^b_/)
    currentUser = null
    const info = await (await GET(req(undefined, 'GET'), ctx({ token }))).json()
    expect(info.name).toBe('Harbor Foods')
    expect(info.questions.length).toBeGreaterThan(5)
    const bad = await POST(req({ answers: { business: 'x' } }), ctx({ token }))
    expect(bad.status).toBe(400)
    const ok = await POST(req({ answers: { kind: 'Website', business: 'Harbor Foods', about: 'We sell fish.', goal: 'Get orders', evil: '<script>' } }), ctx({ token }))
    expect(ok.status).toBe(200)
    const row = tables.clients.find(c => c.id === 'cL')!
    expect(row.brief).toMatchObject({ business: 'Harbor Foods' })
    expect(row.brief).not.toHaveProperty('evil')
    expect(row.brief_submitted_at).toBeTruthy()
    expect(eventMail[0]).toMatchObject({ to: 'freelancer@studio.test', event: 'brief', clientName: 'Harbor Foods' })
  })

  it('a new link kills the old one and clears the answers; turning it off kills it too', async () => {
    const { POST: make, DELETE: off } = await import('./[id]/brief/route')
    const { GET } = await import('../brief/[token]/route')
    currentUser = 'A'
    const t1 = (await (await make(req(), ctx({ id: 'cL' }))).json()).brief_token as string
    const t2 = (await (await make(req(), ctx({ id: 'cL' }))).json()).brief_token as string
    expect(t1).not.toBe(t2)
    expect((await GET(req(undefined, 'GET'), ctx({ token: t1 }))).status).toBe(404)
    expect((await GET(req(undefined, 'GET'), ctx({ token: t2 }))).status).toBe(200)
    await off(req(undefined, 'DELETE'), ctx({ id: 'cL' }))
    expect((await GET(req(undefined, 'GET'), ctx({ token: t2 }))).status).toBe(404)
  })

  it('archived clients, short tokens and viewers are refused; submissions are throttled', async () => {
    const { POST: make } = await import('./[id]/brief/route')
    const { GET, POST } = await import('../brief/[token]/route')
    expect((await GET(req(undefined, 'GET'), ctx({ token: 'b_archivedtoken123' }))).status).toBe(404)
    expect((await GET(req(undefined, 'GET'), ctx({ token: 'x' }))).status).toBe(404)
    currentUser = 'V'
    expect((await make(req(), ctx({ id: 'cW' }))).status).toBe(403)
    currentUser = 'A'
    const token = (await (await make(req(), ctx({ id: 'cW' }))).json()).brief_token as string
    allowRate = false
    expect((await POST(req({ answers: {} }), ctx({ token }))).status).toBe(429)
  })
})

describe('quotes', () => {
  const items = [{ description: 'Design and build', qty: 1, unit: 45000 }, { description: 'Hosting setup', qty: 2, unit: 500 }]

  async function draft(extra: Record<string, unknown> = {}) {
    const { POST } = await import('./[id]/quotes/route')
    currentUser = 'A'
    const r = await POST(req({ title: 'Website build', currency: 'INR', items, paymentInstructions: 'UPI: sam@upi', ...extra }), ctx({ id: 'cW' }))
    return { r, quote: (await r.json()).quote as Record<string, unknown> }
  }
  async function send(id: string, emailClient = false) {
    const { PATCH } = await import('./[id]/quotes/[quoteId]/route')
    currentUser = 'A'
    return PATCH(req({ action: 'send', emailClient }, 'PATCH'), ctx({ id: 'cW', quoteId: id }))
  }

  it('totals on the server and ignores a total sent by the browser; numbers per client', async () => {
    const a = await draft({ total: 1 })
    expect(a.r.status).toBe(201)
    expect(a.quote).toMatchObject({ number: 'Q-001', total: 46000, status: 'draft', currency: 'INR' })
    const b = await draft()
    expect(b.quote.number).toBe('Q-002')
  })

  it('rejects empty quotes, a non-https payment link and an unknown currency falls back safely', async () => {
    expect((await draft({ items: [] })).r.status).toBe(400)
    expect((await draft({ paymentUrl: 'http://pay.test' })).r.status).toBe(400)
    expect((await draft({ currency: 'XXX' })).quote.currency).toBe('USD')
  })

  it('a draft cannot be seen or answered by the client; sending makes it answerable', async () => {
    const { POST: respond } = await import('../portal/[slug]/quote/route')
    const { quote } = await draft()
    currentUser = null
    expect((await respond(req({ quoteId: quote.id, action: 'accept', name: 'Asha Rao' }), ctx({ slug: 'north-1' }))).status).toBe(409)
    expect((await send(quote.id as string)).status).toBe(200)
    expect(tables.client_quotes[0].status).toBe('sent')
  })

  it('sending can email the client, from the freelancer, only to the saved address', async () => {
    const { quote } = await draft()
    const r = await send(quote.id as string, true)
    expect((await r.json()).email).toEqual({ sent: true })
    expect(portalMail[0]).toMatchObject({ to: 'asha@northwind.test', kind: 'quote', fromName: 'Sam Rivera', replyTo: 'freelancer@studio.test', quoteTotal: expect.stringContaining('46,000') })
  })

  it('does not email a client with no address, or an inactive one, or past the hourly limit', async () => {
    const { PATCH } = await import('./[id]/quotes/[quoteId]/route')
    const { POST } = await import('./[id]/quotes/route')
    currentUser = 'A'
    const mk = async (id: string) => (await (await POST(req({ title: 'Q', items }), ctx({ id }))).json()).quote.id as string
    const lead = await mk('cL')
    expect((await (await PATCH(req({ action: 'send', emailClient: true }, 'PATCH'), ctx({ id: 'cL', quoteId: lead }))).json()).email).toEqual({ sent: false, reason: 'no_email' })
    tables.clients.find(c => c.id === 'cL')!.contact_email = 'harbor@x.test'
    const lead2 = await mk('cL')
    expect((await (await PATCH(req({ action: 'send', emailClient: true }, 'PATCH'), ctx({ id: 'cL', quoteId: lead2 }))).json()).email).toEqual({ sent: false, reason: 'inactive' })
    const { quote } = await draft()
    allowRate = false
    expect((await (await send(quote.id as string, true)).json()).email).toEqual({ sent: false, reason: 'rate_limited' })
    expect(portalMail).toHaveLength(0)
  })

  it('a sent quote cannot be edited; withdrawing makes it editable again', async () => {
    const { PATCH } = await import('./[id]/quotes/[quoteId]/route')
    const { quote } = await draft()
    await send(quote.id as string)
    expect((await PATCH(req({ title: 'changed' }, 'PATCH'), ctx({ id: 'cW', quoteId: quote.id as string }))).status).toBe(409)
    expect((await PATCH(req({ action: 'withdraw' }, 'PATCH'), ctx({ id: 'cW', quoteId: quote.id as string }))).status).toBe(200)
    expect((await PATCH(req({ title: 'changed', items: [{ description: 'x', qty: 1, unit: 10 }] }, 'PATCH'), ctx({ id: 'cW', quoteId: quote.id as string }))).status).toBe(200)
    expect(tables.client_quotes[0]).toMatchObject({ title: 'changed', total: 10 })
  })

  it('the client accepts with a name, once; the freelancer is told; then it can be marked paid', async () => {
    const { POST: respond } = await import('../portal/[slug]/quote/route')
    const { PATCH } = await import('./[id]/quotes/[quoteId]/route')
    const { quote } = await draft()
    await send(quote.id as string)
    currentUser = null
    expect((await respond(req({ quoteId: quote.id, action: 'accept', name: 'A' }), ctx({ slug: 'north-1' }))).status).toBe(400)
    expect((await respond(req({ quoteId: quote.id, action: 'accept', name: 'Asha Rao' }), ctx({ slug: 'north-1' }))).status).toBe(200)
    expect(tables.client_quotes[0]).toMatchObject({ status: 'accepted', responded_by: 'Asha Rao' })
    expect(tables.client_quotes[0].responded_at).toBeTruthy()
    expect(eventMail[0]).toMatchObject({ to: 'freelancer@studio.test', event: 'quote_accepted' })
    expect((await respond(req({ quoteId: quote.id, action: 'decline' }), ctx({ slug: 'north-1' }))).status).toBe(409) // already answered
    currentUser = 'A'
    expect((await PATCH(req({ action: 'markPaid' }, 'PATCH'), ctx({ id: 'cW', quoteId: quote.id as string }))).status).toBe(200)
    expect(tables.client_quotes[0].status).toBe('paid')
  })

  it('a client can decline with a reason; it cannot be marked paid, and can be deleted', async () => {
    const { POST: respond } = await import('../portal/[slug]/quote/route')
    const { PATCH, DELETE } = await import('./[id]/quotes/[quoteId]/route')
    const { quote } = await draft()
    await send(quote.id as string)
    currentUser = null
    await respond(req({ quoteId: quote.id, action: 'decline', reason: 'Over budget' }), ctx({ slug: 'north-1' }))
    expect(tables.client_quotes[0]).toMatchObject({ status: 'declined', decline_reason: 'Over budget' })
    currentUser = 'A'
    expect((await PATCH(req({ action: 'markPaid' }, 'PATCH'), ctx({ id: 'cW', quoteId: quote.id as string }))).status).toBe(409)
    expect((await DELETE(req(undefined, 'DELETE'), ctx({ id: 'cW', quoteId: quote.id as string }))).status).toBe(200)
  })

  it('an accepted or waiting quote cannot be deleted; a viewer or outsider cannot touch quotes', async () => {
    const { PATCH, DELETE } = await import('./[id]/quotes/[quoteId]/route')
    const { quote } = await draft()
    await send(quote.id as string)
    currentUser = 'A'
    expect((await DELETE(req(undefined, 'DELETE'), ctx({ id: 'cW', quoteId: quote.id as string }))).status).toBe(409)
    currentUser = 'V'
    expect((await PATCH(req({ action: 'withdraw' }, 'PATCH'), ctx({ id: 'cW', quoteId: quote.id as string }))).status).toBe(403)
    currentUser = 'X'
    expect((await PATCH(req({ action: 'withdraw' }, 'PATCH'), ctx({ id: 'cW', quoteId: quote.id as string }))).status).toBe(404)
  })

  it('a locked page cannot be answered without the passcode', async () => {
    const { POST: respond } = await import('../portal/[slug]/quote/route')
    const { hashPasscode } = await import('@/lib/agency/passcode')
    const { quote } = await draft()
    await send(quote.id as string)
    tables.clients.find(c => c.id === 'cW')!.portal_passcode_hash = hashPasscode('blue-door')
    currentUser = null
    expect((await respond(req({ quoteId: quote.id, action: 'accept', name: 'Asha Rao' }), ctx({ slug: 'north-1' }))).status).toBe(401)
  })
})

describe('handover', () => {
  it('marks delivered with a note, can email the client, and can be undone', async () => {
    const { PATCH } = await import('./[id]/deliverables/[deliverableId]/route')
    currentUser = 'A'
    const r = await PATCH(req({ delivered: true, handoverNote: 'Repo: github.com/x/y. Domain points to Vercel.', emailClient: true }, 'PATCH'), ctx({ id: 'cW', deliverableId: 'dW' }))
    const j = await r.json()
    expect(j.deliverable.delivered_at).toBeTruthy()
    expect(j.email).toEqual({ sent: true })
    expect(portalMail[0]).toMatchObject({ kind: 'delivered', message: 'Repo: github.com/x/y. Domain points to Vercel.' })
    await PATCH(req({ delivered: false }, 'PATCH'), ctx({ id: 'cW', deliverableId: 'dW' }))
    expect(tables.client_deliverables[0].delivered_at).toBeNull()
  })
  it('a viewer cannot hand over', async () => {
    const { PATCH } = await import('./[id]/deliverables/[deliverableId]/route')
    currentUser = 'V'
    expect((await PATCH(req({ delivered: true }, 'PATCH'), ctx({ id: 'cW', deliverableId: 'dW' }))).status).toBe(403)
  })
})

describe('emailed updates', () => {
  it('emails only when asked, only to the saved address, and says why when it did not', async () => {
    const { POST } = await import('./[id]/updates/route')
    currentUser = 'A'
    expect((await (await POST(req({ body: 'Staging is up' }), ctx({ id: 'cW' }))).json()).email).toBeNull()
    expect(portalMail).toHaveLength(0)
    const r = await (await POST(req({ body: 'Staging is up', emailClient: true }), ctx({ id: 'cW' }))).json()
    expect(r.email).toEqual({ sent: true })
    expect(portalMail[0]).toMatchObject({ to: 'asha@northwind.test', kind: 'update', message: 'Staging is up', replyTo: 'freelancer@studio.test' })
    expect(tables.client_updates.find(u => u.id === r.update.id)?.emailed_at).toBeTruthy()
    expect((await (await POST(req({ body: 'x', emailClient: true }), ctx({ id: 'cL' }))).json()).email).toEqual({ sent: false, reason: 'no_email' })
    tables.clients.find(c => c.id === 'cL')!.contact_email = 'harbor@x.test'
    expect((await (await POST(req({ body: 'x', emailClient: true }), ctx({ id: 'cL' }))).json()).email).toEqual({ sent: false, reason: 'inactive' })
    expect(portalMail).toHaveLength(1)
  })
})

describe('approval log', () => {
  it('is a CSV with a header, newest last, and neutralises spreadsheet formulas', async () => {
    const { GET } = await import('./[id]/approvals/route')
    currentUser = 'A'
    const r = await GET(req(undefined, 'GET'), ctx({ id: 'cW' }))
    expect(r.headers.get('content-type')).toContain('text/csv')
    expect(r.headers.get('content-disposition')).toContain('Northwind-approvals.csv')
    const text = await r.text()
    const lines = text.trim().split('\r\n')
    expect(lines[0]).toBe('When,What,Project or quote,Who,Note,Done')
    expect(lines[1]).toContain('Changes requested')
    expect(lines[2]).toContain('Approved')
    expect(text).not.toMatch(/,=HYPERLINK/)
    expect(text).toContain(`'=HYPERLINK`)
  })
  it('is private to people with access', async () => {
    const { GET } = await import('./[id]/approvals/route')
    currentUser = null
    expect((await GET(req(undefined, 'GET'), ctx({ id: 'cW' }))).status).toBe(401)
    currentUser = 'X'
    expect((await GET(req(undefined, 'GET'), ctx({ id: 'cW' }))).status).toBe(404)
    currentUser = 'V' // a viewer may read the record
    expect((await GET(req(undefined, 'GET'), ctx({ id: 'cW' }))).status).toBe(200)
  })
})

describe('credits per client', () => {
  it('adds up what was charged on that client\'s projects only', () => {
    const usage = [
      { project_id: 'p1', credits_charged: 30 }, { project_id: 'p1', credits_charged: 4 }, { project_id: 'p2', credits_charged: 10 },
      { project_id: 'other', credits_charged: 99 }, { project_id: null, credits_charged: 5 }, { project_id: 'p1', credits_charged: null },
    ]
    expect(creditsSpentFor(['p1', 'p2'], usage)).toBe(44)
    expect(creditsSpentFor([], usage)).toBe(0)
  })
})
