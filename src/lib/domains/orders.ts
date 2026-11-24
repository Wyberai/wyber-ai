import { siteRecords, workspaceRecords } from './dns'
import { quoteDomain } from './pricing'
import { costTable } from './search'
import { POLICY_VERSION } from './policy'
import { attachDomain } from './vercel'
import type { ContactDetails, DomainsProvider } from './types'

export type OrderKind = 'domain' | 'workspace'
export type OrderStatus = 'awaiting_payment' | 'registering' | 'active' | 'needs_attention' | 'cancelled'

export interface Order {
  id: string; user_id: string; kind: OrderKind; status: OrderStatus
  domain: string; project_id: string | null; years: number | null; months: number | null; seats: number | null; region: string | null
  registry_cents: number; margin_cents: number; total_cents: number
  contact: ContactDetails; error: string | null; policy_version: string
  rc_order_id: number | null; dodo_checkout_id: string | null
}

export interface ManagedDomain { user_id: string; project_id: string | null; domain: string; rc_order_id: number; expires_at: string | null; dns_written: boolean; vercel_attached: boolean }
export interface WorkspaceSub { user_id: string; domain: string; rc_order_id: number; region: string; seats: number; expires_at: string | null; records: unknown; admin_email: string | null }

/** What the money flow needs from storage. Supabase in production (store.ts), memory in tests. */
export interface OrderStore {
  insertOrder(o: Omit<Order, 'id' | 'status' | 'error' | 'rc_order_id' | 'dodo_checkout_id'>): Promise<Order>
  getOrder(id: string): Promise<Order | null>
  /** Atomic: only moves the row if it is still in `from`. Returns false when someone else already did. */
  transition(id: string, from: OrderStatus, to: OrderStatus, patch?: Partial<Order>): Promise<boolean>
  patchOrder(id: string, patch: Partial<Order>): Promise<void>
  getReseller(userId: string): Promise<{ customerId: number | null; contactId: number | null }>
  saveReseller(userId: string, customerId: number, contactId: number): Promise<void>
  upsertDomain(d: ManagedDomain): Promise<void>
  upsertWorkspace(w: WorkspaceSub): Promise<void>
  linkProject(projectId: string, domain: string): Promise<void>
}

export class QuoteChangedError extends Error {
  constructor(readonly totalCents: number) { super('The price changed since you confirmed it') }
}

/** Re-prices on the server right before checkout. The confirmed total from the screen must match; otherwise nothing is created. */
export async function createDomainOrder(
  deps: { provider: DomainsProvider; store: OrderStore; inrPerUsd?: number },
  input: { userId: string; domain: string; years: number; projectId: string | null; contact: ContactDetails; confirmedTotalCents: number; acknowledged: boolean },
): Promise<Order> {
  if (!input.acknowledged) throw new Error('Please confirm the item, price and policy before paying')
  const table = await costTable(deps.provider)
  const q = quoteDomain(input.domain, input.years, table, deps.inrPerUsd)
  if (!q) throw new Error('This domain cannot be sold right now')
  if (q.totalCents !== input.confirmedTotalCents) throw new QuoteChangedError(q.totalCents)
  const label = q.domain.slice(0, q.domain.indexOf('.'))
  const tld = q.domain.slice(label.length + 1)
  const avail = await deps.provider.checkAvailability(label, [tld])
  if (avail[tld] !== 'available') throw new Error('That domain is no longer available')
  return deps.store.insertOrder({
    user_id: input.userId, kind: 'domain', domain: q.domain, project_id: input.projectId, years: q.years, months: null, seats: null, region: null,
    registry_cents: q.registryCents, margin_cents: q.marginCents, total_cents: q.totalCents, contact: input.contact, policy_version: POLICY_VERSION,
  })
}

type Env = Record<string, string | undefined>
type FulfilDeps = { provider: DomainsProvider; store: OrderStore; env?: Env; attach?: typeof attachDomain }

/** Runs after the payment provider confirms payment. Safe to call twice: only the first call moves the order out of awaiting_payment. */
export async function fulfilOrder(deps: FulfilDeps, orderId: string): Promise<{ ok: boolean; status: OrderStatus; ran: boolean }> {
  const { provider, store } = deps
  const order = await store.getOrder(orderId)
  if (!order) return { ok: false, status: 'needs_attention', ran: false }
  // `ran` is true only for the call that actually did the work, so a retried webhook never sends a second email.
  if (!(await store.transition(orderId, 'awaiting_payment', 'registering'))) return { ok: order.status === 'active', status: order.status, ran: false }
  try {
    const r = await store.getReseller(order.user_id)
    const customerId = await provider.ensureCustomer({ email: order.contact.email, contact: order.contact, existingCustomerId: r.customerId })
    const contactId = await provider.ensureContact({ customerId, contact: order.contact, existingContactId: r.contactId })
    await store.saveReseller(order.user_id, customerId, contactId)
    if (order.kind === 'domain') await fulfilDomain(deps, order, customerId, contactId)
    else await fulfilWorkspace(deps, order, customerId)
    await store.patchOrder(orderId, { status: 'active', error: null })
    return { ok: true, status: 'active', ran: true }
  } catch (e) {
    // Money was taken but a provider step failed: keep the order visible for a person to finish or refund.
    await store.patchOrder(orderId, { status: 'needs_attention', error: e instanceof Error ? e.message : String(e) })
    return { ok: false, status: 'needs_attention', ran: true }
  }
}

async function fulfilDomain(deps: FulfilDeps, o: Order, customerId: number, contactId: number) {
  const { provider, store } = deps
  const ns = await provider.defaultNameservers(customerId)
  const { orderId } = await provider.registerDomain({ domain: o.domain, years: o.years ?? 1, customerId, contactId, nameservers: ns })
  await store.patchOrder(o.id, { rc_order_id: orderId })
  const details = await provider.getDomainDetails(orderId)
  // Connection steps are best-effort and retryable from My domains: the domain is already paid for and registered.
  let dnsWritten = false
  try {
    await provider.activateDns(orderId).catch(() => undefined)
    for (const rec of siteRecords()) await provider.addDnsRecord(o.domain, rec)
    dnsWritten = true
  } catch { /* shown as "DNS pending" */ }
  const v = await (deps.attach ?? attachDomain)(o.domain, deps.env ?? process.env).catch(() => ({ attached: false, verified: false }))
  await store.upsertDomain({ user_id: o.user_id, project_id: o.project_id, domain: o.domain, rc_order_id: orderId, expires_at: details.expiresAt, dns_written: dnsWritten, vercel_attached: v.attached })
  if (o.project_id && v.attached) await store.linkProject(o.project_id, o.domain)
}

async function fulfilWorkspace(deps: FulfilDeps, o: Order, customerId: number) {
  const { provider, store } = deps
  const region = (o.region as 'in' | 'se' | 'gbl') ?? 'gbl'
  const { orderId } = await provider.addWorkspace({ domain: o.domain, months: o.months ?? 12, seats: o.seats ?? 1, customerId, region })
  await store.patchOrder(o.id, { rc_order_id: orderId })
  const c = o.contact
  const [first, ...rest] = c.name.split(' ')
  const admin = `admin@${o.domain}`
  await provider.setupWorkspaceAdmin({ orderId, region, adminEmail: admin, firstName: first, lastName: rest.join(' ') || first, alternateEmail: c.email, name: c.name, company: c.company || c.name, zip: c.zip })
  const details = await provider.getWorkspaceDetails(orderId, region)
  const records = workspaceRecords()
  let written = false
  try { for (const r of records) await provider.addDnsRecord(o.domain, r); written = true } catch { /* the screen shows the records to copy */ }
  await store.upsertWorkspace({ user_id: o.user_id, domain: o.domain, rc_order_id: orderId, region, seats: o.seats ?? 1, expires_at: details.expiresAt, records: { records, written }, admin_email: admin })
}
