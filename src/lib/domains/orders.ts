import { siteRecords, workspaceRecords } from './dns'
import { quoteDomain, quoteRenewal } from './pricing'
import { addMonths, addYears } from './dates'
import { SUPPORTED_YEARS, WORKSPACE_MONTH_OPTIONS, type WorkspaceRegion } from './config'
import { costTable, workspaceQuoteFor } from './search'
import { POLICY_VERSION } from './policy'
import { attachDomain } from './vercel'
import type { ContactDetails, DomainsProvider } from './types'

export type OrderKind = 'domain' | 'workspace' | 'domain_renewal' | 'workspace_renewal'
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
  /** Renewals: the person's own domain or Workspace row, and the contact on their original order. */
  getDomain(userId: string, domain: string): Promise<ManagedDomain | null>
  getWorkspace(userId: string, domain: string): Promise<WorkspaceSub | null>
  latestContact(userId: string, domain: string): Promise<ContactDetails | null>
  /** Sets the new expiry after a renewal and clears the reminders already sent for the old one. */
  setExpiry(kind: 'domain' | 'workspace', userId: string, domain: string, expiresAt: string | null): Promise<void>
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

type Result = { ok: boolean; status: OrderStatus; ran: boolean }

/** Runs after the payment provider confirms payment. Safe to call twice: only the first call moves the order out of awaiting_payment. */
export async function fulfilOrder(deps: FulfilDeps, orderId: string): Promise<Result> {
  const { store } = deps
  const order = await store.getOrder(orderId)
  if (!order) return { ok: false, status: 'needs_attention', ran: false }
  // `ran` is true only for the call that actually did the work, so a retried webhook never sends a second email.
  if (!(await store.transition(orderId, 'awaiting_payment', 'registering'))) return { ok: order.status === 'active', status: order.status, ran: false }
  return runFulfilment(deps, order)
}

/**
 * Carries on with an order that was paid but did not finish: stuck on "registering" (the function was cut off) or on
 * "needs_attention" (a provider step failed, for example the balance was empty and has since been topped up). Steps
 * already done are not repeated: the registration is recorded as rc_order_id, and a renewal checks the provider's date.
 */
export async function resumeOrder(deps: FulfilDeps, orderId: string, from: 'registering' | 'needs_attention'): Promise<Result> {
  const { store } = deps
  const order = await store.getOrder(orderId)
  if (!order) return { ok: false, status: 'needs_attention', ran: false }
  if (!(await store.transition(orderId, from, 'registering', { error: null }))) return { ok: order.status === 'active', status: order.status, ran: false }
  return runFulfilment(deps, { ...order, status: 'registering', error: null })
}

async function runFulfilment(deps: FulfilDeps, order: Order): Promise<Result> {
  const { provider, store } = deps
  try {
    if (order.kind === 'domain_renewal' || order.kind === 'workspace_renewal') {
      await fulfilRenewal(deps, order)
    } else {
      let customerId = 0
      let contactId = 0
      // A resumed order that already has its provider order needs no customer or contact steps.
      if (!order.rc_order_id) {
        const r = await store.getReseller(order.user_id)
        customerId = await provider.ensureCustomer({ email: order.contact.email, contact: order.contact, existingCustomerId: r.customerId })
        contactId = await provider.ensureContact({ customerId, contact: order.contact, existingContactId: r.contactId })
        await store.saveReseller(order.user_id, customerId, contactId)
      }
      if (order.kind === 'domain') await fulfilDomain(deps, order, customerId, contactId)
      else await fulfilWorkspace(deps, order, customerId)
    }
    await store.patchOrder(order.id, { status: 'active', error: null })
    return { ok: true, status: 'active', ran: true }
  } catch (e) {
    // Money was taken but a provider step failed: keep the order visible. The sweep tries again, and tells a person if it keeps failing.
    await store.patchOrder(order.id, { status: 'needs_attention', error: e instanceof Error ? e.message : String(e) })
    return { ok: false, status: 'needs_attention', ran: true }
  }
}

async function fulfilDomain(deps: FulfilDeps, o: Order, customerId: number, contactId: number) {
  const { provider, store } = deps
  let orderId = o.rc_order_id
  if (!orderId) {
    const ns = await provider.defaultNameservers(customerId)
    try {
      orderId = (await provider.registerDomain({ domain: o.domain, years: o.years ?? 1, customerId, contactId, nameservers: ns })).orderId
    } catch (e) {
      // The registration may have gone through on an earlier attempt that was cut off before we saved it. Look for it.
      const existing = /already|exist|registered/i.test(e instanceof Error ? e.message : '') ? await provider.findDomainOrderId(o.domain) : null
      if (!existing) throw e
      orderId = existing
    }
    await store.patchOrder(o.id, { rc_order_id: orderId })
  }
  // The registry can take a while to confirm (seen with .in): no date yet is not a failure.
  const details = await provider.getDomainDetails(orderId).catch(() => null)
  // Connection steps are best-effort and retryable from My domains and by the sweep: the domain is already paid for and registered.
  let dnsWritten = false
  try {
    await provider.activateDns(orderId).catch(() => undefined)
    for (const rec of siteRecords()) await provider.addDnsRecord(o.domain, rec)
    dnsWritten = true
  } catch { /* shown as "DNS pending" */ }
  const v = await (deps.attach ?? attachDomain)(o.domain, deps.env ?? process.env).catch(() => ({ attached: false, verified: false }))
  await store.upsertDomain({ user_id: o.user_id, project_id: o.project_id, domain: o.domain, rc_order_id: orderId, expires_at: details?.expiresAt ?? null, dns_written: dnsWritten, vercel_attached: v.attached })
  if (o.project_id && v.attached) await store.linkProject(o.project_id, o.domain)
}

async function fulfilWorkspace(deps: FulfilDeps, o: Order, customerId: number) {
  const { provider, store } = deps
  const region = (o.region as 'in' | 'se' | 'gbl') ?? 'gbl'
  let orderId = o.rc_order_id
  if (!orderId) {
    orderId = (await provider.addWorkspace({ domain: o.domain, months: o.months ?? 12, seats: o.seats ?? 1, customerId, region })).orderId
    await store.patchOrder(o.id, { rc_order_id: orderId })
  }
  const c = o.contact
  const [first, ...rest] = c.name.split(' ')
  const admin = `admin@${o.domain}`
  // On a resumed order the admin account may already exist; that is not a reason to stop.
  await provider.setupWorkspaceAdmin({ orderId, region, adminEmail: admin, firstName: first, lastName: rest.join(' ') || first, alternateEmail: c.email, name: c.name, company: c.company || c.name, zip: c.zip })
    .catch(e => { if (!o.rc_order_id) throw e })
  const details = await provider.getWorkspaceDetails(orderId, region)
  const records = workspaceRecords()
  let written = false
  try { for (const r of records) await provider.addDnsRecord(o.domain, r); written = true } catch { /* the screen shows the records to copy */ }
  await store.upsertWorkspace({ user_id: o.user_id, domain: o.domain, rc_order_id: orderId, region, seats: o.seats ?? 1, expires_at: details.expiresAt, records: { records, written }, admin_email: admin })
}

// -- Renewals ------------------------------------------------------------------------------------------------------

export interface RenewalPreview {
  kind: 'domain' | 'workspace'
  domain: string
  term: number // years for a domain, months for Workspace
  seats: number | null
  registryCents: number
  marginCents: number
  totalCents: number
  expiresAt: string
  newExpiresAt: string
}

type RenewDeps = { provider: DomainsProvider; store: OrderStore; inrPerUsd?: number; env?: Record<string, string | undefined> }
type RenewInput = { userId: string; kind: 'domain' | 'workspace'; domain: string; years?: number; months?: number }

/** What a renewal would cost and where it would end, for the confirmation screen. Same maths the order uses. */
export async function renewalPreview(deps: RenewDeps, input: RenewInput): Promise<RenewalPreview> {
  const domain = input.domain.trim().toLowerCase()
  if (input.kind === 'domain') {
    const d = await deps.store.getDomain(input.userId, domain)
    if (!d) throw new Error('Domain not found')
    if (!d.expires_at) throw new Error('The expiry date is not confirmed yet. Try again in a few minutes.')
    const years = Number(input.years ?? 1)
    if (!(SUPPORTED_YEARS as readonly number[]).includes(years)) throw new Error('Choose 1, 2, 3, 5 or 10 years')
    const q = quoteRenewal(domain, years, await costTable(deps.provider), deps.inrPerUsd)
    if (!q) throw new Error('This domain cannot be renewed for that term right now')
    return { kind: 'domain', domain, term: years, seats: null, registryCents: q.registryCents, marginCents: q.marginCents, totalCents: q.totalCents, expiresAt: d.expires_at, newExpiresAt: addYears(new Date(d.expires_at), years).toISOString() }
  }
  const w = await deps.store.getWorkspace(input.userId, domain)
  if (!w) throw new Error('Workspace order not found')
  if (!w.expires_at) throw new Error('The end date is not confirmed yet. Try again in a few minutes.')
  const months = Number(input.months ?? 12)
  if (!(WORKSPACE_MONTH_OPTIONS as readonly number[]).includes(months)) throw new Error('Workspace is renewed for 12 months')
  const q = await workspaceQuoteFor(deps.provider, w.region as WorkspaceRegion, w.seats, months, deps.inrPerUsd, deps.env)
  if (!q) throw new Error('Workspace pricing is not available yet')
  return { kind: 'workspace', domain, term: months, seats: w.seats, registryCents: q.registryCents, marginCents: q.marginCents, totalCents: q.totalCents, expiresAt: w.expires_at, newExpiresAt: addMonths(new Date(w.expires_at), months).toISOString() }
}

/** Same money rules as a purchase: needs the tick, and the total the person saw must still be the real total. */
export async function createRenewalOrder(deps: RenewDeps, input: RenewInput & { confirmedTotalCents: number; acknowledged: boolean }): Promise<Order> {
  if (!input.acknowledged) throw new Error('Please confirm the item, price and policy before paying')
  const p = await renewalPreview(deps, input)
  if (p.totalCents !== input.confirmedTotalCents) throw new QuoteChangedError(p.totalCents)
  const contact = await deps.store.latestContact(input.userId, p.domain)
  if (!contact) throw new Error('We could not find the details of your original order. Please write to us.')
  const w = p.kind === 'workspace' ? await deps.store.getWorkspace(input.userId, p.domain) : null
  return deps.store.insertOrder({
    user_id: input.userId, kind: p.kind === 'domain' ? 'domain_renewal' : 'workspace_renewal', domain: p.domain, project_id: null,
    years: p.kind === 'domain' ? p.term : null, months: p.kind === 'workspace' ? p.term : null, seats: p.seats, region: w?.region ?? null,
    registry_cents: p.registryCents, margin_cents: p.marginCents, total_cents: p.totalCents, contact, policy_version: POLICY_VERSION,
  })
}

async function fulfilRenewal(deps: FulfilDeps, o: Order) {
  const { provider, store } = deps
  const DAY = 86_400_000
  if (o.kind === 'domain_renewal') {
    const d = await store.getDomain(o.user_id, o.domain)
    if (!d) throw new Error('Domain not found for renewal')
    // The provider wants the CURRENT expiry date with the request; ask it, and fall back to what we stored.
    const before = await provider.getDomainDetails(d.rc_order_id).catch(() => null)
    const current = before?.expiresAt ?? d.expires_at
    if (!current) throw new Error('The current expiry date is not confirmed yet')
    const years = o.years ?? 1
    // A resumed order may already have been renewed at the provider before the function was cut off. Renewing again would
    // charge twice, so when the provider's date is already about a term past the one we stored, only record it.
    const stored = d.expires_at ? new Date(d.expires_at) : null
    const alreadyRenewed = Boolean(stored && before?.expiresAt && new Date(before.expiresAt).getTime() >= addYears(stored, years).getTime() - 10 * DAY)
    if (!alreadyRenewed) await provider.renewDomain({ orderId: d.rc_order_id, years, currentExpiryEpoch: Math.floor(new Date(current).getTime() / 1000) })
    const after = await provider.getDomainDetails(d.rc_order_id).catch(() => null)
    await store.setExpiry('domain', o.user_id, o.domain, after?.expiresAt ?? addYears(new Date(current), years).toISOString())
    return
  }
  const w = await store.getWorkspace(o.user_id, o.domain)
  if (!w) throw new Error('Workspace order not found for renewal')
  const months = o.months ?? 12
  const stored = w.expires_at ? new Date(w.expires_at) : null
  const before = await provider.getWorkspaceDetails(w.rc_order_id, w.region as WorkspaceRegion).catch(() => null)
  const alreadyRenewed = Boolean(stored && before?.expiresAt && new Date(before.expiresAt).getTime() >= addMonths(stored, months).getTime() - 10 * DAY)
  if (!alreadyRenewed) await provider.renewWorkspace({ orderId: w.rc_order_id, months, region: w.region as WorkspaceRegion })
  const after = await provider.getWorkspaceDetails(w.rc_order_id, w.region as WorkspaceRegion).catch(() => null)
  const base = w.expires_at ? new Date(w.expires_at) : new Date()
  await store.setExpiry('workspace', o.user_id, o.domain, after?.expiresAt ?? addMonths(base, months).toISOString())
}
