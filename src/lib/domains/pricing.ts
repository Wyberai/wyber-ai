import { DOMAIN_MARGIN_CENTS, tldConfig } from './config'
import type { CostTable } from './types'

// Pure price maths. Customers always pay USD through the platform's checkout. The reseller account may be priced in
// INR, so the registry cost is converted with an explicit rate (DOMAINS_INR_PER_USD) and rounded UP to the cent so the
// platform never sells below cost because of rounding.

export function toUsdCents(minor: number, currency: 'USD' | 'INR', inrPerUsd?: number): number {
  if (currency === 'USD') return Math.round(minor)
  if (!inrPerUsd || !(inrPerUsd > 0)) throw new Error('DOMAINS_INR_PER_USD is required when the provider prices in INR')
  // minor = paise; paise / rate = US cents.
  return Math.ceil(minor / inrPerUsd)
}

export interface DomainQuote {
  domain: string
  years: number
  registryCents: number
  marginCents: number
  totalCents: number
  currency: 'USD'
  /** Renewal for the same term, same flat margin. */
  renewalTotalCents: number | null
}

export function splitDomain(domain: string): { label: string; tld: string } | null {
  const d = domain.trim().toLowerCase().replace(/\.$/, '')
  // Longest matching configured TLD wins, so example.co.in is .co.in and not .in.
  const cfgs = ['co.in', 'com', 'in', 'app', 'io']
  for (const t of cfgs.sort((a, b) => b.length - a.length)) {
    if (d.endsWith('.' + t)) {
      const label = d.slice(0, -(t.length + 1))
      if (label && !label.includes('.')) return { label, tld: t }
    }
  }
  return null
}

export function quoteDomain(
  domain: string,
  years: number,
  table: CostTable,
  inrPerUsd?: number,
): DomainQuote | null {
  const parts = splitDomain(domain)
  if (!parts) return null
  const cfg = tldConfig(parts.tld)
  if (!cfg) return null
  const row = table.domains[cfg.productKey]
  const reg = row?.register?.[years]
  if (reg == null || !(reg > 0)) return null
  const registryCents = toUsdCents(reg, table.currency, inrPerUsd)
  const ren = row.renew?.[years]
  const renewalRegistry = ren != null && ren > 0 ? toUsdCents(ren, table.currency, inrPerUsd) : null
  return {
    domain: `${parts.label}.${parts.tld}`,
    years,
    registryCents,
    marginCents: DOMAIN_MARGIN_CENTS,
    totalCents: registryCents + DOMAIN_MARGIN_CENTS,
    currency: 'USD',
    renewalTotalCents: renewalRegistry == null ? null : renewalRegistry + DOMAIN_MARGIN_CENTS,
  }
}

export interface WorkspaceQuote {
  seats: number
  months: number
  perSeatMonthCostCents: number
  perSeatMonthMarginCents: number
  registryCents: number
  marginCents: number
  totalCents: number
  currency: 'USD'
}

export function quoteWorkspace(opts: {
  seats: number
  months: number
  costPerSeatMonthMinor: number
  currency: 'USD' | 'INR'
  inrPerUsd?: number
  marginPerSeatMonthCents: number
}): WorkspaceQuote {
  const { seats, months } = opts
  if (!Number.isInteger(seats) || seats < 1) throw new Error('seats must be a whole number of at least 1')
  if (!Number.isInteger(months) || months < 1) throw new Error('months must be a whole number of at least 1')
  const unitCost = toUsdCents(opts.costPerSeatMonthMinor, opts.currency, opts.inrPerUsd)
  const registryCents = unitCost * seats * months
  const marginCents = opts.marginPerSeatMonthCents * seats * months
  return {
    seats,
    months,
    perSeatMonthCostCents: unitCost,
    perSeatMonthMarginCents: opts.marginPerSeatMonthCents,
    registryCents,
    marginCents,
    totalCents: registryCents + marginCents,
    currency: 'USD',
  }
}

export const formatUsd = (cents: number): string => `$${(cents / 100).toFixed(2)}`
