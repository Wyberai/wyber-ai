import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendUpgradeConfirmEmail,
  sendRenewalEmail,
  sendCancellationEmail,
  sendTopupEmail,
} from '@/lib/email'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const TOPUPS: Record<string, number> = {
  [process.env.DODO_TOPUP_200  || 'TOPUP_UNSET1']: 200,
  [process.env.DODO_TOPUP_600  || 'TOPUP_UNSET2']: 600,
  [process.env.DODO_TOPUP_2000 || 'TOPUP_UNSET3']: 2000,
}

// Plan config keyed by Dodo product ID env var
const PLANS: Record<string, { credits: number; dailyCredits: number; plan: string; label: string; employees: number }> = {
  [process.env.DODO_PRODUCT_STARTER        || 'UNSET1']: { credits: 500,  dailyCredits: 20, plan: 'starter', label: 'Starter', employees: 3   },
  [process.env.DODO_PRODUCT_STARTER_ANNUAL || 'UNSET2']: { credits: 500,  dailyCredits: 20, plan: 'starter', label: 'Starter', employees: 3   },
  [process.env.DODO_PRODUCT_GROWTH         || 'UNSET3']: { credits: 2000, dailyCredits: 80, plan: 'growth',  label: 'Growth',  employees: 10  },
  [process.env.DODO_PRODUCT_GROWTH_ANNUAL  || 'UNSET4']: { credits: 2000, dailyCredits: 80, plan: 'growth',  label: 'Growth',  employees: 10  },
  [process.env.DODO_PRODUCT_SCALE          || 'UNSET5']: { credits: 6000, dailyCredits: 240, plan: 'scale',  label: 'Scale',  employees: -1  },
  [process.env.DODO_PRODUCT_SCALE_ANNUAL   || 'UNSET6']: { credits: 6000, dailyCredits: 240, plan: 'scale',  label: 'Scale',  employees: -1  },
}

export async function POST(req: NextRequest) {
  let body = ''
  try {
    body = await req.text()
  } catch {
    return NextResponse.json({ error: 'Cannot read body' }, { status: 400 })
  }

  // Optional signature verification
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

  if (eventType === 'payment.failed') return NextResponse.json({ received: true })

  try {
    const admin = getAdmin()

    const userId =
      (event.data as Record<string, unknown> | undefined)?.metadata?.user_id ||
      (event.metadata as Record<string, unknown> | undefined)?.user_id ||
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

    const { data: profile } = await admin
      .from('profiles')
      .select('email, credits, plan')
      .eq('id', userId)
      .single()
    const userEmail = profile?.email as string | undefined

    if (eventType === 'payment.succeeded' || eventType === 'subscription.active') {
      // Check if it's a top-up first
      const topupCredits = TOPUPS[productId]
      if (topupCredits) {
        const before = (profile?.credits as number) || 0
        const newBalance = before + topupCredits
        await admin.from('profiles').update({
          credits: newBalance,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
        console.log(`Topup +${topupCredits} for ${userId}`)
        if (userEmail) sendTopupEmail(userEmail, topupCredits, newBalance).catch(() => {})
        return NextResponse.json({ received: true })
      }

      const planConfig = PLANS[productId] || { credits: 500, dailyCredits: 20, plan: 'starter', label: 'Starter', employees: 3 }
      await admin.from('profiles').update({
        plan: planConfig.plan,
        credits: planConfig.credits,
        daily_credits: planConfig.dailyCredits,
        max_ai_employees: planConfig.employees,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
      console.log(`Plan activated: ${planConfig.plan} for ${userId}`)
      if (userEmail) sendUpgradeConfirmEmail(userEmail, planConfig.label, planConfig.credits).catch(() => {})
    }

    if (eventType === 'subscription.renewed') {
      const planConfig = PLANS[productId]
      if (planConfig) {
        const rollover = Math.min(profile?.credits || 0, planConfig.credits)
        const newBalance = planConfig.credits + rollover
        await admin.from('profiles').update({
          credits: newBalance,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
        console.log(`Renewed for ${userId}, rollover: ${rollover}`)
        if (userEmail) sendRenewalEmail(userEmail, planConfig.label, planConfig.credits, rollover).catch(() => {})
      }
    }

    if (eventType === 'subscription.cancelled') {
      const { data: cancelProfile } = await admin.from('profiles').select('email, plan').eq('id', userId).single()
      await admin.from('profiles').update({
        plan: 'free',
        credits: 50,
        max_ai_employees: 0,
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
      console.log(`Cancelled for ${userId}`)
      const planLabel = cancelProfile?.plan ?? 'plan'
      if (cancelProfile?.email) sendCancellationEmail(cancelProfile.email, planLabel).catch(() => {})
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook DB error:', String(err))
    return NextResponse.json({ received: true, dbError: String(err) })
  }
}
