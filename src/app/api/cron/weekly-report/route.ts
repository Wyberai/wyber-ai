import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { loadContacts } from '@/lib/crm/db'
import type { Contact } from '@/lib/crm/contact'
import { buildBrief } from '@/lib/crm/brief'
import { computeResults } from '@/lib/ops/agents/results'
import { buildSchedule, istDay } from '@/lib/ops/schedule'
import { growthSnapshot } from '@/lib/ops/marketing/snapshot'
import { topicsForWeek } from '@/lib/ops/marketing/calendar'
import { buildWeeklyReport } from '@/lib/ops/weekly-report'
import { sendWeeklyReport } from '@/lib/email'

export const maxDuration = 120

// Mondays (vercel.json): the week's report to the founder. Every part is best-effort, so a missing table
// leaves a line out instead of cancelling the report. Off with WEEKLY_REPORT_DISABLED=true. ?dry=1 sends nothing.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (process.env.WEEKLY_REPORT_DISABLED === 'true') return NextResponse.json({ skipped: true, reason: 'WEEKLY_REPORT_DISABLED' })

  const dry = req.nextUrl.searchParams.get('dry') === '1'
  const admin = await createAdminClient()
  const now = new Date()
  const today = istDay(now)

  let contacts: Contact[] = []
  try { contacts = await loadContacts(admin) } catch { /* report without the pipeline numbers */ }
  const brief = buildBrief(contacts, now)

  let signups = null
  try {
    const g = await growthSnapshot(admin, now, today)
    if (g.signups && g.pace) {
      const days = g.signups.per_day
      const sum = (a: { count: number }[]) => a.reduce((s, d) => s + d.count, 0)
      signups = { last7: sum(days.slice(-7)), prev7: sum(days.slice(-14, -7)), perDayAvg: g.last7_average, targetToday: g.pace.target, status: g.pace.status }
    }
  } catch { /* leave the signup section as unavailable */ }

  let agents = null, pendingDrafts = 0, unpaidQuotes = 0
  try {
    const since = new Date(now.getTime() - 30 * 86400_000).toISOString()
    const r = await admin.from('ops_agent_drafts').select('agent, status, edited, created_at').gte('created_at', since).limit(5000)
    if (!r.error) { const res = computeResults(r.data ?? [], now); agents = { totalMade: res.totalMade, totalUsed: res.totalUsed, useRate: res.useRate, hoursSaved: res.hoursSaved } }
    const pend = await admin.from('ops_agent_drafts').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    if (!pend.error) pendingDrafts = pend.count ?? 0
    const q = await admin.from('crm_quotes').select('id', { count: 'exact', head: true }).eq('status', 'accepted').is('paid_at', null)
    if (!q.error) unpaidQuotes = q.count ?? 0
  } catch { /* optional sections */ }

  const week = buildSchedule(today, 7, contacts)
  const report = buildWeeklyReport({
    today, signups,
    pipeline: { openCount: brief.openCount, openValueUsd: brief.openValueUsd, weightedUsd: brief.weightedUsd, wonMonthUsd: brief.wonMonthUsd, wonMonthCount: brief.wonMonthCount, newLast7: brief.newLast7, overdue: brief.overdue },
    agents, unpaidQuotes, pendingDrafts,
    nextWeek: { meetings: week.reduce((s, d) => s + d.meetings.length, 0), followUps: week.reduce((s, d) => s + d.followUps.length, 0), milestones: week.flatMap(d => d.milestones.map(m => `${d.label}: ${m}`)) },
    content: topicsForWeek(today).map(t => `${t.date}: ${t.topic}`),
  })
  if (dry) return NextResponse.json({ dry: true, ...report })

  try { await sendWeeklyReport(report) } catch (e) {
    console.error('[weekly-report] send failed:', e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false, error: 'send failed' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
