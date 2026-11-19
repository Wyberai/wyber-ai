import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { makeFakeDb, type Tables } from '@/lib/agency/fake-db'

// Tenant isolation, attacked from every side. Two tenants:
//   F: a solo freelancer with one client.        G: a four-person agency workspace with one client.
// plus X, a signed-in stranger. Every route is tried against the other tenant's data. Each attack must be refused AND
// must change nothing, and no response may contain the other tenant's data or any passcode hash.

const tables: Tables = {}
let db = makeFakeDb(tables)
let me: string | null = null

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: me ? { id: me } : null } }) } }),
  createAdminClient: async () => db,
  createServiceClient: () => db,
}))
vi.mock('@/lib/email', () => ({
  sendClientFeedbackAlert: async () => {}, sendClientPortalEmail: async () => {}, sendClientEventAlert: async () => {},
}))
vi.mock('@/lib/agency/limits', async (orig) => ({ ...(await orig<typeof import('@/lib/agency/limits')>()), hit: async () => true }))

const req = (body?: unknown, method = 'POST', cookie?: string, url = 'http://localhost/x') =>
  new NextRequest(url, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
const P = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) })

interface World { client: string; deliverable: string; quote: string; update: string; feedback: string; project: string; slug: string; briefToken: string }
const WORLD: Record<'F' | 'G', World> = {
  F: { client: 'cF', deliverable: 'dF', quote: 'qF', update: 'uF', feedback: 'fbF', project: 'pF', slug: 'solo-secret-slug', briefToken: 'b_solo_secret_token' },
  G: { client: 'cG', deliverable: 'dG', quote: 'qG', update: 'uG', feedback: 'fbG', project: 'pG', slug: 'agency-secret-slug', briefToken: 'b_agency_secret_token' },
}

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k]
  const client = (t: 'F' | 'G', owner: string, org: string | null) => ({ id: WORLD[t].client, owner_id: owner, org_id: org, name: `${t} client`, slug: WORLD[t].slug, status: 'active', contact_email: `${t.toLowerCase()}@client.test`, brief_token: WORLD[t].briefToken, portal_passcode_hash: 'salt:hash-SECRET', view_count: 0 })
  Object.assign(tables, {
    clients: [client('F', 'F', null), client('G', 'GO', 'W')],
    organization_members: [{ org_id: 'W', user_id: 'GO', role: 'owner' }, { org_id: 'W', user_id: 'GA', role: 'admin' }, { org_id: 'W', user_id: 'GM', role: 'member' }, { org_id: 'W', user_id: 'GV', role: 'viewer' }],
    organizations: [{ id: 'W', name: 'Agency G', slug: 'g' }],
    projects: [{ id: 'pF', user_id: 'F', org_id: null }, { id: 'pG', user_id: 'GO', org_id: 'W' }, { id: 'pX', user_id: 'X', org_id: null }],
    client_deliverables: (['F', 'G'] as const).map(t => ({ id: WORLD[t].deliverable, client_id: WORLD[t].client, project_id: WORLD[t].project, is_visible: true, headline: `${t} work`, review_status: 'pending', sort_order: 0, preview_token: null, preview_enabled: false })),
    client_feedback: (['F', 'G'] as const).map(t => ({ id: WORLD[t].feedback, client_id: WORLD[t].client, deliverable_id: WORLD[t].deliverable, kind: 'changes_requested', author_name: `${t} client person`, body: `${t} PRIVATE FEEDBACK`, resolved: false, created_at: '2026-11-01T00:00:00Z' })),
    client_updates: (['F', 'G'] as const).map(t => ({ id: WORLD[t].update, client_id: WORLD[t].client, body: `${t} PRIVATE UPDATE`, created_at: '2026-11-01T00:00:00Z' })),
    client_quotes: (['F', 'G'] as const).map(t => ({ id: WORLD[t].quote, client_id: WORLD[t].client, number: 'Q-001', title: `${t} PRIVATE QUOTE`, currency: 'USD', items: [{ description: 'x', qty: 1, unit: 100 }], total: 100, status: 'sent', recurrence: 'one_time' })),
    agency_profiles: [{ id: 'apF', owner_id: 'F', org_id: null, business_name: 'F PRIVATE BIZ' }, { id: 'apG', owner_id: null, org_id: 'W', business_name: 'G PRIVATE BIZ' }],
    profiles: [{ id: 'F', email: 'f@freelancer.test' }, { id: 'GO', email: 'go@agency.test' }],
    audit_logs: [],
  })
  db = makeFakeDb(tables)
  me = null
})

type Attack = { name: string; write: boolean; run: () => Promise<Response> }

// Every owner-side route, aimed at one tenant's resources.
function attacks(t: 'F' | 'G'): Attack[] {
  const w = WORLD[t]
  const c = w.client
  return [
    { name: 'PATCH client', write: true, run: async () => (await import('./[id]/route')).PATCH(req({ name: 'pwned', status: 'paused' }, 'PATCH'), P({ id: c })) },
    { name: 'rotate link', write: true, run: async () => (await import('./[id]/route')).PATCH(req({ rotateLink: true }, 'PATCH'), P({ id: c })) },
    { name: 'set passcode', write: true, run: async () => (await import('./[id]/route')).PATCH(req({ passcode: 'hacked-code' }, 'PATCH'), P({ id: c })) },
    { name: 'move client to workspace', write: true, run: async () => (await import('./[id]/route')).PATCH(req({ orgId: 'W' }, 'PATCH'), P({ id: c })) },
    { name: 'DELETE client', write: true, run: async () => (await import('./[id]/route')).DELETE(req(undefined, 'DELETE'), P({ id: c })) },
    { name: 'attach deliverable', write: true, run: async () => (await import('./[id]/deliverables/route')).POST(req({ projectId: 'pX' }), P({ id: c })) },
    { name: 'PATCH deliverable', write: true, run: async () => (await import('./[id]/deliverables/[deliverableId]/route')).PATCH(req({ headline: 'pwned', delivered: true }, 'PATCH'), P({ id: c, deliverableId: w.deliverable })) },
    { name: 'DELETE deliverable', write: true, run: async () => (await import('./[id]/deliverables/[deliverableId]/route')).DELETE(req(undefined, 'DELETE'), P({ id: c, deliverableId: w.deliverable })) },
    { name: 'post update', write: true, run: async () => (await import('./[id]/updates/route')).POST(req({ body: 'pwned', emailClient: true }), P({ id: c })) },
    { name: 'delete update', write: true, run: async () => (await import('./[id]/updates/[updateId]/route')).DELETE(req(undefined, 'DELETE'), P({ id: c, updateId: w.update })) },
    { name: 'resolve feedback', write: true, run: async () => (await import('./[id]/feedback/[feedbackId]/route')).PATCH(req({ resolved: true }, 'PATCH'), P({ id: c, feedbackId: w.feedback })) },
    { name: 'make intake link', write: true, run: async () => (await import('./[id]/brief/route')).POST(req({}), P({ id: c })) },
    { name: 'email intake link', write: true, run: async () => (await import('./[id]/brief/route')).POST(req({ resend: true }), P({ id: c })) },
    { name: 'turn off intake link', write: true, run: async () => (await import('./[id]/brief/route')).DELETE(req(undefined, 'DELETE'), P({ id: c })) },
    { name: 'create quote', write: true, run: async () => (await import('./[id]/quotes/route')).POST(req({ title: 'pwned', items: [{ description: 'x', qty: 1, unit: 1 }] }), P({ id: c })) },
    { name: 'send quote', write: true, run: async () => (await import('./[id]/quotes/[quoteId]/route')).PATCH(req({ action: 'send' }, 'PATCH'), P({ id: c, quoteId: w.quote })) },
    { name: 'edit quote', write: true, run: async () => (await import('./[id]/quotes/[quoteId]/route')).PATCH(req({ title: 'pwned' }, 'PATCH'), P({ id: c, quoteId: w.quote })) },
    { name: 'delete quote', write: true, run: async () => (await import('./[id]/quotes/[quoteId]/route')).DELETE(req(undefined, 'DELETE'), P({ id: c, quoteId: w.quote })) },
    { name: 'preview create', write: true, run: async () => (await import('./[id]/deliverables/[deliverableId]/preview/route')).POST(req({ action: 'create' }), P({ id: c, deliverableId: w.deliverable })) },
    { name: 'preview refresh', write: true, run: async () => (await import('./[id]/deliverables/[deliverableId]/preview/route')).POST(req({ action: 'refresh' }), P({ id: c, deliverableId: w.deliverable })) },
    { name: 'preview rotate', write: true, run: async () => (await import('./[id]/deliverables/[deliverableId]/preview/route')).POST(req({ action: 'rotate' }), P({ id: c, deliverableId: w.deliverable })) },
    { name: 'preview off', write: true, run: async () => (await import('./[id]/deliverables/[deliverableId]/preview/route')).POST(req({ action: 'off' }), P({ id: c, deliverableId: w.deliverable })) },
    { name: 'read approval log', write: false, run: async () => (await import('./[id]/approvals/route')).GET(req(undefined, 'GET'), P({ id: c })) },
  ]
}

const snapshot = () => JSON.stringify(tables)

async function bodyOf(r: Response): Promise<string> { try { return await r.clone().text() } catch { return '' } }

describe('owner routes refuse other tenants and change nothing', () => {
  it('signed out: every route says 401', async () => {
    for (const t of ['F', 'G'] as const) for (const a of attacks(t)) {
      me = null
      const before = snapshot()
      expect((await a.run()).status, `${t}: ${a.name}`).toBe(401)
      expect(snapshot(), `${t}: ${a.name} changed data`).toBe(before)
    }
  })

  const outsiders: Array<[string, 'F' | 'G']> = [['X', 'F'], ['X', 'G'], ['F', 'G'], ['GM', 'F'], ['GA', 'F'], ['GO', 'F']]
  for (const [who, target] of outsiders) {
    it(`${who} (no access) attacking tenant ${target}: every route is refused and nothing changes`, async () => {
      for (const a of attacks(target)) {
        me = who
        const before = snapshot()
        const r = await a.run()
        expect([403, 404], `${who} → ${target}: ${a.name} returned ${r.status}`).toContain(r.status)
        expect(snapshot(), `${who} → ${target}: ${a.name} changed data`).toBe(before)
        const text = await bodyOf(r)
        expect(text, `${who} → ${target}: ${a.name} leaked`).not.toMatch(new RegExp(`${target} PRIVATE|SECRET`))
      }
    })
  }

  it('a workspace VIEWER can read the agency\'s approval log but every write is refused (403) and changes nothing', async () => {
    for (const a of attacks('G')) {
      me = 'GV'
      const before = snapshot()
      const r = await a.run()
      if (a.write) {
        expect(r.status, `viewer: ${a.name}`).toBe(403)
        expect(snapshot(), `viewer: ${a.name} changed data`).toBe(before)
      } else {
        expect(r.status, `viewer: ${a.name}`).toBe(200)
      }
    }
  })
})

describe('reads never mix tenants', () => {
  const listFor = async (u: string) => { me = u; const r = await (await import('./route')).GET(); return { status: r.status, text: await r.text() } }

  it('each person sees only their own tenant in the client list, with no passcode hash', async () => {
    const f = await listFor('F')
    expect(f.text).toContain('F client'); expect(f.text).not.toContain('G client'); expect(f.text).not.toMatch(/SECRET|portal_passcode_hash/)
    for (const u of ['GO', 'GA', 'GM', 'GV']) {
      const g = await listFor(u)
      expect(g.text, u).toContain('G client'); expect(g.text, u).not.toContain('F client'); expect(g.text, u).not.toMatch(/SECRET|portal_passcode_hash/)
    }
    const x = await listFor('X')
    expect(JSON.parse(x.text).clients).toEqual([])
  })

  it('nobody can read another tenant\'s business profile, and only owners and admins can change a workspace\'s', async () => {
    const { GET, PUT } = await import('../agency/profile/route')
    const get = (org?: string) => GET(req(undefined, 'GET', undefined, `http://localhost/api/agency/profile${org ? `?orgId=${org}` : ''}`))
    const put = (org?: string) => PUT(req({ profile: { business_name: 'pwned' } }, 'PUT', undefined, `http://localhost/api/agency/profile${org ? `?orgId=${org}` : ''}`))
    me = 'F'
    expect((await get('W')).status).toBe(404)
    expect((await put('W')).status).toBe(404)
    expect(await (await get()).text()).toContain('F PRIVATE BIZ')
    me = 'X'
    expect(await (await get()).text()).not.toMatch(/PRIVATE BIZ/)
    expect((await get('W')).status).toBe(404)
    me = 'GM'
    expect(await (await get('W')).text()).toContain('G PRIVATE BIZ')
    expect((await put('W')).status).toBe(403)
    me = 'GV'
    expect((await put('W')).status).toBe(403)
    me = 'GA'
    expect((await put('W')).status).toBe(200)
    expect(tables.agency_profiles.find(p => p.id === 'apF')?.business_name).toBe('F PRIVATE BIZ')
  })

  it('the personal profile is never reachable through a workspace id, and vice versa', async () => {
    const { PUT } = await import('../agency/profile/route')
    me = 'GO'
    await PUT(req({ profile: { business_name: 'G renamed' } }, 'PUT', undefined, 'http://localhost/api/agency/profile'))
    expect(tables.agency_profiles.find(p => p.id === 'apF')?.business_name).toBe('F PRIVATE BIZ')
    expect(tables.agency_profiles.find(p => p.id === 'apG')?.business_name).toBe('G PRIVATE BIZ')
    expect(tables.agency_profiles.filter(p => p.owner_id === 'GO')).toHaveLength(1)
  })
})

describe('public client links cannot cross tenants', () => {
  it('a client of F cannot review, answer a quote for, or unlock anything belonging to G, using F\'s own link', async () => {
    const { POST: review } = await import('../portal/[slug]/review/route')
    const { POST: quote } = await import('../portal/[slug]/quote/route')
    me = null
    const before = snapshot()
    // F's link with G's deliverable and G's quote
    expect((await review(req({ deliverableId: WORLD.G.deliverable, kind: 'approved' }), P({ slug: WORLD.F.slug }))).status).toBe(401) // locked: no passcode yet
    tables.clients.find(c => c.id === 'cF')!.portal_passcode_hash = null
    const before2 = snapshot()
    expect((await review(req({ deliverableId: WORLD.G.deliverable, kind: 'approved' }), P({ slug: WORLD.F.slug }))).status).toBe(404)
    expect((await quote(req({ quoteId: WORLD.G.quote, action: 'accept', name: 'Eve Mallory' }), P({ slug: WORLD.F.slug }))).status).toBe(404)
    expect(snapshot()).toBe(before2)
    void before
  })

  it('unlocking one client\'s page never unlocks another\'s', async () => {
    const { hashPasscode } = await import('@/lib/agency/passcode')
    const { POST: unlock } = await import('../portal/[slug]/unlock/route')
    const { POST: review } = await import('../portal/[slug]/review/route')
    tables.clients.find(c => c.id === 'cF')!.portal_passcode_hash = hashPasscode('shared-pass')
    tables.clients.find(c => c.id === 'cG')!.portal_passcode_hash = hashPasscode('shared-pass') // even the SAME passcode
    me = null
    const cookie = (await unlock(req({ passcode: 'shared-pass' }), P({ slug: WORLD.F.slug }))).headers.get('set-cookie')!.split(';')[0]
    expect((await review(req({ deliverableId: WORLD.F.deliverable, kind: 'comment', note: 'hi' }, 'POST', cookie), P({ slug: WORLD.F.slug }))).status).toBe(200)
    expect((await review(req({ deliverableId: WORLD.G.deliverable, kind: 'comment', note: 'hi' }, 'POST', cookie), P({ slug: WORLD.G.slug }))).status).toBe(401)
  })

  it('an intake link only ever reads or writes its own client', async () => {
    const { GET, POST } = await import('../brief/[token]/route')
    me = null
    const info = await (await GET(req(undefined, 'GET'), P({ token: WORLD.F.briefToken }))).text()
    expect(info).toContain('F client'); expect(info).not.toContain('G client')
    await POST(req({ answers: { kind: 'Website', business: 'Via F link', about: 'a', goal: 'b' } }), P({ token: WORLD.F.briefToken }))
    expect(tables.clients.find(c => c.id === 'cF')?.brief).toMatchObject({ business: 'Via F link' })
    expect(tables.clients.find(c => c.id === 'cG')?.brief).toBeUndefined()
    // a guessed or truncated token reveals nothing
    for (const bad of ['b_', WORLD.F.briefToken.slice(0, -1), `${WORLD.F.briefToken}x`, 'x'.repeat(30)]) expect((await GET(req(undefined, 'GET'), P({ token: bad }))).status, bad).toBe(404)
  })

  it('a paused, lead or archived client\'s page answers nothing', async () => {
    const { POST: review } = await import('../portal/[slug]/review/route')
    tables.clients.find(c => c.id === 'cF')!.portal_passcode_hash = null
    for (const status of ['paused', 'lead', 'archived']) {
      tables.clients.find(c => c.id === 'cF')!.status = status
      expect((await review(req({ deliverableId: WORLD.F.deliverable, kind: 'approved' }), P({ slug: WORLD.F.slug }))).status, status).toBe(404)
    }
  })
})
