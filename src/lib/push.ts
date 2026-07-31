import type { SupabaseClient } from '@supabase/supabase-js'

// Server-side Expo push. Fans out a notification to every device the user has
// registered in `device_tokens` (see migration 20260704160000). Entirely
// best-effort: any failure is swallowed so it can never break the caller
// (crons, webhooks) — push is a nice-to-have layered on top of the in-app row.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

type ExpoMessage = {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default'
  channelId?: string
}

// Maps a notification `type` to the push title/body. Falls back to a generic
// copy for unknown types so new notification kinds still push something sane.
function copyFor(type: string, payload?: Record<string, unknown> | null): { title: string; body: string } {
  switch (type) {
    case 'scheduled_agent_skipped':
      return { title: 'Agent run skipped', body: 'Not enough credits to run your scheduled agent. Tap to top up.' }
    case 'scheduled_agent_ran':
      return { title: 'Agent ran', body: 'Your scheduled agent just completed a run.' }
    case 'build_complete':
      return { title: 'Build complete', body: 'Your app finished building and is ready to preview.' }
    case 'published':
      return { title: 'Published 🎉', body: 'Your project is live.' }
    case 'referral':
      return { title: 'Referral reward', body: 'You earned credits from a referral.' }
    case 'credits_low': {
      const bal = payload && typeof payload.balance === 'number' ? (payload.balance as number) : null
      return {
        title: 'Running low on credits',
        body:
          bal !== null
            ? `You have ${bal} credits left. Tap to top up and keep building.`
            : 'You’re running low on credits. Tap to top up and keep building.',
      }
    }
    case 'weekly_digest': {
      const msg = payload && typeof payload.message === 'string' ? (payload.message as string) : 'See what you can build this week.'
      return { title: 'Your week on WyberAi', body: msg }
    }
    default: {
      const msg = payload && typeof payload.message === 'string' ? (payload.message as string) : 'You have a new update.'
      return { title: 'WyberAi', body: msg }
    }
  }
}

/** POST a batch of messages to Expo's push service. Never throws. */
async function sendExpoPush(messages: ExpoMessage[]): Promise<void> {
  if (messages.length === 0) return
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
  } catch (e) {
    console.error('[push] Expo send failed:', e)
  }
}

/**
 * Look up the user's device tokens and push a notification derived from `type`.
 * Call this alongside a `notifications` insert. Best-effort and non-blocking:
 * callers should NOT await it in a critical path (or await + ignore errors).
 */
export async function notifyPush(
  admin: SupabaseClient,
  userId: string,
  type: string,
  payload?: Record<string, unknown> | null,
): Promise<void> {
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('notification_prefs')
      .eq('id', userId)
      .maybeSingle()
    // Absent key = enabled (default-on) — a prefs object that predates a given
    // event type must never silently go silent for it.
    const prefs = (profile?.notification_prefs ?? {}) as Record<string, boolean>
    if (prefs[type] === false) return

    const { data: tokens } = await admin
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId)

    if (!tokens || tokens.length === 0) return

    const { title, body } = copyFor(type, payload)
    const messages: ExpoMessage[] = tokens.map((t: { token: string }) => ({
      to: t.token,
      title,
      body,
      sound: 'default',
      channelId: 'default',
      data: { type, ...(payload ?? {}) },
    }))

    await sendExpoPush(messages)
  } catch (e) {
    console.error('[push] notifyPush failed:', e)
  }
}

/**
 * Record an event in ONE call: persist the in-app `notifications` row (what the
 * mobile Activity feed reads) AND fan out a push. Use this at every event
 * touchpoint so the feed and the push stay in sync. Fully best-effort — a failed
 * row insert or push must never break the caller (a build, a credit deduction),
 * so this never throws and should not be awaited in a latency-critical path
 * (or await + ignore).
 */
export async function notify(
  admin: SupabaseClient,
  userId: string,
  type: string,
  payload?: Record<string, unknown> | null,
): Promise<void> {
  try {
    await admin.from('notifications').insert({ user_id: userId, type, payload: payload ?? null })
  } catch (e) {
    console.error('[notify] row insert failed:', e)
  }
  await notifyPush(admin, userId, type, payload)
}
