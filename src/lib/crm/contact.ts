import type { Segment, Stage } from './stages'

// Shape of a crm_contacts row, plus normalisation helpers. Pure.

export interface Contact {
  id: string
  created_at: string
  updated_at: string
  name: string
  email: string | null
  phone: string | null
  phone_norm: string | null
  company: string | null
  title: string | null
  country: string | null
  segment: Segment
  source: string
  source_ref: string | null
  stage: Stage
  value_usd: number
  score: number
  tags: string[]
  next_action: string | null
  next_action_at: string | null
  last_touch_at: string | null
  closed_at: string | null
  lost_reason: string | null
  notes: string | null
}

/** Last 10 digits, so +91 98765 43210 and 098765-43210 match. */
export function normalizePhone(raw: string | null | undefined): string | null {
  const d = (raw ?? '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : null
}

export function normalizeEmail(raw: string | null | undefined): string | null {
  const e = (raw ?? '').trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null
}

// The founder's own and test addresses are never leads (standing rule).
const OWNED = ['hello@wyberai.com', 'sumeet.sutar@tryreconsignal.com', 'sumit.sutar259@gmail.com', 'reconsignal', 'continuum', 'vthaku89', 'signalpulsehq.com']
export function isOwnedEmail(email: string | null | undefined): boolean {
  const v = (email ?? '').toLowerCase()
  return !!v && (/@wyberai\.com$/.test(v) || OWNED.some(o => v.includes(o)))
}

/** Key used to find "the same person" across sources: email first, then phone. */
export function matchKeys(c: { email?: string | null; phone?: string | null }): { email: string | null; phone: string | null } {
  return { email: normalizeEmail(c.email), phone: normalizePhone(c.phone) }
}
