import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, sendAdminSignupAlert } from '@/lib/email'
import { sendMetaEvent } from '@/lib/meta-capi'

// Client-agnostic first-run onboarding.
//
// The web signup path (/auth/callback) does welcome email + admin alert + the
// Meta signup conversion inline — but the mobile app authenticates through the
// Supabase SDK directly and never hits that route, so a mobile signup would land
// silent and untracked. The app POSTs here once a session exists (Bearer auth).
//
// The atomic `welcome_sent` flip is the SAME guard the web path uses, so this
// fires at most once per user across every client — a web user who later opens
// the app is a no-op here, and a mobile-first user is a no-op when they hit the
// web later. No double welcome, no double conversion.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ ok: true }, { status: 200 })

  const admin = await createAdminClient()
  const { data: firstTime } = await admin
    .from('profiles')
    .update({ welcome_sent: true })
    .eq('id', user.id)
    .eq('welcome_sent', false)
    .select('id')
    .maybeSingle()

  // Already onboarded (by the web path or a previous app launch) — nothing to do.
  if (!firstTime?.id) return NextResponse.json({ ok: true, already: true })

  const fullName = user.user_metadata?.full_name as string | undefined
  const provider = user.app_metadata?.provider as string | undefined
  sendWelcomeEmail(user.email, fullName).catch(() => {})
  sendAdminSignupAlert(user.email, provider ? `${provider} · mobile` : 'mobile').catch(() => {})

  // Meta signup conversion — same eventId scheme as the web pixel/CAPI so it
  // dedupes rather than double-counts. Tracking must never block onboarding.
  try {
    await sendMetaEvent({
      eventName: 'CompleteRegistration',
      eventId: `reg_${user.id}`,
      email: user.email,
      clientIp: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: req.headers.get('user-agent'),
    })
  } catch { /* never block */ }

  return NextResponse.json({ ok: true, onboarded: true })
}
