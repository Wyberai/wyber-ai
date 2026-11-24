import { addYears } from './dates'
import {
  ProviderError,
  type Availability, type ContactDetails, type CostTable, type DnsRecord, type DomainDetails,
  type DomainsProvider, type WorkspaceDetails,
} from './types'

// An in-memory stand-in for the reseller. Used by unit tests and by the sandbox walkthrough
// (DOMAINS_PROVIDER=fake, refused on production). Prices are made-up round numbers so tests are readable.
// Names that start with "taken" or contain "google" are reported as taken.

export interface FakeState {
  nextId: number
  domains: Map<number, { domain: string; years: number; expiresAt: Date; customerId: number }>
  dns: Map<string, DnsRecord[]>
  workspaces: Map<number, { domain: string; seats: number; months: number; expiresAt: Date; admin?: string }>
  calls: string[]
}

export function newFakeState(): FakeState {
  return { nextId: 1000, domains: new Map(), dns: new Map(), workspaces: new Map(), calls: [] }
}

export class FakeDomainsProvider implements DomainsProvider {
  readonly name = 'fake'
  constructor(readonly state: FakeState = newFakeState(), private readonly now: () => Date = () => new Date()) {}

  /** Make the next call to `method` throw, once. */
  failNext: Record<string, string | undefined> = {}
  private maybeFail(method: string) {
    const msg = this.failNext[method]
    if (msg) { this.failNext[method] = undefined; throw new ProviderError(msg) }
  }

  async checkAvailability(label: string, tlds: string[]): Promise<Record<string, Availability>> {
    this.state.calls.push('checkAvailability')
    this.maybeFail('checkAvailability')
    const out: Record<string, Availability> = {}
    for (const tld of tlds) {
      const name = `${label}.${tld}`
      const taken = label.startsWith('taken') || label.includes('google') || [...this.state.domains.values()].some(d => d.domain === name)
      out[tld] = taken ? 'taken' : 'available'
    }
    return out
  }

  async getCostTable(): Promise<CostTable> {
    this.state.calls.push('getCostTable')
    const row = (reg: number, ren: number) => ({
      register: { 1: reg, 2: reg * 2, 3: reg * 3, 5: reg * 5, 10: reg * 10 },
      renew: { 1: ren, 2: ren * 2, 3: ren * 3, 5: ren * 5, 10: ren * 10 },
    })
    return {
      currency: 'USD',
      domains: {
        domcno: row(1099, 1199), // .com  $10.99 / $11.99
        dotin: row(699, 899), // .in
        thirdleveldotin: row(499, 599), // .co.in
        dotapp: row(1399, 1399), // .app
        // .io is deliberately absent: shows the "price table has no entry, so it is not offered" path.
      },
      workspacePerSeatMonth: { in: 300, gbl: 600, se: 600 },
    }
  }

  async ensureCustomer(i: { email: string; contact: ContactDetails; existingCustomerId?: number | null }) {
    this.state.calls.push('ensureCustomer')
    this.maybeFail('ensureCustomer')
    return i.existingCustomerId ?? this.state.nextId++
  }

  async ensureContact(i: { customerId: number; contact: ContactDetails; existingContactId?: number | null }) {
    this.state.calls.push('ensureContact')
    return i.existingContactId ?? this.state.nextId++
  }

  async defaultNameservers() { return ['ns1.sandbox-dns.test', 'ns2.sandbox-dns.test'] }

  async registerDomain(i: { domain: string; years: number; customerId: number; contactId: number; nameservers: string[] }) {
    this.state.calls.push('registerDomain')
    this.maybeFail('registerDomain')
    if ([...this.state.domains.values()].some(d => d.domain === i.domain)) throw new ProviderError(`${i.domain} is already registered`)
    const orderId = this.state.nextId++
    this.state.domains.set(orderId, { domain: i.domain, years: i.years, expiresAt: addYears(this.now(), i.years), customerId: i.customerId })
    return { orderId }
  }

  async findDomainOrderId(domain: string) {
    for (const [id, d] of this.state.domains) if (d.domain === domain) return id
    return null
  }

  async renewDomain(i: { orderId: number; years: number; currentExpiryEpoch: number }) {
    this.state.calls.push('renewDomain')
    this.maybeFail('renewDomain')
    const d = this.state.domains.get(i.orderId)
    if (!d) throw new ProviderError('Unknown order')
    d.expiresAt = addYears(d.expiresAt, i.years)
  }

  async getDomainDetails(orderId: number): Promise<DomainDetails> {
    const d = this.state.domains.get(orderId)
    if (!d) throw new ProviderError('Unknown order')
    return { orderId, domain: d.domain, status: 'Active', expiresAt: d.expiresAt.toISOString() }
  }

  async activateDns() { this.state.calls.push('activateDns') }

  async addDnsRecord(domain: string, record: DnsRecord) {
    this.state.calls.push('addDnsRecord')
    this.maybeFail('addDnsRecord')
    const list = this.state.dns.get(domain) ?? []
    list.push(record)
    this.state.dns.set(domain, list)
  }

  async addWorkspace(i: { domain: string; months: number; seats: number }) {
    this.state.calls.push('addWorkspace')
    this.maybeFail('addWorkspace')
    const orderId = this.state.nextId++
    const exp = new Date(this.now()); exp.setMonth(exp.getMonth() + i.months)
    this.state.workspaces.set(orderId, { domain: i.domain, seats: i.seats, months: i.months, expiresAt: exp })
    return { orderId }
  }

  async setupWorkspaceAdmin(i: { orderId: number; adminEmail: string }) {
    this.state.calls.push('setupWorkspaceAdmin')
    const w = this.state.workspaces.get(i.orderId)
    if (!w) throw new ProviderError('Unknown order')
    w.admin = i.adminEmail
  }

  async addWorkspaceSeats(i: { orderId: number; seats: number }) {
    const w = this.state.workspaces.get(i.orderId)
    if (!w) throw new ProviderError('Unknown order')
    w.seats += i.seats
  }

  async renewWorkspace(i: { orderId: number; months: number }) {
    const w = this.state.workspaces.get(i.orderId)
    if (!w) throw new ProviderError('Unknown order')
    w.expiresAt = new Date(w.expiresAt); w.expiresAt.setMonth(w.expiresAt.getMonth() + i.months)
  }

  async getWorkspaceDetails(orderId: number): Promise<WorkspaceDetails> {
    const w = this.state.workspaces.get(orderId)
    if (!w) throw new ProviderError('Unknown order')
    return { orderId, domain: w.domain, status: 'Active', seats: w.seats, expiresAt: w.expiresAt.toISOString() }
  }
}
