import { DEFAULT_TLDS, tldConfig, workspaceMarginCents, type WorkspaceRegion } from './config'
import { quoteDomain, quoteWorkspace, splitDomain, type DomainQuote } from './pricing'
import type { CostTable, DomainsProvider } from './types'

export interface SearchResult {
  domain: string
  tld: string
  status: 'available' | 'taken' | 'unknown' | 'not_offered'
  quote: DomainQuote | null
}

/** A name a person types ("Asha Bakery", "ashabakery.com") becomes the label we check. */
export function toLabel(input: string): string {
  const raw = input.trim().toLowerCase()
  const parts = splitDomain(raw)
  const base = parts ? parts.label : raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '').split('.')[0]
  return base.replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '').slice(0, 63)
}

let cache: { at: number; table: CostTable } | null = null
export async function costTable(p: DomainsProvider, now = Date.now()): Promise<CostTable> {
  // The provider recommends caching prices; ten minutes keeps quotes current without a call per keystroke.
  if (!cache || now - cache.at > 600_000 || p.name === 'fake') cache = { at: now, table: await p.getCostTable() }
  return cache.table
}
export const resetCostCache = () => { cache = null }

export async function searchDomains(p: DomainsProvider, input: string, opts: { years?: number; tlds?: string[]; inrPerUsd?: number } = {}): Promise<{ label: string; results: SearchResult[] }> {
  const label = toLabel(input)
  if (label.length < 2) return { label, results: [] }
  const years = opts.years ?? 1
  const wanted = (opts.tlds ?? DEFAULT_TLDS).filter(t => tldConfig(t))
  const [table, avail] = await Promise.all([costTable(p), p.checkAvailability(label, wanted)])
  const results: SearchResult[] = wanted.map(tld => {
    const domain = `${label}.${tld}`
    const quote = quoteDomain(domain, years, table, opts.inrPerUsd)
    // A TLD whose price is not in the provider's table is not offered: we never show a price we cannot back.
    if (!quote) return { domain, tld, status: 'not_offered' as const, quote: null }
    return { domain, tld, status: avail[tld] ?? 'unknown', quote: avail[tld] === 'available' ? quote : null }
  })
  return { label, results }
}

/**
 * When the name someone wants is taken, offer a few close variants that ARE free, with real prices. A plain, honest
 * list (get{name}, {name}hq, {name}online, {name}shop) on .com and .in; never more than four, never a name we have not
 * checked, never one without a backed price.
 */
export async function suggestAlternatives(p: DomainsProvider, label: string, opts: { years?: number; inrPerUsd?: number } = {}): Promise<SearchResult[]> {
  const variants = [...new Set([`get${label}`, `${label}hq`, `${label}online`, `${label}shop`])].filter(v => v.length <= 63)
  const years = opts.years ?? 1
  const table = await costTable(p)
  const checked = await Promise.all(variants.map(async v => ({ v, avail: await p.checkAvailability(v, ['com', 'in']).catch(() => ({} as Record<string, string>)) })))
  const out: SearchResult[] = []
  for (const { v, avail } of checked) {
    for (const tld of ['com', 'in']) {
      if (avail[tld] !== 'available') continue
      const quote = quoteDomain(`${v}.${tld}`, years, table, opts.inrPerUsd)
      if (!quote) continue
      out.push({ domain: `${v}.${tld}`, tld, status: 'available', quote })
      break // one extension per variant keeps the list short
    }
  }
  return out.slice(0, 4)
}

export async function workspaceQuoteFor(p: DomainsProvider, region: WorkspaceRegion, seats: number, months: number, inr?: number, env: Record<string, string | undefined> = process.env, kind: 'add' | 'renew' = 'add') {
  const table = await costTable(p)
  // A renewal is priced from the renewal price, which is higher than the first-year price.
  const cost = kind === 'renew' ? (table.workspaceRenewPerSeatMonth?.[region] ?? table.workspacePerSeatMonth[region]) : table.workspacePerSeatMonth[region]
  if (!cost) return null
  return quoteWorkspace({ seats, months, costPerSeatMonthMinor: cost, currency: table.currency, inrPerUsd: inr, marginPerSeatMonthCents: workspaceMarginCents(env) })
}
