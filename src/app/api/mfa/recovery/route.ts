import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRecoveryCodes } from '@/lib/mfa/recovery'

// (Re)generate recovery codes. Called right after a factor is verified (to hand
// the user their backup codes) and from the panel's "regenerate" action. Only
// enables our mfa bookkeeping once a verified TOTP factor actually exists.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: factors } = await supabase.auth.mfa.listFactors()
  const hasVerified = (factors?.totp ?? []).length > 0
  if (!hasVerified) return NextResponse.json({ error: 'Enroll an authenticator first' }, { status: 400 })

  try {
    const codes = await generateRecoveryCodes(user.id)
    return NextResponse.json({ codes })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
