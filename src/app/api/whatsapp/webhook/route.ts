import { NextRequest, NextResponse, after } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyWebhookSignature, parseInboundWebhook, sendWhatsAppText, type InboundWhatsAppMessage } from '@/lib/whatsapp/client'
import { getOrCreateIdentity, touchLastMessage, setActiveProject, handleOnboardingMessage } from '@/lib/whatsapp/identity'
import { rateLimitDb } from '@/lib/rate-limit-db'
import { creditCost, resolveBuildTier, type ActionType, type ModelTier, type BuildSizeTier } from '@/lib/credits'

// The webhook itself must ack fast (Meta disables a subscription that
// repeatedly times out) — actual build work is queued onto mcp_messages and
// drained by the existing /api/cron/mcp-consumer tick, same as the MCP path.
export const maxDuration = 30

const RESET_PHRASES = new Set(['new app', 'new project', 'reset', 'start over', 'restart'])

// ── GET: Meta's one-time webhook verification handshake ─────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (mode === 'subscribe' && challenge && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// ── POST: inbound messages ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  // MUST verify against the raw body — re-serializing the parsed JSON before
  // hashing will not match what Meta actually signed.
  if (!verifyWebhookSignature(rawBody, req.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: true }) // malformed body isn't worth a retry
  }

  const messages = parseInboundWebhook(payload)

  // Always 200 immediately: Meta retries (then eventually disables) a
  // webhook that doesn't ack quickly, and a retry would just re-deliver the
  // same message into a queue that's still working through the first one.
  // `after()` runs this once the response has been sent, inside the same
  // invocation's lifetime — the Vercel-safe way to do fire-and-forget work
  // (a bare unawaited promise can be frozen mid-flight once the response
  // returns).
  for (const m of messages) {
    after(() =>
      handleInboundMessage(m).catch(e => console.error('[whatsapp/webhook] handleInboundMessage failed', e))
    )
  }

  return NextResponse.json({ ok: true })
}

async function handleInboundMessage(m: InboundWhatsAppMessage): Promise<void> {
  const phone = m.from
  const db = createServiceClient()

  // ── Dedup FIRST, before anything else spends effort or money ──
  // Meta's webhook delivery is at-least-once: a slow ack or a transient
  // hiccup can redeliver the identical message. Without this, a redelivered
  // "build me X" would create a second project or queue a second (double-
  // charged) build. An empty waMessageId (shouldn't happen for a real
  // message, but defend anyway) skips the check rather than colliding every
  // ID-less message against every other one.
  if (m.waMessageId) {
    const { error: dedupError } = await db.from('whatsapp_message_log').insert({ wa_message_id: m.waMessageId })
    if (dedupError) {
      if (dedupError.code === '23505') return // already handled this exact delivery
      console.error('[whatsapp/webhook] dedup insert failed, processing anyway', dedupError)
    }
  }

  // Durable (survives cold starts / concurrent instances) per-phone-number
  // limit on a publicly-reachable webhook with no login wall in front of it.
  const { allowed } = await rateLimitDb(`whatsapp-in:${phone}`, 20, 10 * 60 * 1000)
  if (!allowed) {
    await sendWhatsAppText(phone, "You're sending messages faster than I can build — give it a few minutes.")
    return
  }

  if (m.type !== 'text' || m.text === null) {
    // Silently dropping this (the original v1 behavior) is indistinguishable
    // from the bot being broken from the sender's side — always say something.
    await sendWhatsAppText(phone, "I can only read text right now — describe what you'd like me to build.")
    return
  }
  const text = m.text.trim()
  if (!text) return // whitespace-only text body — nothing to act on, nothing useful to say either

  const identity = await getOrCreateIdentity(phone)
  await touchLastMessage(identity.id)

  if (identity.status !== 'linked') {
    // Onboarding sends real emails (Supabase's OTP mail) — throttle harder
    // than general chat so a phone number can't be used to spam a target
    // email's inbox with OTP requests.
    const { allowed: otpAllowed } = await rateLimitDb(`whatsapp-otp:${phone}`, 3, 60 * 60 * 1000)
    if (!otpAllowed) {
      await sendWhatsAppText(phone, "Too many attempts — try again in an hour.")
      return
    }
    const { reply } = await handleOnboardingMessage(identity, text)
    await sendWhatsAppText(phone, reply)
    return
  }

  const userId = identity.user_id!

  if (RESET_PHRASES.has(text.toLowerCase())) {
    await setActiveProject(identity.id, null)
    await sendWhatsAppText(phone, "Fresh start! What do you want to build?")
    return
  }

  const isFirstBuild = !identity.active_project_id

  // ── Credit gate — mirrors the MCP start_build tool's estimate (see
  // src/app/api/mcp/route.ts) since there is no cookie session here to let
  // /api/generate's own deduction be the first and only check. This is an
  // upfront ESTIMATE only; /api/generate still owns the real charge/refund
  // once the build actually runs. Checked BEFORE creating a project for a
  // first build — an earlier version created the project first and rolled
  // back the active-project pointer on insufficient credits, which still
  // left an empty, orphaned project row behind on every declined first
  // message. Checking first means nothing is created until we know it can
  // actually be built. ──
  const { data: profile } = await db.from('profiles').select('credits, plan').eq('id', userId).single()
  if (!profile) {
    await sendWhatsAppText(phone, 'Could not find your account — text "reset" and try again.')
    return
  }
  const planRank: Record<string, number> = { free: 0, spark: 0, starter: 1, builder: 2, pro: 3, growth: 4, scale: 5 }
  const modelTier: ModelTier = (planRank[profile.plan as string] ?? 0) >= 1 ? 'default' : 'fast'

  let actionType: ActionType
  let buildTier: BuildSizeTier | undefined
  if (isFirstBuild) {
    buildTier = resolveBuildTier({ totalPlannedFiles: 15 }) // no UI here to ask project type/size — same default estimate MCP uses pre-selection
    actionType = 'web-build'
  } else {
    actionType = 'small-edit'
  }
  const estimatedCost = creditCost(actionType, modelTier, buildTier)
  const availableCredits = profile.credits ?? 0

  if (availableCredits < estimatedCost) {
    await sendWhatsAppText(
      phone,
      `You need about ${estimatedCost} credits for this and have ${availableCredits}. Top up at wyberai.com/pricing, then text me again.`
    )
    return
  }

  let projectId = identity.active_project_id
  if (!projectId) {
    const { data: project, error } = await db
      .from('projects')
      .insert({
        user_id: userId,
        name: text.slice(0, 60),
        framework: 'react-vite',
        files: {},
        created_via: 'whatsapp',
        first_prompt: text,
      })
      .select('id')
      .single()
    if (error || !project) {
      await sendWhatsAppText(phone, "Couldn't start a new project — try again in a bit.")
      return
    }
    projectId = project.id
    await setActiveProject(identity.id, projectId)
  }

  const { data: queued, error: queueError } = await db
    .from('mcp_messages')
    .insert({
      project_id: projectId,
      user_id: userId,
      message: text,
      project_type: 'web-app',
      status: 'queued',
      channel: 'whatsapp',
      whatsapp_identity_id: identity.id,
    })
    .select('id')
    .single()

  if (queueError || !queued) {
    await sendWhatsAppText(phone, "Couldn't queue that build — try again in a bit.")
    return
  }

  await sendWhatsAppText(
    phone,
    isFirstBuild
      ? "On it — building your app now. I'll text you the link in a minute or two."
      : "Got it — applying that change now."
  )
}
