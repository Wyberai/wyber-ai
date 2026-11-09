import type { Incoming } from './upsert'

// How each system's records become CRM contacts. Pure mapping only; the
// queries live in db.ts. Sync NEVER moves an existing contact's stage, so the
// stage mapped here only applies the first time a person is seen.

const SEGMENT_FROM_AUDIENCE: Record<string, string> = {
  'software company': 'software', 'business owner': 'business', student: 'student',
}

export interface ExpoLeadRow {
  id: string; created_at: string; name: string; whatsapp: string; email: string | null; business: string | null
  audience: string | null; preferred_day: string | null; pain_point: string; source: string; status: string
}

const EXPO_STAGE: Record<string, string> = {
  new: 'new', contacted: 'contacted', meeting_booked: 'meeting_booked', met_at_booth: 'met', building: 'proposal', won: 'won', lost: 'lost',
}

export function expoLeadToIncoming(r: ExpoLeadRow): Incoming {
  const created = new Date(r.created_at).getTime()
  return {
    name: r.name, email: r.email, phone: r.whatsapp, company: r.business, country: 'India',
    segment: SEGMENT_FROM_AUDIENCE[(r.audience ?? '').toLowerCase()] ?? 'other',
    source: 'expo', source_ref: r.id,
    stage: EXPO_STAGE[r.status] ?? 'new',
    tags: ['expo', 'teg2026', ...(r.preferred_day && r.preferred_day !== 'Any day' ? [`day:${r.preferred_day.toLowerCase().replace(/\s+/g, '')}`] : [])],
    notes: `Pain point: ${r.pain_point || '(not given)'}${r.preferred_day ? ` (prefers ${r.preferred_day})` : ''} [source: ${r.source}]`,
    created_at: r.created_at,
    nextAction: 'Reply on WhatsApp and confirm a time',
    nextActionAt: new Date(created + 3600_000).toISOString(),
  }
}

export interface ConsultRow {
  id: string; attendee_name: string | null; attendee_email: string | null; scheduled_start: string | null
  status: string; converted: boolean | null; deal_value: number | null; notes: string | null; source: string | null
}

export function consultToIncoming(m: ConsultRow): Incoming | null {
  if (!m.attendee_email && !m.attendee_name) return null
  const when = m.scheduled_start
  let stage = 'meeting_booked'
  if (m.converted) stage = 'won'
  else if (m.status === 'completed') stage = 'met'
  else if (m.status === 'cancelled' || m.status === 'no_show') stage = 'nurture'
  const upcoming = stage === 'meeting_booked' && when
  return {
    name: m.attendee_name || (m.attendee_email ?? 'Consult booking'), email: m.attendee_email,
    source: 'consult', source_ref: m.id, stage, segment: 'other',
    tags: ['consult'],
    // deal_value has no recorded currency, so it is kept in the notes rather than guessed into USD.
    notes: [m.notes, m.deal_value ? `Recorded deal value: ${m.deal_value} (currency not recorded)` : null, m.source ? `Booked via ${m.source}` : null].filter(Boolean).join(' | ') || null,
    nextAction: upcoming ? 'Meeting' : null, nextActionAt: upcoming ? when : null,
  }
}

export interface ProfileRow { id: string; email: string | null; plan: string | null; country: string | null; created_at: string }

/** Only signups that did something are worth a CRM row; the rest would bury the queue. */
export function profileToIncoming(p: ProfileRow, activity: { built: boolean; published: boolean }): Incoming | null {
  const paid = !!p.plan && p.plan !== 'free'
  if (!p.email || (!activity.built && !paid)) return null
  const local = p.email.split('@')[0]
  return {
    name: local, email: p.email, country: p.country,
    source: paid || activity.built ? 'signup_built' : 'signup', source_ref: p.id,
    tags: ['signup', ...(activity.built ? ['built'] : []), ...(activity.published ? ['published'] : []), ...(paid ? ['paid'] : [])],
    created_at: p.created_at,
    nextAction: paid ? 'Check in: how is it going?' : 'Ask what they are building and offer to help',
  }
}
