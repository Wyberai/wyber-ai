// The fixed, tested server functions of every generated SaaS (Vercel-style api/ files). RULES: String.raw templates, NO backticks and NO ${ sequences
// inside them. Secrets are read from process.env only and are never sent to the browser; the status function returns booleans, never values.

export const STORE_TS = String.raw`// A tiny key-value store over the REST API of Vercel KV or Upstash Redis. It holds subscriptions and processed event ids.
// Not configured: every call says so, and nothing pretends to be stored.
const url = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || ''
const token = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''

export const storeConfigured = (): boolean => Boolean(url() && token())

async function cmd(args: (string | number)[]): Promise<unknown> {
  const res = await fetch(url(), { method: 'POST', headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' }, body: JSON.stringify(args) })
  if (!res.ok) throw new Error('store answered ' + res.status)
  const body = (await res.json()) as { result?: unknown; error?: string }
  if (body.error) throw new Error('store error')
  return body.result
}

export async function getJson<T>(key: string): Promise<T | null> {
  const v = await cmd(['GET', key])
  if (typeof v !== 'string') return null
  try { return JSON.parse(v) as T } catch { return null }
}
export async function setJson(key: string, value: unknown): Promise<void> { await cmd(['SET', key, JSON.stringify(value)]) }
export async function del(key: string): Promise<void> { await cmd(['DEL', key]) }
/** True only for the first caller of this key within the window. This is what makes the webhook idempotent. */
export async function claimOnce(key: string, ttlSeconds: number): Promise<boolean> { return (await cmd(['SET', key, '1', 'NX', 'EX', ttlSeconds])) === 'OK' }
export async function countUp(key: string, ttlSeconds: number): Promise<number> {
  const n = Number(await cmd(['INCR', key]))
  if (n === 1) await cmd(['EXPIRE', key, ttlSeconds])
  return n
}

export type StoredSubscription = {
  workspace: string
  plan: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled'
  customer?: string
  subscriptionId?: string
  renewsOn?: string
  endsOn?: string
  updatedAt: string
}
`

export const HTTP_TS = String.raw`// Minimal request and response shapes, so these functions need no framework types.
export interface Req {
  method?: string
  headers: Record<string, string | string[] | undefined>
  query?: Record<string, string | string[] | undefined>
  body?: unknown
  socket?: { remoteAddress?: string }
  [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array | string>
}
export interface Res { status: (n: number) => Res; json: (v: unknown) => void; setHeader: (k: string, v: string) => void; end: (s?: string) => void }

export const header = (req: Req, name: string): string => { const v = req.headers[name]; return Array.isArray(v) ? v[0] ?? '' : v ?? '' }

/** The raw body as text. A signature is computed over the exact bytes, so it must be read before anything parses it. */
export async function readRaw(req: Req): Promise<string> {
  if (typeof req.body === 'string') return req.body
  if (req.body instanceof Uint8Array) return Buffer.from(req.body).toString('utf8')
  const iter = req[Symbol.asyncIterator]
  if (!iter) return req.body === undefined ? '' : JSON.stringify(req.body)
  const chunks: Buffer[] = []
  for await (const c of req as AsyncIterable<Uint8Array | string>) chunks.push(typeof c === 'string' ? Buffer.from(c) : Buffer.from(c))
  return Buffer.concat(chunks).toString('utf8')
}

export const originOf = (req: Req): string => {
  const host = header(req, 'x-forwarded-host') || header(req, 'host')
  const proto = header(req, 'x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return host ? proto + '://' + host : ''
}

export const WORKSPACE_ID = /^[a-z0-9-]{4,48}$/
`

export const CHECKOUT_TS = String.raw`// Creates a Stripe Checkout Session for the plan the person chose. Price and name come from src/plans.ts only; nothing is taken from the browser but the plan id.
// STRIPE_SECRET_KEY is read from the environment and never leaves the server.
import { CURRENCY_CODE, PLANS, toMinorUnits } from '../src/plans'
import { OWNER } from '../src/owner-details'
import { getJson, storeConfigured, type StoredSubscription } from './_store'
import { WORKSPACE_ID, originOf, type Req, type Res } from './_http'

const form = (o: Record<string, string>) => new URLSearchParams(o).toString()

async function stripe(path: string, body: Record<string, string>): Promise<{ ok: boolean; data: { url?: string; error?: { message?: string } } }> {
  const res = await fetch('https://api.stripe.com/v1/' + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form(body),
  })
  return { ok: res.ok, data: (await res.json()) as { url?: string; error?: { message?: string } } }
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }) }
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ connected: false, error: 'Payments are not connected. Set STRIPE_SECRET_KEY, then try again.' })
  const input = (typeof req.body === 'object' && req.body ? req.body : {}) as { plan?: string; workspace?: string; action?: string }
  const workspace = String(input.workspace || '')
  if (!WORKSPACE_ID.test(workspace)) return res.status(400).json({ error: 'Missing or invalid workspace.' })
  const origin = originOf(req)
  if (!origin) return res.status(400).json({ error: 'Cannot work out the app address.' })

  try {
    if (input.action === 'portal') {
      if (!storeConfigured()) return res.status(503).json({ error: 'Subscription storage is not connected, so there is nothing to manage yet.' })
      const sub = await getJson<StoredSubscription>('sub:' + workspace)
      if (!sub || !sub.customer) return res.status(404).json({ error: 'No subscription is stored for this workspace yet.' })
      const made = await stripe('billing_portal/sessions', { customer: sub.customer, return_url: origin + '/#/app/billing' })
      if (!made.ok || !made.data.url) return res.status(502).json({ error: 'Stripe did not open the billing portal.' })
      return res.status(200).json({ url: made.data.url })
    }

    const plan = PLANS.find(p => p.id === input.plan)
    if (!plan) return res.status(400).json({ error: 'Unknown plan.' })
    if (plan.price === null) return res.status(400).json({ error: 'The owner has not set a price for ' + plan.name + ' yet. Set it in src/plans.ts.' })
    if (plan.price === 0) return res.status(400).json({ error: plan.name + ' is free, so there is nothing to pay for.' })
    const made = await stripe('checkout/sessions', {
      mode: 'subscription',
      client_reference_id: workspace,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': CURRENCY_CODE,
      'line_items[0][price_data][unit_amount]': String(toMinorUnits(plan.price)),
      'line_items[0][price_data][recurring][interval]': plan.period,
      'line_items[0][price_data][product_data][name]': (OWNER.productName || 'Subscription') + ' ' + plan.name,
      'metadata[plan]': plan.id,
      'metadata[workspace]': workspace,
      'subscription_data[metadata][plan]': plan.id,
      'subscription_data[metadata][workspace]': workspace,
      success_url: origin + '/#/app/billing?checkout=done',
      cancel_url: origin + '/#/app/billing?checkout=cancelled',
    })
    if (!made.ok || !made.data.url) return res.status(502).json({ error: 'Stripe did not create a checkout session.' })
    return res.status(200).json({ url: made.data.url })
  } catch {
    return res.status(502).json({ error: 'Could not reach the payment service. Nothing was charged.' })
  }
}
`

export const WEBHOOK_TS = String.raw`// Receives Stripe events. Signature-verified (STRIPE_WEBHOOK_SECRET), idempotent by event id, and the only thing that ever writes the stored subscription.
// The app shows a paid state only from what this function stored.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { claimOnce, del, getJson, setJson, storeConfigured, type StoredSubscription } from './_store'
import { WORKSPACE_ID, header, readRaw, type Req, type Res } from './_http'

export const config = { api: { bodyParser: false } }

/** Checks the stripe-signature header: t=timestamp,v1=hmac of "timestamp.body". Rejects old timestamps so a captured request cannot be replayed later. */
export function verifySignature(raw: string, signatureHeader: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000), toleranceSeconds = 300): boolean {
  const parts = Object.fromEntries(signatureHeader.split(',').map(p => { const i = p.indexOf('='); return [p.slice(0, i).trim(), p.slice(i + 1).trim()] }))
  const t = Number(parts.t)
  if (!parts.v1 || !Number.isFinite(t) || Math.abs(nowSeconds - t) > toleranceSeconds) return false
  const expected = createHmac('sha256', secret).update(t + '.' + raw).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(parts.v1)
  return a.length === b.length && timingSafeEqual(a, b)
}

type StripeObject = {
  id?: string; status?: string; customer?: string; subscription?: string; client_reference_id?: string
  metadata?: Record<string, string>; current_period_end?: number; cancel_at_period_end?: boolean; ended_at?: number
}
type StripeEvent = { id: string; type: string; data: { object: StripeObject } }

const day = (seconds?: number) => (seconds ? new Date(seconds * 1000).toISOString().slice(0, 10) : undefined)
const statusOf = (s?: string): StoredSubscription['status'] => (s === 'trialing' ? 'trialing' : s === 'past_due' || s === 'unpaid' ? 'past_due' : s === 'canceled' ? 'canceled' : 'active')

async function workspaceFor(obj: StripeObject): Promise<string> {
  const direct = obj.metadata?.workspace || obj.client_reference_id || ''
  if (WORKSPACE_ID.test(direct)) return direct
  if (obj.customer) { const hit = await getJson<{ workspace: string }>('cust:' + obj.customer); if (hit && WORKSPACE_ID.test(hit.workspace)) return hit.workspace }
  return ''
}

/** Turns one verified event into the stored subscription. Unknown event types are ignored on purpose. */
export async function applyEvent(event: StripeEvent): Promise<'stored' | 'ignored'> {
  const obj = event.data?.object ?? {}
  const kinds = ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.payment_failed']
  if (!kinds.includes(event.type)) return 'ignored'
  const workspace = await workspaceFor(obj)
  if (!workspace) return 'ignored'
  const before = (await getJson<StoredSubscription>('sub:' + workspace)) ?? null
  const next: StoredSubscription = {
    workspace,
    plan: obj.metadata?.plan || before?.plan || '',
    status: before?.status ?? 'active',
    customer: obj.customer || before?.customer,
    subscriptionId: event.type === 'checkout.session.completed' ? obj.subscription || before?.subscriptionId : before?.subscriptionId || (event.type.startsWith('customer.subscription') ? obj.id : undefined),
    renewsOn: before?.renewsOn,
    endsOn: before?.endsOn,
    updatedAt: new Date().toISOString(),
  }
  if (event.type === 'checkout.session.completed') next.status = 'active'
  else if (event.type === 'invoice.payment_failed') next.status = 'past_due'
  else if (event.type === 'customer.subscription.deleted') { next.status = 'canceled'; next.endsOn = day(obj.ended_at) || day(obj.current_period_end) || next.updatedAt.slice(0, 10); next.renewsOn = undefined }
  else {
    next.status = statusOf(obj.status)
    if (next.status === 'canceled') next.endsOn = day(obj.current_period_end)
    else if (obj.cancel_at_period_end) { next.endsOn = day(obj.current_period_end); next.renewsOn = undefined }
    else { next.renewsOn = day(obj.current_period_end) || next.renewsOn; next.endsOn = undefined }
  }
  if (!next.plan) return 'ignored'
  await setJson('sub:' + workspace, next)
  if (next.customer) await setJson('cust:' + next.customer, { workspace })
  return 'stored'
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }) }
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return res.status(503).json({ error: 'Payments are not connected: STRIPE_WEBHOOK_SECRET is not set.' })
  const raw = await readRaw(req)
  if (!verifySignature(raw, header(req, 'stripe-signature'), secret)) return res.status(400).json({ error: 'Signature check failed.' })
  let event: StripeEvent
  try { event = JSON.parse(raw) as StripeEvent } catch { return res.status(400).json({ error: 'Not JSON.' }) }
  if (!event.id || !event.type) return res.status(400).json({ error: 'Not a Stripe event.' })
  if (!storeConfigured()) return res.status(503).json({ error: 'Subscription storage is not connected, so this event cannot be kept. Stripe will send it again.' })
  const key = 'evt:' + event.id
  try {
    // idempotent: the first delivery of an event id wins, a repeat is acknowledged and does nothing
    if (!(await claimOnce(key, 7 * 24 * 3600))) return res.status(200).json({ received: true, duplicate: true })
    try {
      const result = await applyEvent(event)
      return res.status(200).json({ received: true, result })
    } catch {
      await del(key)
      return res.status(500).json({ error: 'Could not store the event. Stripe will send it again.' })
    }
  } catch {
    return res.status(500).json({ error: 'Storage did not answer. Stripe will send the event again.' })
  }
}
`

export const SUBSCRIPTION_TS = String.raw`// Reads the stored subscription for a workspace. The billing page shows exactly this, and nothing else, as the paid state.
import { getJson, storeConfigured, type StoredSubscription } from './_store'
import { WORKSPACE_ID, type Req, type Res } from './_http'

export default async function handler(req: Req, res: Res) {
  const w = req.query?.workspace
  const workspace = Array.isArray(w) ? w[0] : w || ''
  if (!WORKSPACE_ID.test(workspace)) return res.status(400).json({ error: 'Missing or invalid workspace.' })
  if (!storeConfigured()) return res.status(200).json({ configured: false, subscription: null })
  try {
    const subscription = await getJson<StoredSubscription>('sub:' + workspace)
    return res.status(200).json({ configured: true, subscription })
  } catch {
    return res.status(502).json({ configured: true, error: 'Storage did not answer.', subscription: null })
  }
}
`

export const STATUS_TS = String.raw`// Reports which services are connected. It answers with true or false and the NAMES of the settings, never a value.
import { storeConfigured } from './_store'
import type { Req, Res } from './_http'

const set = (name: string) => Boolean(process.env[name])

export default function handler(_req: Req, res: Res) {
  const kv = ['KV_REST_API_URL', 'KV_REST_API_TOKEN']
  const services = [
    { id: 'payments', label: 'Payments (Stripe)', connected: set('STRIPE_SECRET_KEY') && set('STRIPE_WEBHOOK_SECRET'), vars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'].map(name => ({ name, set: set(name) })), where: 'Stripe dashboard, Developers, API keys. Add a webhook that points at /api/webhook and copy its signing secret.' },
    { id: 'database', label: 'Subscription storage (Vercel KV or Upstash Redis)', connected: storeConfigured(), vars: kv.map(name => ({ name, set: set(name) })), where: 'Vercel, Storage, create a KV database and connect it to this project. Upstash works too (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN).' },
    { id: 'email', label: 'Email (Resend)', connected: set('RESEND_API_KEY') && set('RESEND_FROM_EMAIL'), vars: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'].map(name => ({ name, set: set(name) })), where: 'Resend dashboard, API Keys. Verify your sending domain first.' },
    { id: 'signin', label: 'Sign-in', connected: false, vars: [], where: 'Accounts in this build live in the browser only (a demo account). Real sign-in is not part of this build yet.' },
  ]
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ services })
}
`

export const EMAIL_TS = String.raw`// Sends welcome, invite and receipt emails through Resend. RESEND_API_KEY and RESEND_FROM_EMAIL come from the environment.
// Not connected: it says so and sends nothing; the app then shows an on-screen preview and never claims the email went out.
import { OWNER } from '../src/owner-details'
import { countUp, storeConfigured } from './_store'
import { WORKSPACE_ID, header, originOf, type Req, type Res } from './_http'

const KINDS = ['welcome', 'invite', 'receipt'] as const
type Kind = (typeof KINDS)[number]
const EMAIL = /^[^\s@<>]{1,64}@[^\s@<>]{1,190}\.[^\s@<>]{2,24}$/
const memory = new Map<string, { n: number; until: number }>()

export function compose(kind: Kind, workspaceName: string, link: string): { subject: string; text: string } {
  const product = OWNER.productName || 'the app'
  if (kind === 'welcome') return { subject: 'Welcome to ' + product, text: 'Your workspace "' + workspaceName + '" is ready.\n\nOpen it here: ' + link + '\n' }
  if (kind === 'invite') return { subject: 'You are invited to ' + workspaceName, text: 'You have been invited to the workspace "' + workspaceName + '" on ' + product + '.\n\nJoin here: ' + link + '\n' }
  return { subject: 'Receipt from ' + product, text: 'Thank you. Your subscription for "' + workspaceName + '" is active.\n\nBilling: ' + link + '\n' }
}

async function allowed(ip: string): Promise<boolean> {
  if (storeConfigured()) { try { return (await countUp('mail:' + ip, 3600)) <= 20 } catch { return false } }
  const now = Date.now()
  const hit = memory.get(ip)
  if (!hit || hit.until < now) { memory.set(ip, { n: 1, until: now + 3600_000 }); return true }
  hit.n += 1
  return hit.n <= 20
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }) }
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!key || !from) return res.status(503).json({ sent: false, connected: false, error: 'Email is not connected. Set RESEND_API_KEY and RESEND_FROM_EMAIL.' })
  const input = (typeof req.body === 'object' && req.body ? req.body : {}) as { kind?: string; to?: string; workspace?: string; workspaceName?: string; link?: string }
  const kind = KINDS.find(k => k === input.kind)
  const to = String(input.to || '')
  const link = String(input.link || '')
  const origin = originOf(req)
  if (!kind || !EMAIL.test(to) || !WORKSPACE_ID.test(String(input.workspace || ''))) return res.status(400).json({ sent: false, error: 'Needs a kind, a valid address and a workspace.' })
  // a link in an email must point back at this app, never somewhere an attacker chose
  if (!origin || !link.startsWith(origin + '/')) return res.status(400).json({ sent: false, error: 'The link must point at this app.' })
  const ip = header(req, 'x-forwarded-for').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
  if (!(await allowed(ip))) return res.status(429).json({ sent: false, error: 'Too many emails from this address. Try again in an hour.' })
  const mail = compose(kind, String(input.workspaceName || 'your workspace').slice(0, 80), link.slice(0, 500))
  try {
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: mail.subject, text: mail.text }),
    })
    if (!sent.ok) return res.status(502).json({ sent: false, error: 'The email service refused the message.' })
    return res.status(200).json({ sent: true })
  } catch {
    return res.status(502).json({ sent: false, error: 'Could not reach the email service. Nothing was sent.' })
  }
}
`
