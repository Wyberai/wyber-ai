import { describe, it, expect } from 'vitest'
import { buildExpoSequenceEmail } from './index'

const lead = { name: 'Asha Patel', day: '28 Nov', painPoint: 'I never know which invoices are unpaid' }
const kinds = ['confirmation', 'reminder', 'thanks', 'followup'] as const

describe('buildExpoSequenceEmail', () => {
  it.each(kinds)('%s has a subject, the visitor\'s pain point, and a signed unsubscribe link', (kind) => {
    const { subject, html } = buildExpoSequenceEmail(kind, 'asha@example.com', lead)
    expect(subject.length).toBeGreaterThan(5)
    expect(html).toContain('I never know which invoices are unpaid')
    expect(html).toMatch(/\/unsubscribe\?e=asha%40example\.com&t=[a-f0-9]{32}/)
  })

  it.each(kinds)('%s escapes HTML in user-supplied text', (kind) => {
    const { html } = buildExpoSequenceEmail(kind, 'a@example.com', { name: '<img src=x onerror=1>', day: '28 Nov', painPoint: '<script>alert(1)</script>' })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).not.toContain('<img src=x onerror=1>')
  })

  it.each(kinds)('%s does not state a venue, opening hours or a booth WhatsApp number (not confirmed)', (kind) => {
    const { html } = buildExpoSequenceEmail(kind, 'a@example.com', lead)
    expect(html).not.toMatch(/Convention|9:30|wa\.me|whatsapp\.com\/send/i)
  })

  it('confirmation names the booth, dates and the chosen day', () => {
    const { subject, html } = buildExpoSequenceEmail('confirmation', 'a@example.com', lead)
    expect(subject).toContain('S23')
    expect(html).toContain('27–29 Nov 2026')
    expect(html).toContain('28 Nov')
  })

  it('"Any day" leads get expo-wide wording in the confirmation and reminder', () => {
    const c = buildExpoSequenceEmail('confirmation', 'a@example.com', { ...lead, day: 'Any day' })
    expect(c.html).toContain('any day of the expo')
    const r = buildExpoSequenceEmail('reminder', 'a@example.com', { ...lead, day: 'Any day' })
    expect(r.subject).toContain('starts tomorrow')
  })

  it('thanks and followup link to signup with expo UTM tags; confirmation and reminder do not push a signup', () => {
    expect(buildExpoSequenceEmail('thanks', 'a@example.com', lead).html).toContain('utm_campaign=teg2026-thanks')
    expect(buildExpoSequenceEmail('followup', 'a@example.com', lead).html).toContain('utm_campaign=teg2026-followup')
    expect(buildExpoSequenceEmail('confirmation', 'a@example.com', lead).html).not.toContain('/signup')
  })

  it('truncates a very long pain point and copes with a missing name', () => {
    const { html } = buildExpoSequenceEmail('confirmation', 'a@example.com', { name: '', day: null, painPoint: 'x'.repeat(1000) })
    expect(html).toContain('there')
    expect(html.length).toBeLessThan(20_000)
  })
})
