import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  sendCreditsExhaustedEmail, sendGettingStartedNudgeEmail, sendPublishNudgeEmail,
  sendQuickStartNudgeEmail, sendNextStepNurtureEmail, sendSocialProofEmail,
  sendFeatureSpotlightEmail, sendReferralNudgeEmail, sendEarlyCreditWarningEmail,
  sendWinBackEmail, sendBreakupEmail, sendCheckoutAbandonedEmail, sendUnusedCreditsEmail,
} from '@/lib/email'
import type { FeatureSpotlightKey } from '@/lib/email'
import type { Currency } from '@/lib/currency'
import { userCurrency } from '@/lib/user-currency'

function planLabelFromKey(key: string): string {
  if (key.startsWith('topup_')) return `${key.replace('topup_', '')} credits`
  const base = key.replace(/_monthly$|_annual$/, '')
  return base.charAt(0).toUpperCase() + base.slice(1)
}
import { unsubscribeUrl } from '@/lib/email/unsubscribe'
import { userCurrency } from '@/lib/user-currency'

export const maxDuration = 120

// Daily lifecycle drip (vercel.json cron). Every campaign is tracked in
// email_events (kind + sent_count + last_sent_at) so a "daily" cron never
// means "daily email" to any one person. Roughly in send order per user:
//   quick-start       — 18–36h old, zero projects: once (fast touch 1)
//   getting-started   — 3–14 days old, zero projects: once (touch 2)
//   social-proof      — 3–4 days old, has ≥1 project, low engagement: once
//   feature-spotlight — 5–7 days old: once, rotates through FEATURE_KEYS
//   referral-nudge     — 5+ days old, ≥2 projects or ≥1 published: once
//   publish-nudge      — has an unpublished 3+ day-old project: every 4 days, max 2
//   early-credit-warn — free plan, 21–50 credits: once
//   credits-drip       — free plan, zero balance: every 3 days, max 4
//   win-back           — 14–30 days since last project activity: once
//   breakup            — already got win-back, 45+ days since signup: once
// All campaigns skip email_opt_out users. Transactional email is unaffected.
const DRIP_INTERVAL_DAYS = 3
const DRIP_MAX_SENDS = 4
const PUBLISH_NUDGE_INTERVAL_DAYS = 4
const PUBLISH_NUDGE_MAX_SENDS = 2
const BATCH = 50 // per campaign per run — spreads big backlogs over days
const FEATURE_KEYS: FeatureSpotlightKey[] = ['mobile', 'connectors', 'domain', 'templates']

type EventRow = { user_id: string; kind: string; sent_count: number; last_sent_at: string | null }

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()
  const now = Date.now()
  const dueBefore = new Date(now - DRIP_INTERVAL_DAYS * 24 * 3600_000).toISOString()
  const publishNudgeDueBefore = new Date(now - PUBLISH_NUDGE_INTERVAL_DAYS * 24 * 3600_000).toISOString()
  const results = {
    creditsDrip: 0, gettingStarted: 0, publishNudge: 0,
    quickStart: 0, nextStep: 0, socialProof: 0, featureSpotlight: 0, referralNudge: 0,
    earlyCreditWarn: 0, checkoutAbandoned: 0, winBack: 0, breakup: 0, unusedCredits: 0, errors: 0,
  }

  // Load prior sends once; keyed lookups below. If the tracking table doesn't
  // exist yet (migration 20260703110000 pending), bail — a drip with no send
  // tracking would mean daily emails to everyone matching the filters.
  const { data: eventRows, error: evErr } = await admin.from('email_events').select('user_id, kind, sent_count, last_sent_at')
  if (evErr) {
    console.error('[email-drip] email_events unavailable — apply migration 20260703110000 first:', evErr.message)
    return NextResponse.json({ skipped: true, reason: 'email_events table unavailable' }, { status: 200 })
  }
  const events = new Map<string, EventRow>()
  for (const r of (eventRows ?? []) as EventRow[]) events.set(`${r.user_id}:${r.kind}`, r)

  const markSent = async (userId: string, kind: string) => {
    const prev = events.get(`${userId}:${kind}`)
    await admin.from('email_events').upsert({
      user_id: userId, kind,
      sent_count: (prev?.sent_count ?? 0) + 1,
      last_sent_at: new Date().toISOString(),
    })
  }

  try {
    // ── 1. Out-of-credits drip (free plan, zero balance) ──────────────────
    const { data: broke } = await admin
      .from('profiles')
      .select('id, email, credits, plan, email_opt_out')
      .eq('plan', 'free')
      .lte('credits', 0)
      .eq('email_opt_out', false)
      .limit(500)
    for (const u of broke ?? []) {
      if (results.creditsDrip >= BATCH) break
      if (!u.email) continue
      const ev = events.get(`${u.id}:credits-drip`)
      if (ev && ev.sent_count >= DRIP_MAX_SENDS) continue
      if (ev?.last_sent_at && ev.last_sent_at > dueBefore) continue
      try {
        await sendCreditsExhaustedEmail(u.email, (ev?.sent_count ?? 0) + 1, unsubscribeUrl(u.email), await userCurrency(admin, u.id))
        await markSent(u.id, 'credits-drip')
        results.creditsDrip++
      } catch { results.errors++ }
    }

    // ── 2a. Quick-start nudge (4–12h old, never generated an app) — touch 1 ─
    // Window tightened from 18–36h to 4–12h: by 18h the user has already mentally
    // churned. 4h catches them while the signup intent is still warm.
    const fourHoursAgo = new Date(now - 4 * 3600_000).toISOString()
    const twelveHoursAgo = new Date(now - 12 * 3600_000).toISOString()
    const { data: brandNew } = await admin
      .from('profiles')
      .select('id, email, full_name, email_opt_out, created_at')
      .lt('created_at', fourHoursAgo)
      .gt('created_at', twelveHoursAgo)
      .eq('email_opt_out', false)
      .limit(300)
    for (const u of brandNew ?? []) {
      if (results.quickStart >= BATCH) break
      if (!u.email) continue
      if (events.get(`${u.id}:quick-start`)) continue // once, ever
      const { count } = await admin.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', u.id)
      if ((count ?? 0) > 0) continue
      try {
        await sendQuickStartNudgeEmail(u.email, (u.full_name as string | null)?.split(' ')[0] || u.email.split('@')[0], unsubscribeUrl(u.email))
        await markSent(u.id, 'quick-start')
        results.quickStart++
      } catch { results.errors++ }
    }

    // ── 2a2. Next-step nurture (already had their first build, day after) ──
    const { data: firstBuilders } = await admin
      .from('profiles')
      .select('id, email, full_name, email_opt_out, created_at, first_build_emailed')
      .eq('first_build_emailed', true)
      .lt('created_at', eighteenHoursAgo)
      .eq('email_opt_out', false)
      .limit(300)
    for (const u of firstBuilders ?? []) {
      if (results.nextStep >= BATCH) break
      if (!u.email) continue
      if (events.get(`${u.id}:next-step`)) continue // once, ever
      const { data: latestProject } = await admin
        .from('projects')
        .select('id, name')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!latestProject) continue
      try {
        await sendNextStepNurtureEmail(u.email, (u.full_name as string | null)?.split(' ')[0] || u.email.split('@')[0], latestProject.name || 'Your app', latestProject.id)
        await markSent(u.id, 'next-step')
        results.nextStep++
      } catch { results.errors++ }
    }

    // ── 2b. Getting-started nudge (3–14 days old, never generated an app) — touch 2
    const threeDaysAgoTS = new Date(now - 3 * 24 * 3600_000).toISOString()
    const twoWeeksAgo = new Date(now - 14 * 24 * 3600_000).toISOString()
    const { data: fresh } = await admin
      .from('profiles')
      .select('id, email, full_name, email_opt_out, created_at')
      .lt('created_at', threeDaysAgoTS)
      .gt('created_at', twoWeeksAgo)
      .eq('email_opt_out', false)
      .limit(300)
    for (const u of fresh ?? []) {
      if (results.gettingStarted >= BATCH) break
      if (!u.email) continue
      if (events.get(`${u.id}:getting-started`)) continue // once, ever
      const { count } = await admin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', u.id)
      if ((count ?? 0) > 0) continue
      try {
        await sendGettingStartedNudgeEmail(u.email, (u.full_name as string | null)?.split(' ')[0] || u.email.split('@')[0], unsubscribeUrl(u.email))
        await markSent(u.id, 'getting-started')
        results.gettingStarted++
      } catch { results.errors++ }
    }

    // ── 2c. Social proof (3–4 days old, HAS built something already) ───────
    const fourDaysAgo = new Date(now - 4 * 24 * 3600_000).toISOString()
    const { data: withProject } = await admin
      .from('profiles')
      .select('id, email, full_name, email_opt_out, created_at')
      .lt('created_at', threeDaysAgoTS)
      .gt('created_at', fourDaysAgo)
      .eq('email_opt_out', false)
      .limit(300)
    for (const u of withProject ?? []) {
      if (results.socialProof >= BATCH) break
      if (!u.email) continue
      if (events.get(`${u.id}:social-proof`)) continue
      const { count } = await admin.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', u.id)
      if ((count ?? 0) === 0) continue // this is the getting-started audience instead
      try {
        await sendSocialProofEmail(u.email, (u.full_name as string | null)?.split(' ')[0] || u.email.split('@')[0])
        await markSent(u.id, 'social-proof')
        results.socialProof++
      } catch { results.errors++ }
    }

    // ── 2d. Feature spotlight (5–7 days old, any engagement level) ─────────
    const fiveDaysAgo = new Date(now - 5 * 24 * 3600_000).toISOString()
    const sevenDaysAgo = new Date(now - 7 * 24 * 3600_000).toISOString()
    const { data: weekOld } = await admin
      .from('profiles')
      .select('id, email, email_opt_out, created_at')
      .lt('created_at', fiveDaysAgo)
      .gt('created_at', sevenDaysAgo)
      .eq('email_opt_out', false)
      .limit(300)
    for (const u of weekOld ?? []) {
      if (results.featureSpotlight >= BATCH) break
      if (!u.email) continue
      if (events.get(`${u.id}:feature-spotlight`)) continue
      // Rotate deterministically per-user so re-runs don't reshuffle who gets what.
      const key = FEATURE_KEYS[u.id.charCodeAt(0) % FEATURE_KEYS.length]
      try {
        await sendFeatureSpotlightEmail(u.email, key)
        await markSent(u.id, 'feature-spotlight')
        results.featureSpotlight++
      } catch { results.errors++ }
    }

    // ── 2e. Referral nudge (5+ days old, real engagement: 2+ projects or 1 published)
    const { data: engaged } = await admin
      .from('profiles')
      .select('id, email, full_name, email_opt_out, created_at, referral_code')
      .lt('created_at', fiveDaysAgo)
      .eq('email_opt_out', false)
      .limit(300)
    for (const u of engaged ?? []) {
      if (results.referralNudge >= BATCH) break
      if (!u.email || !u.referral_code) continue
      if (events.get(`${u.id}:referral-nudge`)) continue
      const { count: projectCount } = await admin.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', u.id)
      const { count: liveCount } = await admin.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', u.id).eq('is_public', true)
      if ((projectCount ?? 0) < 2 && (liveCount ?? 0) < 1) continue
      try {
        await sendReferralNudgeEmail(u.email, (u.full_name as string | null)?.split(' ')[0] || u.email.split('@')[0], u.referral_code)
        await markSent(u.id, 'referral-nudge')
        results.referralNudge++
      } catch { results.errors++ }
    }

    // ── 3. Publish nudge (has a 3+ day-old project, nothing published) ─────
    // Escalates: touch 1 then touch 2, spaced PUBLISH_NUDGE_INTERVAL_DAYS apart.
    const threeDaysAgo = threeDaysAgoTS
    const { data: unpublished } = await admin
      .from('projects')
      .select('id, name, user_id, updated_at, is_public')
      .eq('is_public', false)
      .lt('updated_at', threeDaysAgo)
      .not('files', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(300)
    const seenOwner = new Set<string>()
    for (const proj of unpublished ?? []) {
      if (results.publishNudge >= BATCH) break
      if (seenOwner.has(proj.user_id)) continue
      seenOwner.add(proj.user_id)
      const ev = events.get(`${proj.user_id}:publish-nudge`)
      if (ev && ev.sent_count >= PUBLISH_NUDGE_MAX_SENDS) continue
      if (ev?.last_sent_at && ev.last_sent_at > publishNudgeDueBefore) continue
      // Skip owners who already have ANY live app — they know how to publish.
      const { count: liveCount } = await admin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', proj.user_id)
        .eq('is_public', true)
      if ((liveCount ?? 0) > 0) continue
      const { data: owner } = await admin
        .from('profiles')
        .select('email, email_opt_out')
        .eq('id', proj.user_id)
        .single()
      if (!owner?.email || owner.email_opt_out) continue
      try {
        await sendPublishNudgeEmail(owner.email, proj.name || 'Your app', proj.id, unsubscribeUrl(owner.email), (ev?.sent_count ?? 0) + 1)
        await markSent(proj.user_id, 'publish-nudge')
        results.publishNudge++
      } catch { results.errors++ }
    }

    // ── 4. Early credit warning (free plan, 21–50 credits — before credit-low) ─
    const { data: gettingLow } = await admin
      .from('profiles')
      .select('id, email, credits, plan, email_opt_out')
      .eq('plan', 'free')
      .gt('credits', 20)
      .lte('credits', 50)
      .eq('email_opt_out', false)
      .limit(300)
    for (const u of gettingLow ?? []) {
      if (results.earlyCreditWarn >= BATCH) break
      if (!u.email) continue
      if (events.get(`${u.id}:early-credit-warn`)) continue // once, ever
      // Only warn users who have actually built something — fresh signups start
      // at 50 credits, so "credits <= 50" without this check fires immediately
      // on day 1 before they've even tried the product.
      const { count: builtCount } = await admin.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', u.id)
      if ((builtCount ?? 0) === 0) continue
      try {
        await sendEarlyCreditWarningEmail(u.email, u.credits)
        await markSent(u.id, 'early-credit-warn')
        results.earlyCreditWarn++
      } catch { results.errors++ }
    }

    // ── 4b. Checkout abandoned (1–72h ago, never converted) ──────────────────
    // Window extended to 72h to catch procrastinators. The once-ever guard means
    // each user only gets one abandoned-cart email regardless of the window.
    // checkout_attempts may not exist yet — skip quietly on missing table.
    const oneHourAgo = new Date(now - 3600_000).toISOString()
    const seventyTwoHoursAgo = new Date(now - 72 * 3600_000).toISOString()
    const { data: abandoned } = await admin
      .from('checkout_attempts')
      .select('id, user_id, plan_key, currency, created_at')
      .eq('converted', false)
      .lt('created_at', oneHourAgo)
      .gt('created_at', seventyTwoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(300)
    const seenCheckoutOwner = new Set<string>()
    for (const attempt of (abandoned ?? []) as { id: string; user_id: string; plan_key: string; currency: string }[]) {
      if (results.checkoutAbandoned >= BATCH) break
      if (seenCheckoutOwner.has(attempt.user_id)) continue
      seenCheckoutOwner.add(attempt.user_id)
      if (events.get(`${attempt.user_id}:checkout-abandoned`)) continue // once, ever
      const { data: owner } = await admin
        .from('profiles')
        .select('email, plan, email_opt_out')
        .eq('id', attempt.user_id)
        .single()
      if (!owner?.email || owner.email_opt_out) continue
      // Already upgraded some other way (e.g. a different completed checkout) — skip.
      if (owner.plan && owner.plan !== 'free' && !attempt.plan_key.startsWith('topup_')) continue
      try {
        await sendCheckoutAbandonedEmail(owner.email, planLabelFromKey(attempt.plan_key), (attempt.currency as Currency) || 'USD')
        await markSent(attempt.user_id, 'checkout-abandoned')
        results.checkoutAbandoned++
      } catch { results.errors++ }
    }

    // ── 4c. Unused credits (3–10 days old, 0 builds, credits ≥ 45) ───────────
    // The "stuck at 55" cohort: signed up, never triggered a build, free credits
    // accumulating. One hard-sell email with the annual plan front and centre.
    const threeDaysAgoStrict = new Date(now - 3 * 24 * 3600_000).toISOString()
    const tenDaysAgo = new Date(now - 10 * 24 * 3600_000).toISOString()
    const { data: idleSignups } = await admin
      .from('profiles')
      .select('id, email, full_name, credits, email_opt_out, created_at')
      .eq('plan', 'free')
      .gte('credits', 45)
      .lt('created_at', threeDaysAgoStrict)
      .gt('created_at', tenDaysAgo)
      .eq('email_opt_out', false)
      .limit(300)
    for (const u of idleSignups ?? []) {
      if (results.unusedCredits >= BATCH) break
      if (!u.email) continue
      if (events.get(`${u.id}:unused-credits`)) continue // once, ever
      const { count: builtCount } = await admin.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', u.id)
      if ((builtCount ?? 0) > 0) continue // they built something — not this cohort
      try {
        const cur = await userCurrency(admin, u.id)
        await sendUnusedCreditsEmail(u.email, (u.full_name as string | null)?.split(' ')[0] || u.email.split('@')[0], u.credits, unsubscribeUrl(u.email), cur)
        await markSent(u.id, 'unused-credits')
        results.unusedCredits++
      } catch { results.errors++ }
    }

    // ── 5. Win-back (14–30 days since last project update, credits still unused)
    const fourteenDaysAgo = new Date(now - 14 * 24 * 3600_000).toISOString()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 3600_000).toISOString()
    const { data: dormant } = await admin
      .from('projects')
      .select('user_id, updated_at')
      .lt('updated_at', fourteenDaysAgo)
      .gt('updated_at', thirtyDaysAgo)
      .order('updated_at', { ascending: false })
      .limit(500)
    const seenDormantOwner = new Set<string>()
    for (const proj of dormant ?? []) {
      if (results.winBack >= BATCH) break
      if (seenDormantOwner.has(proj.user_id)) continue
      seenDormantOwner.add(proj.user_id)
      if (events.get(`${proj.user_id}:win-back`)) continue // once, ever
      // Skip anyone with a MORE recent project — they're not actually dormant.
      const { count: recentCount } = await admin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', proj.user_id)
        .gt('updated_at', fourteenDaysAgo)
      if ((recentCount ?? 0) > 0) continue
      const { data: owner } = await admin
        .from('profiles')
        .select('email, full_name, credits, email_opt_out')
        .eq('id', proj.user_id)
        .single()
      if (!owner?.email || owner.email_opt_out || (owner.credits ?? 0) <= 0) continue
      try {
        await sendWinBackEmail(owner.email, (owner.full_name as string | null)?.split(' ')[0] || owner.email.split('@')[0], owner.credits, unsubscribeUrl(owner.email))
        await markSent(proj.user_id, 'win-back')
        results.winBack++
      } catch { results.errors++ }
    }

    // ── 6. Breakup (already got win-back, 45+ days since signup, still silent) ─
    const fortyFiveDaysAgo = new Date(now - 45 * 24 * 3600_000).toISOString()
    const winBackSent = (eventRows ?? []).filter((r: EventRow) => r.kind === 'win-back')
    for (const wb of winBackSent) {
      if (results.breakup >= BATCH) break
      if (events.get(`${wb.user_id}:breakup`)) continue // once, ever
      if (!wb.last_sent_at || wb.last_sent_at > fortyFiveDaysAgo) continue // win-back itself must be 45+ days old
      const { data: owner } = await admin
        .from('profiles')
        .select('email, full_name, email_opt_out')
        .eq('id', wb.user_id)
        .single()
      if (!owner?.email || owner.email_opt_out) continue
      const { count: recentCount } = await admin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', wb.user_id)
        .gt('updated_at', fourteenDaysAgo)
      if ((recentCount ?? 0) > 0) continue // they came back — no breakup needed
      try {
        await sendBreakupEmail(owner.email, (owner.full_name as string | null)?.split(' ')[0] || owner.email.split('@')[0], unsubscribeUrl(owner.email))
        await markSent(wb.user_id, 'breakup')
        results.breakup++
      } catch { results.errors++ }
    }
  } catch (err) {
    console.error('[email-drip] run failed:', String(err))
    return NextResponse.json({ ...results, error: String(err) }, { status: 500 })
  }

  console.log('[email-drip]', JSON.stringify({ ...results, unusedCredits: results.unusedCredits }))
  return NextResponse.json(results)
}
