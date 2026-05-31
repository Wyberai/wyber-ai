import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const PLANS: Record<string, { credits: number; dailyCredits: number; plan: string }> = {
  [process.env.DODO_PRODUCT_PRO || '']:             { credits: 150, dailyCredits: 8, plan: 'pro' },
  [process.env.DODO_PRODUCT_PRO_ANNUAL || '']:      { credits: 150, dailyCredits: 8, plan: 'pro' },
  [process.env.DODO_PRODUCT_BUSINESS || '']:        { credits: 150, dailyCredits: 8, plan: 'business' },
  [process.env.DODO_PRODUCT_BUSINESS_ANNUAL || '']: { credits: 150, dailyCredits: 8, plan: 'business' },
}

const TOPUPS: Record<string, number> = {
  [process.env.DODO_TOPUP_50  || '']: 50,
  [process.env.DODO_TOPUP_150 || '']: 150,
  [process.env.DODO_TOPUP_500 || '']: 500,
}

// Svix signature verification (what Dodo uses)
async function verifySvixSignature(
  body: string,
  secret: string,
  headers: Headers
): Promise<boolean> {
  try {
    const msgId = headers.get('svix-id') || ''
    const msgTimestamp = headers.get('svix-timestamp') || ''
    const msgSignature = headers.get('svix-signature') || ''

    if (!msgId || !msgTimestamp || !msgSignature) return false

    // Reject old timestamps (>5 min)
    const ts = parseInt(msgTimestamp, 10)
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - ts) > 300) return false

    // Build signed content
    const toSign = `${msgId}.${msgTimestamp}.${body}`

    // Decode secret (strip whsec_ prefix if present)
    const rawSecret = secret.startsWith('whsec_')
      ? Buffer.from(secret.slice(6), 'base64')
      : Buffer.from(secret, 'base64')

    // HMAC-SHA256
    const { createHmac } = await import('crypto')
    const computed = createHmac('sha256', rawSecret)
      .update(toSign)
      .digest('base64')

    // Compare against all signatures in header (can be comma-separated with v1, prefix)
    const signatures = msgSignature.split(' ')
    return signatures.some(sig => {
      const clean = sig.startsWith('v1,') ? sig.slice(3) : sig
      return clean === computed
    })
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET

    // Verify signature if secret is configured
    if (webhookSecret) {
      const valid = await verifySvixSignature(body, webhookSecret, req.headers)
      if (!valid) {
        console.error('Dodo webhook: invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(body)
    const admin = await createAdminClient()

    console.log('Dodo webhook event:', event.type, JSON.stringify(event).slice(0, 200))

    const userId =
      event.data?.metadata?.user_id ||
      event.metadata?.user_id ||
      event.data?.customer?.metadata?.user_id

    const productId =
      event.data?.product_cart?.[0]?.product_id ||
      event.data?.items?.[0]?.product_id ||
      event.product_id || ''

    if (!userId) {
      console.error('Dodo webhook: no user_id in metadata', event)
      return NextResponse.json({ received: true, warning: 'no user_id' })
    }

    // ── PAYMENT / SUBSCRIPTION ACTIVATED ──────────────────────────
    if (event.type === 'payment.succeeded' || event.type === 'subscription.active') {
      const topupCredits = TOPUPS[productId]

      if (topupCredits) {
        // Top-up — add credits, never expire
        const { data: profile } = await admin.from('profiles')
          .select('credits, topup_credits').eq('id', userId).single()
        const newCredits = (profile?.credits || 0) + topupCredits
        await admin.from('profiles').update({
          credits: newCredits,
          topup_credits: (profile?.topup_credits || 0) + topupCredits,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
        console.log(`Top-up: +${topupCredits} credits for user ${userId}`)
      } else {
        // Subscription
        const planConfig = PLANS[productId]
        if (planConfig) {
          await admin.from('profiles').update({
            plan: planConfig.plan,
            credits: planConfig.credits,
            daily_credits: planConfig.dailyCredits,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          }).eq('id', userId)
          console.log(`Subscription activated: ${planConfig.plan} for user ${userId}`)
        } else {
          // Unknown product — default to pro credits
          await admin.from('profiles').update({
            plan: 'pro', credits: 150,
            updated_at: new Date().toISOString(),
          }).eq('id', userId)
          console.warn(`Unknown product ${productId} — defaulting to pro`)
        }
      }
    }

    // ── SUBSCRIPTION RENEWED ──────────────────────────────────────
    if (event.type === 'subscription.renewed') {
      const planConfig = PLANS[productId]
      if (planConfig) {
        const { data: profile } = await admin.from('profiles')
          .select('credits, topup_credits').eq('id', userId).single()
        const rollover = Math.min(profile?.credits || 0, planConfig.credits)
        await admin.from('profiles').update({
          credits: planConfig.credits + rollover + (profile?.topup_credits || 0),
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
        console.log(`Subscription renewed for user ${userId}, rollover: ${rollover}`)
      }
    }

    // ── SUBSCRIPTION CANCELLED ────────────────────────────────────
    if (event.type === 'subscription.cancelled') {
      const { data: profile } = await admin.from('profiles')
        .select('topup_credits').eq('id', userId).single()
      await admin.from('profiles').update({
        plan: 'free',
        credits: 10 + (profile?.topup_credits || 0),
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
      console.log(`Subscription cancelled for user ${userId}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Dodo webhook error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
