import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { WorkOS } from '@workos-inc/node'
import { reconcileSsoLogin } from '@/lib/orgs/sso'

// Sibling to /auth/callback — never modifies it. Exchanges the WorkOS code, reconciles
// into the existing profiles/organization_members tables, then establishes a normal
// Supabase session via the same cookie-writing pattern as the email/GitHub callback.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get('code')
  if (!code) return NextResponse.redirect(`${origin}/login?error=sso`)
  if (!process.env.WORKOS_API_KEY || !process.env.WORKOS_CLIENT_ID) {
    return NextResponse.json({ error: 'SSO is not configured' }, { status: 501 })
  }

  try {
    const workos = new WorkOS(process.env.WORKOS_API_KEY)
    const { profile } = await workos.sso.getProfileAndToken({
      code,
      clientId: process.env.WORKOS_CLIENT_ID,
    })

    const { tokenHash } = await reconcileSsoLogin({
      email: profile.email,
      organizationId: profile.organizationId ?? null,
      firstName: profile.firstName,
      lastName: profile.lastName,
    })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash })
    if (error) throw error

    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (e) {
    console.error('SSO callback error:', e)
    return NextResponse.redirect(`${origin}/login?error=sso`)
  }
}
