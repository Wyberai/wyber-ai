import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { JOBS, cronMatches, jobsOn, dueOn, buildSchedule, istDay } from './schedule'
import type { Contact } from '@/lib/crm/contact'

const c = (o: Partial<Contact> = {}): Contact => ({
  id: 'x', created_at: '', updated_at: '', name: 'Asha', email: null, phone: null, phone_norm: null, company: null, title: null, country: null, segment: 'business',
  source: 'expo', source_ref: null, stage: 'contacted', value_usd: 0, score: 50, tags: [], next_action: 'Send demo link', next_action_at: null, last_touch_at: null,
  closed_at: null, lost_reason: null, notes: null, ...o,
})

describe('JOBS registry', () => {
  it('describes every cron in vercel.json, with the same schedule, and nothing that is not there', () => {
    const vercel = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as { crons: { path: string; schedule: string }[] }
    const real = new Map(vercel.crons.map(x => [x.path, x.schedule]))
    for (const [path, schedule] of real) {
      const job = JOBS.find(j => j.path === path)
      expect(job, `vercel.json has ${path} but schedule.ts does not describe it`).toBeTruthy()
      expect(job!.cron, `schedule for ${path} differs`).toBe(schedule)
    }
    for (const j of JOBS) expect(real.has(j.path), `${j.path} is described but not in vercel.json`).toBe(true)
  })
})

describe('cronMatches', () => {
  const t = (iso: string) => new Date(iso)
  it('handles numbers, steps, lists, ranges and weekdays', () => {
    expect(cronMatches('0 3 * * *', t('2026-11-10T03:00:00Z'))).toBe(true)
    expect(cronMatches('0 3 * * *', t('2026-11-10T03:01:00Z'))).toBe(false)
    expect(cronMatches('15 */3 * * *', t('2026-11-10T06:15:00Z'))).toBe(true)
    expect(cronMatches('15 */3 * * *', t('2026-11-10T07:15:00Z'))).toBe(false)
    expect(cronMatches('*/15 * * * *', t('2026-11-10T07:45:00Z'))).toBe(true)
    expect(cronMatches('0 9 * * 1', t('2026-11-09T09:00:00Z'))).toBe(true) // a Monday
    expect(cronMatches('0 9 * * 1', t('2026-11-10T09:00:00Z'))).toBe(false)
    expect(cronMatches('0 6 28-31 * *', t('2026-11-30T06:00:00Z'))).toBe(true)
    expect(cronMatches('0 6 28-31 * *', t('2026-11-27T06:00:00Z'))).toBe(false)
  })
})

describe('jobsOn (an India day, shown in India time)', () => {
  it('lists daily jobs once at the right local time and busy jobs as continuous', () => {
    const jobs = jobsOn('2026-11-10')
    const brief = jobs.find(j => j.name === 'Daily revenue brief')!
    expect(brief.times).toEqual(['08:30']) // 03:00 UTC
    const expo = jobs.find(j => j.name === 'Expo email sequence')!
    expect(expo.times).toEqual(['10:00']) // 04:30 UTC
    expect(jobs.find(j => j.name === 'Agent scheduler')).toMatchObject({ frequency: 'continuous', times: [] })
    expect(jobs.find(j => j.name === 'Company agents')!.times).toHaveLength(8)
  })
  it('weekly and month-end jobs appear only on their days', () => {
    expect(jobsOn('2026-11-09').some(j => j.name === 'Weekly digest email')).toBe(true) // Monday
    expect(jobsOn('2026-11-10').some(j => j.name === 'Weekly digest email')).toBe(false)
    expect(jobsOn('2026-11-30').some(j => j.name === 'Premier League reminder')).toBe(true)
    expect(jobsOn('2026-11-12').some(j => j.name === 'Premier League reminder')).toBe(false)
  })
})

describe('dueOn', () => {
  it('puts follow-ups and meetings on the right India day, sorted by time, and ignores closed deals', () => {
    const contacts = [
      c({ name: 'Late', next_action_at: '2026-11-10T10:00:00Z' }), c({ name: 'Early', next_action_at: '2026-11-10T04:00:00Z' }),
      c({ name: 'Meet', stage: 'meeting_booked', next_action: 'Meeting', next_action_at: '2026-11-10T08:00:00Z' }),
      c({ name: 'Tomorrow', next_action_at: '2026-11-11T08:00:00Z' }), c({ name: 'Won', stage: 'won', next_action_at: '2026-11-10T08:00:00Z' }),
      c({ name: 'Edge', next_action_at: '2026-11-09T19:00:00Z' }), // 00:30 IST on the 10th
    ]
    const r = dueOn(contacts, '2026-11-10')
    expect(r.followUps.map(x => x.name)).toEqual(['Edge', 'Early', 'Late'])
    expect(r.meetings.map(x => x.name)).toEqual(['Meet'])
    expect(r.followUps[1].at).toBe('09:30')
  })
})

describe('buildSchedule', () => {
  it('returns consecutive days, clamps the range, and carries expo milestones', () => {
    const s = buildSchedule('2026-11-26', 5, [])
    expect(s.map(d => d.date)).toEqual(['2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29', '2026-11-30'])
    expect(s[0].milestones[0]).toContain('reminder')
    expect(s[1].milestones[0]).toContain('day 1')
    expect(s[4].milestones[0]).toContain('thanks')
    expect(buildSchedule('2026-11-10', 99, [])).toHaveLength(14)
  })
  it('istDay converts late-evening UTC to the next India day', () => {
    expect(istDay(new Date('2026-11-09T19:00:00Z'))).toBe('2026-11-10')
  })
})
