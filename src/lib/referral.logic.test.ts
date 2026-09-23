import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

// notify() fans out email/push side effects unrelated to the credit-ledger
// logic under test here — stub it so the queue below only has to model
// rewardReferrerOnFirstPayment's own DB calls, same isolation affiliate.ts's
// tests get from not touching real email/push.
vi.mock('@/lib/push', () => ({ notify: vi.fn(() => Promise.resolve()) }))

import { rewardReferrerOnFirstPayment, REFERRER_PAYMENT_REWARD_CREDITS } from './referral'

// Same fluent+thenable mock shape as affiliate.logic.test.ts, extended with
// `rpc` (called directly on `admin`, not via `.from()`) sharing the same
// queue/index so call order across from()... and rpc(...) stays a single
// linear sequence matching the order rewardReferrerOnFirstPayment issues them.
function makeMockAdmin(queue: Record<string, unknown>[]): SupabaseClient {
  let i = 0
  const chain: Record<string, unknown> = {}
  const passthrough = ['select', 'eq', 'order', 'limit', 'insert', 'update', 'delete']
  for (const m of passthrough) chain[m] = vi.fn(() => chain)
  chain.maybeSingle = vi.fn(() => Promise.resolve(queue[i++]))
  chain.single = vi.fn(() => Promise.resolve(queue[i++]))
  ;(chain as { then: (resolve: (v: unknown) => void) => void }).then = (resolve) => resolve(queue[i++])
  return {
    from: vi.fn(() => chain),
    rpc: vi.fn(() => Promise.resolve(queue[i++])),
  } as unknown as SupabaseClient
}

describe('rewardReferrerOnFirstPayment', () => {
  it('does nothing when the payer was not referred by anyone', async () => {
    const admin = makeMockAdmin([])
    await rewardReferrerOnFirstPayment(admin, null, 'user-b')
    expect(admin.from).not.toHaveBeenCalled()
  })

  it('is a no-op when this referred user has already triggered a payout before', async () => {
    const admin = makeMockAdmin([{ data: null }]) // claim update matched zero rows (flag already true)
    await rewardReferrerOnFirstPayment(admin, 'user-a', 'user-b')
    // Only the claim attempt ran — no credit adjustment, no earned-total update.
    expect(admin.from).toHaveBeenCalledTimes(1)
    expect(admin.rpc).not.toHaveBeenCalled()
  })

  it('pays the referrer 50 credits on the referred user\'s first payment', async () => {
    const admin = makeMockAdmin([
      { data: { id: 'user-b' } },                      // claim succeeds (flag was false)
      { data: { referral_credits_earned: 30 } },        // referrer's current earned total
      { data: null, error: null },                      // adjust_credits rpc
      { error: null },                                  // referral_credits_earned update
    ])
    await rewardReferrerOnFirstPayment(admin, 'user-a', 'user-b')
    expect(admin.rpc).toHaveBeenCalledWith('adjust_credits', { p_user_id: 'user-a', p_delta: REFERRER_PAYMENT_REWARD_CREDITS })
  })

  it('never throws even if every DB call fails', async () => {
    const admin: SupabaseClient = {
      from: vi.fn(() => { throw new Error('DB is down') }),
      rpc: vi.fn(),
    } as unknown as SupabaseClient
    await expect(rewardReferrerOnFirstPayment(admin, 'user-a', 'user-b')).resolves.not.toThrow()
  })
})
