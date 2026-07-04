import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { currencyForCountry, type Currency } from '@/lib/currency'

// Server-only. Decides the storefront currency for a page, and whether the
// current viewer is the owner (admin) — used to show the region switcher.
//
// Default: the visitor's IP country (India → INR once the flag is on, else USD).
// Override: an admin can force either storefront with ?region=us|in — so you can
// preview both, even from an Indian IP, and even before India is launched.
// Regular visitors never reach the override branch, so US and India stay fully
// separated and arbitrage-free.
export async function resolveRegion(region?: string): Promise<{ currency: Currency; isAdmin: boolean }> {
  let isAdmin = false
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    isAdmin = isAdminEmail(data.user?.email)
  } catch { /* no session — anonymous visitor */ }

  if (region && isAdmin) {
    return { currency: region.toLowerCase() === 'in' ? 'INR' : 'USD', isAdmin }
  }
  const country = (await headers()).get('x-vercel-ip-country')
  return { currency: currencyForCountry(country), isAdmin }
}
