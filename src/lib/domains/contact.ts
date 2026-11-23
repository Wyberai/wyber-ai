import type { ContactDetails } from './types'

const FIELDS: (keyof ContactDetails)[] = ['name', 'email', 'address1', 'city', 'state', 'zip', 'country', 'phoneCc', 'phone']

/** Registrant details the registry requires. Returns the cleaned contact or a message to show the person. */
export function parseContact(raw: unknown): { ok: true; contact: ContactDetails } | { ok: false; error: string } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const c = {} as ContactDetails
  for (const k of [...FIELDS, 'company'] as (keyof ContactDetails)[]) c[k] = String(r[k] ?? '').trim()
  const missing = FIELDS.filter(k => !c[k])
  if (missing.length) return { ok: false, error: `Please fill in: ${missing.join(', ')}` }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) return { ok: false, error: 'Enter a valid email address' }
  if (!/^[A-Za-z]{2}$/.test(c.country)) return { ok: false, error: 'Country must be a two-letter code, for example IN' }
  c.country = c.country.toUpperCase()
  c.phoneCc = c.phoneCc.replace(/\D/g, '')
  c.phone = c.phone.replace(/\D/g, '')
  if (c.phoneCc.length < 1 || c.phoneCc.length > 3) return { ok: false, error: 'Country calling code must be 1 to 3 digits' }
  if (c.phone.length < 4 || c.phone.length > 12) return { ok: false, error: 'Phone number must be 4 to 12 digits' }
  return { ok: true, contact: c }
}
