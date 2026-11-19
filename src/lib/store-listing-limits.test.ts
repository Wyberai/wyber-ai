import { describe, it, expect } from 'vitest'
import { clampStoreListing, fitKeywords, fitText, STORE_LIMITS } from './store-listing-limits'

describe('store listing limits', () => {
  it('cuts the subtitle that was 40 characters in the real run to 30 or fewer, at a word', () => {
    const out = fitText('Build daily habits, one streak at a time', STORE_LIMITS.subtitle)
    expect(out.length).toBeLessThanOrEqual(30)
    expect(out).toBe('Build daily habits, one streak')
  })

  it('leaves text that already fits alone', () => {
    expect(fitText('Streak Keeper: Habit Tracker', 30)).toBe('Streak Keeper: Habit Tracker')
  })

  it('keeps whole keywords and counts the commas, so the real 128-character list fits in 100', () => {
    const real = ['habit tracker', 'habit streak', 'daily habits', 'routine', 'productivity', 'self improvement', 'reminders', 'goals', 'consistency', 'daily planner']
    expect(real.join(',').length).toBeGreaterThan(100)
    const out = fitKeywords(real)
    expect(out.join(',').length).toBeLessThanOrEqual(100)
    expect(out[0]).toBe('habit tracker')
    expect(out.every((k) => real.includes(k))).toBe(true)
  })

  it('clamps a whole listing and does not touch other fields', () => {
    const out = clampStoreListing({ title: 'x'.repeat(50), subtitle: 'y'.repeat(50), keywords: ['a'.repeat(60), 'b'.repeat(60)], category: 'Productivity' })
    expect((out.title as string).length).toBeLessThanOrEqual(30)
    expect((out.subtitle as string).length).toBeLessThanOrEqual(30)
    expect((out.keywords as string[]).join(',').length).toBeLessThanOrEqual(100)
    expect(out.category).toBe('Productivity')
  })
})
