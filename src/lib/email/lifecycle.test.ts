import { describe, it, expect } from 'vitest'
import { PLAN_FACTS, TOPUP_PACKS } from '@/lib/plans'
import {
  LIFECYCLE_STEPS, LIFECYCLE_WINDOW_DAYS, buildLifecycleEmail, nextLifecycleStep,
} from './lifecycle'

const DAY = 86_400_000
const created = Date.UTC(2026, 9, 1)
const at = (days: number) => created + days * DAY + 3_600_000

describe('lifecycle steps', () => {
  it('have unique ids and ascending days', () => {
    const ids = LIFECYCLE_STEPS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    const days = LIFECYCLE_STEPS.map(s => s.day)
    expect([...days].sort((a, b) => a - b)).toEqual(days)
  })

  it('every step builds a complete email with a signed unsubscribe link and a tagged button', () => {
    for (const s of LIFECYCLE_STEPS) {
      const { subject, html } = buildLifecycleEmail(s, 'Asha Patel', 'asha@example.com')
      expect(subject.length).toBeGreaterThan(10)
      expect(html).toContain('Hi Asha,')
      expect(html).toMatch(/\/unsubscribe\?e=asha%40example\.com&t=[a-f0-9]{32}/)
      expect(html).toContain(`utm_campaign=${s.id}`)
    }
  })

  it('escapes the recipient name', () => {
    const { html } = buildLifecycleEmail(LIFECYCLE_STEPS[0], '<script>alert(1)</script>', 'a@example.com')
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('uses a light layout with readable text, not the dark theme', () => {
    const { html } = buildLifecycleEmail(LIFECYCLE_STEPS[0], 'A', 'a@example.com')
    expect(html).toContain('background:#FFFFFF')
    expect(html).not.toContain('#8888a0')
  })

  it('ties the plan numbers to plans.ts', () => {
    const plans = LIFECYCLE_STEPS.find(s => s.id === 'plans')!
    const text = plans.body.join(' ')
    for (const id of ['starter', 'builder', 'pro'] as const) {
      expect(text).toContain(PLAN_FACTS[id].credits.toLocaleString('en-US'))
    }
    expect(text).toContain(TOPUP_PACKS.map(t => t.credits).join(' / '))
  })

  it('never brings back claims the product cannot back', () => {
    const all = JSON.stringify(LIFECYCLE_STEPS)
    expect(all).not.toMatch(/60 seconds|60-second|24 integrations|25 integrations|2,400|50 free credits|unlimited/i)
    expect(all).not.toMatch(/solo|Bidar|founder-led/i)
  })
})

describe('nextLifecycleStep', () => {
  const base = { createdAtMs: created, sentIds: new Set<string>(), hasBuilt: false }

  it('sends nothing before day 8', () => {
    expect(nextLifecycleStep({ ...base, nowMs: at(7) })).toBeNull()
  })

  it('sends the first step from day 8, to everyone', () => {
    expect(nextLifecycleStep({ ...base, nowMs: at(8) })?.id).toBe('cost-first')
    expect(nextLifecycleStep({ ...base, hasBuilt: true, nowMs: at(8) })?.id).toBe('cost-first')
  })

  it('does not resend a step that was already sent', () => {
    expect(nextLifecycleStep({ ...base, sentIds: new Set(['cost-first']), nowMs: at(9) })).toBeNull()
  })

  it('stops offering a step once its window has passed (a missed cron run is tolerated, a long gap is not)', () => {
    expect(nextLifecycleStep({ ...base, nowMs: at(8 + LIFECYCLE_WINDOW_DAYS - 1) })?.id).toBe('cost-first')
    expect(nextLifecycleStep({ ...base, nowMs: at(8 + LIFECYCLE_WINDOW_DAYS) })).toBeNull()
  })

  it('splits builders and non-builders at day 38', () => {
    expect(nextLifecycleStep({ ...base, hasBuilt: true, nowMs: at(38) })?.id).toBe('security-scan')
    expect(nextLifecycleStep({ ...base, hasBuilt: false, nowMs: at(38) })?.id).toBe('gallery')
  })

  it('skips builder-only steps for people who never built', () => {
    expect(nextLifecycleStep({ ...base, nowMs: at(33) })).toBeNull()
    expect(nextLifecycleStep({ ...base, hasBuilt: true, nowMs: at(33) })?.id).toBe('themes')
  })

  it('ends after the last step plus its window', () => {
    const last = LIFECYCLE_STEPS[LIFECYCLE_STEPS.length - 1]
    expect(nextLifecycleStep({ ...base, nowMs: at(last.day + LIFECYCLE_WINDOW_DAYS + 30) })).toBeNull()
  })
})
