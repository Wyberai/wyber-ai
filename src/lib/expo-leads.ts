// Helpers for Tech Expo Gujarat booth leads (see /api/expo-lead).
import { decodeAttribution } from '@/lib/signup-attribution'

/** Last 10 digits of a phone number, so +91 98765 43210 == 09876543210. */
export function normalizePhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '')
  return digits.slice(-10)
}

export const LEAD_STATUSES = ['new', 'contacted', 'meeting_booked', 'met_at_booth', 'building', 'won', 'lost'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

/**
 * The form sends utm_source / utm_campaign it read from the URL. If the
 * visitor arrived on another page first (or the params were dropped by an
 * in-app browser), fall back to the first-touch cookie from signup-attribution.
 */
export function resolveLeadSource(formSource: string | null | undefined, attrCookie: string | null | undefined): {
  source: string
  utmSource: string | null
  utmCampaign: string | null
} {
  const attr = decodeAttribution(attrCookie)
  const form = (formSource || '').trim()
  if (form && form !== 'direct') {
    const [src, camp] = form.split('/').map(s => s.trim())
    return { source: form.slice(0, 80), utmSource: src || null, utmCampaign: camp || attr?.campaign || null }
  }
  if (attr) {
    return { source: [attr.source, attr.campaign].filter(Boolean).join(' / ').slice(0, 80), utmSource: attr.source, utmCampaign: attr.campaign }
  }
  return { source: 'direct', utmSource: null, utmCampaign: null }
}
