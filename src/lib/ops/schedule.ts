import type { Contact } from '@/lib/crm/contact'
import { EXPO } from '@/lib/ops/facts'

// "What is going to happen on this day?" Everything that runs by itself, everything
// that is due from you, and the dated milestones, for any day, in India time. Pure.

export interface Job { path: string; cron: string; name: string; what: string; touchesCustomers: boolean }

/** Every scheduled job in vercel.json. A test fails if one is added there and not described here. */
export const JOBS: Job[] = [
  { path: '/api/cron/daily-credits', cron: '0 0 * * *', name: 'Daily free credits', what: 'Tops up daily credits for signed-up users.', touchesCustomers: true },
  { path: '/api/cron/agent-scheduler', cron: '* * * * *', name: 'Agent scheduler', what: 'Runs customers\' scheduled automations as they come due.', touchesCustomers: true },
  { path: '/api/cron/mcp-consumer', cron: '* * * * *', name: 'MCP queue', what: 'Processes requests arriving through the Claude connector.', touchesCustomers: true },
  { path: '/api/cron/employee-scheduler', cron: '*/15 * * * *', name: 'AI employee scheduler', what: 'Runs customers\' AI employees on their schedules.', touchesCustomers: true },
  { path: '/api/cron/weekly-digest', cron: '0 9 * * 1', name: 'Weekly digest email', what: 'Sends users their weekly summary email.', touchesCustomers: true },
  { path: '/api/cron/email-drip', cron: '30 10 * * *', name: 'Lifecycle emails', what: 'Sends the onboarding and nudge emails to users who are due one.', touchesCustomers: true },
  { path: '/api/cron/expo-sequence', cron: '30 4 * * *', name: 'Expo email sequence', what: 'Sends the next expo email (reminder, thanks or follow-up) to booth leads who are due one.', touchesCustomers: true },
  { path: '/api/cron/crm-brief', cron: '0 3 * * *', name: 'Daily revenue brief', what: 'Refreshes the CRM from every source, then emails you the brief with drafts waiting and unpaid quotes.', touchesCustomers: false },
  { path: '/api/cron/ops-agents', cron: '15 */3 * * *', name: 'Company agents', what: 'The agents write new drafts for your approval. Nothing is sent.', touchesCustomers: false },
  { path: '/api/cron/security-rescan', cron: '0 3 * * *', name: 'Security rescan', what: 'Re-checks published apps for security problems.', touchesCustomers: true },
  { path: '/api/cron/consultation-reminders', cron: '*/15 * * * *', name: 'Consultation reminders', what: 'Reminds people about consultation calls they booked.', touchesCustomers: true },
  { path: '/api/cron/wpl-monthly-reminder', cron: '0 6 28-31 * *', name: 'Premier League reminder', what: 'Month-end reminder for the monthly contest.', touchesCustomers: true },
]

// ── a small cron matcher (minute hour day-of-month month day-of-week; * , - / supported) ──
function field(spec: string, min: number, max: number): Set<number> {
  const out = new Set<number>()
  for (const part of spec.split(',')) {
    const [range, stepRaw] = part.split('/')
    const step = stepRaw ? Number(stepRaw) : 1
    let lo = min, hi = max
    if (range !== '*') { const [a, b] = range.split('-'); lo = Number(a); hi = b === undefined ? (stepRaw ? max : lo) : Number(b) }
    for (let v = lo; v <= hi; v += step) out.add(v)
  }
  return out
}

export function cronMatches(cron: string, at: Date): boolean {
  const [mi, h, dom, mon, dow] = cron.trim().split(/\s+/)
  if (!field(mi, 0, 59).has(at.getUTCMinutes()) || !field(h, 0, 23).has(at.getUTCHours()) || !field(mon, 1, 12).has(at.getUTCMonth() + 1)) return false
  const domOk = field(dom, 1, 31).has(at.getUTCDate()), dowOk = field(dow, 0, 6).has(at.getUTCDay())
  return dom !== '*' && dow !== '*' ? domOk || dowOk : domOk && dowOk
}

const IST_MS = 5.5 * 3600_000
export const istDay = (d: Date) => new Date(d.getTime() + IST_MS).toISOString().slice(0, 10)
const fmtIst = (d: Date) => new Date(d.getTime() + IST_MS).toISOString().slice(11, 16)

/** The UTC instants an India calendar day covers. */
function istDayRange(date: string): { start: number; end: number } {
  const start = new Date(`${date}T00:00:00Z`).getTime() - IST_MS
  return { start, end: start + 86400_000 }
}

export interface JobRun { name: string; what: string; touchesCustomers: boolean; frequency: 'continuous' | 'times'; times: string[]; count: number }

export function jobsOn(date: string): JobRun[] {
  const { start, end } = istDayRange(date)
  const out: JobRun[] = []
  for (const j of JOBS) {
    const times: string[] = []
    for (let t = start; t < end; t += 60_000) if (cronMatches(j.cron, new Date(t))) times.push(fmtIst(new Date(t)))
    if (!times.length) continue
    out.push({ name: j.name, what: j.what, touchesCustomers: j.touchesCustomers, frequency: times.length > 24 ? 'continuous' : 'times', times: times.length > 24 ? [] : times, count: times.length })
  }
  return out.sort((a, b) => (a.times[0] ?? '00:00').localeCompare(b.times[0] ?? '00:00') || a.name.localeCompare(b.name))
}

/** Dated things that are decided in code (expo sequence dates, the expo itself). */
export const MILESTONES: { date: string; text: string }[] = [
  { date: '2026-11-26', text: 'Expo reminder emails go to leads who chose a day, or "Any day".' },
  { date: EXPO.start, text: `${EXPO.name} day 1 at booth ${EXPO.booth}. Use Booth capture on your phone.` },
  { date: '2026-11-28', text: `${EXPO.name} day 2 at booth ${EXPO.booth}.` },
  { date: EXPO.end, text: `${EXPO.name} day 3 at booth ${EXPO.booth}. Last day.` },
  { date: '2026-11-30', text: 'Expo "thanks" emails start going out to booth leads.' },
  { date: '2026-12-04', text: 'Expo follow-up emails start going out (one last note).' },
]

export interface DueItem { name: string; what: string; at: string; stage: string }

export function dueOn(contacts: Contact[], date: string): { followUps: DueItem[]; meetings: DueItem[]; overdue: number } {
  const { start, end } = istDayRange(date)
  const followUps: DueItem[] = [], meetings: DueItem[] = []
  let overdue = 0
  const openStages = ['new', 'contacted', 'replied', 'meeting_booked', 'met', 'proposal']
  for (const c of contacts) {
    if (!c.next_action_at || !openStages.includes(c.stage)) continue
    const t = new Date(c.next_action_at).getTime()
    if (t < start && date === istDay(new Date())) overdue++
    if (t < start || t >= end) continue
    const item = { name: c.name, what: c.next_action ?? 'Follow up', at: fmtIst(new Date(t)), stage: c.stage }
    ;(c.stage === 'meeting_booked' ? meetings : followUps).push(item)
  }
  const byTime = (a: DueItem, b: DueItem) => a.at.localeCompare(b.at)
  return { followUps: followUps.sort(byTime), meetings: meetings.sort(byTime), overdue }
}

export interface DaySchedule { date: string; label: string; jobs: JobRun[]; milestones: string[]; followUps: DueItem[]; meetings: DueItem[]; overdue: number }

export function buildDay(date: string, contacts: Contact[]): DaySchedule {
  const due = dueOn(contacts, date)
  return {
    date,
    label: new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }),
    jobs: jobsOn(date),
    milestones: MILESTONES.filter(m => m.date === date).map(m => m.text),
    followUps: due.followUps, meetings: due.meetings, overdue: due.overdue,
  }
}

/** `days` consecutive India days starting at `from` (YYYY-MM-DD). */
export function buildSchedule(from: string, days: number, contacts: Contact[]): DaySchedule[] {
  const n = Math.min(14, Math.max(1, Math.floor(days)))
  return Array.from({ length: n }, (_, i) => buildDay(new Date(new Date(`${from}T00:00:00Z`).getTime() + i * 86400_000).toISOString().slice(0, 10), contacts))
}
