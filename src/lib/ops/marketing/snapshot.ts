import { summarizeSignups, runTool, type Admin } from '@/lib/ops/ask/tools'
import { CHANNELS, DAILY_TARGET, RAMP, pace, planTotal } from './growth'
import { piecesOn } from './calendar'

// One object with everything the growth page and the Ask assistant need.
export async function growthSnapshot(admin: Admin, now: Date, today: string) {
  const s = await runTool(admin, 'signups', { days: 14 }, now) as ReturnType<typeof summarizeSignups> | { error: string }
  const signups = 'error' in s ? null : s
  // Last 7 days average, so one quiet day does not swing the verdict.
  const last7 = signups ? signups.per_day.slice(-7) : []
  const avg7 = last7.length ? Math.round((last7.reduce((a, d) => a + d.count, 0) / last7.length) * 10) / 10 : 0
  return {
    today, goal_per_day: DAILY_TARGET, signups, signups_error: 'error' in s ? s.error : null,
    last7_average: avg7, pace: signups ? pace(avg7, today) : null,
    ramp: RAMP, today_content: piecesOn(today), channels: CHANNELS, channels_plan_total: planTotal(),
  }
}
