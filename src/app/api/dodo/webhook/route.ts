import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendUpgradeConfirmEmail,
  sendRenewalEmail,
  sendCancellationEmail,
  sendTopupEmail,
  sendPaymentFailedEmail,
  sendRefundEmail,
  sendAdminPaymentAlert,
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

// Plan config keyed by Dodo product ID env var — matches new 5-tier pricing
const PLANS: Record<string, { credits: number; dailyCredits: number; plan: string; label: string }> = {
  [process.env.DODO_PRODUCT_STARTER         || 'UNSET_ST1']: { credits: 150,   dailyCredits: 6,   plan: 'starter',  label: 'Starter'  },
  [process.env.DODO_PRODUCT_STARTER_ANNUAL  || 'UNSET_ST2']: { credits: 150,   dailyCredits: 6,   plan: 'starter',  label: 'Starter'  },
  [process.env.DODO_PRODUCT_BUILDER         || 'UNSET_B1']:  { credits: 500,   dailyCredits: 20,  plan: 'builder',  label: 'Builder'  },
  [process.env.DODO_PRODUCT_BUILDER_ANNUAL  || 'UNSET_B2']:  { credits: 500,   dailyCredits: 20,  plan: 'builder',  label: 'Builder'  },
  [process.env.DODO_PRODUCT_PRO             || 'UNSET_P1']:  { credits: 1500,  dailyCredits: 60,  plan: 'pro',      label: 'Pro'      },
  [process.env.DODO_PRODUCT_PRO_ANNUAL      || 'UNSET_P2']:  { credits: 1500,  dailyCredits: 60,  plan: 'pro',      label: 'Pro'      },
  [process.env.DODO_PRODUCT_GROWTH          || 'UNSET_G1']:  { credits: 4000,  dailyCredits: 160, plan: 'growth',   label: 'Growth'   },
  [process.env.DODO_PRODUCT_GROWTH_ANNUAL   || 'UNSET_G2']:  { credits: 4000,  dailyCredits: 160, plan: 'growth',   label: 'Growth'   },
  [process.env.DODO_PRODUCT_SCALE           || 'UNSET_S1']:  { credits: 10000, dailyCredits: 400, plan: 'scale',    label: 'Scale'    },
  [process.env.DODO_PRODUCT_SCALE_ANNUAL    || 'UNSET_S2']:  { credits: 10000, dailyCredits: 400, plan: 'scale',    label: 'Scale'    },
}

export async function POST(req: NextRequest) {
  let body = ''
  try {
    body = await req.text()
  } catch {
    return NextResponse.json({ error: 'Cannot read body' }, { status: 400 })
  }

  // ── Signature verification (FAIL CLOSED) ────────────────────────────────
  // This endpoint grants credits/plans with the service-role key, so an
  // unverified body must never be trusted. Reject bad/missing signatures and,
  // in production, refuse to run at all if the secret isn't configured.
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET
  const headerId  = req.headers.get('webhook-id')        || req.headers.get('svix-id')        || ''
  const headerTs  = req.headers.get('webhook-timestamp') || req.headers.get('svix-timestamp') || ''
  const headerSig = req.headers.get('webhook-signature') || req.headers.get('svix-signature') || ''

  if (webhookSecret && webhookSecret.length > 10) {
    if (!headerId || !headerTs || !headerSig) {
      console.error('Dodo webhook rejected: missing signature headers')
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 })
    }
    try {
      const { Webhook } = await import('svix')
      new Webhook(webhookSecret).verify(body, {
        'svix-id':        headerId,
        'svix-timestamp': headerTs,
        'svix-signature': headerSig,
      })
    } catch (sigErr) {
      console.error('Dodo webhook rejected: signature verification failed:', String(sigErr))
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('Dodo webhook rejected: DODO_WEBHOOK_SECRET not configured in production')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = String(event.type || '')
  console.log('Dodo event:', eventType)

  try {
    const admin = getAdmin()

    // ── Idempotency: webhooks are retried; never apply the same event twice ──
    const dedupeId = headerId || String((event.data as Record<string, unknown> | undefined)?.payment_id || (event as Record<string, unknown>).id || '')
    if (dedupeId) {
      const { error: dupeErr } = await admin
        .from('processed_webhooks')
        .insert({ id: dedupeId, source: 'dodo' })
      if (dupeErr?.code === '23505') {
        // Primary-key conflict → already processed this delivery
        console.log('Dodo webhook duplicate ignored:', dedupeId)
        return NextResponse.json({ received: true, duplicate: true })
      }
      // Any other insert error: log but still process (don't drop a real payment)
      if (dupeErr) console.warn('Dodo dedupe insert failed (processing anyway):', String(dupeErr.message || dupeErr))
    }

    const metadata =
      (event.data as Record<string, unknown> | undefined)?.metadata as Record<string, unknown> | undefined ||
      (event.metadata as Record<string, unknown> | undefined) || {}

    const userId = (metadata.user_id as string | undefined) || null

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

    // Payment failed → dunning email (no plan/credit change; processor will retry)
    if (eventType === 'payment.failed') {
      if (userEmail) sendPaymentFailedEmail(userEmail, profile?.plan as string | undefined).catch(() => {})
      console.log(`Payment failed for ${userId}`)
      return NextResponse.json({ received: true })
    }

    // Refund → confirmation email
    if (eventType === 'refund.succeeded' || eventType === 'payment.refunded' || eventType === 'refund.created') {
      if (userEmail) sendRefundEmail(userEmail).catch(() => {})
      console.log(`Refund processed for ${userId}`)
      return NextResponse.json({ received: true })
    }

    // Domain purchase confirmation: buy the domain via Vercel and attach it
    // to the project. Distinct from credit top-ups/plans — keyed by metadata,
    // not productId, since the domain product is pay-what-you-want.
    if (eventType === 'payment.succeeded' && metadata.purchase_type === 'domain') {
      const purchaseId = String(metadata.domain_purchase_id || '')
      const domain = String(metadata.domain || '')
      const projectIdForDomain = String(metadata.project_id || '') || null
      if (purchaseId && domain) {
        try {
          const { data: purchaseRow } = await admin
            .from('domain_purchases')
            .select('price_cents, contact_info')
            .eq('id', purchaseId)
            .single()
          if (!purchaseRow?.contact_info) throw new Error('No contact_info stored for this purchase')

          // WYBERAI_DOMAINS is a separately-scoped token with Vercel Registrar API
          // access (the original VERCEL_TOKEN lacked the right scope for it).
          const VERCEL_TOKEN = process.env.WYBERAI_DOMAINS || process.env.VERCEL_TOKEN
          const VERCEL_TEAM = process.env.VERCEL_TEAM_ID
          const teamQ = VERCEL_TEAM ? `?teamId=${VERCEL_TEAM}` : ''
          // Old v4/v5 domains/buy was sunset Nov 9 2025 → Registrar API, which
          // additionally requires years, expectedPrice, and ICANN contact info.
          const buyRes = await fetch(`https://api.vercel.com/v1/registrar/domains/${encodeURIComponent(domain)}/buy${teamQ}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              autoRenew: false,
              years: 1,
              expectedPrice: (purchaseRow.price_cents as number) / 100,
              contactInformation: purchaseRow.contact_info,
            }),
          })
          const buyData = await buyRes.json()
          if (!buyRes.ok) throw new Error(buyData?.message || buyData?.error?.message || `Vercel buy failed: ${buyRes.status}`)

          await admin.from('domain_purchases').update({
            status: 'purchased', purchased_at: new Date().toISOString(),
          }).eq('id', purchaseId)

          if (projectIdForDomain) {
            await admin.from('projects').update({ custom_domain: domain }).eq('id', projectIdForDomain)
          }
          console.log(`Domain purchased: ${domain} for ${userId}`)
          if (userEmail) sendAdminPaymentAlert(userEmail, `Domain purchase: ${domain}`).catch(() => {})
        } catch (buyErr) {
          console.error('Domain purchase failed after payment:', String(buyErr))
          await admin.from('domain_purchases').update({ status: 'failed' }).eq('id', purchaseId)
        }
      }
      return NextResponse.json({ received: true })
    }

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
        if (userEmail) {
          sendTopupEmail(userEmail, topupCredits, newBalance).catch(() => {})
          sendAdminPaymentAlert(userEmail, `Top-up: ${topupCredits} credits`).catch(() => {})
        }
        return NextResponse.json({ received: true })
      }

      const planConfig = PLANS[productId]
      if (!planConfig) {
        console.warn('Dodo webhook: unknown product, no plan change:', productId)
        return NextResponse.json({ received: true, warning: 'unknown product' })
      }
      await admin.from('profiles').update({
        plan: planConfig.plan,
        credits: planConfig.credits,
        daily_credits: planConfig.dailyCredits,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
      console.log(`Plan activated: ${planConfig.plan} for ${userId}`)
      if (userEmail) {
        sendUpgradeConfirmEmail(userEmail, planConfig.label, planConfig.credits).catch(() => {})
        sendAdminPaymentAlert(userEmail, `${planConfig.label} plan`).catch(() => {})
      }
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
        if (userEmail) {
          sendRenewalEmail(userEmail, planConfig.label, planConfig.credits, rollover).catch(() => {})
          sendAdminPaymentAlert(userEmail, `${planConfig.label} renewal`).catch(() => {})
        }
      }
    }

    if (eventType === 'subscription.cancelled') {
      const { data: cancelProfile } = await admin.from('profiles').select('email, plan').eq('id', userId).single()
      await admin.from('profiles').update({
        plan: 'free',
        credits: 50,
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
