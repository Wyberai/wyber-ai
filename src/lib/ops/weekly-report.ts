// The Monday report: what changed last week and what the coming week holds. Plain
// text, built from numbers the dashboard already has. Pure: data in, words out.

export interface WeeklyInput {
  today: string // YYYY-MM-DD
  signups: { last7: number; prev7: number; perDayAvg: number; targetToday: number; status: 'ahead' | 'on_track' | 'behind' } | null
  pipeline: { openCount: number; openValueUsd: number; weightedUsd: number; wonMonthUsd: number; wonMonthCount: number; newLast7: number; overdue: number }
  agents: { totalMade: number; totalUsed: number; useRate: number | null; hoursSaved: number } | null
  unpaidQuotes: number
  pendingDrafts: number
  nextWeek: { meetings: number; followUps: number; milestones: string[] }
  content: string[] // topics for the week
}

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const pct = (n: number) => `${Math.round(n * 100)}%`

function trend(now: number, before: number): string {
  if (!before && !now) return 'no signups in either week'
  if (!before) return `up from none the week before`
  const d = Math.round(((now - before) / before) * 100)
  return d === 0 ? 'the same as the week before' : `${d > 0 ? 'up' : 'down'} ${Math.abs(d)}% on the week before`
}

export function buildWeeklyReport(i: WeeklyInput): { subject: string; text: string } {
  const L: string[] = []
  const verdict = i.signups ? ({ ahead: 'ahead of the ramp', on_track: 'on track', behind: 'behind the ramp' } as const)[i.signups.status] : null

  L.push('SIGNUPS')
  if (!i.signups) L.push('Signup numbers could not be read this week.')
  else {
    L.push(`${i.signups.last7} signups in the last 7 days (${i.signups.perDayAvg} a day), ${trend(i.signups.last7, i.signups.prev7)}.`)
    L.push(`The ramp needs ${i.signups.targetToday} a day by now, so we are ${verdict}. The goal is 100 a day.`)
  }

  L.push('', 'PIPELINE')
  const p = i.pipeline
  L.push(`${p.openCount} open deals worth ${usd(p.openValueUsd)} (${usd(p.weightedUsd)} weighted). ${p.newLast7} new leads this week.`)
  L.push(`Won this month: ${usd(p.wonMonthUsd)} across ${p.wonMonthCount} deal${p.wonMonthCount === 1 ? '' : 's'}. Target for the year: $5,000,000.`)
  if (p.overdue) L.push(`${p.overdue} follow-up${p.overdue === 1 ? ' is' : 's are'} overdue. Start there.`)
  if (i.unpaidQuotes) L.push(`${i.unpaidQuotes} accepted quote${i.unpaidQuotes === 1 ? ' is' : 's are'} not paid yet.`)

  L.push('', 'AGENTS')
  if (!i.agents || !i.agents.totalMade) L.push('The agents have not written any drafts yet.')
  else L.push(`${i.agents.totalMade} drafts written in 30 days, ${i.agents.totalUsed} used${i.agents.useRate !== null ? ` (${pct(i.agents.useRate)} of those you decided on)` : ''}. Estimated time saved: about ${i.agents.hoursSaved} hours.`)
  if (i.pendingDrafts) L.push(`${i.pendingDrafts} draft${i.pendingDrafts === 1 ? ' is' : 's are'} waiting for your approval.`)

  L.push('', 'THIS WEEK')
  const w = i.nextWeek
  L.push(`${w.meetings} meeting${w.meetings === 1 ? '' : 's'} and ${w.followUps} follow-up${w.followUps === 1 ? '' : 's'} scheduled.`)
  for (const m of w.milestones) L.push(`- ${m}`)
  if (i.content.length) { L.push('Content topics for the week:'); for (const c of i.content) L.push(`- ${c}`) }

  const subject = i.signups
    ? `Weekly report: ${i.signups.last7} signups (${verdict}), ${usd(p.wonMonthUsd)} won this month`
    : `Weekly report: ${usd(p.wonMonthUsd)} won this month, ${p.overdue} overdue`
  return { subject, text: L.join('\n') }
}
