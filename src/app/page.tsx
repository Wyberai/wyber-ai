import { resolveRegion } from '@/lib/region'
import { HomeClient } from './HomeClient'
import { RegionSwitcher } from '@/components/shared/RegionSwitcher'

// Per-request render from IP country (never cached across regions), so India
// sees ₹ pricing on first paint and the US never sees a trace of India. The
// owner (admin) gets a one-click switcher to preview either.
export const dynamic = 'force-dynamic'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const { region } = await searchParams
  const { currency, isAdmin } = await resolveRegion(region)
  return (
    <>
      <HomeClient initialCurrency={currency} />
      <RegionSwitcher current={currency} show={isAdmin} />
    </>
  )
}
