import { resolveRegion, isOwnerPreview } from '@/lib/region'
import { HomeClient } from './HomeClient'
import { OwnerRegionSwitcher } from '@/components/shared/OwnerRegionSwitcher'
import { getScanStats } from '@/lib/security-stats'

// Per-request render from IP country (never cached across regions), so India
// sees ₹ pricing on first paint and the US never sees a trace of India. The
// owner switcher only renders on a browser unlocked via /api/owner-preview.
//
// Edge runtime so this (unavoidably dynamic) function executes at the PoP
// nearest the visitor instead of always round-tripping to a single Node
// region — that extra hop was the main source of slow "live" page loads.
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default async function HomePage() {
  const currency = await resolveRegion()
  const owner = await isOwnerPreview()
  const stats = await getScanStats()
  return (
    <>
      <HomeClient initialCurrency={currency} scanStats={stats} />
      {owner && <OwnerRegionSwitcher current={currency} />}
    </>
  )
}
