import { describe, it, expect } from 'vitest'
import { buildWeeklyReport, type WeeklyInput } from './weekly-report'

const base: WeeklyInput = {
  today: '2026-11-16',
  signups: { last7: 14, prev7: 10, perDayAvg: 2, targetToday: 5, status: 'behind' },
  pipeline: { openCount: 12, openValueUsd: 48000, weightedUsd: 15200, wonMonthUsd: 3000, wonMonthCount: 1, newLast7: 9, overdue: 3 },
  agents: { totalMade: 40, totalUsed: 30, useRate: 0.75, hoursSaved: 5.2 },
  unpaidQuotes: 1, pendingDrafts: 6,
  nextWeek: { meetings: 2, followUps: 11, milestones: ['Friday 27 November: Tech Expo Gujarat day 1 at booth S23.'] },
  content: ['2026-11-16: Orders that arrive on WhatsApp and get lost'],
}

describe('buildWeeklyReport', () => {
  it('reports signups against the ramp, with the week-on-week change', () => {
    const r = buildWeeklyReport(base)
    expect(r.text).toContain('14 signups in the last 7 days (2 a day), up 40% on the week before.')
    expect(r.text).toContain('needs 5 a day by now, so we are behind the ramp')
    expect(r.subject).toBe('Weekly report: 14 signups (behind the ramp), $3,000 won this month')
  })
  it('says what needs attention and what is waiting, with correct plurals', () => {
    const t = buildWeeklyReport(base).text
    expect(t).toContain('3 follow-ups are overdue')
    expect(t).toContain('1 accepted quote is not paid yet')
    expect(t).toContain('6 drafts are waiting')
    const one = buildWeeklyReport({ ...base, pipeline: { ...base.pipeline, overdue: 1, wonMonthCount: 1 }, pendingDrafts: 1 }).text
    expect(one).toContain('1 follow-up is overdue')
    expect(one).toContain('1 draft is waiting')
  })
  it('does not shout about nothing: no overdue, unpaid or pending lines when there are none', () => {
    const t = buildWeeklyReport({ ...base, pipeline: { ...base.pipeline, overdue: 0 }, unpaidQuotes: 0, pendingDrafts: 0 }).text
    expect(t).not.toMatch(/overdue|not paid|waiting for your approval/)
  })
  it('handles week-on-week edge cases: no signups either week, first week with signups, a drop', () => {
    expect(buildWeeklyReport({ ...base, signups: { ...base.signups!, last7: 0, prev7: 0 } }).text).toContain('no signups in either week')
    expect(buildWeeklyReport({ ...base, signups: { ...base.signups!, last7: 3, prev7: 0 } }).text).toContain('up from none the week before')
    expect(buildWeeklyReport({ ...base, signups: { ...base.signups!, last7: 5, prev7: 10 } }).text).toContain('down 50% on the week before')
    expect(buildWeeklyReport({ ...base, signups: { ...base.signups!, last7: 10, prev7: 10 } }).text).toContain('the same as the week before')
  })
  it('degrades honestly when parts are unavailable: no invented numbers', () => {
    const r = buildWeeklyReport({ ...base, signups: null, agents: null })
    expect(r.text).toContain('Signup numbers could not be read this week.')
    expect(r.text).toContain('have not written any drafts yet')
    expect(r.subject).toBe('Weekly report: $3,000 won this month, 3 overdue')
  })
  it('lists the week ahead: meetings, follow-ups, expo dates and the content topics', () => {
    const t = buildWeeklyReport(base).text
    expect(t).toContain('2 meetings and 11 follow-ups scheduled.')
    expect(t).toContain('Tech Expo Gujarat day 1')
    expect(t).toContain('Orders that arrive on WhatsApp and get lost')
  })
})
