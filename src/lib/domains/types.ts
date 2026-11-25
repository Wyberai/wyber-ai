export type Money = { cents: number; currency: 'USD' }

export type Availability = 'available' | 'taken' | 'unknown'

export interface ContactDetails {
  name: string
  company: string
  email: string
  address1: string
  city: string
  state: string
  zip: string
  country: string // ISO 3166-1 alpha-2
  phoneCc: string // digits, 1-3
  phone: string // digits, 4-12
}

/** Provider prices in the reseller's own currency, minor units (cents or paise). */
export interface CostTable {
  currency: 'USD' | 'INR'
  /** productKey -> years -> minor units, for new registration and renewal. */
  domains: Record<string, { register: Record<number, number>; renew: Record<number, number> }>
  /** Workspace cost per seat per month in minor units, by region. null when the provider table does not state it. */
  workspacePerSeatMonth: Partial<Record<'in' | 'se' | 'gbl', number | null>>
  /** Per seat per month when renewing. Higher than the first-year price above, so renewals are priced from this, not that. */
  workspaceRenewPerSeatMonth?: Partial<Record<'in' | 'se' | 'gbl', number | null>>
}

export interface DnsRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT'
  /** '@' for the root domain, otherwise the host label (www). */
  host: string
  value: string
  ttl: number
  priority?: number
}

export interface DomainDetails {
  orderId: number
  domain: string
  status: string
  expiresAt: string | null // ISO
}

export interface WorkspaceDetails {
  orderId: number
  domain: string
  status: string
  seats: number
  expiresAt: string | null
}

/** Everything the app asks of the provider. The relay client and the fake both implement it. */
export interface DomainsProvider {
  readonly name: string
  checkAvailability(label: string, tlds: string[]): Promise<Record<string, Availability>>
  getCostTable(): Promise<CostTable>
  ensureCustomer(input: { email: string; contact: ContactDetails; existingCustomerId?: number | null }): Promise<number>
  ensureContact(input: { customerId: number; contact: ContactDetails; existingContactId?: number | null }): Promise<number>
  defaultNameservers(customerId: number): Promise<string[]>
  /** The provider order id of a domain already registered on our account, or null. Lets a retry carry on instead of registering twice. */
  findDomainOrderId(domain: string): Promise<number | null>
  registerDomain(input: { domain: string; years: number; customerId: number; contactId: number; nameservers: string[] }): Promise<{ orderId: number }>
  renewDomain(input: { orderId: number; years: number; currentExpiryEpoch: number }): Promise<void>
  getDomainDetails(orderId: number): Promise<DomainDetails>
  /** What a person needs to move the domain to another provider: its transfer (authorization) code, and whether it is locked against transfer. */
  getTransferInfo(orderId: number): Promise<{ authCode: string | null; locked: boolean }>
  setTransferLock(orderId: number, locked: boolean): Promise<void>
  activateDns(orderId: number): Promise<void>
  addDnsRecord(domain: string, record: DnsRecord): Promise<void>
  addWorkspace(input: { domain: string; months: number; seats: number; customerId: number; region: 'in' | 'se' | 'gbl' }): Promise<{ orderId: number }>
  setupWorkspaceAdmin(input: {
    orderId: number; region: 'in' | 'se' | 'gbl'; adminEmail: string; firstName: string; lastName: string
    alternateEmail: string; name: string; company: string; zip: string
  }): Promise<void>
  addWorkspaceSeats(input: { orderId: number; seats: number; region: 'in' | 'se' | 'gbl' }): Promise<void>
  renewWorkspace(input: { orderId: number; months: number; region: 'in' | 'se' | 'gbl' }): Promise<void>
  getWorkspaceDetails(orderId: number, region: 'in' | 'se' | 'gbl'): Promise<WorkspaceDetails>
}

export class ProviderError extends Error {
  constructor(message: string, readonly retryable = false) {
    super(message)
    this.name = 'ProviderError'
  }
}
