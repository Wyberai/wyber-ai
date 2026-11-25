import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { makeFakeDb, type Tables } from '@/lib/agency/fake-db'

// Agency mode: every client, deliverable, update and portal route must be scoped to the signed-in account (and its
// workspace roles). These run the real route handlers against an in-memory database with several accounts.

const tables: Tables = {}
let db = makeFakeDb(tables)
let currentUser: string | null = null
const sent: Array<Record<string, unknown>> = []

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: currentUser ? { id: currentUser } : null } }) } }),
  createAdminClient: async () => db,
  createServiceClient: () => db,
}))
vi.mock('@/lib/email', () => ({ sendClientFeedbackAlert: async (a: Record<string, unknown>) => { sent.push(a) } }))
let allowRate = true
vi.mock('@/lib/agency/limits', async (orig) => ({ ...(await orig<typeof import('@/lib/agency/limits')>()), hit: async () => allowRate }))

const jsonReq = (body: unknown, cookie?: string) =>
  new NextRequest('http://localhost/x', { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) })
const ctx = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) })

// A: owns a solo client (cA) and the agency workspace W (cW, role owner).  M: member of W.  V: viewer of W.  X: outsider.
beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k]
  Object.assign(tables, {
    clients: [
      { id: 'cA', owner_id: 'A', org_id: null, name: 'Solo client', slug: 'solo-1', status: 'active' },
      { id: 'cW', owner_id: 'A', org_id: 'W', name: 'Team client', slug: 'team-1', status: 'active', portal_passcode_hash: null, view_count: 0 },
      { id: 'cB', owner_id: 'B', org_id: null, name: 'B client', slug: 'b-1', status: 'active' },
    ],
    organization_members: [
      { org_id: 'W', user_id: 'A', role: 'owner' }, { org_id: 'W', user_id: 'AD', role: 'admin' },
      { org_id: 'W', user_id: 'M', role: 'member' }, { org_id: 'W', user_id: 'V', role: 'viewer' },
    ],
    organizations: [{ id: 'W', name: 'Northwind', slug: 'northwind' }],
    client_deliverables: [{ id: 'dW', client_id: 'cW', project_id: 'pA', is_visible: true, headline: 'Booking portal', review_status: 'pending', sort_order: 0 }],
    client_feedback: [], client_updates: [], profiles: [{ id: 'A', email: 'owner@agency.test' }],
    projects: [{ id: 'pA', user_id: 'A', org_id: null }, { id: 'pW', user_id: 'A', org_id: 'W' }, { id: 'pB', user_id: 'B', org_id: null }, { id: 'pM', user_id: 'M', org_id: null }],
  })
  db = makeFakeDb(tables)
  currentUser = null
  allowRate = true
  sent.length = 0
})

describe('accounts are isolated', () => {
  it('rejects signed-out callers', async () => {
    const { GET } = await import('./route')
    expect((await GET()).status).toBe(401)
  })

  it('an outsider sees none of A\'s clients', async () => {
    const { GET } = await import('./route')
    currentUser = 'X'
    expect((await (await GET()).json()).clients).toEqual([])
  })

  it('a stranger cannot edit, delete or attach to another account\'s client', async () => {
    const { PATCH, DELETE } = await import('./[id]/route')
    const { POST } = await import('./[id]/deliverables/route')
    currentUser = 'B'
    expect((await PATCH(jsonReq({ name: 'hijack' }), ctx({ id: 'cA' }))).status).toBe(404)
    expect((await DELETE(jsonReq({}), ctx({ id: 'cA' }))).status).toBe(404)
    expect((await POST(jsonReq({ projectId: 'pB' }), ctx({ id: 'cA' }))).status).toBe(404)
    expect(tables.clients.find(c => c.id === 'cA')?.name).toBe('Solo client')
  })

  it('you cannot attach a stranger\'s project to your own client', async () => {
    const { POST } = await import('./[id]/deliverables/route')
    currentUser = 'A'
    expect((await POST(jsonReq({ projectId: 'pB' }), ctx({ id: 'cA' }))).status).toBe(404)
  })

  it('new clients are stamped with the caller as owner', async () => {
    const { POST } = await import('./route')
    currentUser = 'B'
    const r = await POST(jsonReq({ name: 'New Co' }))
    expect(r.status).toBe(201)
    expect(tables.clients.find(c => c.name === 'New Co')?.owner_id).toBe('B')
  })
})

describe('workspaces share clients by role', () => {
  it('every role in the workspace can see the team\'s client, outsiders cannot', async () => {
    const { GET } = await import('./route')
    for (const u of ['A', 'AD', 'M', 'V']) {
      currentUser = u
      const ids = (await (await GET()).json()).clients.map((c: { id: string }) => c.id)
      expect(ids, u).toContain('cW')
    }
    currentUser = 'X'
    expect((await (await GET()).json()).clients.map((c: { id: string }) => c.id)).not.toContain('cW')
  })

  it('a member can edit, a viewer cannot', async () => {
    const { PATCH } = await import('./[id]/route')
    currentUser = 'M'
    expect((await PATCH(jsonReq({ introText: 'hello' }), ctx({ id: 'cW' }))).status).toBe(200)
    currentUser = 'V'
    expect((await PATCH(jsonReq({ introText: 'nope' }), ctx({ id: 'cW' }))).status).toBe(403)
    expect(tables.clients.find(c => c.id === 'cW')?.intro_text).toBe('hello')
  })

  it('only owners and admins can delete', async () => {
    const { DELETE } = await import('./[id]/route')
    currentUser = 'M'
    expect((await DELETE(jsonReq({}), ctx({ id: 'cW' }))).status).toBe(403)
    currentUser = 'V'
    expect((await DELETE(jsonReq({}), ctx({ id: 'cW' }))).status).toBe(403)
    currentUser = 'AD'
    expect((await DELETE(jsonReq({}), ctx({ id: 'cW' }))).status).toBe(200)
    expect(tables.clients.some(c => c.id === 'cW')).toBe(false)
  })

  it('a client can only be created in a workspace you can edit in', async () => {
    const { POST } = await import('./route')
    currentUser = 'X'
    expect((await POST(jsonReq({ name: 'Sneaky', orgId: 'W' }))).status).toBe(404)
    currentUser = 'V'
    expect((await POST(jsonReq({ name: 'Viewer made', orgId: 'W' }))).status).toBe(404)
    currentUser = 'M'
    const r = await POST(jsonReq({ name: 'By member', orgId: 'W' }))
    expect(r.status).toBe(201)
    expect(tables.clients.find(c => c.name === 'By member')).toMatchObject({ owner_id: 'M', org_id: 'W' })
  })

  it('a teammate can attach a workspace project, but not another person\'s private one', async () => {
    const { POST } = await import('./[id]/deliverables/route')
    currentUser = 'M'
    expect((await POST(jsonReq({ projectId: 'pW' }), ctx({ id: 'cW' }))).status).toBe(201)
    expect((await POST(jsonReq({ projectId: 'pM' }), ctx({ id: 'cW' }))).status).toBe(201) // their own
    expect((await POST(jsonReq({ projectId: 'pB' }), ctx({ id: 'cW' }))).status).toBe(404) // someone else's
  })

  it('only the person who added a client can move it between workspaces', async () => {
    const { PATCH } = await import('./[id]/route')
    currentUser = 'M'
    expect((await PATCH(jsonReq({ orgId: null }), ctx({ id: 'cW' }))).status).toBe(403)
    currentUser = 'A'
    expect((await PATCH(jsonReq({ orgId: null }), ctx({ id: 'cW' }))).status).toBe(200)
    expect(tables.clients.find(c => c.id === 'cW')?.org_id).toBeNull()
  })
})

describe('the link and passcode', () => {
  it('setting a passcode stores a hash and never returns it', async () => {
    const { PATCH } = await import('./[id]/route')
    currentUser = 'A'
    const r = await PATCH(jsonReq({ passcode: 'blue-door' }), ctx({ id: 'cW' }))
    const j = await r.json()
    expect(j.client.has_passcode).toBe(true)
    expect(JSON.stringify(j)).not.toContain('portal_passcode_hash')
    expect(JSON.stringify(j)).not.toContain('blue-door')
    expect(String(tables.clients.find(c => c.id === 'cW')?.portal_passcode_hash)).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
  })

  it('rejects a too-short passcode and can remove one', async () => {
    const { PATCH } = await import('./[id]/route')
    currentUser = 'A'
    expect((await PATCH(jsonReq({ passcode: 'ab' }), ctx({ id: 'cW' }))).status).toBe(400)
    await PATCH(jsonReq({ passcode: 'blue-door' }), ctx({ id: 'cW' }))
    await PATCH(jsonReq({ passcode: null }), ctx({ id: 'cW' }))
    expect(tables.clients.find(c => c.id === 'cW')?.portal_passcode_hash).toBeNull()
  })

  it('a new link kills the old one', async () => {
    const { PATCH } = await import('./[id]/route')
    const { loadActivePortalClient } = await import('@/lib/agency/portal')
    currentUser = 'A'
    const r = await PATCH(jsonReq({ rotateLink: true }), ctx({ id: 'cW' }))
    const slug = (await r.json()).client.slug as string
    expect(slug).not.toBe('team-1')
    expect(await loadActivePortalClient(db, 'team-1')).toBeNull()
    expect((await loadActivePortalClient(db, slug))?.id).toBe('cW')
  })

  it('rejects a brand colour that is not a hex value', async () => {
    const { PATCH } = await import('./[id]/route')
    currentUser = 'A'
    expect((await PATCH(jsonReq({ brandColor: 'red; background:url(x)' }), ctx({ id: 'cW' }))).status).toBe(400)
    expect((await PATCH(jsonReq({ brandColor: '#0d9488' }), ctx({ id: 'cW' }))).status).toBe(200)
  })
})

describe('updates and re-review', () => {
  it('posts and deletes updates; viewers cannot', async () => {
    const { POST } = await import('./[id]/updates/route')
    const { DELETE } = await import('./[id]/updates/[updateId]/route')
    currentUser = 'V'
    expect((await POST(jsonReq({ body: 'hi' }), ctx({ id: 'cW' }))).status).toBe(403)
    currentUser = 'M'
    expect((await POST(jsonReq({ body: '   ' }), ctx({ id: 'cW' }))).status).toBe(400)
    const r = await POST(jsonReq({ body: 'Booking flow is live on staging.' }), ctx({ id: 'cW' }))
    expect(r.status).toBe(201)
    const id = (await r.json()).update.id as string
    currentUser = 'X'
    expect((await DELETE(jsonReq({}), ctx({ id: 'cW', updateId: id }))).status).toBe(404)
    currentUser = 'M'
    expect((await DELETE(jsonReq({}), ctx({ id: 'cW', updateId: id }))).status).toBe(200)
    expect(tables.client_updates).toHaveLength(0)
  })

  it('the agency can ask for a fresh review but cannot approve on the client\'s behalf', async () => {
    const { PATCH } = await import('./[id]/deliverables/[deliverableId]/route')
    currentUser = 'A'
    tables.client_deliverables[0].review_status = 'changes_requested'
    expect((await PATCH(jsonReq({ reviewStatus: 'approved' }), ctx({ id: 'cW', deliverableId: 'dW' }))).status).toBe(400)
    expect(tables.client_deliverables[0].review_status).toBe('changes_requested')
    expect((await PATCH(jsonReq({ reviewStatus: 'pending' }), ctx({ id: 'cW', deliverableId: 'dW' }))).status).toBe(200)
    expect(tables.client_deliverables[0].review_status).toBe('pending')
  })
})

describe('the client\'s page: unlock, review, views', () => {
  async function lock() {
    const { hashPasscode } = await import('@/lib/agency/passcode')
    tables.clients.find(c => c.id === 'cW')!.portal_passcode_hash = hashPasscode('blue-door')
  }

  it('wrong passcode is refused, the right one sets a cookie that opens the page', async () => {
    const { POST: unlock } = await import('../portal/[slug]/unlock/route')
    const { POST: review } = await import('../portal/[slug]/review/route')
    await lock()
    expect((await unlock(jsonReq({ passcode: 'nope' }), ctx({ slug: 'team-1' }))).status).toBe(401)
    expect((await review(jsonReq({ deliverableId: 'dW', kind: 'approved' }), ctx({ slug: 'team-1' }))).status).toBe(401) // still locked
    const ok = await unlock(jsonReq({ passcode: 'blue-door' }), ctx({ slug: 'team-1' }))
    expect(ok.status).toBe(200)
    const cookie = ok.headers.get('set-cookie')!.split(';')[0]
    expect((await review(jsonReq({ deliverableId: 'dW', kind: 'approved' }, cookie), ctx({ slug: 'team-1' }))).status).toBe(200)
  })

  it('an unlock cookie stops working when the passcode changes', async () => {
    const { POST: unlock } = await import('../portal/[slug]/unlock/route')
    const { POST: review } = await import('../portal/[slug]/review/route')
    const { hashPasscode } = await import('@/lib/agency/passcode')
    await lock()
    const cookie = (await unlock(jsonReq({ passcode: 'blue-door' }), ctx({ slug: 'team-1' }))).headers.get('set-cookie')!.split(';')[0]
    tables.clients.find(c => c.id === 'cW')!.portal_passcode_hash = hashPasscode('new-code')
    expect((await review(jsonReq({ deliverableId: 'dW', kind: 'approved' }, cookie), ctx({ slug: 'team-1' }))).status).toBe(401)
  })

  it('unlock is throttled', async () => {
    const { POST: unlock } = await import('../portal/[slug]/unlock/route')
    await lock()
    allowRate = false
    expect((await unlock(jsonReq({ passcode: 'blue-door' }), ctx({ slug: 'team-1' }))).status).toBe(429)
  })

  it('approve marks the deliverable and emails the agency', async () => {
    const { POST } = await import('../portal/[slug]/review/route')
    const r = await POST(jsonReq({ deliverableId: 'dW', kind: 'approved', name: 'Asha' }), ctx({ slug: 'team-1' }))
    expect(r.status).toBe(200)
    expect(tables.client_deliverables[0].review_status).toBe('approved')
    expect(tables.client_feedback[0]).toMatchObject({ kind: 'approved', author_name: 'Asha', client_id: 'cW' })
    expect(sent[0]).toMatchObject({ to: 'owner@agency.test', kind: 'approved', clientName: 'Team client' })
  })

  it('requesting changes needs a note; a comment does not change the status', async () => {
    const { POST } = await import('../portal/[slug]/review/route')
    expect((await POST(jsonReq({ deliverableId: 'dW', kind: 'changes_requested' }), ctx({ slug: 'team-1' }))).status).toBe(400)
    expect((await POST(jsonReq({ deliverableId: 'dW', kind: 'changes_requested', note: 'Larger button on phones' }), ctx({ slug: 'team-1' }))).status).toBe(200)
    expect(tables.client_deliverables[0].review_status).toBe('changes_requested')
    expect((await POST(jsonReq({ deliverableId: 'dW', kind: 'comment', note: 'Thanks!' }), ctx({ slug: 'team-1' }))).status).toBe(200)
    expect(tables.client_deliverables[0].review_status).toBe('changes_requested')
  })

  it('cannot review another client\'s deliverable, a hidden one, or on a paused client', async () => {
    const { POST } = await import('../portal/[slug]/review/route')
    tables.client_deliverables.push({ id: 'dB', client_id: 'cB', project_id: 'pB', is_visible: true, review_status: 'pending' })
    expect((await POST(jsonReq({ deliverableId: 'dB', kind: 'approved' }), ctx({ slug: 'team-1' }))).status).toBe(404)
    tables.client_deliverables[0].is_visible = false
    expect((await POST(jsonReq({ deliverableId: 'dW', kind: 'approved' }), ctx({ slug: 'team-1' }))).status).toBe(404)
    tables.client_deliverables[0].is_visible = true
    tables.clients.find(c => c.id === 'cW')!.status = 'paused'
    expect((await POST(jsonReq({ deliverableId: 'dW', kind: 'approved' }), ctx({ slug: 'team-1' }))).status).toBe(404)
    expect(tables.client_feedback).toHaveLength(0)
  })

  it('a failed email never fails the review', async () => {
    vi.doMock('@/lib/email', () => ({ sendClientFeedbackAlert: async () => { throw new Error('smtp down') } }))
    vi.resetModules()
    const { POST } = await import('../portal/[slug]/review/route')
    expect((await POST(jsonReq({ deliverableId: 'dW', kind: 'approved' }), ctx({ slug: 'team-1' }))).status).toBe(200)
    vi.doUnmock('@/lib/email')
  })

  it('counts a view once per browser, and never the agency\'s own visits', async () => {
    const { POST } = await import('../portal/[slug]/view/route')
    const r1 = await POST(jsonReq({}), ctx({ slug: 'team-1' }))
    expect(r1.status).toBe(204)
    expect(tables.clients.find(c => c.id === 'cW')?.view_count).toBe(1)
    const cookie = r1.headers.get('set-cookie')!.split(';')[0]
    await POST(jsonReq({}, cookie), ctx({ slug: 'team-1' }))
    expect(tables.clients.find(c => c.id === 'cW')?.view_count).toBe(1)
    currentUser = 'M' // a teammate previewing the page
    await POST(jsonReq({}), ctx({ slug: 'team-1' }))
    expect(tables.clients.find(c => c.id === 'cW')?.view_count).toBe(1)
    currentUser = 'X' // a signed-in stranger counts like any visitor
    await POST(jsonReq({}), ctx({ slug: 'team-1' }))
    expect(tables.clients.find(c => c.id === 'cW')?.view_count).toBe(2)
  })
})
