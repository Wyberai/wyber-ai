import { describe, it, expect } from 'vitest'
import { buildExpoSequenceEmail } from '@/lib/email'

// The pain point is optional on the booking form, so none of the four emails may show an empty quote or refer to
// something the person never wrote.
describe('expo emails when the lead gave no pain point', () => {
  const lead = { name: 'Asha Patel', day: '28 Nov', painPoint: '' }
  for (const kind of ['confirmation', 'reminder', 'thanks', 'followup'] as const) {
    it(`${kind}: no empty quote and no "you gave us / you sent / you told us"`, () => {
      const { html } = buildExpoSequenceEmail(kind, 'asha@example.com', lead)
      expect(html).not.toContain('“”')
      expect(html).not.toMatch(/you gave us|you sent|you told us/i)
    })
  }
  it('still quotes the pain point when there is one', () => {
    const { html } = buildExpoSequenceEmail('confirmation', 'asha@example.com', { ...lead, painPoint: 'Challans pile up' })
    expect(html).toContain('Challans pile up')
  })
})
