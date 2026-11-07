import type { Contact } from './contact'
import { ACTIVE_STAGES, isOpen } from './stages'

// "Who should I contact today?" Pure: give it contacts and a clock, get an
// ordered list with the reason each one is there. Reasons are plain sentences
// shown on the page, so a row can always be explained and argued with.

export interface QueueItem {
  contactId: string
  name: string
  reason: string
  priority: number
}

const HOUR = 3600_000
const DAY = 24 * HOUR
/** Hot inbound leads (expo, consult) should get a reply within this many hours. */
export const REPLY_SLA_HOURS = 4
export const QUIET_DAYS = 7
/**
 * A cold list (Apollo, a WhatsApp sheet) scores in the 40s and would bury real
 * inbound leads, so it only surfaces unprompted above this bar. Inbound leads
 * (expo, consult, built-something signups) score well above it.
 */
export const COLD_LEAD_MIN_SCORE = 55
const HOT_SOURCES = new Set(['expo', 'consult', 'referral'])

/** End of the current day in India Standard Time, as epoch ms. */
export function endOfTodayIst(now: Date): number {
  const ist = new Date(now.getTime() + 5.5 * HOUR)
  const end = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + 1) - 5.5 * HOUR
  return end
}

export function todayQueue(contacts: Contact[], now: Date = new Date(), limit = 25): QueueItem[] {
  const t = now.getTime()
  const eod = endOfTodayIst(now)
  const out: QueueItem[] = []

  for (const c of contacts) {
    if (!isOpen(c.stage)) continue
    const half = c.score / 2
    const due = c.next_action_at ? new Date(c.next_action_at).getTime() : null
    let item: QueueItem | null = null

    // 1. A promised next action that is now overdue.
    if (due !== null && due <= t) {
      const hrs = Math.min(48, Math.round((t - due) / HOUR))
      item = { contactId: c.id, name: c.name, reason: `Overdue${hrs ? ` by ${hrs}h` : ''}: ${c.next_action || 'follow up'}`, priority: 100 + hrs + half }
    }
    // 2. A hot inbound lead nobody has touched yet.
    else if (c.stage === 'new' && HOT_SOURCES.has(c.source) && !c.last_touch_at) {
      const age = (t - new Date(c.created_at).getTime()) / HOUR
      if (age >= 1) {
        const breached = age >= REPLY_SLA_HOURS
        item = { contactId: c.id, name: c.name, reason: `${breached ? `Reply overdue (${REPLY_SLA_HOURS}h SLA)` : 'New hot lead'}: ${c.source}, ${Math.round(age)}h old, no reply yet`, priority: (breached ? 120 : 90) + Math.min(24, age) + half }
      }
    }
    // 3. A next action due later today.
    else if (due !== null && due <= eod) {
      item = { contactId: c.id, name: c.name, reason: `Due today: ${c.next_action || 'follow up'}`, priority: 80 + half }
    }
    // 4. An active deal that has gone quiet.
    else if (ACTIVE_STAGES.includes(c.stage)) {
      const last = new Date(c.last_touch_at ?? c.updated_at).getTime()
      const quiet = (t - last) / DAY
      if (quiet >= QUIET_DAYS) item = { contactId: c.id, name: c.name, reason: `Gone quiet ${Math.floor(quiet)} days at "${c.stage}"`, priority: 40 + half }
    }
    // 5. A strong cold lead nobody has contacted.
    else if (c.stage === 'new' && !c.last_touch_at && c.score >= COLD_LEAD_MIN_SCORE) {
      item = { contactId: c.id, name: c.name, reason: `Strong lead, not contacted yet (score ${c.score})`, priority: 20 + half }
    }

    if (item) out.push(item)
  }

  return out.sort((a, b) => b.priority - a.priority).slice(0, limit)
}
