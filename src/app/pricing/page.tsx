import { headers } from 'next/headers'
import { currencyForCountry } from '@/lib/currency'
import { PricingClient } from './PricingClient'

// Rendered per request from the visitor's IP country — never cached, so a
// India-rendered page can NEVER be served to a US visitor (or vice versa).
// This is what keeps the US and India experiences fully separate.
export const dynamic = 'force-dynamic'

// Server component: reads the visitor's country from Vercel's edge geo header
// and hands the client the right currency. India (IP=IN) → ₹/UPI on first
// paint; everyone else (incl. unknown/localhost) → the USD US product, with no
// trace of India. IP is the sole decider — no client-side clock check that
// could leak the India page to a US browser.
export default async function PricingPage() {
  const country = (await headers()).get('x-vercel-ip-country')
  return <PricingClient initialCurrency={currencyForCountry(country)} />
}
