// The client logic of every generated SaaS: account, workspace, roles, limits and service status. Fixed and tested.
// RULES (same as app-spec/runtime-core.ts): String.raw templates, NO backticks, NO ${ sequences. Pure functions are exported separately from the browser calls so tests can run them.

export const SAAS_TS = String.raw`// Account, workspace, roles, usage and service calls. The account here is a DEMO account kept in this browser only; nothing is sent to a server.
import { APP } from '../schema'
import { LIMIT_ENTITY, PLANS, checkLimit, planById, priceLabel, type LimitKind } from '../plans'
import { list, uid, type Store } from './db'
import { OWNER } from '../owner-details'

const KEY = 'saas-state:' + APP.id

export const ROLES = ['owner', 'admin', 'member', 'viewer'] as const
export type Role = (typeof ROLES)[number]
export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage'
export type Member = { id: string; email: string; role: Role; status: 'invited' | 'active'; at: string }
export type Mail = { to: string; subject: string; text: string }
export type SaasState = {
  account: { name: string; email: string; hash: string; at: string } | null
  signedIn: boolean
  consentAt: string | null
  workspace: { id: string; name: string } | null
  /** What the app is showing. The owner can switch it to see the product as another role (a demo of the roles; real roles need real sign-in). */
  role: Role
  members: Member[]
  checklistDismissed: boolean
}

export const emptyState = (): SaasState => ({ account: null, signedIn: false, consentAt: null, workspace: null, role: 'owner', members: [], checklistDismissed: false })

export function loadState(): SaasState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const p = JSON.parse(raw)
    const base = emptyState()
    return {
      account: p && p.account && typeof p.account.email === 'string' ? p.account : null,
      signedIn: Boolean(p && p.signedIn),
      consentAt: typeof p?.consentAt === 'string' ? p.consentAt : null,
      workspace: p && p.workspace && typeof p.workspace.id === 'string' ? p.workspace : null,
      role: ROLES.includes(p?.role) ? p.role : base.role,
      members: Array.isArray(p?.members) ? p.members.filter((m: Member) => m && typeof m.email === 'string') : [],
      checklistDismissed: Boolean(p?.checklistDismissed),
    }
  } catch { return emptyState() }
}
export function saveState(s: SaasState): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true } catch { return false }
}
export function wipeState(): void { try { localStorage.removeItem(KEY) } catch { /* storage blocked */ } }

/** What each role may do. Viewers read; members add and edit; admins and the owner delete and manage; only the owner removes the account. */
export function can(role: Role, action: Action): boolean {
  if (role === 'owner' || role === 'admin') return true
  if (role === 'member') return action === 'read' || action === 'create' || action === 'update'
  return action === 'read'
}
export const roleNote = (role: Role): string =>
  role === 'viewer' ? 'You can look at everything but cannot change anything.' : role === 'member' ? 'You can add and edit, but not delete or manage the team.' : ''

export type Usage = { records: number; seats: number }
export const usageOf = (store: Store, members: Member[]): Usage => ({ records: list(store, LIMIT_ENTITY).length, seats: Math.max(1, members.length) })

/** Can one more of this be added on the current plan? The message names the limit and what the next plan unlocks. */
export const limitFor = (planId: string, kind: LimitKind, used: number) => checkLimit(planId, kind, used)
/** Can one more person join, given how many are in the workspace already? */
export const inviteLimit = (planId: string, memberCount: number) => checkLimit(planId, 'seats', memberCount)

export function newWorkspaceId(): string { return 'ws-' + uid().replace(/[^a-z0-9]/g, '').slice(0, 12).padEnd(8, '0') }

/** Strength hints for a password. Shown only after the person has typed in the field. */
export function passwordHints(pw: string): string[] {
  const out: string[] = []
  if (pw.length < 8) out.push('Use at least 8 characters.')
  if (!/[a-z]/.test(pw) || !/[A-Z0-9]/.test(pw)) out.push('Mix lower case with capitals or numbers.')
  return out
}
export const validEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

export async function hashPassword(email: string, pw: string): Promise<string> {
  try {
    const data = new TextEncoder().encode('v1:' + email.trim().toLowerCase() + ':' + pw)
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch { return 'plain:' + pw.length }
}

export const productName = (): string => OWNER.productName || APP.name
export const inviteLink = (ws: string, code: string): string => (typeof window === 'undefined' ? '' : window.location.origin) + '/#/app?workspace=' + ws + '&invite=' + code

export function composeMail(kind: 'welcome' | 'invite' | 'receipt' | 'reset', to: string, workspaceName: string, link: string): Mail {
  const p = productName()
  if (kind === 'welcome') return { to, subject: 'Welcome to ' + p, text: 'Your workspace "' + workspaceName + '" is ready.\n\nOpen it here: ' + link + '\n' }
  if (kind === 'invite') return { to, subject: 'You are invited to ' + workspaceName, text: 'You have been invited to the workspace "' + workspaceName + '" on ' + p + '.\n\nJoin here: ' + link + '\n' }
  if (kind === 'reset') return { to, subject: 'Reset your ' + p + ' password', text: 'Use this link to choose a new password: ' + link + '\n' }
  return { to, subject: 'Receipt from ' + p, text: 'Thank you. Your subscription for "' + workspaceName + '" is active.\n\nBilling: ' + link + '\n' }
}

export function exportEverything(store: Store, s: SaasState): string {
  return JSON.stringify({
    product: APP.id, exportedAt: new Date().toISOString(),
    account: s.account ? { name: s.account.name, email: s.account.email, createdAt: s.account.at } : null,
    workspace: s.workspace, members: s.members, consentAt: s.consentAt, data: store.data, history: store.history,
  }, null, 2)
}

// ── Service calls. Each says plainly when the server is not there. ─────────────────────────────

export type ServiceStatus = { id: string; label: string; connected: boolean; vars: { name: string; set: boolean }[]; where: string }
export type StatusResult = { state: 'ok'; services: ServiceStatus[] } | { state: 'unreachable' }

async function getJson(url: string, ms = 4000): Promise<unknown> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctl.signal })
    if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) throw new Error('not json')
    return await res.json()
  } finally { clearTimeout(t) }
}

export async function fetchStatus(): Promise<StatusResult> {
  try {
    const body = (await getJson('/api/status')) as { services?: ServiceStatus[] }
    return Array.isArray(body.services) ? { state: 'ok', services: body.services } : { state: 'unreachable' }
  } catch { return { state: 'unreachable' } }
}
export const isConnected = (s: StatusResult | null, id: string): boolean => Boolean(s && s.state === 'ok' && s.services.some(x => x.id === id && x.connected))

export type Subscription = { plan: string; status: 'active' | 'trialing' | 'past_due' | 'canceled'; renewsOn?: string; endsOn?: string; customer?: string; updatedAt?: string }
export type SubscriptionResult = { state: 'ok'; subscription: Subscription | null } | { state: 'not-configured' } | { state: 'unreachable' }

/** The stored subscription, as the server's webhook wrote it. A paid state is never shown from anything else. */
export async function fetchSubscription(workspace: string): Promise<SubscriptionResult> {
  try {
    const body = (await getJson('/api/subscription?workspace=' + encodeURIComponent(workspace))) as { configured?: boolean; subscription?: Subscription | null }
    if (body.configured === false) return { state: 'not-configured' }
    return { state: 'ok', subscription: body.subscription ?? null }
  } catch { return { state: 'unreachable' } }
}

/** The plan limits are measured against: the stored paid plan while it is active or trialing, otherwise the first plan. */
export function currentPlanId(r: SubscriptionResult | null): string {
  if (r && r.state === 'ok' && r.subscription && (r.subscription.status === 'active' || r.subscription.status === 'trialing' || r.subscription.status === 'past_due')) return planById(r.subscription.plan).id
  return PLANS[0].id
}

async function post(url: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    return { ok: res.ok, data }
  } catch { return { ok: false, data: { error: 'The server could not be reached. Server features run once the app is deployed.' } } }
}
export async function startCheckout(workspace: string, plan: string): Promise<{ url?: string; error?: string }> {
  const r = await post('/api/checkout', { workspace, plan })
  return r.ok && typeof r.data.url === 'string' ? { url: r.data.url } : { error: String(r.data.error || 'Checkout did not start.') }
}
export async function openPortal(workspace: string): Promise<{ url?: string; error?: string }> {
  const r = await post('/api/checkout', { workspace, action: 'portal' })
  return r.ok && typeof r.data.url === 'string' ? { url: r.data.url } : { error: String(r.data.error || 'The billing portal did not open.') }
}
export async function sendMail(kind: 'welcome' | 'invite' | 'receipt', mail: Mail, workspace: string, workspaceName: string, link: string): Promise<{ sent: boolean; error?: string }> {
  const r = await post('/api/send-email', { kind, to: mail.to, workspace, workspaceName, link })
  return r.data.sent === true ? { sent: true } : { sent: false, error: String(r.data.error || 'The email was not sent.') }
}

export { priceLabel }
`
