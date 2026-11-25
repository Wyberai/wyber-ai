// Google Workspace prices from the provider's reseller cost list (products/reseller-cost-price.json), read from the live
// account on 2026-11-24. The layout, per region key (gappsin = India, gappsgbl = rest of the world, gappsse = South East
// Asia and Egypt):
//   { plans: { "<planId>": { add: { "1": monthly, "12": per month on a 12 month term }, renew: { ... }, transfer: { ... } } } }
// Prices are per seat per month in the reseller account's currency. The first year ("add") is an introductory price and the
// renewal is higher, so the two are kept apart: charging renewals at the first-year price would sell below cost.
// Business Starter is the cheapest plan on each list, and it is the plan the provider orders when no plan id is given.

export type WsRegion = 'in' | 'se' | 'gbl'

export interface WorkspacePrices {
  /** Minor units (paise or cents) per seat per month for a new 12 month order. */
  add: Partial<Record<WsRegion, number>>
  /** Minor units per seat per month when renewing for 12 months. */
  renew: Partial<Record<WsRegion, number>>
  /** The plan the prices were read from, for the record. */
  planId: Partial<Record<WsRegion, number>>
}

const KEYS: [string, WsRegion][] = [['gappsin', 'in'], ['gappsgbl', 'gbl'], ['gappsse', 'se']]
const minor = (v: unknown): number => Math.round(Number(v) * 100)

export function parseWorkspacePrices(list: unknown): WorkspacePrices {
  const out: WorkspacePrices = { add: {}, renew: {}, planId: {} }
  const root = (list ?? {}) as Record<string, { plans?: Record<string, { add?: Record<string, unknown>; renew?: Record<string, unknown> }> }>
  for (const [key, region] of KEYS) {
    const plans = root[key]?.plans
    if (!plans) continue
    let best: { id: number; add: number; renew: number } | null = null
    for (const [id, p] of Object.entries(plans)) {
      const add = Number(p?.add?.['12'])
      if (!(add > 0)) continue
      const renew = Number(p?.renew?.['12'])
      if (!best || add < best.add) best = { id: Number(id), add, renew: renew > 0 ? renew : add }
    }
    if (best) {
      out.add[region] = minor(best.add)
      out.renew[region] = minor(best.renew)
      out.planId[region] = best.id
    }
  }
  return out
}
