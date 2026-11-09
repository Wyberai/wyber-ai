import { resolveRegion, isOwnerPreview } from '@/lib/region'
import { PricingClient } from './PricingClient'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { OwnerRegionSwitcher } from '@/components/shared/OwnerRegionSwitcher'

// Rendered per request from the visitor's IP country — never cached, so a
// India-rendered page can NEVER be served to a US visitor (or vice versa).
// India (IP=IN) → ₹/UPI on first paint; everyone else → the USD US product.
// The owner switcher only renders on a browser unlocked via /api/owner-preview.
//
// Edge runtime so this executes at the PoP nearest the visitor instead of a
// single Node region — see src/app/page.tsx for why.
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default async function PricingPage() {
  const currency = await resolveRegion()
  const owner = await isOwnerPreview()
  return (
    <>
      <SignalFrame><div className="sg-island-dark"><PricingClient initialCurrency={currency} /></div></SignalFrame>
      {owner && <OwnerRegionSwitcher current={currency} />}
    </>
  )
}
