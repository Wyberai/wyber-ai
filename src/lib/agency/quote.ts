// Quotes a freelancer sends a client. Pure and strict: totals are computed here, in whole cents, never trusted from the
// browser. WyberAi never handles the payment; see docs/agency-mode-plan.md.

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'AUD', 'CAD', 'SGD'] as const
export type Currency = (typeof CURRENCIES)[number]
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'paid'

export interface QuoteItem { description: string; qty: number; unit: number }

const MAX_ITEMS = 30

const cents = (n: number) => Math.round(n * 100)

export function validateItems(input: unknown): { ok: true; items: QuoteItem[]; total: number } | { ok: false; error: string } {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: 'Add at least one line' }
  if (input.length > MAX_ITEMS) return { ok: false, error: `At most ${MAX_ITEMS} lines` }
  const items: QuoteItem[] = []
  let totalCents = 0
  for (const raw of input) {
    const r = (raw ?? {}) as Record<string, unknown>
    const description = typeof r.description === 'string' ? r.description.replace(/\s+/g, ' ').trim().slice(0, 200) : ''
    const qty = Number(r.qty)
    const unit = Number(r.unit)
    if (!description) return { ok: false, error: 'Every line needs a description' }
    if (!Number.isFinite(qty) || qty <= 0 || qty > 10000) return { ok: false, error: 'Quantity must be more than 0' }
    if (!Number.isFinite(unit) || unit < 0 || unit > 1e9) return { ok: false, error: 'Price must be 0 or more' }
    items.push({ description, qty: Math.round(qty * 100) / 100, unit: cents(unit) / 100 })
    totalCents += Math.round(cents(unit) * (Math.round(qty * 100) / 100))
  }
  return { ok: true, items, total: totalCents / 100 }
}

/** Only an https link, no embedded credentials. This is shown to the client as "Pay here". */
export function validatePaymentUrl(url: unknown): { ok: true; url: string | null } | { ok: false } {
  if (url === undefined || url === null || url === '') return { ok: true, url: null }
  if (typeof url !== 'string' || url.length > 500) return { ok: false }
  try {
    const u = new URL(url.trim())
    if (u.protocol !== 'https:' || u.username || u.password) return { ok: false }
    return { ok: true, url: u.toString() }
  } catch { return { ok: false } }
}

export function isCurrency(c: unknown): c is Currency { return typeof c === 'string' && (CURRENCIES as readonly string[]).includes(c) }

export function formatMoney(amount: number, currency: string): string {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount) }
  catch { return `${currency} ${amount.toFixed(2)}` }
}

/** Q-001, Q-002 ... per client, one more than the highest already used. */
export function nextQuoteNumber(existing: string[]): string {
  const max = existing.reduce((m, n) => { const k = /^Q-(\d+)$/.exec(n); return k ? Math.max(m, Number(k[1])) : m }, 0)
  return `Q-${String(max + 1).padStart(3, '0')}`
}

/** What the freelancer may do to a quote, from where it stands. */
export function ownerCan(status: QuoteStatus) {
  return {
    edit: status === 'draft',
    send: status === 'draft',
    withdraw: status === 'sent',
    markPaid: status === 'accepted',
    remove: status === 'draft' || status === 'declined',
  }
}

/** A client can only answer a quote that was sent and is still waiting. */
export function clientCanRespond(status: QuoteStatus): boolean { return status === 'sent' }
