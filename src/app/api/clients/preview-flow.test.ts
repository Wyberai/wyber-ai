import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { makeFakeDb, type Tables } from '@/lib/agency/fake-db'
import { isPreviewToken, makePreviewToken, previewPath } from '@/lib/agency/preview'
import { unlockCookieName, unlockToken, hashPasscode } from '@/lib/agency/passcode'
import { webPreviewPage } from '@/lib/agency/preview-page'

// Share a preview: the freelancer makes a private link to the latest saved version; the client opens it without the
// project being published. Real route handlers over an in-memory database and object store.

const tables: Tables = {}
let db = makeFakeDb(tables)
let me: string | null = null
let allow = true
const builderCalls: Array<{ url: string; body?: string }> = []
let builderMode: 'ok' | 'fail' | 'unreachable' = 'ok'
let mobileHtml = '<!doctype html><title>mobile</title><p>MOBILE FRAME</p>'

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: me ? { id: me } : null } }) } }),
  createAdminClient: async () => db,
  createServiceClient: () => db,
}))
vi.mock('@/lib/agency/limits', async (orig) => ({ ...(await orig<typeof import('@/lib/agency/limits')>()), hit: async () => allow }))
vi.mock('@/lib/smoke-test', () => ({ runSmokeTest: async () => ({ ok: true }) }))
vi.mock('@/lib/rnw-preview/share-page', () => ({ mobileSharePage: async () => ({ status: 200, html: mobileHtml }) }))

const APP_HTML = '<!doctype html><html><body><div id="root"></div><script src="./assets/app.js"></script></body></html>'

beforeEach(() => {
  builderCalls.length = 0; builderMode = 'ok'; allow = true; me = null
  vi.stubGlobal('fetch', async (url: string, init?: { body?: string }) => {
    builderCalls.push({ url: String(url), body: init?.body })
    if (builderMode === 'unreachable') throw new Error('network down')
    if (String(url).endsWith('/build')) return builderMode === 'fail' ? new Response(JSON.stringify({ error: 'Bundling error in App.tsx' }), { status: 500 }) : new Response(JSON.stringify({ url: 'https://builder.test/b/abc/index.html' }), { status: 200 })
    return new Response(APP_HTML, { status: 200 })
  })
  for (const k of Object.keys(tables)) delete tables[k]
  Object.assign(tables, {
    clients: [
      { id: 'cW', owner_id: 'A', org_id: 'W', name: 'Northwind', slug: 'north-secret', status: 'active', portal_passcode_hash: null },
      { id: 'cS', owner_id: 'A', org_id: null, name: 'Solo Co', slug: 'solo-secret', status: 'active', portal_passcode_hash: null },
    ],
    organization_members: [{ org_id: 'W', user_id: 'A', role: 'owner' }, { org_id: 'W', user_id: 'M', role: 'member' }, { org_id: 'W', user_id: 'V', role: 'viewer' }],
    organizations: [{ id: 'W', name: 'Northwind Studio', slug: 'nw' }],
    projects: [
      { id: 'pW', user_id: 'A', org_id: 'W', name: 'Booking site', project_type: 'app', files: { 'src/App.tsx': 'export default function App(){return <h1>Hello</h1>}' }, feedback_mode_enabled: false, published_url: null, is_public: false },
      { id: 'pMob', user_id: 'A', org_id: 'W', name: 'Booking app', project_type: 'mobile', files: { 'App.tsx': 'x' } },
      { id: 'pSolo', user_id: 'A', org_id: null, name: 'Solo site', project_type: 'app', files: { 'src/App.tsx': 'export default function App(){return <h1>Solo</h1>}' } },
      { id: 'pPrivate', user_id: 'OTHER', org_id: null, name: 'Not yours', project_type: 'app', files: { 'src/App.tsx': 'x' } },
    ],
    client_deliverables: [
      { id: 'dW', client_id: 'cW', project_id: 'pW', is_visible: true, review_status: 'pending', sort_order: 0, preview_token: null, preview_enabled: false },
      { id: 'dMob', client_id: 'cW', project_id: 'pMob', is_visible: true, review_status: 'pending', sort_order: 1, preview_token: null, preview_enabled: false },
      { id: 'dS', client_id: 'cS', project_id: 'pSolo', is_visible: true, review_status: 'pending', sort_order: 0, preview_token: null, preview_enabled: false },
      { id: 'dBad', client_id: 'cW', project_id: 'pPrivate', is_visible: true, review_status: 'pending', sort_order: 2, preview_token: null, preview_enabled: false },
    ],
    profiles: [{ id: 'A', email: 'sam@x.test', credits: 120 }],
    agency_profiles: [{ id: 'ap', org_id: 'W', owner_id: null, business_name: 'Northwind Studio' }],
    audit_logs: [],
  })
  db = makeFakeDb(tables)
})

const req = (body?: unknown, method = 'POST', cookie?: string) =>
  new NextRequest('http://localhost/x', { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
const P = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) })
const owner = async (clientId: string, deliverableId: string, action: string) =>
  (await import('./[id]/deliverables/[deliverableId]/preview/route')).POST(req({ action }), P({ id: clientId, deliverableId }))
const del = (id: string) => tables.client_deliverables.find(d => d.id === id)!
const stored = () => (db as unknown as { objects: Map<string, string> }).objects

describe('preview tokens', () => {
  it('are long, random and recognisable', () => {
    const a = makePreviewToken(), b = makePreviewToken()
    expect(a).not.toBe(b)
    expect(isPreviewToken(a)).toBe(true)
    for (const bad of ['', 'pv_', 'pv_short', 'xx_' + 'a'.repeat(32), 'pv_' + '!'.repeat(32), null, 5]) expect(isPreviewToken(bad as never), String(bad)).toBe(false)
    expect(previewPath(a)).toBe(`previews/${a}/index.html`)
  })
})

describe('making a preview', () => {
  it('builds the latest saved version, stores it under the secret token, and turns the link on', async () => {
    me = 'A'
    const r = await owner('cW', 'dW', 'create')
    expect(r.status).toBe(200)
    const { preview } = await r.json()
    expect(preview).toMatchObject({ enabled: true, kind: 'web' })
    expect(isPreviewToken(preview.token)).toBe(true)
    expect(del('dW')).toMatchObject({ preview_token: preview.token, preview_enabled: true })
    expect(stored().get(`published-apps/previews/${preview.token}/index.html`)).toContain('id="root"')
    expect(builderCalls[0].url).toContain('/build')
    expect(builderCalls[0].body).toContain('src/App.tsx')
  })

  it('never publishes, never touches the live site, never costs a credit, and never returns the project id', async () => {
    me = 'A'
    const before = JSON.stringify({ p: tables.projects.find(p => p.id === 'pW'), c: tables.profiles })
    const text = await (await owner('cW', 'dW', 'create')).text()
    expect(JSON.stringify({ p: tables.projects.find(p => p.id === 'pW'), c: tables.profiles })).toBe(before)
    expect(text).not.toContain('pW')
    expect(tables.profiles[0].credits).toBe(120)
  })

  it('adds the pinned-comments widget only when that is switched on for the project', async () => {
    me = 'A'
    const t1 = (await (await owner('cW', 'dW', 'create')).json()).preview.token
    expect(stored().get(`published-apps/previews/${t1}/index.html`)).not.toContain('wyber-feedback')
    tables.projects.find(p => p.id === 'pW')!.feedback_mode_enabled = true
    await owner('cW', 'dW', 'refresh')
    expect(stored().get(`published-apps/previews/${t1}/index.html`)).toContain('wyber-feedback')
  })

  it('refresh rebuilds on the same link; rotate makes a new one and the old one stops working', async () => {
    me = 'A'
    const t1 = (await (await owner('cW', 'dW', 'create')).json()).preview.token
    expect((await (await owner('cW', 'dW', 'refresh')).json()).preview.token).toBe(t1)
    const t2 = (await (await owner('cW', 'dW', 'rotate')).json()).preview.token
    expect(t2).not.toBe(t1)
    expect(stored().has(`published-apps/previews/${t1}/index.html`)).toBe(false)
    expect(stored().has(`published-apps/previews/${t2}/index.html`)).toBe(true)
  })

  it('off switches the link off and removes the stored page', async () => {
    me = 'A'
    const t = (await (await owner('cW', 'dW', 'create')).json()).preview.token
    await owner('cW', 'dW', 'off')
    expect(del('dW').preview_enabled).toBe(false)
    expect(stored().has(`published-apps/previews/${t}/index.html`)).toBe(false)
  })

  it('a failed build leaves the previous preview working', async () => {
    me = 'A'
    const t = (await (await owner('cW', 'dW', 'create')).json()).preview.token
    builderMode = 'fail'
    const r = await owner('cW', 'dW', 'refresh')
    expect(r.status).toBe(502)
    expect((await r.json()).error).toContain('Bundling error')
    expect(del('dW')).toMatchObject({ preview_token: t, preview_enabled: true })
    expect(stored().has(`published-apps/previews/${t}/index.html`)).toBe(true)
    builderMode = 'unreachable'
    expect((await owner('cW', 'dW', 'refresh')).status).toBe(502)
  })

  it('a failed first build does not turn anything on', async () => {
    me = 'A'; builderMode = 'fail'
    expect((await owner('cS', 'dS', 'create')).status).toBe(502)
    expect(del('dS')).toMatchObject({ preview_enabled: false, preview_token: null })
  })

  it('refuses to preview a project that contains a secret key', async () => {
    me = 'A'
    tables.projects.find(p => p.id === 'pW')!.files = { 'src/App.tsx': "const k = 'sk_live_" + 'a'.repeat(30) + "'" }
    const r = await owner('cW', 'dW', 'create')
    expect(r.status).toBe(400)
    expect((await r.json()).error).toContain('exposed secret')
    expect(builderCalls).toHaveLength(0)
    expect(del('dW').preview_enabled).toBe(false)
  })

  it('refuses an empty project', async () => {
    me = 'A'
    tables.projects.find(p => p.id === 'pW')!.files = {}
    expect((await owner('cW', 'dW', 'create')).status).toBe(409)
  })

  it('a mobile project needs no build: it just turns the link on', async () => {
    me = 'A'
    const r = await (await owner('cW', 'dMob', 'create')).json()
    expect(r.preview).toMatchObject({ enabled: true, kind: 'mobile' })
    expect(builderCalls).toHaveLength(0)
    expect(stored().size).toBe(0)
  })

  it('builds are rate limited per person, but a mobile preview is not', async () => {
    me = 'A'; allow = false
    expect((await owner('cW', 'dW', 'create')).status).toBe(429)
    expect((await owner('cW', 'dMob', 'create')).status).toBe(200)
  })

  it('rejects an unknown action', async () => {
    me = 'A'
    expect((await owner('cW', 'dW', 'publish')).status).toBe(400)
  })

  it('records the sharing in the workspace audit log, never the token', async () => {
    me = 'A'
    const t = (await (await owner('cW', 'dW', 'create')).json()).preview.token
    await owner('cW', 'dW', 'off')
    await new Promise(r => setTimeout(r, 10))
    expect(tables.audit_logs.map(a => a.action)).toEqual(expect.arrayContaining(['client.preview_shared', 'client.preview_off']))
    expect(JSON.stringify(tables.audit_logs)).not.toContain(t)
  })
})

describe('who may make a preview', () => {
  it('a workspace member can; a viewer, a stranger and a signed-out caller cannot', async () => {
    me = 'M'; expect((await owner('cW', 'dW', 'create')).status).toBe(200)
    me = 'V'; expect((await owner('cW', 'dW', 'off')).status).toBe(403)
    me = 'X'; expect((await owner('cW', 'dW', 'create')).status).toBe(404)
    me = null; expect((await owner('cW', 'dW', 'create')).status).toBe(401)
  })
  it('cannot preview a project the caller may not change, even on a client they can edit', async () => {
    me = 'A'
    const r = await owner('cW', 'dBad', 'create')
    expect(r.status).toBe(404)
    expect(builderCalls).toHaveLength(0)
    expect(del('dBad').preview_enabled).toBe(false)
  })
  it('a deliverable of another client is not reachable through this one', async () => {
    me = 'A'
    expect((await owner('cS', 'dW', 'create')).status).toBe(404)
  })
})

describe('what the client sees at /preview/<token>', () => {
  const get = async (token: string, cookie?: string) => (await import('../../preview/[token]/route')).GET(req(undefined, 'GET', cookie), P({ token }))
  async function live(clientId = 'cW', deliverableId = 'dW') { me = 'A'; return (await (await owner(clientId, deliverableId, 'create')).json()).preview.token as string }

  it('shows the draft in a sandboxed frame with no app code on our own page, and says it is a draft', async () => {
    const t = await live()
    me = null
    const r = await get(t)
    expect(r.status).toBe(200)
    const body = await r.text()
    expect(body).toContain('This is a draft')
    expect(body).toContain('Northwind Studio')
    expect(body).toMatch(/<iframe[^>]+sandbox="[^"]*allow-scripts/)
    expect(body, 'the frame must not share our origin').not.toContain('allow-same-origin')
    expect(body).toContain('srcdoc=')
    // The only app code is inside the frame's srcdoc attribute. Our own page, before and after it, has no script at all.
    expect(body.slice(0, body.indexOf('srcdoc=')), 'script before the frame').not.toMatch(/<script/i)
    expect(body.slice(body.indexOf('</iframe>')), 'script after the frame').not.toMatch(/<script/i)
    expect(body).not.toContain('pW')
  })

  it('is never cached, never indexed, and never leaks a referrer', async () => {
    const t = await live()
    me = null
    const h = (await get(t)).headers
    expect(h.get('cache-control')).toContain('no-store')
    expect(h.get('x-robots-tag')).toContain('noindex')
    expect(h.get('referrer-policy')).toBe('no-referrer')
  })

  it('malformed, unknown and switched-off tokens all look the same: not available', async () => {
    const t = await live()
    await owner('cW', 'dW', 'off')
    me = null
    for (const bad of ['nope', 'pv_' + 'a'.repeat(32), t]) {
      const r = await get(bad)
      expect(r.status, bad).toBe(404)
      expect(await r.text()).toContain('not available')
    }
  })

  it('a rotated link stops working and the new one works', async () => {
    const t1 = await live()
    me = 'A'
    const t2 = (await (await owner('cW', 'dW', 'rotate')).json()).preview.token
    me = null
    expect((await get(t1)).status).toBe(404)
    expect((await get(t2)).status).toBe(200)
  })

  it('stops working when the client is paused, archived or a lead', async () => {
    const t = await live()
    me = null
    for (const status of ['paused', 'archived', 'lead']) {
      tables.clients.find(c => c.id === 'cW')!.status = status
      expect((await get(t)).status, status).toBe(404)
    }
  })

  it('on a passcode-locked client, only opens in a browser that has unlocked it, and never reveals the page address', async () => {
    const t = await live()
    tables.clients.find(c => c.id === 'cW')!.portal_passcode_hash = hashPasscode('blue-door')
    me = null
    const locked = await get(t)
    expect(locked.status).toBe(401)
    const body = await locked.text()
    expect(body).toContain('protected')
    expect(body).not.toContain('north-secret')
    const hash = String(tables.clients.find(c => c.id === 'cW')!.portal_passcode_hash)
    const cookie = `${unlockCookieName('north-secret')}=${unlockToken('north-secret', hash)}`
    expect((await get(t, cookie)).status).toBe(200)
    // a cookie from a DIFFERENT client's page does not help
    expect((await get(t, `${unlockCookieName('solo-secret')}=${unlockToken('solo-secret', hash)}`)).status).toBe(401)
  })

  it('says so plainly when the preview has not been built yet or is being rebuilt', async () => {
    const t = await live()
    stored().clear()
    me = null
    const r = await get(t)
    expect(r.status).toBe(404)
    expect(await r.text()).toContain('not ready')
  })

  it('renders a mobile project in its phone frame', async () => {
    const t = await live('cW', 'dMob')
    me = null
    const r = await get(t)
    expect(r.status).toBe(200)
    expect(await r.text()).toContain('MOBILE FRAME')
    expect(r.headers.get('cache-control')).toContain('no-store')
  })

  it('one client\'s link never shows another client\'s work', async () => {
    const tW = await live('cW', 'dW')
    const tS = await live('cS', 'dS')
    stored().set(`published-apps/previews/${tW}/index.html`, '<div id="root">NORTHWIND WORK</div>')
    stored().set(`published-apps/previews/${tS}/index.html`, '<div id="root">SOLO WORK</div>')
    me = null
    const a = await (await get(tW)).text(), b = await (await get(tS)).text()
    expect(a).toContain('NORTHWIND WORK'); expect(a).not.toContain('SOLO WORK')
    expect(b).toContain('SOLO WORK'); expect(b).not.toContain('NORTHWIND WORK')
  })

  it('escapes hostile project names and app html so nothing breaks out of the frame', () => {
    const page = webPreviewPage({ name: '"><script>alert(1)</script>', business: '<img src=x onerror=alert(1)>', inner: '<div id="root">"quote" & <b>bold</b></div>' })
    expect(page).not.toContain('<script>alert(1)</script>')
    expect(page).not.toContain('<img src=x onerror')
    expect(page).toContain('srcdoc="')
    // inside srcdoc, a double quote must be escaped or it would end the attribute early
    const srcdoc = /srcdoc="([^"]*)"/.exec(page)![1]
    expect(srcdoc).toContain('&quot;quote&quot;')
  })
})
