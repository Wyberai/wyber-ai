import { createServiceClient } from '@/lib/supabase/server'

export type WorkosProfile = {
  email: string
  organizationId: string | null
  firstName?: string | null
  lastName?: string | null
}

// Reconciles a WorkOS SSO login into the SAME `profiles` table used by email/GitHub
// signup, so an SSO user is indistinguishable elsewhere in the app (including billing).
// Returns a one-time email OTP the callback route verifies (via email+token, not
// token_hash — more reliable for this admin-generated-session pattern) to establish a
// normal Supabase session — after this, the user flows through middleware.ts and every
// existing query path completely unchanged.
export async function reconcileSsoLogin(profile: WorkosProfile): Promise<{ email: string; emailOtp: string; orgId: string | null }> {
  const email = profile.email.trim().toLowerCase()
  const db = createServiceClient()

  // generateLink creates the auth.users row (and returns a verifiable token_hash) if it
  // doesn't already exist — this is the standard Supabase pattern for admin-initiated
  // passwordless sessions, used here in place of WorkOS-native session handling.
  const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkError || !linkData) throw linkError ?? new Error('Failed to generate SSO session link')

  const userId = linkData.user.id

  // First-signup-only upsert — never overwrite existing credits/plan, mirrors auth/callback/route.ts.
  await db.from('profiles').upsert({
    id: userId,
    email,
    credits: 50,
    plan: 'free',
    onboarded: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id', ignoreDuplicates: true })

  let orgId: string | null = null
  if (profile.organizationId) {
    const { data: connection } = await db
      .from('org_sso_connections')
      .select('org_id')
      .eq('workos_org_id', profile.organizationId)
      .maybeSingle()

    if (connection) {
      orgId = connection.org_id
      await db.from('organization_members').upsert(
        { org_id: orgId, user_id: userId, role: 'member', invited_via: 'sso' },
        { onConflict: 'org_id,user_id', ignoreDuplicates: true }
      )
      await db.from('org_sso_connections').update({ status: 'active' }).eq('org_id', orgId).eq('status', 'pending')
    }
  }

  const emailOtp = linkData.properties.email_otp
  return { email, emailOtp, orgId }
}
