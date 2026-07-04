import { resolveRegion } from '@/lib/region'
import { PricingClient } from './PricingClient'

// Rendered per request from the visitor's IP country — never cached, so a
// India-rendered page can NEVER be served to a US visitor (or vice versa).
// India (IP=IN) → ₹/UPI on first paint; everyone else → the USD US product.
export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const currency = await resolveRegion()
  return <PricingClient initialCurrency={currency} />
}
