import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { logDemoEvent } from '@/lib/gtm/events'

// Entry point for the outreach "claim your dashboard" link. Drops the demo's
// claim token in a cookie, then sends the founder to sign up. After they
// authenticate, the dashboard/claim step reads this cookie and transfers the
// project to their account — regardless of which email they signed up with.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''

  // GTM funnel: record the CTA click (resolve the slug from the token so it's
  // attributable to the company). Fire-and-forget — never delay the redirect.
  if (token) {
    (async () => {
      try {
        const admin = createServiceClient()
        const { data } = await admin.from('projects').select('subdomain').eq('claim_token', token).maybeSingle()
        await logDemoEvent(admin, { event: 'cta_click', slug: data?.subdomain ?? null, token, ua: req.headers.get('user-agent') })
      } catch { /* best-effort */ }
    })()
  }

  const dest = new URL('/signup', req.nextUrl.origin)
  const res = NextResponse.redirect(dest)
  if (token) {
    res.cookies.set('gtm_claim', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days — covers a slow-to-sign-up recipient
      sameSite: 'lax',
      httpOnly: true,
    })
  }
  return res
}
