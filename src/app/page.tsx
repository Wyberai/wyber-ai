import { resolveRegion } from '@/lib/region'
import { HomeClient } from './HomeClient'

// Per-request render from IP country (never cached across regions), so India
// sees ₹ pricing on first paint and the US never sees a trace of India.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const currency = await resolveRegion()
  return <HomeClient initialCurrency={currency} />
}
