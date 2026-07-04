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
 * Best-guess currency for a first-time visitor (client-side). India → INR,
 * everyone else → USD. Timezone is the most reliable signal available without
 * a network round-trip; a manual toggle always lets the user override. Returns
 * USD when the flag is off so nothing INR ever shows until we're ready.
 */
export function detectCurrency(): Currency {
  if (!INR_PRICING_ENABLED) return 'USD'
  if (typeof window === 'undefined') return 'USD'
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'INR'
    const lang = (navigator.language || '').toLowerCase()
    if (lang === 'en-in' || lang === 'hi' || lang.endsWith('-in')) return 'INR'
  } catch { /* fall through */ }
  return 'USD'
}
