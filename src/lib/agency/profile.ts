import type { Db } from './access'
import { isCurrency } from './quote'

// The business behind a client: the workspace's profile when the client belongs to one, otherwise the owner's own.
// It is what the client sees on their page, quotes and emails.

export interface AgencyProfile {
  business_name: string | null
  logo_url: string | null
  website: string | null
  support_email: string | null
  phone: string | null
  address: string | null
  tax_label: string | null
  tax_id: string | null
  default_currency: string | null
  default_payment_instructions: string | null
  default_terms: string | null
}

export const PROFILE_COLUMNS =
  'business_name, logo_url, website, support_email, phone, address, tax_label, tax_id, default_currency, default_payment_instructions, default_terms'

export async function loadAgencyProfile(db: Db, client: { owner_id: string; org_id: string | null }): Promise<AgencyProfile | null> {
  const q = client.org_id
    ? db.from('agency_profiles').select(PROFILE_COLUMNS).eq('org_id', client.org_id)
    : db.from('agency_profiles').select(PROFILE_COLUMNS).eq('owner_id', client.owner_id)
  const { data } = await q.maybeSingle()
  return (data as AgencyProfile | null) ?? null
}

/** The few fields a client may see: contact details, never the defaults the freelancer keeps for their own use. */
export function publicProfile(p: AgencyProfile | null) {
  if (!p) return null
  return {
    business_name: p.business_name, logo_url: p.logo_url, website: p.website, support_email: p.support_email,
    phone: p.phone, address: p.address, tax_label: p.tax_label, tax_id: p.tax_id,
  }
}

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/

function text(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null
  if (typeof v !== 'string') return null
  const s = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max)
  return s || null
}

function httpsUrl(v: unknown): { ok: true; url: string | null } | { ok: false } {
  if (v === null || v === undefined || v === '') return { ok: true, url: null }
  if (typeof v !== 'string' || v.length > 500) return { ok: false }
  try {
    const u = new URL(v.trim().startsWith('http') ? v.trim() : `https://${v.trim()}`)
    if (u.protocol !== 'https:' || u.username || u.password) return { ok: false }
    return { ok: true, url: u.toString() }
  } catch { return { ok: false } }
}

/** Checks and trims what a freelancer typed. Only known fields get through. */
export function validateProfile(input: unknown): { ok: true; profile: AgencyProfile } | { ok: false; error: string } {
  const r = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const logo = httpsUrl(r.logo_url)
  if (!logo.ok) return { ok: false, error: 'The logo link must be an https address' }
  const site = httpsUrl(r.website)
  if (!site.ok) return { ok: false, error: 'The website must be a web address' }
  const email = text(r.support_email, 200)
  if (email && !EMAIL.test(email)) return { ok: false, error: 'That support email does not look right' }
  const cur = text(r.default_currency, 3)
  if (cur && !isCurrency(cur)) return { ok: false, error: 'Unsupported currency' }
  return {
    ok: true,
    profile: {
      business_name: text(r.business_name, 120), logo_url: logo.url, website: site.url, support_email: email,
      phone: text(r.phone, 40), address: text(r.address, 400), tax_label: text(r.tax_label, 30), tax_id: text(r.tax_id, 40),
      default_currency: cur, default_payment_instructions: text(r.default_payment_instructions, 1000), default_terms: text(r.default_terms, 2000),
    },
  }
}
