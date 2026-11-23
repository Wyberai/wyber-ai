import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
vi.setConfig({ testTimeout: 30000 })
import ts from 'typescript'
import fs from 'node:fs'
import path from 'node:path'
import { createHmac } from 'node:crypto'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { planSaas, pickSaasDirection, validatePlans, normalizePlans, renderSaas, generateSaas, buildSaasModelPrompt, validateSaasModel, normalizeSaasModel, previewOf } from './index'
import { DEMO_SAAS, demoSiteCopy } from './demo-models'
import { saasSpecEnabled } from './flag'
import { checkSaasReady } from '../saas-ready'
import { scanSlopSource } from '../unslop'
import { reviewEmittedFile, createFindingIdGenerator } from '../agents/security-rules'
import { validateCopy } from '../website-spec/copy'
import { DIRECTIONS } from '../design-directions'
import { WYBER_UI_KIT_SOURCE } from '../wyber-ui-kit'
import { kitImportCount } from '../kit-imports'

const siteCopyFor = (d: (typeof DEMO_SAAS)[number], seed = d.seed) => {
  const spec = planSaas(d.prompt, { seed, currency: d.currency })
  return { spec, copy: demoSiteCopy(spec.site, d.copy) }
}

describe('plans model', () => {
  const d = DEMO_SAAS[0]
  const clone = () => structuredClone(d.model.plans)
  it('the demo plans pass, and prices only come from the brief', () => {
    for (const x of DEMO_SAAS) expect(validatePlans(x.model.plans, x.prompt, x.model.app), x.key).toEqual([])
  })
  it('rejects an invented price, a made-up free plan, shrinking limits, claims and unknown entities', () => {
    const p = clone()
    p.plans[0].price = 29
    p.plans[1].limits.records = 5
    p.plans[1].blurb = 'The best studio plan!'
    p.limitEntity = 'nothing'
    const out = validatePlans(p, d.prompt, d.model.app).join(' | ')
    expect(out).toMatch(/never gave a price of 29/)
    expect(out).toMatch(/must not shrink/)
    expect(out).toMatch(/blurb/)
    expect(out).toMatch(/limitEntity/)
    const free = clone(); free.plans[0].price = 0
    expect(validatePlans(free, d.prompt, d.model.app).join(' ')).toMatch(/never gave a price of 0/)
    expect(validatePlans(free, d.prompt + ' The first plan is free.', d.model.app)).toEqual([])
  })
  it('a price written with a thousands comma still counts as given', () => {
    expect(validatePlans(clone(), d.prompt, d.model.app)).toEqual([])
    expect(d.prompt).toContain('1,499')
  })
  it('normalizePlans drops unknown keys and defaults a missing price to null', () => {
    const n = normalizePlans({ limitEntity: 'members', secret: 1, plans: [{ id: 'starter', name: 'S', blurb: 'x', features: [], limits: {}, hack: true }] })
    expect(JSON.stringify(n)).not.toMatch(/secret|hack/)
    expect(n.plans[0].price).toBeNull()
  })
})

describe('saas plan', () => {
  it('is deterministic per seed, uses directions made for both a website and an app, and varies across seeds', () => {
    const p = DEMO_SAAS[0].prompt
    expect(planSaas(p, { seed: 'a' })).toEqual(planSaas(p, { seed: 'a' }))
    for (let i = 0; i < 12; i++) {
      const id = planSaas(p, { seed: 'k' + i }).direction.id
      const d = DIRECTIONS.find(x => x.id === id)!
      expect(d.surfaces).toContain('website')
      expect(d.surfaces).toContain('app')
    }
    const layouts = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(planSaas(p, { seed: 's' + i }).layout)))
    expect(layouts.size).toBeGreaterThan(3)
    const dirs = new Set(Array.from({ length: 20 }, (_, i) => planSaas('A SaaS for dentists to manage patient recalls.', { seed: 'd' + i }).direction.id))
    expect(dirs.size).toBeGreaterThan(1)
  })
  it('the stated feel steers the direction', () => {
    expect(pickSaasDirection('A SaaS for gyms. The feel: dark and moody.', { seed: 'x' }).palette.mode).toBe('dark')
  })
  it('the site plan is the product blueprint: features, how it works, FAQ, closing call to action; no photos', () => {
    const s = planSaas(DEMO_SAAS[0].prompt, { seed: 'z' })
    expect(s.site.sections.map(x => x.kind)).toEqual(['services', 'steps', 'faq', 'cta'])
    expect(s.site.brief.intent).toBe('product')
    expect(s.site.images).toEqual([])
    expect(s.app.direction.id).toBe(s.site.direction.id)
  })
})

describe('model prompts and validation', () => {
  const d = DEMO_SAAS[0]
  it('the model prompt asks for data only, plans without invented prices, and a customer-facing domain', () => {
    const { system, user } = buildSaasModelPrompt(d.prompt)
    expect(system).toMatch(/do not write code/i)
    expect(system).toMatch(/CUSTOMER of this SaaS/)
    expect(user).toMatch(/plans/)
    expect(user).toMatch(/Never invent a price/)
  })
  it('the demo models validate; an invented price in the reply is reported with the exact problem', () => {
    const raw = (m: typeof d.model) => ({ ...m.app, plans: m.plans })
    for (const x of DEMO_SAAS) expect(validateSaasModel(normalizeSaasModel(raw(x.model)), x.prompt), x.key).toEqual([])
    const bad = structuredClone(d.model); bad.plans.plans[0].price = 29
    expect(validateSaasModel(normalizeSaasModel(raw(bad)), d.prompt).join(' ')).toMatch(/never gave a price/)
  })
  it('the demo copy passes the website copy validator for every layout the planner can pick', () => {
    for (const x of DEMO_SAAS) for (let i = 0; i < 12; i++) {
      const { spec, copy } = siteCopyFor(x, 'v' + i)
      expect(validateCopy(spec.site, copy).map(p => p.path + ' ' + p.message), x.key + i).toEqual([])
    }
  })
})

for (const d of DEMO_SAAS) {
  describe('rendered SaaS: ' + d.key, () => {
    const { spec, copy } = siteCopyFor(d)
    const { files } = renderSaas(spec, d.model, copy)
    const code = Object.entries(files).filter(([p]) => /\.(tsx?|css|html)$/.test(p)).map(([p, c]) => `// FILE ${p}\n${c}`).join('\n')

    it('meets every SaaS contract check by construction, with the kit in use', () => {
      const r = checkSaasReady(files)
      expect(r.items.filter(i => !i.ok).map(i => i.id)).toEqual([])
      expect(r.passed).toBe(r.total)
      expect(kitImportCount(code)).toBeGreaterThanOrEqual(10)
    })
    it('has no slop findings and no blocking security finding', () => {
      const ui = Object.fromEntries(Object.entries(files).filter(([p]) => /\.(tsx|css)$/.test(p)))
      expect(scanSlopSource(ui).issues.map(i => i.id + ': ' + i.sample)).toEqual([])
      const next = createFindingIdGenerator()
      const blocking = Object.entries(files).flatMap(([p, c]) => reviewEmittedFile(p, c, '', { nextId: next })).filter(f => f.blocking)
      expect(blocking.map(f => f.ruleId + ' ' + f.detail)).toEqual([])
    })
    it('every generated source file is valid TypeScript (syntax)', () => {
      for (const [p, c] of Object.entries(files)) {
        if (!/\.tsx?$/.test(p)) continue
        const out = ts.transpileModule(c, { reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }, fileName: p })
        expect((out.diagnostics ?? []).map(x => ts.flattenDiagnosticMessageText(x.messageText, '\n')), p).toEqual([])
      }
    })
    it('no secret, price or claim is written outside its one place', () => {
      expect(code).not.toMatch(/sk_(live|test)_|whsec_[A-Za-z0-9]|re_[A-Za-z0-9]{10}/)
      const outside = Object.entries(files).filter(([p]) => !/plans\.ts$|build-spec\.json$/.test(p)).map(([, c]) => c).join('\n')
      expect(outside).not.toMatch(/[$₹€£]\s?\d{1,5}(,\d{3})*(\.\d+)?\s?\/\s?(mo|month|yr|year)\b/i)
      expect(outside).not.toMatch(/\b(secure|synced|real-time|AI-powered|SOC ?2|ISO ?27001|GDPR[- ]compliant)\b/i)
    })
    it('the site shows the product honestly: the plan prices come from plans.ts, the preview is labelled sample data, the CTA opens the product', () => {
      const site = files['src/Site.tsx']
      expect(site).toContain("from './plans'")
      expect(site).toContain('Sample data')
      expect(site).toContain("window.location.hash = '#/app'")
      expect(site).toContain('Demo mode: nothing is charged, sent or stored on a server.')
      expect(site).not.toMatch(/trusted by|customers love|\d+\+ (users|customers)/i)
      expect(files['src/plans.ts']).toContain(d.model.plans.plans.some(p => p.price === null) ? 'null' : String(d.model.plans.plans[0].price))
    })
    it('the product shell enforces roles and limits, shows the demo line and the legal links', () => {
      const app = files['src/product/ProductApp.tsx']
      expect(app).toContain("can(role, 'create')")
      expect(app).toContain("limitFor(planId, 'records'")
      expect(app).toContain('Demo mode: nothing is charged, sent or stored on a server.')
      expect(app).toContain('hidden border-r')
      expect(app).toContain('lg:hidden')
      expect(files['src/saas/AuthPage.tsx']).toContain('type="checkbox"')
      expect(files['src/saas/SettingsPage.tsx']).toMatch(/Export my data/)
      expect(files['src/saas/SettingsPage.tsx']).toMatch(/Delete my account/)
      expect(files['src/saas/BillingPage.tsx']).toContain('Connect payments to enable')
    })
  })
}

it('the preview takes its numbers and rows from the model, not from thin air', () => {
  const p = previewOf(DEMO_SAAS[0].model.app)
  expect(p.entity.id).toBe('members')
  expect(p.rows[0][0]).toBe('Aarti Menon')
  expect(p.stats.map(s => s.label)).toContain('Active members')
  expect(p.stats.find(s => s.label === 'Active members')?.value).toBe('2')
})

// ── Execute the generated code: bundle files from memory, run them ─────────────────────────────

const nodeRequire = createRequire(import.meta.url)
async function bundle(files: Record<string, string>, entry: string): Promise<Record<string, any>> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const vfs = new Map(Object.entries(files).map(([p, c]) => ['/v/' + p, c]))
  const res = await build({
    stdin: { contents: entry, resolveDir: '/v', sourcefile: 'entry.ts', loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', logLevel: 'silent', external: ['node:crypto'],
    plugins: [{
      name: 'vfs',
      setup(b) {
        b.onResolve({ filter: /^\.\.?\// }, a => {
          const base = a.namespace === 'vfs' ? a.importer.replace(/\/[^/]+$/, '') : '/v'
          const stack: string[] = []
          for (const s of (base + '/' + a.path).split('/')) { if (s === '..') stack.pop(); else if (s !== '.' && s !== '') stack.push(s) }
          const raw = '/' + stack.join('/')
          const hit = [raw, raw + '.ts', raw + '.tsx'].find(x => vfs.has(x))
          return hit ? { path: hit, namespace: 'vfs' } : undefined
        })
        b.onLoad({ filter: /.*/, namespace: 'vfs' }, a => ({ contents: vfs.get(a.path)!, loader: a.path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: a.path.replace(/\/[^/]+$/, '') }))
      },
    }],
  })
  const store = new Map<string, string>()
  const local = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v) }, removeItem: (k: string) => { store.delete(k) } }
  const mod = { exports: {} as Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any
  new Function('module', 'exports', 'require', 'localStorage', res.outputFiles[0].text)(mod, mod.exports, nodeRequire, local)
  return { ...mod.exports, localStore: store }
}

describe('client logic, executed', () => {
  const d = DEMO_SAAS[0]
  const { spec, copy } = siteCopyFor(d)
  const files = renderSaas(spec, d.model, copy).files
  const load = () => bundle(files, "export * as plans from './src/plans'\nexport * as saas from './src/lib/saas'\nexport * as db from './src/lib/db'\nexport * as logic from './src/lib/logic'")

  it('plan limits say which limit was hit and what the next plan unlocks; the top plan says it is the top', async () => {
    const { plans } = await load()
    expect(plans.checkLimit('starter', 'records', 24).ok).toBe(true)
    const hit = plans.checkLimit('starter', 'records', 25)
    expect(hit.ok).toBe(false)
    expect(hit.message).toBe('You have reached the Starter limit of 25 members. Upgrade to Studio to unlock up to 300 members.')
    expect(plans.checkLimit('studio', 'seats', 5).message).toMatch(/highest plan/)
    expect(plans.checkLimit('studio', 'records', 5).ok).toBe(true)
    expect(plans.priceLabel(plans.PLANS[0])).toBe('₹499 / month')
    expect(plans.toMinorUnits(499)).toBe(49900)
  })
  it('a plan without a price says the owner has not set it, never a made-up number', async () => {
    const r = DEMO_SAAS[1]
    const s = siteCopyFor(r)
    const { plans } = await bundle(renderSaas(s.spec, r.model, s.copy).files, "export * as plans from './src/plans'")
    for (const p of plans.PLANS) expect(plans.priceLabel(p)).toBe('Price set by the owner')
    expect(plans.checkLimit('chain', 'records', 100000).ok).toBe(true)
  })
  it('roles: viewers read, members add and edit, admins and the owner do everything', async () => {
    const { saas } = await load()
    expect(['read', 'create', 'update', 'delete', 'manage'].map(a => saas.can('viewer', a))).toEqual([true, false, false, false, false])
    expect(['read', 'create', 'update', 'delete', 'manage'].map(a => saas.can('member', a))).toEqual([true, true, true, false, false])
    for (const r of ['owner', 'admin']) expect(['read', 'create', 'update', 'delete', 'manage'].every(a => saas.can(r, a))).toBe(true)
  })
  it('usage counts the limited list and the team; the stored plan decides the limit, otherwise the first plan', async () => {
    const { saas, db, logic } = await load()
    let s = logic.withSample(db.load())
    const u = saas.usageOf(s, [{ id: 'me', email: 'a@b.co', role: 'owner', status: 'active', at: '' }])
    expect(u).toEqual({ records: 4, seats: 1 })
    expect(saas.currentPlanId(null)).toBe('starter')
    expect(saas.currentPlanId({ state: 'ok', subscription: { plan: 'studio', status: 'active' } })).toBe('studio')
    expect(saas.currentPlanId({ state: 'ok', subscription: { plan: 'studio', status: 'canceled' } })).toBe('starter')
    expect(saas.currentPlanId({ state: 'unreachable' })).toBe('starter')
    expect(saas.inviteLimit('starter', 1).ok).toBe(false)
    s = db.load(); expect(saas.usageOf(s, []).seats).toBe(1)
  })
  it('state survives a reload, an unreadable save is ignored, hints only describe what is missing', async () => {
    const { saas, localStore } = await load()
    const st = { ...saas.emptyState(), account: { name: 'A', email: 'a@b.co', hash: 'h', at: 'x' }, signedIn: true, workspace: { id: 'ws-abc12345', name: 'W' } }
    expect(saas.saveState(st)).toBe(true)
    expect(saas.loadState().workspace.name).toBe('W')
    localStore.set([...localStore.keys()].find(k => k.startsWith('saas-state:'))!, '{nope')
    expect(saas.loadState().account).toBeNull()
    expect(saas.passwordHints('abc')).toHaveLength(2)
    expect(saas.passwordHints('Studio2026ok')).toEqual([])
    expect(saas.validEmail('a@b.co')).toBe(true)
    expect(saas.validEmail('a@b')).toBe(false)
    expect(saas.newWorkspaceId()).toMatch(/^[a-z0-9-]{4,48}$/)
  })
  it('export holds the account, team and every list; emails are only previews built from facts', async () => {
    const { saas, db, logic } = await load()
    const s = logic.withSample(db.load())
    const out = JSON.parse(saas.exportEverything(s, { ...saas.emptyState(), account: { name: 'A', email: 'a@b.co', hash: 'SECRET', at: 'x' } }))
    expect(out.data.members).toHaveLength(4)
    expect(JSON.stringify(out)).not.toMatch(/SECRET/)
    const m = saas.composeMail('invite', 'x@y.co', 'My Studio', 'https://app.example/#/app')
    expect(m.subject).toBe('You are invited to My Studio')
    expect(m.text).toContain('https://app.example/#/app')
  })
})

describe('server functions, executed', () => {
  const d = DEMO_SAAS[0]
  const { spec, copy } = siteCopyFor(d)
  const files = renderSaas(spec, d.model, copy).files
  const load = (name: string) => bundle(files, `export { default } from './api/${name}'
export * from './api/${name}'`)

  const kv = new Map<string, string>()
  const calls: { url: string; init?: RequestInit }[] = []
  const realFetch = globalThis.fetch
  const SECRET = 'whsec_test_secret'
  const env = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL'] as const
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    kv.clear(); calls.length = 0
    for (const k of env) { saved[k] = process.env[k]; delete process.env[k] }
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), init })
      if (String(url).startsWith('https://kv.test')) {
        const a = JSON.parse(String(init?.body)) as (string | number)[]
        const [c, k, v, nx] = a as string[]
        let result: unknown = null
        if (c === 'GET') result = kv.get(k) ?? null
        else if (c === 'SET') { if (nx === 'NX' && kv.has(k)) result = null; else { kv.set(k, v); result = 'OK' } }
        else if (c === 'DEL') { kv.delete(k); result = 1 }
        else if (c === 'INCR') { const n = Number(kv.get(k) || 0) + 1; kv.set(k, String(n)); result = n }
        else result = 1
        return new Response(JSON.stringify({ result }), { status: 200 })
      }
      if (String(url).startsWith('https://api.stripe.com')) return new Response(JSON.stringify({ url: 'https://checkout.stripe.test/session' }), { status: 200 })
      if (String(url).startsWith('https://api.resend.com')) return new Response(JSON.stringify({ id: 'e1' }), { status: 200 })
      throw new Error('unexpected fetch ' + url)
    }) as typeof fetch
  })
  afterEach(() => { globalThis.fetch = realFetch; for (const k of env) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k] } })

  const res = () => {
    const r = { code: 0, body: undefined as any, headers: {} as Record<string, string>, status(n: number) { r.code = n; return r }, json(v: unknown) { r.body = v }, setHeader(k: string, v: string) { r.headers[k] = v }, end() { /* */ } } // eslint-disable-line @typescript-eslint/no-explicit-any
    return r
  }
  const streamReq = (raw: string, headers: Record<string, string>) => ({ method: 'POST', headers, async *[Symbol.asyncIterator]() { yield Buffer.from(raw) } })
  const sign = (raw: string, t = Math.floor(Date.now() / 1000), secret = SECRET) => `t=${t},v1=${createHmac('sha256', secret).update(t + '.' + raw).digest('hex')}`
  const event = (id: string, type: string, object: Record<string, unknown>) => JSON.stringify({ id, type, data: { object } })
  const connect = () => { process.env.STRIPE_WEBHOOK_SECRET = SECRET; process.env.KV_REST_API_URL = 'https://kv.test'; process.env.KV_REST_API_TOKEN = 'tok' }

  it('webhook: rejects a missing secret, a bad or old signature, and unconnected storage; never stores on those', async () => {
    const { default: handler } = await load('webhook')
    const raw = event('evt_1', 'checkout.session.completed', { client_reference_id: 'ws-abc12345', metadata: { plan: 'studio' }, customer: 'cus_1' })
    let r = res(); await handler(streamReq(raw, { 'stripe-signature': sign(raw) }), r); expect(r.code).toBe(503)
    connect()
    r = res(); await handler(streamReq(raw, { 'stripe-signature': sign(raw, undefined, 'wrong') }), r); expect(r.code).toBe(400)
    r = res(); await handler(streamReq(raw, { 'stripe-signature': sign(raw, Math.floor(Date.now() / 1000) - 3600) }), r); expect(r.code).toBe(400)
    r = res(); await handler(streamReq(raw, {}), r); expect(r.code).toBe(400)
    r = res(); await handler(streamReq(raw + ' ', { 'stripe-signature': sign(raw) }), r); expect(r.code).toBe(400)
    delete process.env.KV_REST_API_URL
    r = res(); await handler(streamReq(raw, { 'stripe-signature': sign(raw) }), r); expect(r.code).toBe(503)
    expect(kv.size).toBe(0)
    r = res(); await handler({ method: 'GET', headers: {} }, r); expect(r.code).toBe(405)
  })

  it('webhook: a verified event stores the subscription; the same event again is acknowledged and does nothing; later events update it', async () => {
    connect()
    const { default: handler } = await load('webhook')
    const first = event('evt_1', 'checkout.session.completed', { client_reference_id: 'ws-abc12345', metadata: { plan: 'studio' }, customer: 'cus_1', subscription: 'sub_1' })
    let r = res(); await handler(streamReq(first, { 'stripe-signature': sign(first) }), r)
    expect(r.code).toBe(200); expect(r.body.result).toBe('stored')
    expect(JSON.parse(kv.get('sub:ws-abc12345')!)).toMatchObject({ plan: 'studio', status: 'active', customer: 'cus_1' })
    const writes = calls.filter(c => c.url === 'https://kv.test').length
    r = res(); await handler(streamReq(first, { 'stripe-signature': sign(first) }), r)
    expect(r.code).toBe(200); expect(r.body.duplicate).toBe(true)
    // the duplicate only claimed the event id; it did not touch the subscription again
    expect(calls.filter(c => c.url === 'https://kv.test').length).toBe(writes + 1)
    const upd = event('evt_2', 'customer.subscription.updated', { id: 'sub_1', status: 'past_due', customer: 'cus_1', metadata: {}, current_period_end: 1893456000 })
    r = res(); await handler(streamReq(upd, { 'stripe-signature': sign(upd) }), r)
    expect(JSON.parse(kv.get('sub:ws-abc12345')!)).toMatchObject({ plan: 'studio', status: 'past_due' })
    const gone = event('evt_3', 'customer.subscription.deleted', { id: 'sub_1', customer: 'cus_1', metadata: {}, ended_at: 1893456000 })
    r = res(); await handler(streamReq(gone, { 'stripe-signature': sign(gone) }), r)
    const end = JSON.parse(kv.get('sub:ws-abc12345')!)
    expect(end.status).toBe('canceled'); expect(end.endsOn).toBe('2030-01-01')
    const other = event('evt_4', 'charge.refunded', { customer: 'cus_1' })
    r = res(); await handler(streamReq(other, { 'stripe-signature': sign(other) }), r)
    expect(r.body.result).toBe('ignored')
  })

  it('webhook: when storing fails the event id is released so Stripe can send it again', async () => {
    connect()
    const { default: handler } = await load('webhook')
    const ev = event('evt_9', 'customer.subscription.updated', { id: 'sub_9', status: 'active', customer: 'cus_9', metadata: { workspace: 'ws-zzzz9999', plan: 'studio' } })
    const inner = globalThis.fetch
    let fail = true
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      const a = url === 'https://kv.test' ? (JSON.parse(String(init?.body)) as string[]) : []
      if (fail && a[0] === 'SET' && String(a[1]).startsWith('sub:')) return new Response('{}', { status: 500 })
      return inner(url, init)
    }) as typeof fetch
    let r = res(); await handler(streamReq(ev, { 'stripe-signature': sign(ev) }), r)
    expect(r.code).toBe(500)
    expect(kv.has('evt:evt_9')).toBe(false)
    fail = false
    r = res(); await handler(streamReq(ev, { 'stripe-signature': sign(ev) }), r)
    expect(r.code).toBe(200); expect(r.body.result).toBe('stored')
  })

  it('subscription: says storage is not connected rather than inventing a state, then returns what the webhook stored', async () => {
    const { default: handler } = await load('subscription')
    let r = res(); await handler({ headers: {}, query: { workspace: 'ws-abc12345' } }, r)
    expect(r.body).toEqual({ configured: false, subscription: null })
    r = res(); await handler({ headers: {}, query: { workspace: '../etc' } }, r); expect(r.code).toBe(400)
    connect(); kv.set('sub:ws-abc12345', JSON.stringify({ workspace: 'ws-abc12345', plan: 'studio', status: 'active' }))
    r = res(); await handler({ headers: {}, query: { workspace: 'ws-abc12345' } }, r)
    expect(r.body.subscription.plan).toBe('studio')
  })

  it('checkout: not connected without the key; unknown, free and unpriced plans are refused; a priced plan builds the right Stripe request', async () => {
    const { default: handler } = await load('checkout')
    const req = (body: unknown) => ({ method: 'POST', headers: { host: 'app.example.com', 'x-forwarded-proto': 'https' }, body })
    let r = res(); await handler(req({ plan: 'studio', workspace: 'ws-abc12345' }), r); expect(r.code).toBe(503)
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
    r = res(); await handler(req({ plan: 'nope', workspace: 'ws-abc12345' }), r); expect(r.code).toBe(400)
    r = res(); await handler(req({ plan: 'studio', workspace: '../x' }), r); expect(r.code).toBe(400)
    r = res(); await handler({ method: 'GET', headers: {} }, r); expect(r.code).toBe(405)
    r = res(); await handler(req({ plan: 'studio', workspace: 'ws-abc12345', price: 1, amount: 1 }), r)
    expect(r.code).toBe(200); expect(r.body.url).toMatch(/^https:\/\/checkout\.stripe\.test/)
    const sent = calls.find(c => c.url === 'https://api.stripe.com/v1/checkout/sessions')!
    const form = new URLSearchParams(String(sent.init!.body))
    expect(form.get('mode')).toBe('subscription')
    expect(form.get('line_items[0][price_data][unit_amount]')).toBe('149900')
    expect(form.get('line_items[0][price_data][currency]')).toBe('inr')
    expect(form.get('line_items[0][price_data][recurring][interval]')).toBe('month')
    expect(form.get('client_reference_id')).toBe('ws-abc12345')
    expect(form.get('success_url')).toBe('https://app.example.com/#/app/billing?checkout=done')
    expect((sent.init!.headers as Record<string, string>).Authorization).toBe('Bearer sk_test_fake')
  })
  it('checkout: a plan with no price set is refused with a message that names where to set it', async () => {
    const r2 = DEMO_SAAS[1]
    const s = siteCopyFor(r2)
    const { default: handler } = await bundle(renderSaas(s.spec, r2.model, s.copy).files, "export { default } from './api/checkout'")
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
    const r = res(); await handler({ method: 'POST', headers: { host: 'a.example.com' }, body: { plan: 'shop', workspace: 'ws-abc12345' } }, r)
    expect(r.code).toBe(400); expect(r.body.error).toMatch(/not set a price.*src\/plans\.ts/)
    expect(calls.some(c => c.url.startsWith('https://api.stripe.com'))).toBe(false)
  })

  it('status: booleans and variable names only, never a value; sign-in is never reported as connected', async () => {
    const { default: handler } = await load('status')
    process.env.STRIPE_SECRET_KEY = 'sk_test_SECRETVALUE'
    const r = res(); handler({ headers: {} }, r)
    const text = JSON.stringify(r.body)
    expect(text).not.toMatch(/SECRETVALUE/)
    const by = Object.fromEntries(r.body.services.map((s: any) => [s.id, s])) // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(by.payments.connected).toBe(false)
    expect(by.payments.vars).toEqual([{ name: 'STRIPE_SECRET_KEY', set: true }, { name: 'STRIPE_WEBHOOK_SECRET', set: false }])
    expect(by.signin.connected).toBe(false)
    connect(); process.env.STRIPE_SECRET_KEY = 'x'
    const r2 = res(); handler({ headers: {} }, r2)
    expect(r2.body.services.find((s: any) => s.id === 'payments').connected).toBe(true) // eslint-disable-line @typescript-eslint/no-explicit-any
  })

  it('send-email: not connected says so; the link must point back at the app; a valid send reaches Resend with the key from the environment', async () => {
    const { default: handler } = await load('send-email')
    const req = (body: unknown, ip = '1.1.1.1') => ({ method: 'POST', headers: { host: 'app.example.com', 'x-forwarded-for': ip }, body })
    const ok = { kind: 'invite', to: 'friend@example.org', workspace: 'ws-abc12345', workspaceName: 'Studio', link: 'https://app.example.com/#/app?workspace=ws-abc12345&invite=abc' }
    let r = res(); await handler(req(ok), r); expect(r.code).toBe(503); expect(r.body.sent).toBe(false)
    process.env.RESEND_API_KEY = 're_fake'; process.env.RESEND_FROM_EMAIL = 'hello@studio.example'
    r = res(); await handler(req({ ...ok, link: 'https://evil.example/x' }), r); expect(r.code).toBe(400)
    r = res(); await handler(req({ ...ok, to: 'not-an-email' }), r); expect(r.code).toBe(400)
    r = res(); await handler(req({ ...ok, kind: 'newsletter' }), r); expect(r.code).toBe(400)
    r = res(); await handler(req(ok), r); expect(r.code).toBe(200); expect(r.body.sent).toBe(true)
    const sent = calls.find(c => c.url === 'https://api.resend.com/emails')!
    expect((sent.init!.headers as Record<string, string>).Authorization).toBe('Bearer re_fake')
    expect(JSON.parse(String(sent.init!.body))).toMatchObject({ from: 'hello@studio.example', to: ['friend@example.org'], subject: 'You are invited to Studio' })
    for (let i = 0; i < 25; i++) r = (await handler(req(ok, '9.9.9.9'), (r = res())), r)
    expect(r.code).toBe(429)
  })
})

describe('generateSaas (model injected)', () => {
  const d = DEMO_SAAS[0]
  const reply = (o: unknown) => ({ text: JSON.stringify(o), inputTokens: 500, outputTokens: 1500 })
  const writer = (opts: { model?: unknown; copy?: (spec: ReturnType<typeof planSaas>) => unknown } = {}) => {
    const spec = planSaas(d.prompt, { seed: d.seed, currency: d.currency })
    const asked: string[] = []
    const fn = async (_s: string, u: string) => {
      asked.push(u)
      if (/Sections to write/.test(u)) return reply(opts.copy ? opts.copy(spec) : demoSiteCopy(spec.site, d.copy))
      return reply(opts.model ?? { ...d.model.app, plans: d.model.plans })
    }
    return { fn, asked }
  }

  it('asks twice (model, then copy), validates, renders every file and returns <file> blocks with App.tsx last', async () => {
    const w = writer()
    const r = await generateSaas({ prompt: d.prompt, seed: d.seed }, { write: w.fn })
    expect(w.asked).toHaveLength(2)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.paths[r.paths.length - 1]).toBe('src/App.tsx')
    for (const p of ['src/plans.ts', 'api/checkout.ts', 'api/webhook.ts', 'api/status.ts', 'api/send-email.ts', 'src/saas/BillingPage.tsx', 'src/Site.tsx']) expect(r.text).toContain(`<file path="${p}">`)
    expect(w.asked[1]).toContain('Studio Desk')
    expect(r.usage).toEqual({ inputTokens: 1000, outputTokens: 3000 })
    const blocks = Object.fromEntries([...r.text.matchAll(/<file path="([^"]+)">\n([\s\S]*?)\n<\/file>/g)].map(m => [m[1], m[2]]))
    expect(checkSaasReady(blocks).items.filter(i => !i.ok)).toEqual([])
  })
  it('an invented price is sent back with the exact problem, then accepted once fixed; keys the schema does not know never reach the product', async () => {
    const bad = structuredClone({ ...d.model.app, plans: d.model.plans }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    bad.plans.plans[0].price = 29; bad.secret = 'nope'
    let n = 0
    const spec = planSaas(d.prompt, { seed: d.seed, currency: d.currency })
    const asked: string[] = []
    const fn = async (_s: string, u: string) => {
      asked.push(u)
      if (/Sections to write/.test(u)) return reply(demoSiteCopy(spec.site, d.copy))
      return reply(n++ === 0 ? bad : { ...d.model.app, plans: d.model.plans, secret: 'nope' })
    }
    const r = await generateSaas({ prompt: d.prompt, seed: d.seed }, { write: fn })
    expect(r.ok).toBe(true)
    expect(asked[1]).toMatch(/never gave a price of 29/)
    if (r.ok) expect(r.text).not.toContain('nope')
  })
  it('gives up cleanly (so the free-form build takes over) when the model never produces valid plans or copy', async () => {
    const w = writer({ model: { ...d.model.app, plans: { limitEntity: 'members', plans: [] } } })
    const a = await generateSaas({ prompt: d.prompt, seed: d.seed }, { write: w.fn })
    expect(a.ok).toBe(false)
    const c = await generateSaas({ prompt: d.prompt, seed: d.seed }, { write: writer({ copy: () => ({ brand: 'x' }) }).fn })
    expect(c.ok).toBe(false)
    if (!c.ok) expect(c.reason).toMatch(/^copy:/)
    const t = await generateSaas({ prompt: d.prompt, seed: d.seed }, { write: async () => { throw new Error('timeout') } })
    expect(t.ok).toBe(false)
  })
})

describe('route wiring', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', '..', 'app', 'api', 'generate', 'route.ts'), 'utf8')
  it('is off unless SAAS_SPEC_BUILD=on', () => { expect(saasSpecEnabled()).toBe(false) })
  it('runs only for new launch-ready SaaS and replacement builds, reviews the files and falls back on any failure', () => {
    const start = route.indexOf('Spec-driven SaaS and Replace-your-SaaS build')
    expect(start).toBeGreaterThan(0)
    const mobileAt = route.indexOf('Spec-driven mobile build', start)
    const block = route.slice(start, mobileAt > 0 ? mobileAt : route.indexOf('let handledByParallel = handledBySpec'))
    expect(block).toContain("projectType === 'saas'")
    expect(block).toContain("!handledBySpec && isNewBuild && stage === 'full' && !selfHeal")
    expect(block).toContain('saasSpecEnabled()')
    expect(block).toContain('reviewEmittedFile(f.path, f.content')
    expect(block).toContain('sentinelDone(c)')
    expect(block).toContain('falling back to the free-form build')
    expect(block.split('\n').length).toBeLessThan(80)
  })
})

it('the kit pieces the SaaS screens lean on exist', () => {
  for (const n of ['Button', 'Badge', 'Card', 'Dialog', 'Drawer', 'Input', 'Tabs', 'ProgressBar', 'SidebarNav', 'BottomTabBar', 'StatBlock', 'Accordion', 'BrowserFrame', 'Navbar', 'Footer', 'CTASection', 'MonoLabel']) {
    expect(WYBER_UI_KIT_SOURCE).toMatch(new RegExp('export function ' + n + '\\b'))
  }
})
