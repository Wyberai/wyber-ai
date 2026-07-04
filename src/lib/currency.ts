// India localization — currency detection, formatting, and the master flag.
//
// Dark-launched: with NEXT_PUBLIC_INR_PRICING_ENABLED unset/false the whole
// INR experience is invisible and the site behaves exactly as before (USD
// only). Flip it to 'true' ONLY after the INR-priced products exist in Dodo
// (currency=INR is what unlocks UPI) and the DODO_PRODUCT_*_INR env vars are
// set — otherwise Indian checkouts have nothing to charge.

export type Currency = 'USD' | 'INR'

export const INR_PRICING_ENABLED = process.env.NEXT_PUBLIC_INR_PRICING_ENABLED === 'true'

export const CURRENCY_SYMBOL: Record<Currency, string> = { USD: '$', INR: '₹' }

/** Format a whole-unit amount for display, e.g. 1499 → "₹1,499", 29 → "$29". */
export function formatPrice(amount: number, currency: Currency): string {
  if (currency === 'INR') return `₹${amount.toLocaleString('en-IN')}`
  return `$${amount.toLocaleString('en-US')}`
}

/**
 * Currency for a visitor, from their IP country (read server-side from Vercel's
 * x-vercel-ip-country header) — India → INR, everyone else → USD. This runs on
 * the server so the correct price renders on first paint with no flicker and no
 * client-side guessing. Returns USD when the flag is off (nothing INR shows) or
 * when the country is unknown (e.g. localhost, where the header is absent).
 */
export function currencyForCountry(country?: string | null): Currency {
  if (!INR_PRICING_ENABLED) return 'USD'
  return country === 'IN' ? 'INR' : 'USD'
}
