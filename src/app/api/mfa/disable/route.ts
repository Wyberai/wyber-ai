import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { disableMfa } from '@/lib/mfa/recovery'

// Clear our 2FA bookkeeping (recovery codes + mfa_enabled flag). Called by the
// settings panel after the user removes their last authenticator factor.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await disableMfa(user.id)
  return NextResponse.json({ ok: true })
}
