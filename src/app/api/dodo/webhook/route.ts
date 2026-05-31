import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Plan definitions — 75% of Lovable price, 50% more credits
const PLANS: Record<string, { credits: number; dailyCredits: number; plan: string }> = {
  [process.env.DODO_PRODUCT_PRO || 'pro']:         { credits: 150, dailyCredits: 8,  plan: 'pro' },
  [process.env.DODO_PRODUCT_BUSINESS || 'business']:{ credits: 150, dailyCredits: 8,  plan: 'business' },
  [process.env.DODO_PRODUCT_PRO_ANNUAL || 'pro_annual']:       { credits: 150, dailyCredits: 8, plan: 'pro' },
  [process.env.DODO_PRODUCT_BUSINESS_ANNUAL || 'business_annual']:{ credits: 150, dailyCredits: 8, plan: 'business' },
}

// Top-up packs (one-time, credits never expire)
const TOPUPS: Record<string, number> = {
  [process.env.DODO_TOPUP_50  || 'topup_50']:  50,
  [process.env.DODO_TOPUP_150 || 'topup_150']: 150,
  [process.env.DODO_TOPUP_500 || 'topup_500']: 500,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET
    const signature = req.headers.get('webhook-signature') || req.headers.get('x-dodo-signature')

    if (webhookSecret && signature) {
      const { createHmac } = await import('crypto')
      const expected = createHmac('sha256', webhookSecret).update(body).digest('hex')
      if (signature !== expected && !signature.includes(expected)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(body)
    const admin = await createAdminClient()
    const userId = event.data?.metadata?.user_id || event.metadata?.user_id

    if (!userId) return NextResponse.json({ received: true })

    const productId = event.data?.product_cart?.[0]?.product_id ||
                      event.data?.items?.[0]?.product_id ||
                      event.product_id || ''

    // ── SUBSCRIPTION ACTIVATED ─────────────────────────────────────
    if (event.type === 'subscription.active' || event.type === 'payment.succeeded') {

      // Check if it's a top-up
      const topupCredits = TOPUPS[productId]
      if (topupCredits) {
        // Add credits to existing balance (never expire)
        const { data: profile } = await admin.from('profiles')
          .select('credits, topup_credits').eq('id', userId).single()
        await admin.from('profiles').update({
          topup_credits: (profile?.topup_credits || 0) + topupCredits,
          credits: (profile?.credits || 0) + topupCredits,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)

        // Log the top-up
        await admin.from('credit_usage').insert({
          user_id: userId, amount: -topupCredits,
          reason: `topup_${topupCredits}`,
          credits_before: profile?.credits || 0,
          credits_after: (profile?.credits || 0) + topupCredits,
        })
        return NextResponse.json({ received: true })
      }

      // It's a subscription
      const planConfig = PLANS[productId]
      if (planConfig) {
        const now = new Date()
        const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1) // 1st of next month

        await admin.from('profiles').update({
          plan: planConfig.plan,
          credits: planConfig.credits,
          daily_credits: planConfig.dailyCredits,
          daily_credits_reset: new Date(Date.now() + 86400000).toISOString(), // tomorrow
          plan_credits_reset: resetDate.toISOString(),
          subscription_status: 'active',
          updated_at: now.toISOString(),
        }).eq('id', userId)
      }
    }

    // ── SUBSCRIPTION RENEWED (monthly reset) ──────────────────────
    if (event.type === 'subscription.renewed') {
      const planConfig = PLANS[productId]
      if (planConfig) {
        const { data: profile } = await admin.from('profiles')
          .select('credits, topup_credits').eq('id', userId).single()

        // Roll over unused monthly credits (keep top-up credits separate)
        const rollover = Math.min(profile?.credits || 0, planConfig.credits)
        const topupCredits = profile?.topup_credits || 0

        await admin.from('profiles').update({
          credits: planConfig.credits + rollover + topupCredits, // new + rollover + topups
          daily_credits: planConfig.dailyCredits,
          daily_credits_reset: new Date(Date.now() + 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
      }
    }

    // ── SUBSCRIPTION CANCELLED ────────────────────────────────────
    if (event.type === 'subscription.cancelled') {
      const { data: profile } = await admin.from('profiles')
        .select('topup_credits').eq('id', userId).single()

      await admin.from('profiles').update({
        plan: 'free',
        credits: 10 + (profile?.topup_credits || 0), // free credits + keep top-ups
        daily_credits: 5,
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Dodo webhook error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
