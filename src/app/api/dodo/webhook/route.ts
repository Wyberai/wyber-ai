import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET

    // Log all headers for debugging
    const allHeaders: Record<string, string> = {}
    req.headers.forEach((val, key) => { allHeaders[key] = val })
    console.log('Webhook headers:', JSON.stringify(allHeaders))

    // Try both svix-* and webhook-* header names (Dodo uses both)
    const headerId = req.headers.get('svix-id') || req.headers.get('webhook-id') || ''
    const headerTs = req.headers.get('svix-timestamp') || req.headers.get('webhook-timestamp') || ''
    const headerSig = req.headers.get('svix-signature') || req.headers.get('webhook-signature') || ''

    console.log('Sig headers:', { headerId, headerTs, headerSig: headerSig.slice(0, 20) })

    if (webhookSecret && headerId && headerTs && headerSig) {
      const wh = new Webhook(webhookSecret)
      try {
        wh.verify(body, {
          'svix-id':        headerId,
          'svix-timestamp': headerTs,
          'svix-signature': headerSig,
        })
      } catch (err) {
        console.error('Webhook signature invalid:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else if (webhookSecret && (!headerId || !headerTs || !headerSig)) {
      console.error('Missing headers - skipping verification for now')
      // Don't reject - log and continue so we can see the payload
    }

    const event = JSON.parse(body)
    const admin = await createAdminClient()
    console.log('Dodo event:', event.type)

    const userId =
      event.data?.metadata?.user_id ||
      event.metadata?.user_id ||
      event.data?.customer?.metadata?.user_id

    const productId =
      event.data?.product_cart?.[0]?.product_id ||
      event.data?.items?.[0]?.product_id ||
      event.product_id || ''

    if (!userId) {
      console.warn('No user_id in webhook metadata:', JSON.stringify(event).slice(0, 300))
      return NextResponse.json({ received: true, warning: 'no user_id' })
    }

    if (event.type === 'payment.succeeded' || event.type === 'subscription.active') {
      const topupCredits = TOPUPS[productId]

      if (topupCredits) {
        const { data: profile } = await admin.from('profiles')
          .select('credits, topup_credits').eq('id', userId).single()
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
      }
    }

    if (event.type === 'subscription.cancelled') {
      const { data: profile } = await admin.from('profiles')
        .select('topup_credits').eq('id', userId).single()
      await admin.from('profiles').update({
        plan: 'free',
        credits: 10 + (profile?.topup_credits || 0),
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
