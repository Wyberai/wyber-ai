import type { Contact } from '@/lib/crm/contact'
import { buildBrief } from '@/lib/crm/brief'
import type { AgentId, Candidate, Lang } from './types'

// Which contacts each agent should work on right now. Pure: contacts, a clock and
// the set of drafts that already exist go in; candidates come out. Every agent
// is conservative on purpose: it only picks someone when there is a clear reason,
// and never the same person twice for the same reason.

const DAY = 86400_000
const dateKey = (iso: string | null | undefined) => (iso ?? '').slice(0, 10)

export const existingKey = (agent: AgentId, contactId: string | null, key: string) => `${agent}|${contactId ?? '-'}|${key}`

/** ISO-ish week key (year-week), enough to run the weekly coach once a week. */
export function weekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1)
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t.getTime() - yearStart) / DAY + 1) / 7)).padStart(2, '0')}`
}

/** The language to write in: the one their own notes are in, else English. */
export function chooseLang(c: Contact): Lang {
  const probe = `${c.notes ?? ''} ${c.tags.join(' ')}`
  if (/lang:gu|[઀-૿]/.test(probe)) return 'gu'
  if (/lang:hi|[ऀ-ॿ]/.test(probe)) return 'hi'
  return 'en'
}

const hasReach = (c: Contact) => !!(c.phone_norm || c.email)

export function selectOutreach(contacts: Contact[], have: Set<string>): Candidate[] {
  return contacts
    .filter(c => c.stage === 'new' && !c.last_touch_at && hasReach(c) && !have.has(existingKey('outreach', c.id, 'first')))
    .sort((a, b) => b.score - a.score)
    .map(c => ({ contact: c, key: 'first', reason: `New ${c.source} lead, score ${c.score}, not contacted`, activities: [] }))
}

export function selectFollowup(contacts: Contact[], now: Date, have: Set<string>): Candidate[] {
  const out: Candidate[] = []
  for (const c of contacts) {
    if (!['contacted', 'replied', 'proposal'].includes(c.stage) || !hasReach(c)) continue
    const last = new Date(c.last_touch_at ?? c.updated_at).getTime()
    const overdue = c.next_action_at ? new Date(c.next_action_at).getTime() <= now.getTime() : false
    const quietDays = (now.getTime() - last) / DAY
    // Contacted but silent for 3+ days, a reply we have not answered for 1+, or a promised action now due.
    const due = overdue || (c.stage === 'contacted' && quietDays >= 3) || (c.stage !== 'contacted' && quietDays >= 1)
    if (!due) continue
    const key = `touch:${dateKey(c.last_touch_at ?? c.updated_at)}`
    if (have.has(existingKey('followup', c.id, key))) continue
    out.push({ contact: c, key, reason: overdue ? `Promised action overdue: ${c.next_action ?? 'follow up'}` : `${Math.floor(quietDays)} days since last touch at "${c.stage}"`, activities: [] })
  }
  return out.sort((a, b) => b.contact!.score - a.contact!.score)
}

export function selectMeetingPrep(contacts: Contact[], now: Date, have: Set<string>): Candidate[] {
  const out: Candidate[] = []
  for (const c of contacts) {
    if (c.stage !== 'meeting_booked' || !c.next_action_at) continue
    const at = new Date(c.next_action_at).getTime()
    // From 48 hours before until the meeting starts.
    if (at < now.getTime() || at - now.getTime() > 2 * DAY) continue
    const key = `mtg:${dateKey(c.next_action_at)}`
    if (have.has(existingKey('meeting_prep', c.id, key))) continue
    out.push({ contact: c, key, reason: `Meeting on ${c.next_action_at}`, activities: [] })
  }
  return out.sort((a, b) => new Date(a.contact!.next_action_at!).getTime() - new Date(b.contact!.next_action_at!).getTime())
}

export function selectProposal(contacts: Contact[], have: Set<string>): Candidate[] {
  return contacts
    // Only once we have actually met, and there are notes to build a scope from.
    .filter(c => c.stage === 'met' && (c.notes ?? '').trim().length >= 20 && !have.has(existingKey('proposal', c.id, 'v1')))
    .sort((a, b) => b.score - a.score)
    .map(c => ({ contact: c, key: 'v1', reason: 'Met them; notes available; no proposal outline yet', activities: [] }))
}

export function selectWeeklyCoach(contacts: Contact[], now: Date, have: Set<string>): Candidate[] {
  const key = `week:${weekKey(now)}`
  if (have.has(existingKey('weekly_coach', null, key))) return []
  // Needs something to read.
  if (contacts.length < 3) return []
  const brief = buildBrief(contacts, now)
  return [{ contact: null, key, reason: 'Weekly pipeline read', activities: [], }].map(c => ({ ...c, activities: [{ kind: 'system', summary: brief.text, created_at: now.toISOString() }] }))
}

export function selectOnboarding(contacts: Contact[], have: Set<string>): Candidate[] {
  return contacts
    .filter(c => c.stage === 'won' && !have.has(existingKey('onboarding', c.id, 'kickoff')))
    .sort((a, b) => b.value_usd - a.value_usd)
    .map(c => ({ contact: c, key: 'kickoff', reason: 'Deal won; no kickoff checklist yet', activities: [] }))
}

const OPTED_OUT = /do not contact|don'?t contact|unsubscribe|stop messag|not interested|\bstop\b|\bdnd\b/i

/** Quiet 21+ days at a contacted, replied or parked stage; one nudge per contact per month; never someone who said no. */
export function selectReengage(contacts: Contact[], now: Date, have: Set<string>): Candidate[] {
  const out: Candidate[] = []
  const key = `re:${now.toISOString().slice(0, 7)}`
  for (const c of contacts) {
    if (!['contacted', 'replied', 'nurture'].includes(c.stage) || !hasReach(c)) continue
    if (OPTED_OUT.test(`${c.notes ?? ''} ${c.tags.join(' ')} ${c.lost_reason ?? ''}`)) continue
    const quietDays = (now.getTime() - new Date(c.last_touch_at ?? c.updated_at).getTime()) / DAY
    if (quietDays < 21 || have.has(existingKey('reengage', c.id, key))) continue
    out.push({ contact: c, key, reason: `${Math.floor(quietDays)} days since last touch at "${c.stage}"`, activities: [] })
  }
  return out.sort((a, b) => b.contact!.score - a.contact!.score)
}

export function selectContent(now: Date, have: Set<string>): Candidate[] {
  const key = `posts:${weekKey(now)}`
  return have.has(existingKey('content', null, key)) ? [] : [{ contact: null, key, reason: 'Weekly LinkedIn drafts', activities: [] }]
}
