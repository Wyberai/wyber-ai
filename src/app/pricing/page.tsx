import { headers } from 'next/headers'
import { currencyForCountry } from '@/lib/currency'
import { PricingClient } from './PricingClient'

// Server component: reads the visitor's country from Vercel's edge geo header
// and hands the client the right currency, so India sees ₹/UPI on first paint
// with no flicker and no client-side guessing. Unknown country (e.g. localhost)
// → USD. Reading headers makes this route dynamic, which is what we want for
// per-visitor pricing.
export default async function PricingPage() {
  const country = (await headers()).get('x-vercel-ip-country')
  return <PricingClient initialCurrency={currencyForCountry(country)} />
}
