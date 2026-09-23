import type { SupabaseClient } from '@supabase/supabase-js'
import { notify } from '@/lib/push'

// Single source of truth for the referral-code redemption cap. Two
// completely separate code paths redeem a referral code — the manual
// "enter a code" endpoint (src/app/api/referral/route.ts) and the
// link-based `?ref=CODE` signup flow (src/lib/auth/onboard-user.ts) — and
// they drifted out of sync: one enforced 3, the other enforced 5 and, past
// its own cap, kept minting new-account welcome bonuses forever with only
// the referrer's payout turned off. Both now import this one constant and
// both fully stop the redemption (no referred_by link, no new-account
// bonus, no referrer payout) once a code has paid out this many times.
export const REFERRAL_LIMIT = 3

export const REFERRER_PAYMENT_REWARD_CREDITS = 50

// Pays the referrer's 50 credits when — and only when — the person they
// referred makes their FIRST real payment, not at signup. Previously the
// referrer was paid at signup regardless of whether the referred user ever
// converted, which optimized the whole loop for free signups instead of
// revenue. Call this from the Dodo webhook, once per grant-worthy payment
// event, alongside accrueAffiliateCommission (src/lib/affiliate.ts) — same
// shape, different ledger (in-app credits, not cash).
//
// Idempotent via profiles.referral_reward_paid on the REFERRED user's own
// row: at most one payout per person referred, no matter how many payments
// they go on to make. Never throws — this must not affect the credit/plan
// grant it's called alongside.
export async function rewardReferrerOnFirstPayment(
  admin: SupabaseClient,
  referredByUserId: string | null | undefined,
  referredUserId: string,
): Promise<void> {
  if (!referredByUserId) return
  try {
    const { data: claimed, error: claimErr } = await admin
      .from('profiles')
      .update({ referral_reward_paid: true })
      .eq('id', referredUserId)
      .eq('referral_reward_paid', false)
      .select('id')
      .maybeSingle()
    if (claimErr) { console.error('[referral] reward claim failed:', claimErr.message); return }
    if (!claimed?.id) return // already paid out for this referred user

    const { data: referrer } = await admin
      .from('profiles')
      .select('referral_credits_earned')
      .eq('id', referredByUserId)
      .maybeSingle()

    await admin.rpc('adjust_credits', { p_user_id: referredByUserId, p_delta: REFERRER_PAYMENT_REWARD_CREDITS })
    await admin.from('profiles').update({
      referral_credits_earned: (referrer?.referral_credits_earned ?? 0) + REFERRER_PAYMENT_REWARD_CREDITS,
    }).eq('id', referredByUserId)

    notify(admin, referredByUserId, 'referral', { credits: REFERRER_PAYMENT_REWARD_CREDITS }).catch(() => {})
  } catch (e) {
    console.error('[referral] reward-on-payment failed (non-fatal):', String(e))
  }
}
