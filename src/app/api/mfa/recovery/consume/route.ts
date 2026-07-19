import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { consumeRecoveryCode, disableMfa } from '@/lib/mfa/recovery'

// Lost-device recovery. The user is signed in (aal1) but can't complete the TOTP
// step-up. A valid single-use recovery code REMOVES their authenticator factors
// so they regain full access, then they're prompted to re-enroll. This is the
// safe anti-lockout path: it never mints an aal2 session it isn't entitled to.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await req.json().catch(() => ({ code: '' }))
  if (!code || typeof code !== 'string') return NextResponse.json({ error: 'Recovery code required' }, { status: 400 })

  const ok = await consumeRecoveryCode(user.id, code)
  if (!ok) return NextResponse.json({ error: 'Invalid or already-used recovery code' }, { status: 400 })

  // Remove every authenticator factor via the admin API so the user drops back
  // to a plain (aal1) session with no pending step-up.
  try {
    const admin = createServiceClient()
    const { data } = await admin.auth.admin.mfa.listFactors({ userId: user.id })
    for (const f of data?.factors ?? []) {
      await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: user.id })
    }
  } catch (e) {
    console.error('[mfa recovery] factor cleanup failed:', e)
  }
  await disableMfa(user.id)

  return NextResponse.json({ ok: true, message: '2FA removed. Please re-enroll an authenticator in Settings → Security.' })
}
