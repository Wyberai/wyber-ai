import { describe, it, expect } from 'vitest'
import { TOPICS, CALENDAR_START, CALENDAR_END, piecesOn, topicsForWeek } from './calendar'
import { RAMP, CHANNELS, DAILY_TARGET, targetOn, pace, planTotal } from './growth'

describe('content calendar', () => {
  it('has 30 topics, one per day, ending at the expect date', () => {
    expect(TOPICS).toHaveLength(30)
    expect(CALENDAR_START).toBe('2026-11-09')
    expect(CALENDAR_END).toBe('2026-12-08')
  })
  it('never says anything the founder rules forbid, makes up a number, or promises a result', () => {
    for (const t of TOPICS) {
      const text = `${t.topic} ${t.hook}`
      expect(text, text).not.toMatch(/\bsolo\b|just me|one[- ]person (company|team|startup)|bidar|my (wife|family)/i) // no founder or location exposure
      expect(text, text).not.toMatch(/guarantee|100\s?%|risk[- ]free|cheapest|\d+x\b|\$\s?\d|₹\s?\d/i) // no promises or prices
      expect(text, text).not.toMatch(/\b(customers?|clients?) (love|trust|use)\b/i) // no invented social proof
      expect(text, text).not.toMatch(/\bai\b.*\bwrote\b/i)
    }
  })
  it('does not run the expo posts on the wrong days', () => {
    expect(piecesOn('2026-11-27')[0].topic).toContain('Day one')
    expect(piecesOn('2026-11-28')[0].topic).toContain('Day two')
    expect(piecesOn('2026-11-29')[0].topic).toContain('Day three')
  })
  it('every day has a LinkedIn post, and videos, community and newsletter land on their weekdays', () => {
    const days = Array.from({ length: 30 }, (_, i) => new Date(new Date(`${CALENDAR_START}T00:00:00Z`).getTime() + i * 86400_000).toISOString().slice(0, 10))
    for (const d of days) expect(piecesOn(d).some(p => p.channel === 'linkedin')).toBe(true)
    expect(piecesOn('2026-11-10').map(p => p.channel)).toEqual(['linkedin', 'short_video']) // Tuesday
    expect(piecesOn('2026-11-11').map(p => p.channel)).toEqual(['linkedin', 'community']) // Wednesday
    expect(piecesOn('2026-11-14').map(p => p.channel)).toEqual(['linkedin', 'newsletter']) // Saturday
    expect(piecesOn('2026-11-09').map(p => p.channel)).toEqual(['linkedin']) // Monday
  })
  it('is empty outside the calendar', () => {
    expect(piecesOn('2026-11-08')).toEqual([])
    expect(piecesOn('2026-12-09')).toEqual([])
  })
  it('topicsForWeek returns up to seven dated topics and stops at the end of the calendar', () => {
    expect(topicsForWeek('2026-11-09')).toHaveLength(7)
    expect(topicsForWeek('2026-12-06')).toHaveLength(3)
    expect(topicsForWeek('2027-01-01')).toEqual([])
  })
  it('expo-day posts only exist on or near the expo dates', () => {
    for (const d of Array.from({ length: 30 }, (_, i) => new Date(new Date(`${CALENDAR_START}T00:00:00Z`).getTime() + i * 86400_000).toISOString().slice(0, 10))) {
      for (const p of piecesOn(d)) if (/^Day (one|two|three)/.test(p.topic)) expect(['2026-11-27', '2026-11-28', '2026-11-29']).toContain(d)
    }
  })
})

describe('growth ramp', () => {
  it('starts low, rises steadily and reaches 100 a day by the end of March 2027', () => {
    expect(DAILY_TARGET).toBe(100)
    expect(RAMP[RAMP.length - 1]).toEqual({ date: '2027-03-31', perDay: 100 })
    for (let i = 1; i < RAMP.length; i++) expect(RAMP[i].perDay).toBeGreaterThan(RAMP[i - 1].perDay)
  })
  it('interpolates between milestones and clamps outside them', () => {
    expect(targetOn('2026-01-01')).toBe(2)
    expect(targetOn('2026-11-30')).toBe(10)
    expect(targetOn('2026-12-31')).toBe(25)
    expect(targetOn('2026-12-15')).toBeGreaterThan(10)
    expect(targetOn('2026-12-15')).toBeLessThan(25)
    expect(targetOn('2030-01-01')).toBe(100)
  })
  it('says honestly whether we are ahead, on track or behind', () => {
    expect(pace(12, '2026-11-30').status).toBe('ahead')
    expect(pace(8.5, '2026-11-30').status).toBe('on_track')
    expect(pace(1.6, '2026-11-30')).toMatchObject({ status: 'behind', target: 10, gap: -8.4 })
  })
  it('channels each say what is automated and what needs the founder, and together cover the target', () => {
    for (const c of CHANNELS) { expect(c.automated.length).toBeGreaterThan(10); expect(c.needsYou.length).toBeGreaterThan(10); expect(c.firstStep.length).toBeGreaterThan(10) }
    expect(planTotal()).toBeGreaterThanOrEqual(DAILY_TARGET)
    expect(new Set(CHANNELS.map(c => c.id)).size).toBe(CHANNELS.length)
  })
})
