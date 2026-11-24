import { randomBytes } from 'crypto'
import { providerPath } from './dns'
import { signRelayBody } from './relay-sign'
import { ENV_NAMES, TLDS } from './config'
import {
  ProviderError,
  type Availability, type ContactDetails, type CostTable, type DnsRecord, type DomainDetails,
  type DomainsProvider, type WorkspaceDetails,
} from './types'

// The ONE module that talks to the reseller. It never sees the reseller's API key or reseller id: those live only on
// the relay (relay/), which adds them to each call from its own environment. This client sends
//   POST {DOMAINS_RELAY_URL}/v1/call   { method, path, params }   with an HMAC signature header,
// and the relay forwards it to the provider from its fixed IP. Point the relay at the sandbox
// (RESELLERCLUB_BASE=https://test.httpapi.com/api/) and this same client runs against the sandbox.

type Fetch = typeof fetch
type Region = 'in' | 'se' | 'gbl'

export interface RelayClientOptions {
  url: string
  secret: string
  currency?: 'USD' | 'INR'
  fetchImpl?: Fetch
  now?: () => number
  env?: Record<string, string | undefined>
}

type Params = Record<string, string | number | boolean | string[] | undefined>

function cleanParams(p: Params): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {}
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined) continue
    out[k] = Array.isArray(v) ? v.map(String) : String(v)
  }
  return out
}

const major = (v: unknown): number => Math.round(Number(v) * 100)

/** A random password that meets the provider's rule (found in the sandbox: 9 to 16 characters with upper case, lower case,
 *  a digit and a special character from ~*!@$#%_+.?:,{}). 14 characters, never stored or shown. */
export function providerPassword(): string {
  const pick = (set: string, n: number) => Array.from(randomBytes(n), b => set[b % set.length]).join('')
  const chars = [pick('ABCDEFGHJKLMNPQRSTUVWXYZ', 3), pick('abcdefghijkmnopqrstuvwxyz', 5), pick('23456789', 3), pick('!@#%+', 3)].join('')
  const bytes = randomBytes(chars.length)
  return Array.from(chars).map((c, i) => ({ c, k: bytes[i] })).sort((a, b) => a.k - b.k).map(x => x.c).join('')
}

export class RelayDomainsClient implements DomainsProvider {
  readonly name = 'resellerclub-relay'
  private readonly doFetch: Fetch
  private readonly now: () => number
  private readonly env: Record<string, string | undefined>
  readonly currency: 'USD' | 'INR'

  constructor(private readonly opts: RelayClientOptions) {
    this.doFetch = opts.fetchImpl ?? fetch
    this.now = opts.now ?? (() => Math.floor(Date.now() / 1000))
    this.env = opts.env ?? process.env
    this.currency = opts.currency ?? 'USD'
  }

  async call(method: 'GET' | 'POST', path: string, params: Params = {}): Promise<unknown> {
    const body = JSON.stringify({ method, path, params: cleanParams(params) })
    const ts = this.now()
    let res: Response
    try {
      res = await this.doFetch(`${this.opts.url.replace(/\/$/, '')}/v1/call`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-relay-timestamp': String(ts),
          'x-relay-signature': signRelayBody(this.opts.secret, ts, body),
        },
        body,
      })
    } catch (e) {
      throw new ProviderError(`Domain service unreachable: ${e instanceof Error ? e.message : String(e)}`, true)
    }
    const text = await res.text()
    let json: unknown
    try { json = text ? JSON.parse(text) : null } catch { json = text }
    if (!res.ok) {
      const msg = typeof json === 'object' && json && 'message' in json ? String((json as { message: unknown }).message) : `HTTP ${res.status}`
      throw new ProviderError(msg, res.status >= 500)
    }
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const o = json as Record<string, unknown>
      const st = String(o.status ?? '').toLowerCase()
      // The provider also answers HTTP 200 with status "Failed" and a `msg` (seen on DNS records in the sandbox).
      if (st === 'error' || st === 'failed' || (o.error && !o.entityid)) {
        throw new ProviderError(String(o.message ?? o.msg ?? o.error ?? 'The domain provider refused the request'))
      }
    }
    return json
  }

  async checkAvailability(label: string, tlds: string[]): Promise<Record<string, Availability>> {
    const json = (await this.call('GET', 'domains/available.json', { 'domain-name': label, tlds })) as Record<string, { status?: string }>
    const out: Record<string, Availability> = {}
    for (const tld of tlds) {
      const st = json?.[`${label}.${tld}`]?.status
      out[tld] = st === 'available' ? 'available' : st === 'regthroughus' || st === 'regthroughothers' ? 'taken' : 'unknown'
    }
    return out
  }

  async getCostTable(): Promise<CostTable> {
    const json = (await this.call('GET', 'products/reseller-cost-price.json')) as Record<string, Record<string, Record<string, string>>>
    const domains: CostTable['domains'] = {}
    for (const t of TLDS) {
      const row = json?.[t.productKey]
      if (!row) continue
      const reg: Record<number, number> = {}
      const ren: Record<number, number> = {}
      for (const [y, p] of Object.entries(row.addnewdomain ?? {})) reg[Number(y)] = major(p)
      for (const [y, p] of Object.entries(row.renewdomain ?? {})) ren[Number(y)] = major(p)
      domains[t.productKey] = { register: reg, renew: ren }
    }
    // The cost-price documentation shows the layout for domains and hosting but not for Google Workspace, so the
    // per-seat cost is read from the founder's own figures (set from the reseller panel) until it is confirmed live.
    const wsEnv = (k: string) => {
      const v = this.env[k]
      return v && Number(v) > 0 ? Math.round(Number(v)) : null
    }
    return {
      currency: this.currency,
      domains,
      workspacePerSeatMonth: { in: wsEnv(ENV_NAMES_WS.in), gbl: wsEnv(ENV_NAMES_WS.gbl), se: wsEnv(ENV_NAMES_WS.gbl) },
    }
  }

  async ensureCustomer(input: { email: string; contact: ContactDetails; existingCustomerId?: number | null }): Promise<number> {
    if (input.existingCustomerId) return input.existingCustomerId
    const c = input.contact
    try {
      const res = await this.call('POST', 'customers/v2/signup.json', {
        username: input.email,
        // The customer never signs in to the provider's panel; everything happens inside WyberAi. A random password is set and discarded.
        passwd: providerPassword(),
        name: c.name, company: c.company || 'N/A', 'address-line-1': c.address1, city: c.city, state: c.state,
        country: c.country, zipcode: c.zip, 'phone-cc': c.phoneCc, phone: c.phone, 'lang-pref': 'en',
      })
      return Number(res)
    } catch (e) {
      // An earlier attempt may have created this customer and then failed before we saved them. Find them instead of
      // failing on "already exists", so a retry carries on.
      if (e instanceof ProviderError && /already|exist/i.test(e.message)) {
        try {
          const d = (await this.call('GET', 'customers/details.json', { username: input.email })) as { customerid?: string | number }
          const n = Number(d?.customerid)
          if (Number.isFinite(n) && n > 0) return n
        } catch { /* fall through to the original error */ }
      }
      throw e
    }
  }

  async ensureContact(input: { customerId: number; contact: ContactDetails; existingContactId?: number | null }): Promise<number> {
    if (input.existingContactId) return input.existingContactId
    const c = input.contact
    const res = await this.call('POST', 'contacts/add.json', {
      name: c.name, company: c.company || 'N/A', email: c.email, 'address-line-1': c.address1, city: c.city,
      state: c.state, country: c.country, zipcode: c.zip, 'phone-cc': c.phoneCc, phone: c.phone,
      'customer-id': input.customerId, type: 'Contact',
    })
    return Number(res)
  }

  async defaultNameservers(customerId: number): Promise<string[]> {
    const fromEnv = (this.env[ENV_NAMES.nameservers] ?? '').split(',').map(s => s.trim()).filter(Boolean)
    if (fromEnv.length >= 2) return fromEnv
    const res = await this.call('GET', 'domains/customer-default-ns.json', { 'customer-id': customerId })
    return Array.isArray(res) ? res.map(String) : []
  }

  async registerDomain(i: { domain: string; years: number; customerId: number; contactId: number; nameservers: string[] }) {
    const res = (await this.call('POST', 'domains/register.json', {
      'domain-name': i.domain, years: i.years, ns: i.nameservers, 'customer-id': i.customerId,
      'reg-contact-id': i.contactId, 'admin-contact-id': i.contactId, 'tech-contact-id': i.contactId, 'billing-contact-id': i.contactId,
      'invoice-option': 'NoInvoice', 'auto-renew': false,
    })) as { entityid?: string | number }
    if (!res?.entityid) throw new ProviderError('The provider did not return an order id for the registration')
    return { orderId: Number(res.entityid) }
  }

  async findDomainOrderId(domain: string): Promise<number | null> {
    try {
      const r = await this.call('GET', 'domains/orderid.json', { 'domain-name': domain })
      const n = Number(r)
      return Number.isFinite(n) && n > 0 ? n : null
    } catch { return null }
  }

  async renewDomain(i: { orderId: number; years: number; currentExpiryEpoch: number }) {
    await this.call('POST', 'domains/renew.json', {
      'order-id': i.orderId, years: i.years, 'exp-date': i.currentExpiryEpoch, 'invoice-option': 'NoInvoice', 'auto-renew': false,
    })
  }

  async getDomainDetails(orderId: number): Promise<DomainDetails> {
    const r = (await this.call('GET', 'domains/details.json', { 'order-id': orderId, options: 'OrderDetails' })) as Record<string, unknown>
    const end = Number(r.endtime)
    const expiresAt = Number.isFinite(end) && end > 0 ? new Date(end * 1000).toISOString() : null
    // Domain orders carry no `currentstatus`: a finished order has an `endtime`, a fresh one (seen with .in) has none yet.
    const flags = Array.isArray(r.orderstatus) ? (r.orderstatus as unknown[]).map(String).join(',') : ''
    return {
      orderId,
      domain: String(r.domainname ?? r.description ?? ''),
      status: String(r.currentstatus ?? (expiresAt ? (flags || 'active') : 'pending')),
      expiresAt,
    }
  }

  async activateDns(orderId: number) {
    await this.call('POST', 'dns/activate.json', { 'order-id': orderId })
  }

  async addDnsRecord(domain: string, record: DnsRecord) {
    const { path, params } = providerPath(record)
    await this.call('POST', path, { 'domain-name': domain, ...params })
  }

  async addWorkspace(i: { domain: string; months: number; seats: number; customerId: number; region: Region }) {
    const res = (await this.call('POST', `gapps/${i.region}/add.json`, {
      'domain-name': i.domain, months: i.months, 'no-of-accounts': i.seats, 'customer-id': i.customerId,
      'invoice-option': 'NoInvoice', 'auto-renew': false,
    })) as { entityid?: string | number }
    if (!res?.entityid) throw new ProviderError('The provider did not return an order id for Workspace')
    return { orderId: Number(res.entityid) }
  }

  async setupWorkspaceAdmin(i: Parameters<DomainsProvider['setupWorkspaceAdmin']>[0]) {
    await this.call('POST', `gapps/${i.region}/admin/add.json`, {
      'order-id': i.orderId, 'email-address': i.adminEmail, 'first-name': i.firstName, 'last-name': i.lastName,
      'alternate-email-address': i.alternateEmail, name: i.name, company: i.company, zip: i.zip,
    })
  }

  async addWorkspaceSeats(i: { orderId: number; seats: number; region: Region }) {
    await this.call('POST', `gapps/${i.region}/add-account.json`, { 'order-id': i.orderId, 'no-of-accounts': i.seats, 'invoice-option': 'NoInvoice' })
  }

  async renewWorkspace(i: { orderId: number; months: number; region: Region }) {
    await this.call('POST', `gapps/${i.region}/renew.json`, { 'order-id': i.orderId, months: i.months, 'invoice-option': 'NoInvoice', 'auto-renew': false })
  }

  async getWorkspaceDetails(orderId: number, region: Region): Promise<WorkspaceDetails> {
    const r = (await this.call('GET', `gapps/${region}/details.json`, { 'order-id': orderId })) as Record<string, unknown>
    const end = Number(r.endtime)
    return {
      orderId,
      domain: String(r.domainname ?? ''),
      status: String(r.currentstatus ?? 'unknown'),
      seats: Number(r.emailaccounts ?? 0),
      expiresAt: Number.isFinite(end) && end > 0 ? new Date(end * 1000).toISOString() : null,
    }
  }
}

const ENV_NAMES_WS = { in: 'WORKSPACE_COST_MINOR_PER_SEAT_MONTH_IN', gbl: 'WORKSPACE_COST_MINOR_PER_SEAT_MONTH_GBL' } as const
