import { resolveRegion, isOwnerPreview } from '@/lib/region'
import { HomeClient } from './HomeClient'
import { OwnerRegionSwitcher } from '@/components/shared/OwnerRegionSwitcher'

// Per-request render from IP country (never cached across regions), so India
// sees ₹ pricing on first paint and the US never sees a trace of India. The
// owner switcher only renders on a browser unlocked via /api/owner-preview.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const currency = await resolveRegion()
  const owner = await isOwnerPreview()
  return (
    <>
      <HomeClient initialCurrency={currency} />
      {owner && <OwnerRegionSwitcher current={currency} />}
    </>
  )
}
