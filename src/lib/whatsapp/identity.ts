import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'

type WhatsappIdentity = {
  id: string
  phone_e164: string
  user_id: string | null
  status: 'pending_email' | 'pending_otp' | 'linked'
  pending_email: string | null
  active_project_id: string | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_RE = /^\d{6}$/

/** GoTrue's public auth endpoints (signInWithOtp/verifyOtp) need the anon
 *  key, not the service-role key — this is a bare client with no cookie jar
 *  and no session persistence, since there's no browser on the other end of
 *  a WhatsApp webhook to persist a session for. */
function authClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function getOrCreateIdentity(phone: string): Promise<WhatsappIdentity> {
  const db = createServiceClient()
  const { data: existing } = await db
    .from('whatsapp_identities')
    .select('id, phone_e164, user_id, status, pending_email, active_project_id')
    .eq('phone_e164', phone)
    .maybeSingle()
  if (existing) return existing as WhatsappIdentity

  const { data: created, error } = await db
    .from('whatsapp_identities')
    .insert({ phone_e164: phone, status: 'pending_email' })
    .select('id, phone_e164, user_id, status, pending_email, active_project_id')
    .single()
  if (created) return created as WhatsappIdentity

  // Lost a race with a concurrent first-message-from-this-number insert (the
  // unique constraint on phone_e164 fired) — the other request's row is now
  // the source of truth, so fetch it instead of failing this one outright.
  if (error?.code === '23505') {
    const { data: retried } = await db
      .from('whatsapp_identities')
      .select('id, phone_e164, user_id, status, pending_email, active_project_id')
      .eq('phone_e164', phone)
      .maybeSingle()
    if (retried) return retried as WhatsappIdentity
  }
  throw new Error(`Could not create whatsapp_identity: ${error?.message}`)
}

export async function touchLastMessage(identityId: string): Promise<void> {
  await createServiceClient()
    .from('whatsapp_identities')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', identityId)
}

export async function setActiveProject(identityId: string, projectId: string | null): Promise<void> {
  await createServiceClient()
    .from('whatsapp_identities')
    .update({ active_project_id: projectId })
    .eq('id', identityId)
}

/**
 * Gated linking flow: a brand-new phone number must prove it owns the email
 * on an EXISTING WyberAi account (shouldCreateUser: false) before it can
 * spend a single credit. Deliberately reuses Supabase's own email-OTP send/
 * verify rather than inventing a parallel OTP system — one fewer thing to
 * keep secure, and it's the exact mechanism /login and /signup already trust.
 *
 * Returns `linkedUserId` once status flips to 'linked' so the caller (the
 * webhook route) can start treating this message as an authenticated build
 * request in the SAME inbound request — no "text us again" round-trip needed
 * right after the code is verified.
 */
export async function handleOnboardingMessage(
  identity: WhatsappIdentity,
  text: string
): Promise<{ reply: string; linkedUserId: string | null }> {
  const db = createServiceClient()
  const trimmed = text.trim()

  if (identity.status === 'pending_email' || (identity.status === 'pending_otp' && EMAIL_RE.test(trimmed))) {
    if (!EMAIL_RE.test(trimmed)) {
      return {
        reply: "Hey! I'm the WyberAi builder. To link this WhatsApp number, reply with the email on your existing WyberAi account (sign up free at wyberai.com first if you don't have one).",
        linkedUserId: null,
      }
    }
    const email = trimmed.toLowerCase()
    const { error } = await authClient().auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    if (error) {
      // shouldCreateUser:false surfaces as a generic/opaque error for a
      // non-existent account rather than a clean "not found" code — treat
      // any signInWithOtp failure here as "no account", which is the only
      // realistic cause since the email itself already passed regex.
      return {
        reply: `I couldn't find a WyberAi account for ${email}. Sign up free at wyberai.com, then text me that same email again.`,
        linkedUserId: null,
      }
    }
    await db.from('whatsapp_identities').update({ status: 'pending_otp', pending_email: email }).eq('id', identity.id)
    return { reply: `Sent a 6-digit code to ${email} — reply with that code to link this number.`, linkedUserId: null }
  }

  if (identity.status === 'pending_otp') {
    if (!OTP_RE.test(trimmed)) {
      return {
        reply: 'Reply with the 6-digit code from your email, or text your email again to get a new one.',
        linkedUserId: null,
      }
    }
    // Defensive only — every path that sets status to 'pending_otp' sets
    // pending_email in the same write, so this should be unreachable. Guards
    // against verifyOtp({email: null}) throwing an opaque error if that
    // invariant is ever broken by a future edit.
    if (!identity.pending_email) {
      return { reply: 'Something reset on our end — text your email again to get a new code.', linkedUserId: null }
    }
    const { data, error } = await authClient().auth.verifyOtp({
      email: identity.pending_email,
      token: trimmed,
      type: 'email',
    })
    if (error || !data.user) {
      return { reply: "That code didn't work (it may have expired) — text your email again for a new one.", linkedUserId: null }
    }
    await db
      .from('whatsapp_identities')
      .update({ status: 'linked', user_id: data.user.id, pending_email: null })
      .eq('id', identity.id)
    return { reply: "You're linked! Tell me what you want to build.", linkedUserId: data.user.id }
  }

  // Unreachable given the two branches above, but keeps the return type total.
  return { reply: 'Something went wrong linking your account — text your email again to retry.', linkedUserId: null }
}
