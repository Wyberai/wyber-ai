// India localization — currency detection and formatting.
//
// India is LIVE: currency is decided SOLELY by the visitor's IP country, so the
// US and India storefronts stay fully separate and there is no build-time flag
// to get wrong. (The old NEXT_PUBLIC_INR_PRICING_ENABLED dark-launch flag was
// retired at launch — it was a build-time-inlined footgun that could silently
// leave India on USD even when set in Vercel.)

export type Currency = 'USD' | 'INR'

export const CURRENCY_SYMBOL: Record<Currency, string> = { USD: '$', INR: '₹' }

/** Format a whole-unit amount for display, e.g. 1499 → "₹1,499", 29 → "$29". */
export function formatPrice(amount: number, currency: Currency): string {
  if (currency === 'INR') return `₹${amount.toLocaleString('en-IN')}`
  return `$${amount.toLocaleString('en-US')}`
}

/**
 * Currency for a visitor, from their IP country (read server-side from Vercel's
 * x-vercel-ip-country header) — India → INR, everyone else → USD. Runs on the
 * server so the correct price renders on first paint with no flicker. Unknown
 * country (e.g. localhost, where the header is absent) → USD.
 */
export function currencyForCountry(country?: string | null): Currency {
  return country === 'IN' ? 'INR' : 'USD'
}
