import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { claimDemos } from '@/lib/gtm/claim'
import { removeLeadFromAllCampaigns } from '@/lib/gtm/smartlead'
import { getDecryptedSecret } from '@/lib/get-decrypted-secret'

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
 *
 * A successful claim also stops the outbound campaign: a signed-up founder is
 * a converted lead and should never get another follow-up email.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const token = (await cookies()).get('gtm_claim')?.value
  const claimed = await claimDemos(admin, user.id, { email: user.email, token })

  if (claimed.length > 0) {
    const outreachUserId = process.env.GTM_OUTREACH_USER_ID
    if (outreachUserId) {
      const smartleadKey = await getDecryptedSecret(outreachUserId, 'SMARTLEAD_API_KEY')
      if (smartleadKey) {
        // Fire-and-forget — never let a Smartlead hiccup block the claim response.
        removeLeadFromAllCampaigns(smartleadKey, user.email).catch(() => {})
      }
    }
  }

  return NextResponse.json({ claimed })
}
