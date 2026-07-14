import { headers, cookies } from 'next/headers'
import { currencyForCountry, type Currency } from '@/lib/currency'
import { OWNER_COOKIE, REGION_COOKIE, isOwnerToken } from '@/lib/owner-preview'

// Server-only. For the PUBLIC, the storefront currency is decided SOLELY by the
// visitor's IP country (Vercel's x-vercel-ip-country): India → ₹, everyone else
// → $. No public toggle, no build-time flag — the US and India storefronts can
// never bleed into each other.
//
// The ONE exception is the owner: on a browser unlocked via /api/owner-preview
// (a secret key only the owner holds), an httpOnly override cookie can pin the
// region so the owner can preview either storefront. This is invisible to, and
// unreachable by, normal visitors and crawlers — see lib/owner-preview.ts.
export async function resolveRegion(): Promise<Currency> {
  const jar = await cookies()
  if (await isOwnerToken(jar.get(OWNER_COOKIE)?.value)) {
    const override = jar.get(REGION_COOKIE)?.value
    if (override === 'IN') return 'INR'
    if (override === 'US') return 'USD'
  }
  const country = (await headers()).get('x-vercel-ip-country')
  return currencyForCountry(country)
}

/** True only on a browser the owner has unlocked — gates the preview switcher. */
export async function isOwnerPreview(): Promise<boolean> {
  const jar = await cookies()
  return isOwnerToken(jar.get(OWNER_COOKIE)?.value)
}
