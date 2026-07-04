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
import { sendMetaEvent } from '@/lib/meta-capi'
import { PLAN_VALUE, PLAN_VALUE_INR } from '@/lib/pricing-values'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const TOPUPS: Record<string, number> = {
  [process.env.DODO_TOPUP_200      || 'TOPUP_UNSET1']: 200,
  [process.env.DODO_TOPUP_600      || 'TOPUP_UNSET2']: 600,
  [process.env.DODO_TOPUP_2000     || 'TOPUP_UNSET3']: 2000,
  // India (INR) top-ups — same credit packs, separate INR-priced products.
  [process.env.DODO_TOPUP_200_INR  || 'TOPUP_UNSET4']: 200,
  [process.env.DODO_TOPUP_600_INR  || 'TOPUP_UNSET5']: 600,
  [process.env.DODO_TOPUP_2000_INR || 'TOPUP_UNSET6']: 2000,
}

// Plan config, shared by the USD and INR products (same tier, same credits —
// only the charge currency differs). Spark is the India-only entry tier.
type PlanConfig = { credits: number; dailyCredits: number; plan: string; label: string }
const SPARK:   PlanConfig = { credits: 50,    dailyCredits: 2,   plan: 'spark',   label: 'Spark'   }
const STARTER: PlanConfig = { credits: 150,   dailyCredits: 6,   plan: 'starter', label: 'Starter' }
const BUILDER: PlanConfig = { credits: 500,   dailyCredits: 20,  plan: 'builder', label: 'Builder' }
const PRO:     PlanConfig = { credits: 1500,  dailyCredits: 60,  plan: 'pro',     label: 'Pro'     }
const GROWTH:  PlanConfig = { credits: 4000,  dailyCredits: 160, plan: 'growth',  label: 'Growth'  }
const SCALE:   PlanConfig = { credits: 10000, dailyCredits: 400, plan: 'scale',   label: 'Scale'   }

// Keyed by Dodo product ID env var. INR product IDs map to the SAME config, so
// a rupee checkout grants credits/plan identically — without these the payment
// would succeed but grant nothing.
const PLANS: Record<string, PlanConfig> = {
  // USD
  [process.env.DODO_PRODUCT_STARTER          || 'UNSET_ST1']: STARTER,
  [process.env.DODO_PRODUCT_STARTER_ANNUAL   || 'UNSET_ST2']: STARTER,
  [process.env.DODO_PRODUCT_BUILDER          || 'UNSET_B1']:  BUILDER,
  [process.env.DODO_PRODUCT_BUILDER_ANNUAL   || 'UNSET_B2']:  BUILDER,
  [process.env.DODO_PRODUCT_PRO              || 'UNSET_P1']:  PRO,
  [process.env.DODO_PRODUCT_PRO_ANNUAL       || 'UNSET_P2']:  PRO,
  [process.env.DODO_PRODUCT_GROWTH           || 'UNSET_G1']:  GROWTH,
  [process.env.DODO_PRODUCT_GROWTH_ANNUAL    || 'UNSET_G2']:  GROWTH,
  [process.env.DODO_PRODUCT_SCALE            || 'UNSET_S1']:  SCALE,
  [process.env.DODO_PRODUCT_SCALE_ANNUAL     || 'UNSET_S2']:  SCALE,
  // India (INR) — including the Spark entry tier
  [process.env.DODO_PRODUCT_SPARK_INR        || 'UNSET_SPK1']: SPARK,
  [process.env.DODO_PRODUCT_SPARK_ANNUAL_INR || 'UNSET_SPK2']: SPARK,
  [process.env.DODO_PRODUCT_STARTER_INR      || 'UNSET_ST1I']: STARTER,
  [process.env.DODO_PRODUCT_STARTER_ANNUAL_INR || 'UNSET_ST2I']: STARTER,
  [process.env.DODO_PRODUCT_BUILDER_INR      || 'UNSET_B1I']:  BUILDER,
  [process.env.DODO_PRODUCT_BUILDER_ANNUAL_INR || 'UNSET_B2I']: BUILDER,
  [process.env.DODO_PRODUCT_PRO_INR          || 'UNSET_P1I']:  PRO,
  [process.env.DODO_PRODUCT_PRO_ANNUAL_INR   || 'UNSET_P2I']:  PRO,
  // Spark USD (in case it's ever sold in USD — spark_monthly=$6)
  [process.env.DODO_PRODUCT_SPARK            || 'UNSET_SPK3']: SPARK,
  [process.env.DODO_PRODUCT_SPARK_ANNUAL     || 'UNSET_SPK4']: SPARK,
}

// Report a paid conversion to Meta (Conversions API). Server-side is the only
// place with the real payment id + amount and it can't be blocked. Value comes
// from the plan key stashed in checkout metadata; eventId is the payment id so
// Meta dedupes retries. Best-effort — sendMetaEvent no-ops without creds and
// never throws.
async function reportMetaPurchase(
  req: NextRequest,
  event: Record<string, unknown> & { data?: unknown },
  metadata: Record<string, unknown>,
  userEmail: string | undefined,
  dedupeId: string,
) {
  const planKey = (metadata.plan as string | undefined) || ''
  const currency = (metadata.currency as string | undefined) === 'INR' ? 'INR' : 'USD'
  const value = (currency === 'INR' ? PLAN_VALUE_INR[planKey] : PLAN_VALUE[planKey]) ?? 0
  const evData = event.data as Record<string, unknown> | undefined
  const paymentId = String(evData?.payment_id || dedupeId || '')
  await sendMetaEvent({
    eventName: 'Purchase',
    eventId: `purchase_${paymentId}`,
    email: userEmail || null,
    value,
    currency,
    clientIp: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: req.headers.get('user-agent'),
  })
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

  // Hoisted so the catch below can release the idempotency claims on failure.
  const dedupeId = headerId || String((event.data as Record<string, unknown> | undefined)?.payment_id || (event as Record<string, unknown>).id || '')
  // Every processed_webhooks claim taken during this delivery — the catch
  // releases ALL of them so a retried delivery re-runs the full grant.
  const claimedKeys: string[] = []
  if (dedupeId) claimedKeys.push(dedupeId)

  try {
    const admin = getAdmin()

    // ── Idempotency: webhooks are retried; never apply the same event twice ──
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
      // A real payment with no user to credit is a silent money-taken/nothing-
      // granted black hole — alert a human to reconcile it manually instead of
      // just logging into the void. Still ack: retries can't fix missing metadata.
      console.warn('No user_id in event metadata for', eventType)
      if (eventType === 'payment.succeeded' || eventType === 'subscription.active') {
        sendAdminPaymentAlert(
          'UNKNOWN USER — reconcile manually',
          `⚠ ${eventType} arrived with NO user_id metadata. product=${productId || 'unknown'} webhook-id=${dedupeId || 'none'} — find the payment in the Dodo dashboard and grant credits by hand.`
        ).catch(() => {})
      }
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
        // Atomic when the adjust_credits RPC exists (migration
        // 20260702130000); read-then-write fallback until it's applied.
        let newBalance: number | null = null
        const { data: adjusted, error: adjErr } = await admin.rpc('adjust_credits', {
          p_user_id: userId, p_delta: topupCredits,
        })
        if (!adjErr && typeof adjusted === 'number') newBalance = adjusted
        if (newBalance === null) {
          const before = (profile?.credits as number) || 0
          newBalance = before + topupCredits
          const { error: updErr } = await admin.from('profiles').update({
            credits: newBalance,
            updated_at: new Date().toISOString(),
          }).eq('id', userId)
          // A failed grant must NOT be acked — throw so the catch below
          // releases the idempotency claim and Dodo retries the delivery.
          if (updErr) throw updErr
        }
        console.log(`Topup +${topupCredits} for ${userId}`)
        if (userEmail) {
          sendTopupEmail(userEmail, topupCredits, newBalance).catch(() => {})
          sendAdminPaymentAlert(userEmail, `Top-up: ${topupCredits} credits`).catch(() => {})
        }
        await reportMetaPurchase(req, event, metadata, userEmail, dedupeId)
        return NextResponse.json({ received: true })
      }

      const planConfig = PLANS[productId]
      if (!planConfig) {
        console.warn('Dodo webhook: unknown product, no plan change:', productId)
        return NextResponse.json({ received: true, warning: 'unknown product' })
      }

      // Plan credits are ADDED to the existing balance (top-ups "never expire"
      // — activation must not wipe them). Because payment.succeeded and
      // subscription.active BOTH fire for the same subscribe (and were harmless
      // when this was a SET), the grant is deduped across the pair on the
      // subscription id: whichever event lands first grants, the other only
      // refreshes the plan fields. A renewal's payment.succeeded reuses the
      // same subscription id, so it can't re-grant either — renewals are
      // credited by the subscription.renewed handler below.
      const evData = event.data as Record<string, unknown> | undefined
      const subscriptionRef = String(evData?.subscription_id || evData?.payment_id || evData?.id || dedupeId || '')
      let grantCredits = true
      if (subscriptionRef) {
        const grantKey = `plan-grant:${userId}:${subscriptionRef}`
        const { error: grantDupeErr } = await admin
          .from('processed_webhooks')
          .insert({ id: grantKey, source: 'dodo-plan-grant' })
        if (grantDupeErr?.code === '23505') {
          grantCredits = false
        } else if (grantDupeErr) {
          console.warn('Plan-grant dedupe insert failed (granting anyway):', String(grantDupeErr.message || grantDupeErr))
        } else {
          claimedKeys.push(grantKey)
        }
      }

      let newBalance: number | null = null
      if (grantCredits) {
        const { data: adjusted, error: adjErr } = await admin.rpc('adjust_credits', {
          p_user_id: userId, p_delta: planConfig.credits,
        })
        if (!adjErr && typeof adjusted === 'number') newBalance = adjusted
      }
      const planUpdate: Record<string, unknown> = {
        plan: planConfig.plan,
        daily_credits: planConfig.dailyCredits,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      }
      // RPC unavailable (missing grant) → non-atomic fallback add
      if (grantCredits && newBalance === null) {
        planUpdate.credits = ((profile?.credits as number) || 0) + planConfig.credits
      }
      const { error: planErr } = await admin.from('profiles').update(planUpdate).eq('id', userId)
      if (planErr) throw planErr // unacked → Dodo retries (all claims released below)
      console.log(`Plan activated: ${planConfig.plan} for ${userId} (credits ${grantCredits ? `+${planConfig.credits}` : 'already granted'})`)
      if (userEmail && grantCredits) {
        sendUpgradeConfirmEmail(userEmail, planConfig.label, planConfig.credits).catch(() => {})
        sendAdminPaymentAlert(userEmail, `${planConfig.label} plan`).catch(() => {})
      }
      // Report the Meta Purchase once — on the event that actually grants (the
      // payment.succeeded / subscription.active pair fires twice per subscribe).
      if (grantCredits) await reportMetaPurchase(req, event, metadata, userEmail, dedupeId)
    }

    if (eventType === 'subscription.renewed') {
      const planConfig = PLANS[productId]
      if (planConfig) {
        const rollover = Math.min(profile?.credits || 0, planConfig.credits)
        const newBalance = planConfig.credits + rollover
        const { error: renewErr } = await admin.from('profiles').update({
          credits: newBalance,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
        if (renewErr) throw renewErr // unacked → Dodo retries
        console.log(`Renewed for ${userId}, rollover: ${rollover}`)
        if (userEmail) {
          sendRenewalEmail(userEmail, planConfig.label, planConfig.credits, rollover).catch(() => {})
          sendAdminPaymentAlert(userEmail, `${planConfig.label} renewal`).catch(() => {})
        }
      }
    }

    if (eventType === 'subscription.cancelled') {
      const { data: cancelProfile } = await admin.from('profiles').select('email, plan').eq('id', userId).single()
      // Keep the credit balance — top-ups never expire and the user paid for
      // what's left. Only the plan drops to free; daily_credits returns to the
      // free-tier drip (3) so a cancelled Scale user doesn't keep receiving
      // 400/day from the add_daily_credits cron.
      await admin.from('profiles').update({
        plan: 'free',
        daily_credits: 3,
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
      console.log(`Cancelled for ${userId} (balance kept)`)
      const planLabel = cancelProfile?.plan ?? 'plan'
      if (cancelProfile?.email) sendCancellationEmail(cancelProfile.email, planLabel).catch(() => {})
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook DB error:', String(err))
    // A failed grant must never be acked with 200: the user paid, and the
    // provider's retry — the one chance to fix it — would then be swallowed
    // as a duplicate by the idempotency claims taken above. Release every
    // claim from this delivery (including the plan-grant key) and return 500
    // so Dodo redelivers and the grant re-runs.
    if (claimedKeys.length > 0) {
      try { await getAdmin().from('processed_webhooks').delete().in('id', claimedKeys) } catch { /* best-effort */ }
    }
    return NextResponse.json({ error: 'Processing failed — retry' }, { status: 500 })
  }
}
