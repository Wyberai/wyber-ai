import { describe, it, expect, vi } from 'vitest'
import { nextDueEmail, istDate, visitWindow, deliver, type SeqLead } from './expo-sequence'

// All times below are given in UTC; IST is +5:30, so 20:00Z is already the next IST day.
const at = (iso: string) => new Date(iso)
const lead = (over: Partial<SeqLead> = {}): SeqLead => ({
  created_at: '2026-11-10T06:00:00Z', // 11:30 IST on 10 Nov
  email: 'asha@example.com',
  email_opt_out: false,
  status: 'new',
  preferred_day: '28 Nov',
  ...over,
})
const none = new Set<string>()
const sent = (...k: string[]) => new Set(k)

describe('istDate', () => {
  it('rolls over at 18:30 UTC', () => {
    expect(istDate(at('2026-11-26T18:29:00Z'))).toBe('2026-11-26')
    expect(istDate(at('2026-11-26T18:30:00Z'))).toBe('2026-11-27')
  })
})

describe('visitWindow', () => {
  it('reminds the day before a chosen day', () => {
    expect(visitWindow('28 Nov')).toEqual({ reminderOn: '2026-11-27', lastDay: '2026-11-28' })
    expect(visitWindow('27 Nov')).toEqual({ reminderOn: '2026-11-26', lastDay: '2026-11-27' })
  })
  it('treats "Any day" and unknown values as the whole expo', () => {
    expect(visitWindow('Any day')).toEqual({ reminderOn: '2026-11-26', lastDay: '2026-11-29' })
    expect(visitWindow(null)).toEqual({ reminderOn: '2026-11-26', lastDay: '2026-11-29' })
  })
})

describe('nextDueEmail', () => {
  it('sends the confirmation first, whenever it is due', () => {
    expect(nextDueEmail(lead(), none, at('2026-11-10T07:00:00Z'))).toBe('confirmation')
  })

  it('never emails without an address, after opt-out, or for a lost lead', () => {
    expect(nextDueEmail(lead({ email: null }), none, at('2026-11-10T07:00:00Z'))).toBeNull()
    expect(nextDueEmail(lead({ email_opt_out: true }), none, at('2026-11-10T07:00:00Z'))).toBeNull()
    expect(nextDueEmail(lead({ status: 'lost' }), none, at('2026-11-27T05:00:00Z'))).toBeNull()
  })

  it('sends nothing between confirmation and the reminder day', () => {
    expect(nextDueEmail(lead(), sent('confirmation'), at('2026-11-20T05:00:00Z'))).toBeNull()
  })

  it('sends the reminder the day before the chosen day, not earlier', () => {
    expect(nextDueEmail(lead(), sent('confirmation'), at('2026-11-26T05:00:00Z'))).toBeNull()
    expect(nextDueEmail(lead(), sent('confirmation'), at('2026-11-27T05:00:00Z'))).toBe('reminder')
  })

  it('does not remind on or after the visit day has passed', () => {
    expect(nextDueEmail(lead(), sent('confirmation'), at('2026-11-29T05:00:00Z'))).toBeNull()
  })

  it('"Any day" leads are reminded on 26 Nov', () => {
    expect(nextDueEmail(lead({ preferred_day: 'Any day' }), sent('confirmation'), at('2026-11-26T05:00:00Z'))).toBe('reminder')
  })

  it('skips the reminder for someone who signed up on the reminder day itself', () => {
    const l = lead({ created_at: '2026-11-27T04:00:00Z' }) // 27 Nov IST, reminder day for 28 Nov
    expect(nextDueEmail(l, sent('confirmation'), at('2026-11-27T10:00:00Z'))).toBeNull()
  })

  it('skips the reminder once they have already met us or are further along', () => {
    for (const status of ['met_at_booth', 'building', 'won']) {
      expect(nextDueEmail(lead({ status }), sent('confirmation'), at('2026-11-27T05:00:00Z'))).not.toBe('reminder')
    }
  })

  it('sends thanks from 30 Nov, and only once the expo is over', () => {
    const s = sent('confirmation', 'reminder')
    expect(nextDueEmail(lead(), s, at('2026-11-29T05:00:00Z'))).toBeNull()
    expect(nextDueEmail(lead(), s, at('2026-11-30T05:00:00Z'))).toBe('thanks')
  })

  it('thanks still goes to a lead whose reminder was skipped, and never twice', () => {
    expect(nextDueEmail(lead(), sent('confirmation'), at('2026-11-30T05:00:00Z'))).toBe('thanks')
    expect(nextDueEmail(lead(), sent('confirmation', 'reminder', 'thanks'), at('2026-11-30T09:00:00Z'))).toBeNull()
  })

  it('sends one email per run even when several are overdue', () => {
    // Cron was down: on 5 Dec everything after the confirmation is due; only the next one goes.
    expect(nextDueEmail(lead(), sent('confirmation'), at('2026-12-05T05:00:00Z'))).toBe('thanks')
    expect(nextDueEmail(lead(), sent('confirmation', 'thanks'), at('2026-12-05T05:00:00Z'))).toBe('followup')
  })

  it('followup waits until 4 Dec and stops for building/won leads', () => {
    const s = sent('confirmation', 'reminder', 'thanks')
    expect(nextDueEmail(lead(), s, at('2026-12-03T05:00:00Z'))).toBeNull()
    expect(nextDueEmail(lead(), s, at('2026-12-04T05:00:00Z'))).toBe('followup')
    expect(nextDueEmail(lead({ status: 'building' }), s, at('2026-12-04T05:00:00Z'))).toBeNull()
    expect(nextDueEmail(lead({ status: 'won' }), s, at('2026-12-04T05:00:00Z'))).toBeNull()
  })

  it('does not send stale thanks or followup weeks late', () => {
    // Past the thanks window (15 Dec) the standalone followup is still allowed until 20 Dec...
    expect(nextDueEmail(lead(), sent('confirmation'), at('2026-12-16T05:00:00Z'))).toBe('followup')
    // ...and after that nothing about the expo goes out at all.
    expect(nextDueEmail(lead(), sent('confirmation'), at('2026-12-21T05:00:00Z'))).toBeNull()
    expect(nextDueEmail(lead(), sent('confirmation', 'thanks'), at('2026-12-21T05:00:00Z'))).toBeNull()
  })

  it('does not email people who signed up after the expo about the expo', () => {
    const late = lead({ created_at: '2026-12-01T05:00:00Z' })
    expect(nextDueEmail(late, sent('confirmation'), at('2026-12-05T05:00:00Z'))).toBeNull()
  })
})

describe('deliver', () => {
  const mk = (claimResult: boolean, sendErr?: Error) => ({
    claim: vi.fn().mockResolvedValue(claimResult),
    release: vi.fn().mockResolvedValue(undefined),
    send: sendErr ? vi.fn().mockRejectedValue(sendErr) : vi.fn().mockResolvedValue(undefined),
  })

  it('sends after winning the claim', async () => {
    const d = mk(true)
    expect(await deliver('L1', 'reminder', d)).toBe('sent')
    expect(d.send).toHaveBeenCalledWith('reminder')
    expect(d.release).not.toHaveBeenCalled()
  })

  it('does not send when someone else already holds the claim (double run / race)', async () => {
    const d = mk(false)
    expect(await deliver('L1', 'reminder', d)).toBe('skipped')
    expect(d.send).not.toHaveBeenCalled()
  })

  it('releases the claim when sending fails so the next run retries', async () => {
    const d = mk(true, new Error('smtp down'))
    expect(await deliver('L1', 'thanks', d)).toBe('failed')
    expect(d.release).toHaveBeenCalledWith('L1', 'thanks')
  })
})
