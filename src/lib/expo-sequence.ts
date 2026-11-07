// Email sequence for Tech Expo Gujarat booth leads (27-29 Nov 2026).
//
// Four emails, all tied to the event and disclosed on the form:
//   confirmation  immediately after the request
//   reminder      the day before the day they chose (26 Nov for "Any day")
//   thanks        30 Nov, the day after the expo
//   followup      4 Dec, one last note
// Pure functions only (no I/O) so the timing rules are testable. The cron in
// /api/cron/expo-sequence and the form route call into this.

export type SeqKind = 'confirmation' | 'reminder' | 'thanks' | 'followup'
export const SEQ_ORDER: SeqKind[] = ['confirmation', 'reminder', 'thanks', 'followup']

export const EVENT_DAYS: Record<string, string> = {
  '27 Nov': '2026-11-27',
  '28 Nov': '2026-11-28',
  '29 Nov': '2026-11-29',
}
export const EVENT_START = '2026-11-27'
export const EVENT_END = '2026-11-29'
export const THANKS_FROM = '2026-11-30'
export const THANKS_UNTIL = '2026-12-15' // don't send a "thanks" weeks late
export const FOLLOWUP_FROM = '2026-12-04'
export const FOLLOWUP_UNTIL = '2026-12-20'

/** Statuses (from expo_leads.status) that mean "stop emailing about the expo". */
const STOP_ALL = new Set(['lost'])
const STOP_FOLLOWUP = new Set(['building', 'won', 'lost'])
const STOP_REMINDER = new Set(['met_at_booth', 'building', 'won', 'lost'])

export interface SeqLead {
  created_at: string
  email: string | null
  email_opt_out: boolean | null
  status: string
  preferred_day: string | null
}

/** YYYY-MM-DD in India Standard Time (UTC+5:30). */
export function istDate(d: Date): string {
  return new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10)
}

function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** The day they plan to come, or the whole expo window for "Any day". */
export function visitWindow(preferredDay: string | null): { reminderOn: string; lastDay: string } {
  const day = preferredDay ? EVENT_DAYS[preferredDay] : undefined
  if (day) return { reminderOn: addDays(day, -1), lastDay: day }
  return { reminderOn: addDays(EVENT_START, -1), lastDay: EVENT_END }
}

/**
 * The single next email this lead is due, or null. One at a time on purpose:
 * a lead who signed up late never gets two emails back to back from one run.
 * `sent` is the set of kinds already recorded for this lead.
 */
export function nextDueEmail(lead: SeqLead, sent: ReadonlySet<string>, now: Date = new Date()): SeqKind | null {
  if (!lead.email || lead.email_opt_out || STOP_ALL.has(lead.status)) return null

  const today = istDate(now)
  const created = istDate(new Date(lead.created_at))

  if (!sent.has('confirmation')) return 'confirmation'

  const { reminderOn, lastDay } = visitWindow(lead.preferred_day)
  if (
    !sent.has('reminder') &&
    !STOP_REMINDER.has(lead.status) &&
    created < reminderOn && // signed up the day itself? the confirmation already covers it
    today >= reminderOn &&
    today <= lastDay
  ) return 'reminder'

  if (!sent.has('thanks') && created <= EVENT_END && today >= THANKS_FROM && today <= THANKS_UNTIL) return 'thanks'

  if (
    !sent.has('followup') &&
    !STOP_FOLLOWUP.has(lead.status) &&
    created <= EVENT_END &&
    today >= FOLLOWUP_FROM &&
    today <= FOLLOWUP_UNTIL
  ) return 'followup'

  return null
}

export interface DeliverDeps {
  /** Inserts the claim row; returns false if it already exists (unique violation). */
  claim: (leadId: string, kind: SeqKind) => Promise<boolean>
  /** Removes the claim so a failed send is retried on the next run. */
  release: (leadId: string, kind: SeqKind) => Promise<void>
  send: (kind: SeqKind) => Promise<void>
}

/**
 * Claim-then-send: the unique (lead_id, kind) row is the lock, so a double
 * cron run or a form-submit racing the cron cannot send the same email twice.
 * A failed send releases the claim so it is retried next run.
 */
export async function deliver(leadId: string, kind: SeqKind, deps: DeliverDeps): Promise<'sent' | 'skipped' | 'failed'> {
  if (!(await deps.claim(leadId, kind))) return 'skipped'
  try {
    await deps.send(kind)
    return 'sent'
  } catch {
    try { await deps.release(leadId, kind) } catch { /* next run will see the claim and skip: log-worthy, not fatal */ }
    return 'failed'
  }
}
