import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { claimDemosForEmail } from '@/lib/gtm/claim'

/**
 * Claim any campaign demo(s) built for the signed-in user's email.
 *
 * The GTM stamper creates personalized demo dashboards owned by the outreach
 * account, tagged is_demo + target_email. When the founder we built one for
 * replies and signs up, this transfers that exact project (same slug, same
 * live URL) to their new account and clears the demo flags — so it becomes a
 * normal project they fully own and can keep editing.
 *
 * Safe to call on every authenticated load: it's a no-op once the user has no
 * matching unclaimed demos. Email match is case-insensitive.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const claimed = await claimDemosForEmail(admin, user.id, user.email)
  return NextResponse.json({ claimed })
}
