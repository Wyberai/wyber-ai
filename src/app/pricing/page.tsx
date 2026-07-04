import { resolveRegion } from '@/lib/region'
import { PricingClient } from './PricingClient'
import { RegionSwitcher } from '@/components/shared/RegionSwitcher'

// Rendered per request from the visitor's IP country — never cached, so a
// India-rendered page can NEVER be served to a US visitor (or vice versa).
// This is what keeps the US and India experiences fully separate.
export const dynamic = 'force-dynamic'

// India (IP=IN) → ₹/UPI on first paint; everyone else → the USD US product,
// with no trace of India. The owner (admin) gets a one-click switcher to
// preview either — regular visitors can't, so the two storefronts stay separate.
export default async function PricingPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const { region } = await searchParams
  const { currency, isAdmin } = await resolveRegion(region)
  return (
    <>
      <PricingClient initialCurrency={currency} />
      <RegionSwitcher current={currency} show={isAdmin} />
    </>
  )
}
