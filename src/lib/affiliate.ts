import type { SupabaseClient } from '@supabase/supabase-js'

export const AFFILIATE_COMMISSION_RATE = 0.30

// Pure — unit-testable in isolation (see affiliate.test.ts). Rounds to
// cents; a non-finite or non-positive charge yields zero commission rather
// than throwing, since this sits on the hot path of real payment processing.
export function computeCommission(chargeUsd: number, rate: number = AFFILIATE_COMMISSION_RATE): number {
  if (!Number.isFinite(chargeUsd) || chargeUsd <= 0) return 0
  return Math.round(chargeUsd * rate * 100) / 100
}

interface AccrueParams {
  referredByUserId: string | null | undefined
  referredUserId: string
  dodoEventType: string
  dodoPaymentId: string
  planKey: string
  chargeUsd: number
}

// Accrues a commission for a payment IF the payer was referred by an
// APPROVED affiliate. `referredByUserId` comes from profiles.referred_by —
// the existing free-credit referral loop's attribution column
// (src/lib/referral.ts) — reused here purely as attribution. Commission
// itself only ever flows once an explicit `affiliates` row exists with
// status='approved' (20260922000000_affiliates.sql): reusing referred_by
// directly for cash would extend the exact account-farming vector already
// fixed once for credits (commit 389be52) to real payouts.
//
// Never throws — a failure here must never affect the credit/plan grant
// this is called alongside in the Dodo webhook. Call it fire-and-forget
// (or awaited + ignored) from a context that has already granted credits.
export async function accrueAffiliateCommission(admin: SupabaseClient, params: AccrueParams): Promise<void> {
  const { referredByUserId, referredUserId, dodoEventType, dodoPaymentId, planKey, chargeUsd } = params
  if (!referredByUserId || !dodoPaymentId) return
  try {
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id')
      .eq('user_id', referredByUserId)
      .eq('status', 'approved')
      .maybeSingle()
    if (!affiliate) return

    const commissionUsd = computeCommission(chargeUsd)
    if (commissionUsd <= 0) return

    const { error: insErr } = await admin.from('affiliate_commissions').insert({
      affiliate_id: affiliate.id,
      referred_user_id: referredUserId,
      dodo_event_type: dodoEventType,
      dodo_payment_id: dodoPaymentId,
      plan_key: planKey,
      charge_usd: chargeUsd,
      commission_rate: AFFILIATE_COMMISSION_RATE,
      commission_usd: commissionUsd,
    })
    if (insErr) {
      // Unique violation on dodo_payment_id = already accrued for this
      // payment (the safety-net index doing its job), not a real error.
      if (insErr.code === '23505') return
      console.error('[affiliate] commission insert failed:', insErr.message)
      return
    }

    const { data: affProfile } = await admin.from('profiles').select('affiliate_pending_usd').eq('id', referredByUserId).maybeSingle()
    await admin.from('profiles').update({
      affiliate_pending_usd: Number(affProfile?.affiliate_pending_usd || 0) + commissionUsd,
    }).eq('id', referredByUserId)
  } catch (e) {
    console.error('[affiliate] accrual failed (non-fatal):', String(e))
  }
}

// Reverses a commission when its underlying payment is refunded. If the
// commission was already marked `paid`, the payout already left the
// building via a manual process outside the app (Dodo has no split-
// payment/clawback API) — flag it for manual review instead of silently
// touching a balance that's already been paid out.
export async function reverseAffiliateCommissionForPayment(admin: SupabaseClient, dodoPaymentId: string): Promise<void> {
  if (!dodoPaymentId) return
  try {
    const { data: commission } = await admin
      .from('affiliate_commissions')
      .select('id, affiliate_id, commission_usd, status')
      .eq('dodo_payment_id', dodoPaymentId)
      .maybeSingle()
    if (!commission) return

    if (commission.status === 'paid') {
      console.warn(`[affiliate] refund on an ALREADY-PAID commission ${commission.id} (payment ${dodoPaymentId}) — needs manual reconciliation, not auto-reversed`)
      return
    }
    if (commission.status !== 'pending') return

    await admin.from('affiliate_commissions').update({ status: 'reversed', updated_at: new Date().toISOString() }).eq('id', commission.id)

    const { data: affiliate } = await admin.from('affiliates').select('user_id').eq('id', commission.affiliate_id).maybeSingle()
    if (affiliate?.user_id) {
      const { data: affProfile } = await admin.from('profiles').select('affiliate_pending_usd').eq('id', affiliate.user_id).maybeSingle()
      const newPending = Math.max(0, Number(affProfile?.affiliate_pending_usd || 0) - Number(commission.commission_usd))
      await admin.from('profiles').update({ affiliate_pending_usd: newPending }).eq('id', affiliate.user_id)
    }
  } catch (e) {
    console.error('[affiliate] reversal failed (non-fatal):', String(e))
  }
}
