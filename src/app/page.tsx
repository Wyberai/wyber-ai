import { resolveCurrency } from '@/lib/region'
import { HomeClient } from './HomeClient'

// Per-request render from IP country (never cached across regions), so India
// sees ₹ pricing on first paint and the US never sees a trace of India. The
// owner (admin) can preview either with ?region=us / ?region=in.
export const dynamic = 'force-dynamic'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const { region } = await searchParams
  return <HomeClient initialCurrency={await resolveCurrency(region)} />
}
