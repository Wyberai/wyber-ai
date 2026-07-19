import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Composio } from '@composio/core'
import { creditCost } from '@/lib/credits'
import { sendCreditLowEmail } from '@/lib/email'
import { userCurrency } from '@/lib/user-currency'
import { notifyPush } from '@/lib/push'

const ITER_COST    = creditCost('execution', 'default') // 2 credits
const MAX_RUN_COST = ITER_COST * 11                     // 22 credits — same ceiling as run route

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST /api/composio/webhook
// Public endpoint — Composio POSTs here whenever a trigger fires (e.g. new Gmail).
// All requests are rejected unless HMAC signature is valid.
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.COMPOSIO_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[composio/webhook] COMPOSIO_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // ── HMAC verification — reject unsigned requests immediately ─────────────
  const webhookId        = req.headers.get('webhook-id')        ?? ''
  const webhookTimestamp = req.headers.get('webhook-timestamp') ?? ''
  const webhookSignature = req.headers.get('webhook-signature') ?? ''
  const rawBody          = await req.text()

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 401 })
  }

  const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY! })

  let verified: { payload: { triggerSlug?: string; connectedAccountId?: string; triggerId?: string; data?: Record<string, unknown> } }
  try {
    verified = await composio.triggers.verifyWebhook({
      id:        webhookId,
      timestamp: webhookTimestamp,
      signature: webhookSignature,
      payload:   rawBody,
      secret:    webhookSecret,
    })
  } catch (err) {
    console.error('[composio/webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const { triggerId, connectedAccountId } = verified.payload as {
    triggerId?: string
    connectedAccountId?: string
    triggerSlug?: string
    data?: Record<string, unknown>
  }

  if (!triggerId) {
    return NextResponse.json({ error: 'No triggerId in payload' }, { status: 400 })
  }

  const admin = getAdmin()

  // ── Lookup subscription ───────────────────────────────────────────────────
  const { data: sub, error: subErr } = await admin
    .from('composio_trigger_subscriptions')
    .select('*')
    .eq('trigger_id', triggerId)
    .eq('is_active', true)
    .single()

  if (subErr || !sub) {
    // No active subscription — Composio may fire for triggers we deleted; ignore.
    return NextResponse.json({ skipped: 'no_active_subscription' })
  }

  const tag = `[composio/webhook] trigger=${triggerId} user=${sub.user_id} agent=${sub.agent_id}`

  // ── Daily cap ─────────────────────────────────────────────────────────────
  const now       = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const { count: todayCount } = await admin
    .from('agent_executions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', sub.user_id)
    .eq('agent_id', sub.agent_id)
    .eq('triggered_by', 'trigger')
    .gte('started_at', todayStart.toISOString())

  if ((todayCount ?? 0) >= sub.daily_cap) {
    console.log(`${tag} SKIP — daily cap hit (${todayCount}/${sub.daily_cap})`)
    return NextResponse.json({ skipped: 'daily_cap' })
  }

  // ── Pre-flight credit check ───────────────────────────────────────────────
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('credits, email')
    .eq('id', sub.user_id)
    .single()

  if (profileErr || !profile) {
    console.error(`${tag} SKIP — could not read profile:`, profileErr)
    return NextResponse.json({ skipped: 'profile_read_error' })
  }

  if (profile.credits < MAX_RUN_COST) {
    console.log(`${tag} SKIP — insufficient credits (${profile.credits} < ${MAX_RUN_COST})`)

    try { await sendCreditLowEmail(profile.email, profile.credits, await userCurrency(admin, sub.user_id)) } catch {}

    await admin.from('notifications').insert({
      user_id: sub.user_id,
      type: 'trigger_agent_skipped',
      payload: {
        agent_id:        sub.agent_id,
        trigger_slug:    sub.trigger_slug,
        credits_balance: profile.credits,
        credits_needed:  MAX_RUN_COST,
        upgrade_url:     `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      },
    })

    // Best-effort push to the companion app (never blocks the webhook).
    await notifyPush(admin, sub.user_id, 'scheduled_agent_skipped', {
      agent_id: sub.agent_id,
      upgrade_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    })

    return NextResponse.json({ skipped: 'low_credits' })
  }

  // ── Fire the agent ────────────────────────────────────────────────────────
  try {
    const baseUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const isFlow   = sub.agent_id.startsWith('flow:')
    const flowId   = isFlow ? sub.agent_id.slice(5) : null
    const endpoint = isFlow ? `${baseUrl}/api/canvas/run` : `${baseUrl}/api/agents/run`

    // Pass the event data as context so the agent can read the email
    const eventData = (verified.payload as { data?: Record<string, unknown> }).data ?? {}
    const input = isFlow ? undefined : JSON.stringify({ event: 'gmail_new_email', data: eventData })

    const body = isFlow
      ? { flowId, triggeredBy: 'trigger', context: eventData }
      : { agentId: sub.agent_id, projectId: sub.project_id, input, triggeredBy: 'trigger' }

    const runRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Scheduler-User-Id': sub.user_id,
        'X-Scheduler-Secret':  process.env.CRON_SECRET!,
      },
      body: JSON.stringify(body),
    })

    const runData = await runRes.json().catch(() => ({}))
    console.log(`${tag} FIRED — status=${runRes.status} credits_remaining=${runData.credits_remaining}`)

    return NextResponse.json({ fired: true, agentId: sub.agent_id })
  } catch (fireErr) {
    console.error(`${tag} FIRE ERROR:`, fireErr)
    return NextResponse.json({ error: 'Fire failed' }, { status: 500 })
  }
}
