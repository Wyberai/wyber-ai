import { NextRequest, NextResponse } from 'next/server'

// Entry point for the outreach "claim your dashboard" link. Drops the demo's
// claim token in a cookie, then sends the founder to sign up. After they
// authenticate, the dashboard/claim step reads this cookie and transfers the
// project to their account — regardless of which email they signed up with.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
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
