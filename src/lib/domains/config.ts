// Domains + Google Workspace: one place for the rules the founder set and the provider facts we rely on.
//
// Provider: ResellerClub (HTTP API). Facts below come from the provider's knowledge base (read 2026-11-23):
//   - Domain product keys: .com = domcno, .in = dotin, .co.in = thirdleveldotin (KB "Product Keys").
//   - .app and .io are NOT listed in that table; their keys are marked unverified and the TLD is only offered when
//     the live cost-price response actually contains a price for it (see search.ts).
//   - Google Workspace is sold through the same API and the same reseller credentials: /api/gapps/{in|se|gbl}/...
//     (product keys gappsin / gappsse / gappsgbl).

/** The flat margin on every domain, in USD cents. "Our price = the registry price + $1." */
export const DOMAIN_MARGIN_CENTS = 100

/**
 * Proposed Workspace margin: a flat 50 cents per seat per month on top of the reseller's cost.
 * Recorded assumption (docs/domains-workspace.md): low, flat and shown openly. The founder can change it with
 * WORKSPACE_MARGIN_CENTS_PER_SEAT_MONTH without a deploy of code.
 */
export const DEFAULT_WORKSPACE_MARGIN_CENTS = 50

export const SUPPORTED_YEARS = [1, 2, 3, 5, 10] as const

export interface TldConfig {
  tld: string
  /** ResellerClub product key used in the cost-price table. */
  productKey: string
  /** false = the key is not in the provider's published table; offered only if the live price table contains it. */
  keyVerified: boolean
  /** Money-back grace period in days, from the provider's KB. null = not published for this TLD. */
  moneyBackDays: number | null
}

export const TLDS: TldConfig[] = [
  { tld: 'com', productKey: 'domcno', keyVerified: true, moneyBackDays: 4 },
  { tld: 'in', productKey: 'dotin', keyVerified: true, moneyBackDays: 4 },
  { tld: 'co.in', productKey: 'thirdleveldotin', keyVerified: true, moneyBackDays: null },
  { tld: 'app', productKey: 'dotapp', keyVerified: false, moneyBackDays: null },
  { tld: 'io', productKey: 'dotio', keyVerified: false, moneyBackDays: null },
]

export const DEFAULT_TLDS = TLDS.map(t => t.tld)

export function tldConfig(tld: string): TldConfig | undefined {
  return TLDS.find(t => t.tld === tld.toLowerCase())
}

/** Names of the environment variables this feature reads. Values are never written to files or logs. */
export const ENV_NAMES = {
  provider: 'DOMAINS_PROVIDER', // 'relay' (default when the two below are set) | 'fake' (sandbox walkthrough, never in production)
  relayUrl: 'DOMAINS_RELAY_URL',
  relaySecret: 'DOMAINS_RELAY_SECRET',
  currency: 'DOMAINS_PROVIDER_CURRENCY', // 'USD' (default) or 'INR': the currency of the reseller account's prices
  inrPerUsd: 'DOMAINS_INR_PER_USD', // required when the currency is INR
  workspaceMargin: 'WORKSPACE_MARGIN_CENTS_PER_SEAT_MONTH',
  nameservers: 'DOMAINS_NAMESERVERS', // optional comma list; otherwise the customer's default nameservers from the provider
  vercelProjectId: 'VERCEL_PROJECT_ID', // already used by /api/custom-domain
} as const

export function workspaceMarginCents(env: Record<string, string | undefined> = process.env): number {
  const raw = env[ENV_NAMES.workspaceMargin]
  const n = raw == null || raw === '' ? NaN : Number(raw)
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : DEFAULT_WORKSPACE_MARGIN_CENTS
}

/** The Workspace plans. Only plans whose ordering is documented are marked available. */
export interface WorkspacePlan {
  id: string
  name: string
  available: boolean
  note: string
}

export const WORKSPACE_PLANS: WorkspacePlan[] = [
  {
    id: 'starter',
    name: 'Business Starter',
    available: true,
    // The provider's "Add" call provisions the starter plan when no plan-id is given.
    note: 'Email on your own domain, 30 GB storage per user, Meet, Docs and Sheets.',
  },
  {
    id: 'standard',
    name: 'Business Standard',
    available: false,
    note: 'Not offered yet. The provider documents a plan-id only for transfers, so ordering this plan is not confirmed.',
  },
  {
    id: 'plus',
    name: 'Business Plus',
    available: false,
    note: 'Not offered yet. The provider documents a plan-id only for transfers, so ordering this plan is not confirmed.',
  },
]

export type WorkspaceRegion = 'in' | 'se' | 'gbl'

/** Which provider region (price list and endpoint) a customer is sold from. India and everything else are the two we use. */
export function workspaceRegionFor(countryCode: string | null | undefined): WorkspaceRegion {
  return (countryCode ?? '').toUpperCase() === 'IN' ? 'in' : 'gbl'
}

export const WORKSPACE_MONTH_OPTIONS = [12] as const
export const WORKSPACE_MAX_SEATS = 50
