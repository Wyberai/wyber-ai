import { headers } from 'next/headers'
import { currencyForCountry, type Currency } from '@/lib/currency'

// Server-only. The storefront currency is decided SOLELY by the visitor's IP
// country (Vercel's x-vercel-ip-country): India → ₹, everyone else → $. No
// toggle, no override, no admin preview — IP is the single source of truth, so
// the US and India storefronts can never bleed into each other.
export async function resolveRegion(): Promise<Currency> {
  const country = (await headers()).get('x-vercel-ip-country')
  return currencyForCountry(country)
}
