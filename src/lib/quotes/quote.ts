// Quotes: pure logic, safe to import from both the server and browser components. The server always recomputes totals from line items and
// never trusts a total sent by a client. No prices or terms are invented here:
// the founder types them.

export const CURRENCIES = ['USD', 'INR'] as const
export type Currency = (typeof CURRENCIES)[number]
export const QUOTE_STATUSES = ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export interface QuoteItem { description: string; qty: number; unit_price: number }

export interface QuoteRow {
  id: string
  token: string
  contact_id: string | null
  title: string
  currency: Currency
  items: QuoteItem[]
  total: number
  scope: string | null
  terms: string | null
  valid_until: string | null   // YYYY-MM-DD
  status: QuoteStatus
  sent_at: string | null
  viewed_at: string | null
  view_count: number
  accepted_at: string | null
  accepted_by: string | null
}

/** Rupees per US dollar used ONLY to roll an accepted INR quote into the dollar pipeline. Override with CRM_INR_PER_USD. */
export const DEFAULT_INR_PER_USD = 85

const round2 = (n: number) => Math.round(n * 100) / 100

export function lineTotal(i: QuoteItem): number { return round2(i.qty * i.unit_price) }
export function computeTotal(items: QuoteItem[]): number { return round2(items.reduce((s, i) => s + lineTotal(i), 0)) }

export function toUsd(total: number, currency: Currency, inrPerUsd: number = DEFAULT_INR_PER_USD): number {
  return currency === 'USD' ? round2(total) : round2(total / (inrPerUsd > 0 ? inrPerUsd : DEFAULT_INR_PER_USD))
}

export function formatMoney(amount: number, currency: Currency): string {
  return currency === 'INR'
    ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`
    : `$${amount.toLocaleString('en-US', { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`
}

/** A URL-safe token a stranger cannot guess (192 bits). */
export function newToken(): string {
  const bytes = new Uint8Array(24)
  globalThis.crypto.getRandomValues(bytes) // Web Crypto: available in Node 20+ and every browser
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export const isToken = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{32}$/.test(v)

const text = (v: unknown, max: number): string | null => {
  const s = String(v ?? '').replace(/\r/g, '').trim().slice(0, max)
  return s || null
}

export type Validated = { ok: true; value: { title: string; currency: Currency; items: QuoteItem[]; scope: string | null; terms: string | null; valid_until: string | null } } | { ok: false; error: string }

/** Check what the admin form sends. Totals are not accepted from the client. */
export function validateQuoteInput(b: Record<string, unknown>): Validated {
  const title = text(b.title, 140)
  if (!title) return { ok: false, error: 'Give the quote a title' }
  const currency = (CURRENCIES as readonly string[]).includes(String(b.currency)) ? (b.currency as Currency) : null
  if (!currency) return { ok: false, error: 'Choose USD or INR' }

  if (!Array.isArray(b.items) || b.items.length === 0) return { ok: false, error: 'Add at least one line item' }
  if (b.items.length > 30) return { ok: false, error: 'Too many line items (30 max)' }
  const items: QuoteItem[] = []
  for (const raw of b.items as Record<string, unknown>[]) {
    const description = text(raw?.description, 300)
    const qty = Number(raw?.qty)
    const unit = Number(raw?.unit_price)
    if (!description) return { ok: false, error: 'Every line item needs a description' }
    if (!Number.isFinite(qty) || qty <= 0 || qty > 10_000) return { ok: false, error: `Quantity for "${description.slice(0, 30)}" must be more than 0` }
    if (!Number.isFinite(unit) || unit < 0 || unit > 100_000_000) return { ok: false, error: `Price for "${description.slice(0, 30)}" must be 0 or more` }
    items.push({ description, qty: round2(qty), unit_price: round2(unit) })
  }
  if (computeTotal(items) <= 0) return { ok: false, error: 'The total must be more than zero' }

  let valid_until: string | null = null
  if (b.valid_until !== undefined && b.valid_until !== null && b.valid_until !== '') {
    const s = String(b.valid_until)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())) return { ok: false, error: 'That date does not look right' }
    valid_until = s
  }
  return { ok: true, value: { title, currency, items, scope: text(b.scope, 6000), terms: text(b.terms, 3000), valid_until } }
}

/** The end of the validity day, in India time, so "valid until 30 Nov" includes 30 Nov. */
export function isExpired(q: Pick<QuoteRow, 'valid_until' | 'status'>, now: Date = new Date()): boolean {
  if (q.status === 'accepted' || !q.valid_until) return false
  const endOfDay = new Date(`${q.valid_until}T23:59:59+05:30`).getTime()
  return now.getTime() > endOfDay
}

/** Can the client still accept this quote? */
export function canAccept(q: Pick<QuoteRow, 'status' | 'valid_until'>, now: Date = new Date()): { ok: true } | { ok: false; reason: string } {
  if (q.status === 'accepted') return { ok: false, reason: 'This quote has already been accepted.' }
  if (q.status === 'draft') return { ok: false, reason: 'This quote is not available.' }
  if (q.status === 'declined') return { ok: false, reason: 'This quote was declined.' }
  if (q.status === 'expired' || isExpired(q, now)) return { ok: false, reason: 'This quote has expired. Please ask for an updated one.' }
  return { ok: true }
}

/** Status after a visitor opens the link: first view moves "sent" to "viewed"; nothing else changes. */
export function statusAfterView(status: QuoteStatus): QuoteStatus { return status === 'sent' ? 'viewed' : status }

export function validateAcceptName(raw: unknown): { ok: true; name: string } | { ok: false; error: string } {
  const name = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 100)
  if (name.length < 2) return { ok: false, error: 'Please type your full name to accept' }
  return { ok: true, name }
}

/** A short WhatsApp-ready message for the founder to send with the link. */
export function shareMessage(q: Pick<QuoteRow, 'title' | 'total' | 'currency' | 'valid_until'>, url: string, contactName?: string): string {
  const greet = contactName ? `Hi ${contactName.split(' ')[0]}, ` : 'Hi, '
  return `${greet}here is the quote for "${q.title}": ${formatMoney(q.total, q.currency)}${q.valid_until ? `, valid until ${q.valid_until}` : ''}. You can read it and accept it here: ${url}`
}
