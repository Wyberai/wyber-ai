import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendEmail = vi.fn()
vi.mock('@/lib/email', () => ({ sendExpoSequenceEmail: (...a: unknown[]) => sendEmail(...a) }))

import { deliverExpoEmail, expoSequenceDisabled } from './expo-sequence-send'

const lead = { id: 'L1', name: 'Asha', email: 'asha@example.com', preferred_day: '28 Nov', pain_point: 'invoices' }

function admin(insertResult: { error: { code?: string; message: string } | null }) {
  const del = vi.fn()
  const chain = { eq: vi.fn().mockReturnThis() }
  const insert = vi.fn().mockResolvedValue(insertResult)
  const db = { from: vi.fn().mockReturnValue({ insert, delete: () => { del(); return { eq: () => ({ eq: async () => ({}) }) } } }) }
  return { db, insert, del, chain }
}

beforeEach(() => { sendEmail.mockReset().mockResolvedValue({ id: 'm1' }) })

describe('deliverExpoEmail', () => {
  it('claims then sends with the lead details', async () => {
    const a = admin({ error: null })
    expect(await deliverExpoEmail(a.db, lead, 'reminder')).toBe('sent')
    expect(a.insert).toHaveBeenCalledWith({ lead_id: 'L1', kind: 'reminder' })
    expect(sendEmail).toHaveBeenCalledWith('reminder', 'asha@example.com', { name: 'Asha', day: '28 Nov', painPoint: 'invoices' })
  })

  it('does not send when the email was already claimed (unique violation)', async () => {
    const a = admin({ error: { code: '23505', message: 'duplicate' } })
    expect(await deliverExpoEmail(a.db, lead, 'reminder')).toBe('skipped')
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('does not send when the tracking table is unavailable (cannot lock, so could double-send)', async () => {
    const a = admin({ error: { code: '42P01', message: 'relation does not exist' } })
    expect(await deliverExpoEmail(a.db, lead, 'thanks')).toBe('skipped')
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('reports failure and releases the claim when sending fails', async () => {
    sendEmail.mockRejectedValue(new Error('smtp down'))
    const a = admin({ error: null })
    expect(await deliverExpoEmail(a.db, lead, 'thanks')).toBe('failed')
    expect(a.del).toHaveBeenCalled()
  })

  it('never throws', async () => {
    const db = { from: () => { throw new Error('boom') } }
    expect(await deliverExpoEmail(db, lead, 'thanks')).toBe('failed')
  })
})

describe('expoSequenceDisabled', () => {
  it('is on by default and off only when EXPO_SEQUENCE_DISABLED=true', () => {
    const prev = process.env.EXPO_SEQUENCE_DISABLED
    delete process.env.EXPO_SEQUENCE_DISABLED
    expect(expoSequenceDisabled()).toBe(false)
    process.env.EXPO_SEQUENCE_DISABLED = 'true'
    expect(expoSequenceDisabled()).toBe(true)
    if (prev === undefined) delete process.env.EXPO_SEQUENCE_DISABLED; else process.env.EXPO_SEQUENCE_DISABLED = prev
  })
})
