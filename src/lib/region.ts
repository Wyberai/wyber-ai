import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { currencyForCountry, type Currency } from '@/lib/currency'

// Server-only. Decides the storefront currency for a page.
//
// Default: the visitor's IP country (India → INR once the flag is on, else USD).
// Override: an admin (the owner) can force either storefront with ?region=us|in
// — so you can preview both, even from an Indian IP, and even before India is
// launched. Regular visitors never reach the override branch, so US and India
// stay fully separated and arbitrage-free.
export async function resolveCurrency(region?: string): Promise<Currency> {
  if (region) {
    try {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      if (isAdminEmail(data.user?.email)) {
        return region.toLowerCase() === 'in' ? 'INR' : 'USD'
      }
    } catch { /* not signed in / no session — fall through to IP */ }
  }
  const country = (await headers()).get('x-vercel-ip-country')
  return currencyForCountry(country)
}
