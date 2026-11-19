import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { makeFakeDb, type Tables } from '@/lib/agency/fake-db'
import { validateProfile } from '@/lib/agency/profile'
import { dnsRecordFor, dnsInstructionsText, isApexDomain } from '@/lib/dns-records'
import { checklistSteps } from '../../clients/Checklist'

const tables: Tables = {}
let db = makeFakeDb(tables)
let me: string | null = null
const portalMail: Array<Record<string, unknown>> = []
let allowRate = true

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: me ? { id: me } : null } }) } }),
  createAdminClient: async () => db,
  createServiceClient: () => db,
}))
vi.mock('@/lib/email', () => ({
  sendClientFeedbackAlert: async () => {}, sendClientEventAlert: async () => {},
  sendClientPortalEmail: async (a: Record<string, unknown>) => { portalMail.push(a) },
}))
vi.mock('@/lib/agency/limits', async (orig) => ({ ...(await orig<typeof import('@/lib/agency/limits')>()), hit: async () => allowRate }))

const req = (body?: unknown, method = 'POST') =>
  new NextRequest('http://localhost/x', { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
const P = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) })

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k]
  Object.assign(tables, {
    clients: [
      { id: 'cW', owner_id: 'A', org_id: 'W', name: 'Northwind', slug: 'north', status: 'active', contact_email: 'asha@northwind.test', brief_token: null, portal_passcode_hash: null },
      { id: 'cL', owner_id: 'A', org_id: null, name: 'Harbor Foods', slug: 'harbor', status: 'lead', contact_email: 'owner@harbor.test', brief_token: null, portal_passcode_hash: null },
    ],
    organization_members: [{ org_id: 'W', user_id: 'A', role: 'owner' }],
    organizations: [{ id: 'W', name: 'Northwind Studio', slug: 'nw' }],
    client_deliverables: [{ id: 'dW', client_id: 'cW', project_id: 'pW', is_visible: true, review_status: 'pending', sort_order: 0 }],
    client_feedback: [], client_updates: [], client_quotes: [], projects: [{ id: 'pW', user_id: 'A', org_id: 'W' }],
    profiles: [{ id: 'A', email: 'sam@personal.test', full_name: 'Sam Rivera' }],
    agency_profiles: [], audit_logs: [],
  })
  db = makeFakeDb(tables)
  me = 'A'; portalMail.length = 0; allowRate = true
})

describe('business profile', () => {
  it('keeps only known fields, trims, and caps length', () => {
    const r = validateProfile({ business_name: '  Northwind Studio  ', tax_id: 'x'.repeat(100), evil: 'drop me', default_currency: 'INR' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.profile.business_name).toBe('Northwind Studio')
      expect(r.profile.tax_id).toHaveLength(40)
      expect(r.profile).not.toHaveProperty('evil')
    }
  })
  it('rejects a non-https logo, a javascript link, a bad email and an unknown currency', () => {
    for (const bad of [{ logo_url: 'http://x.test/a.png' }, { logo_url: 'javascript:alert(1)' }, { website: 'javascript:alert(1)' }, { support_email: 'not an email' }, { default_currency: 'XXX' }]) {
      expect(validateProfile(bad).ok, JSON.stringify(bad)).toBe(false)
    }
    expect(validateProfile({ website: 'northwind.studio' })).toMatchObject({ ok: true, profile: { website: 'https://northwind.studio/' } })
  })
})

describe('DNS hand-off', () => {
  it('a root domain gets an A record, a subdomain a CNAME', () => {
    expect(isApexDomain('example.com')).toBe(true)
    expect(isApexDomain('www.example.com')).toBe(false)
    expect(dnsRecordFor('example.com')).toMatchObject({ type: 'A', name: '@', value: '76.76.21.21' })
    expect(dnsRecordFor('www.example.com')).toMatchObject({ type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' })
  })
  it('the message for the client\'s IT person says what to add, keeps email records, and never asks for logins', () => {
    const m = dnsInstructionsText('clientsite.com', { from: 'Sam' })
    expect(m).toContain('clientsite.com'); expect(m).toContain('76.76.21.21'); expect(m).toContain('MX'); expect(m).toContain('Sam')
    expect(m.toLowerCase()).not.toMatch(/password|login credentials/)
  })
})

describe('emails go out in the business\'s name', () => {
  async function send(clientId: string) {
    const { POST } = await import('./[id]/updates/route')
    return POST(req({ body: 'Staging is up', emailClient: true }), P({ id: clientId }))
  }
  it('uses the workspace profile for a workspace client, and replies to its support address', async () => {
    tables.agency_profiles.push({ id: 'ap1', owner_id: null, org_id: 'W', business_name: 'Northwind Studio', support_email: 'hello@northwind.studio' })
    tables.agency_profiles.push({ id: 'ap2', owner_id: 'A', org_id: null, business_name: 'Sam personal brand', support_email: 'sam@personal.test' })
    await send('cW')
    expect(portalMail[0]).toMatchObject({ fromName: 'Northwind Studio', replyTo: 'hello@northwind.studio' })
  })
  it('uses the freelancer\'s own profile for a solo client', async () => {
    tables.agency_profiles.push({ id: 'ap2', owner_id: 'A', org_id: null, business_name: 'Sam Rivera Web', support_email: 'work@samrivera.dev' })
    tables.clients.find(c => c.id === 'cL')!.status = 'active'
    await send('cL')
    expect(portalMail[0]).toMatchObject({ fromName: 'Sam Rivera Web', replyTo: 'work@samrivera.dev' })
  })
  it('falls back to the person\'s name and email when there is no profile', async () => {
    await send('cW')
    expect(portalMail[0]).toMatchObject({ fromName: 'Sam Rivera', replyTo: 'sam@personal.test' })
  })
  it('does not send when there is no business name and no personal name, so the client is never mailed from a stranger', async () => {
    tables.profiles.find(p => p.id === 'A')!.full_name = ''
    const r = await (await send('cW')).json()
    expect(r.email).toEqual({ sent: false, reason: 'no_sender' })
    expect(portalMail).toHaveLength(0)
  })
  it('a daily cap per freelancer stops them being used to mass-mail', async () => {
    allowRate = false
    const r = await (await send('cW')).json()
    expect(r.email).toEqual({ sent: false, reason: 'rate_limited' })
    expect(portalMail).toHaveLength(0)
  })
})

describe('quote terms and billing period', () => {
  it('stores terms and a billing period, defaults to one-off, and refuses an unknown period', async () => {
    const { POST } = await import('./[id]/quotes/route')
    const { PATCH } = await import('./[id]/quotes/[quoteId]/route')
    const items = [{ description: 'Hosting and updates', qty: 1, unit: 4999 }]
    const a = await (await POST(req({ title: 'Retainer', items, recurrence: 'monthly', terms: 'Cancel any time.' }), P({ id: 'cW' }))).json()
    expect(a.quote).toMatchObject({ recurrence: 'monthly', terms: 'Cancel any time.' })
    const b = await (await POST(req({ title: 'Build', items }), P({ id: 'cW' }))).json()
    expect(b.quote.recurrence).toBe('one_time')
    expect((await PATCH(req({ recurrence: 'weekly' }, 'PATCH'), P({ id: 'cW', quoteId: a.quote.id }))).status).toBe(400)
    expect((await PATCH(req({ recurrence: 'yearly', terms: 'New terms' }, 'PATCH'), P({ id: 'cW', quoteId: a.quote.id }))).status).toBe(200)
    expect(tables.client_quotes.find(q => q.id === a.quote.id)).toMatchObject({ recurrence: 'yearly', terms: 'New terms' })
  })
})

describe('intake link by email', () => {
  it('can create and email in one go, and re-send without changing the link', async () => {
    const { POST } = await import('./[id]/brief/route')
    const made = await (await POST(req({ emailClient: true }), P({ id: 'cL' }))).json()
    expect(made.email).toEqual({ sent: true })
    expect(portalMail[0]).toMatchObject({ to: 'owner@harbor.test', kind: 'brief' })
    expect(String(portalMail[0].link)).toContain(`/brief/${made.brief_token}`)
    const again = await (await POST(req({ resend: true }), P({ id: 'cL' }))).json()
    expect(again.brief_token).toBe(made.brief_token)
    expect(portalMail).toHaveLength(2)
  })
  it('cannot re-send a link that does not exist, and does not email an archived client', async () => {
    const { POST } = await import('./[id]/brief/route')
    expect((await POST(req({ resend: true }), P({ id: 'cL' }))).status).toBe(409)
    tables.clients.find(c => c.id === 'cL')!.status = 'archived'
    expect((await (await POST(req({ emailClient: true }), P({ id: 'cL' }))).json()).email).toEqual({ sent: false, reason: 'inactive' })
  })
})

describe('audit log for workspace clients', () => {
  it('records who did what, never the secret itself, and nothing for a solo freelancer', async () => {
    const { PATCH, DELETE } = await import('./[id]/route')
    await PATCH(req({ passcode: 'super-secret-code' }, 'PATCH'), P({ id: 'cW' }))
    await PATCH(req({ rotateLink: true }, 'PATCH'), P({ id: 'cW' }))
    await PATCH(req({ status: 'paused' }, 'PATCH'), P({ id: 'cW' }))
    await DELETE(req(undefined, 'DELETE'), P({ id: 'cW' }))
    await new Promise(r => setTimeout(r, 10)) // audit entries are written fire-and-forget, so let the last one land
    const actions = tables.audit_logs.map(r => r.action)
    expect(actions).toEqual(expect.arrayContaining(['client.passcode_set', 'client.link_rotated', 'client.status_changed', 'client.deleted']))
    expect(JSON.stringify(tables.audit_logs)).not.toContain('super-secret-code')
    expect(tables.audit_logs.every(r => r.org_id === 'W' && r.user_id === 'A')).toBe(true)
    const before = tables.audit_logs.length
    await PATCH(req({ rotateLink: true }, 'PATCH'), P({ id: 'cL' })) // solo client: no workspace, no log
    expect(tables.audit_logs).toHaveLength(before)
  })
})

describe('the limiter fails closed for passcode attempts', () => {
  it('denies when the database is unreachable, but lets ordinary traffic through', async () => {
    vi.resetModules()
    vi.doUnmock('@/lib/agency/limits')
    vi.doMock('@/lib/supabase/server', () => ({ createServiceClient: () => ({ rpc: async () => ({ data: null, error: { message: 'down' } }) }) }))
    const { hit } = await import('@/lib/agency/limits')
    expect(await hit('k', 1, 1000, { failClosed: true })).toBe(false)
    expect(await hit('k', 1, 1000)).toBe(true)
    vi.doUnmock('@/lib/supabase/server')
  })
})

describe('first-run checklist reflects what really happened', () => {
  const run = { business: () => {}, newClient: () => {} }
  it('starts empty and ticks off as the job progresses', () => {
    const done = (steps: ReturnType<typeof checklistSteps>) => steps.filter(s => s.done).map(s => s.id)
    expect(done(checklistSteps([], false, run))).toEqual([])
    const client = {
      brief_submitted_at: '2026-01-01', client_deliverables: [{ projects: { published_url: 'https://x', custom_domain_verified: true }, review_status: 'approved', delivered_at: '2026-01-05' }],
      client_quotes: [{ status: 'sent' }],
    } as never
    expect(done(checklistSteps([client], true, run))).toEqual(['biz', 'client', 'start', 'publish', 'domain', 'review', 'quote', 'handover'])
  })
})
