import type { Contact } from '@/lib/crm/contact'
import { buildBrief } from '@/lib/crm/brief'
import { isOptedOut } from '@/lib/crm/patch'
import { topicsForWeek } from '@/lib/ops/marketing/calendar'
import { emailDomain } from './prompts'
import { istDay } from '@/lib/ops/schedule'
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

// Someone who asked us to stop is never written to by any agent.
const hasReach = (c: Contact) => !!(c.phone_norm || c.email) && !isOptedOut(c)

export function selectOutreach(contacts: Contact[], have: Set<string>): Candidate[] {
  return contacts
    .filter(c => c.stage === 'new' && !c.last_touch_at && hasReach(c) && !have.has(existingKey('outreach', c.id, 'first')))
    .sort((a, b) => b.score - a.score)
    .map(c => ({ contact: c, key: 'first', reason: `New ${c.source} lead, score ${c.score}, not contacted`, activities: [] }))
}

export function selectFollowup(contacts: Contact[], now: Date, have: Set<string>): Candidate[] {
  const out: Candidate[] = []
  for (const c of contacts) {
    // Booth leads sit at "met": they get a thank-you follow-up too, once a day has passed.
    const boothLead = c.stage === 'met' && c.tags.includes('booth')
    if (!(['contacted', 'replied', 'proposal'].includes(c.stage) || boothLead) || !hasReach(c)) continue
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


/** Quiet 21+ days at a contacted, replied or parked stage; one nudge per contact per month; never someone who said no. */
export function selectReengage(contacts: Contact[], now: Date, have: Set<string>): Candidate[] {
  const out: Candidate[] = []
  const key = `re:${now.toISOString().slice(0, 7)}`
  for (const c of contacts) {
    if (!['contacted', 'replied', 'nurture'].includes(c.stage) || !hasReach(c)) continue
    const quietDays = (now.getTime() - new Date(c.last_touch_at ?? c.updated_at).getTime()) / DAY
    if (quietDays < 21 || have.has(existingKey('reengage', c.id, key))) continue
    out.push({ contact: c, key, reason: `${Math.floor(quietDays)} days since last touch at "${c.stage}"`, activities: [] })
  }
  return out.sort((a, b) => b.contact!.score - a.contact!.score)
}

/** Leads worth looking up: still open, we know what business they are (a company name or a business email), and no research yet. */
export function selectResearch(contacts: Contact[], have: Set<string>): Candidate[] {
  return contacts
    .filter(c => ['new', 'contacted', 'replied', 'meeting_booked'].includes(c.stage) && !isOptedOut(c)
      && !!((c.company ?? '').trim() || emailDomain(c.email)) && !have.has(existingKey('research', c.id, 'v1')))
    .sort((a, b) => b.score - a.score)
    .map(c => ({ contact: c, key: 'v1', reason: `Open lead (${c.stage}), score ${c.score}; no research yet`, activities: [] }))
}

export function selectContent(now: Date, have: Set<string>): Candidate[] {
  const key = `posts:${weekKey(now)}`
  if (have.has(existingKey('content', null, key))) return []
  // The next three days from the content calendar are what this week's posts are about.
  const topics = topicsForWeek(istDay(now)).slice(0, 3)
  const summary = topics.length
    ? topics.map((t, i) => `Post ${i + 1} (for ${t.date}): topic "${t.topic}". Opening line idea: "${t.hook}"`).join('\n')
    : 'No topics scheduled. Write three posts about common business problems that custom software solves.'
  return [{ contact: null, key, reason: 'Weekly LinkedIn drafts', activities: [{ kind: 'system', summary, created_at: now.toISOString() }] }]
}

/** The few quote fields the collections agent needs. */
export interface QuoteLite { id: string; contact_id: string | null; title: string; status: string; accepted_at: string | null; paid_at: string | null }

export const MAX_PAYMENT_REMINDERS = 3

/**
 * Accepted quotes with no payment recorded, 3+ days after acceptance: one reminder a week, at most three per quote.
 * The amount is never given to the model, so a reminder can never state or invent one.
 */
export function selectCollections(contacts: Contact[], quotes: QuoteLite[], now: Date, have: Set<string>): Candidate[] {
  const byId = new Map(contacts.map(c => [c.id, c]))
  const out: Candidate[] = []
  for (const q of quotes) {
    if (q.status !== 'accepted' || q.paid_at || !q.accepted_at || !q.contact_id) continue
    const c = byId.get(q.contact_id)
    if (!c || !hasReach(c)) continue
    const days = Math.floor((now.getTime() - new Date(q.accepted_at).getTime()) / DAY)
    if (days < 3) continue
    const prefix = `collections|${c.id}|pay:${q.id}:`
    const sent = [...have].filter(k => k.startsWith(prefix)).length
    if (sent >= MAX_PAYMENT_REMINDERS) continue
    const key = `pay:${q.id}:${weekKey(now)}`
    if (have.has(existingKey('collections', c.id, key))) continue
    out.push({
      contact: c, key, reason: `Quote accepted ${days} days ago, no payment recorded (reminder ${sent + 1} of ${MAX_PAYMENT_REMINDERS})`,
      activities: [{ kind: 'system', summary: `Quote "${q.title}" was accepted ${days} days ago. No payment has been recorded yet. This is reminder number ${sent + 1}.`, created_at: q.accepted_at }],
    })
  }
  return out.sort((a, b) => a.activities[0].created_at.localeCompare(b.activities[0].created_at)) // oldest acceptance first
}

export async function loadAcceptedQuotes(admin: { from: (t: string) => any }): Promise<QuoteLite[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.from('crm_quotes').select('id, contact_id, title, status, accepted_at, paid_at').eq('status', 'accepted')
  if (error) return [] // fail soft: before the migration there is no paid_at column, and nothing to remind about
  return (data ?? []) as QuoteLite[]
}
