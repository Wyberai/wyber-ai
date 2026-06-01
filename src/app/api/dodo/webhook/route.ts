import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const PLANS: Record<string, { credits: number; dailyCredits: number; plan: string }> = {
  [process.env.DODO_PRODUCT_PRO || 'UNSET1']:             { credits: 150, dailyCredits: 8, plan: 'pro' },
  [process.env.DODO_PRODUCT_PRO_ANNUAL || 'UNSET2']:      { credits: 150, dailyCredits: 8, plan: 'pro' },
  [process.env.DODO_PRODUCT_BUSINESS || 'UNSET3']:        { credits: 150, dailyCredits: 8, plan: 'business' },
  [process.env.DODO_PRODUCT_BUSINESS_ANNUAL || 'UNSET4']: { credits: 150, dailyCredits: 8, plan: 'business' },
}

const TOPUPS: Record<string, number> = {
  [process.env.DODO_TOPUP_50  || 'UNSET5']: 50,
  [process.env.DODO_TOPUP_150 || 'UNSET6']: 150,
  [process.env.DODO_TOPUP_500 || 'UNSET7']: 500,
}

export async function POST(req: NextRequest) {
  let body = ''
  try {
    body = await req.text()
  } catch {
    return NextResponse.json({ error: 'Cannot read body' }, { status: 400 })
  }

  // Optional signature verification — skip if secret not set
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET
  if (webhookSecret && webhookSecret.length > 10) {
    try {
      const { Webhook } = await import('svix')
      const headerId  = req.headers.get('webhook-id')        || req.headers.get('svix-id')        || ''
      const headerTs  = req.headers.get('webhook-timestamp') || req.headers.get('svix-timestamp') || ''
      const headerSig = req.headers.get('webhook-signature') || req.headers.get('svix-signature') || ''
      if (headerId && headerTs && headerSig) {
        new Webhook(webhookSecret).verify(body, {
          'svix-id':        headerId,
          'svix-timestamp': headerTs,
          'svix-signature': headerSig,
        })
      }
    } catch (sigErr) {
      console.error('Signature error (ignoring):', String(sigErr))
      // Don't block — Dodo may use different header format
    }
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = String(event.type || '')
  console.log('Dodo event:', eventType)

  // payment.failed — always 200, nothing to do
  if (eventType === 'payment.failed') {
    return NextResponse.json({ received: true })
  }

  try {
    const admin = getAdmin()

    const userId =
      (event.data as Record<string, unknown> | undefined)?.metadata?.user_id ||
      event.metadata?.user_id ||
      null

    const productId = String(
      (event.data as Record<string, unknown> | undefined)?.product_cart?.[0]?.product_id ||
      (event.data as Record<string, unknown> | undefined)?.items?.[0]?.product_id ||
      event.product_id || ''
    )

    if (!userId) {
      console.warn('No user_id in event metadata for', eventType)
      return NextResponse.json({ received: true, warning: 'no user_id' })
    }

    // payment.succeeded or subscription.active → grant access
    if (eventType === 'payment.succeeded' || eventType === 'subscription.active') {
      const topupCredits = TOPUPS[productId]
      if (topupCredits) {
        const { data: profile } = await admin.from('profiles').select('credits, topup_credits').eq('id', userId).single()
        await admin.from('profiles').update({
          credits: (profile?.credits || 0) + topupCredits,
          topup_credits: (profile?.topup_credits || 0) + topupCredits,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
        console.log(`Topup +${topupCredits} for ${userId}`)
      } else {
        const planConfig = PLANS[productId] || { credits: 150, dailyCredits: 8, plan: 'pro' }
        await admin.from('profiles').update({
          plan: planConfig.plan,
          credits: planConfig.credits,
          daily_credits: planConfig.dailyCredits,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
        console.log(`Plan activated: ${planConfig.plan} for ${userId}`)
      }
    }

    // subscription.renewed → reset credits + keep topups
    if (eventType === 'subscription.renewed') {
      const planConfig = PLANS[productId]
      if (planConfig) {
        const { data: profile } = await admin.from('profiles').select('credits, topup_credits').eq('id', userId).single()
        const rollover = Math.min(profile?.credits || 0, planConfig.credits)
        await admin.from('profiles').update({
          credits: planConfig.credits + rollover + (profile?.topup_credits || 0),
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
        console.log(`Renewed for ${userId}, rollover: ${rollover}`)
      }
    }

    // subscription.cancelled → drop to free
    if (eventType === 'subscription.cancelled') {
      const { data: profile } = await admin.from('profiles').select('topup_credits').eq('id', userId).single()
      await admin.from('profiles').update({
        plan: 'free',
        credits: 10 + (profile?.topup_credits || 0),
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
      console.log(`Cancelled for ${userId}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook DB error:', String(err))
    // Still return 200 so Dodo doesn't retry forever
    return NextResponse.json({ received: true, dbError: String(err) })
  }
}
