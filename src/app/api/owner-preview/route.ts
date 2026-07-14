import { NextRequest, NextResponse } from 'next/server'
import { OWNER_COOKIE, REGION_COOKIE, ownerToken, keyMatches, isOwnerToken } from '@/lib/owner-preview'

export const dynamic = 'force-dynamic'

// Owner region preview — unlock + toggle. No public UI links here; access is
// gated entirely by the secret key (first unlock) or an existing owner cookie.
//
//   Unlock:   /api/owner-preview?key=<OWNER_PREVIEW_KEY>   (sets owner cookie)
//   Toggle:   /api/owner-preview?region=US|IN&to=/pricing  (owner cookie only)
//   Clear:    /api/owner-preview?region=off                (back to IP-based)
//   Sign out: /api/owner-preview?logout=1                  (drop owner cookie)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const key = searchParams.get('key')
  const region = searchParams.get('region')
  const to = searchParams.get('to') || '/'

  const hasValidKey = keyMatches(key)
  const isOwner = hasValidKey || await isOwnerToken(req.cookies.get(OWNER_COOKIE)?.value)

  // Never confirm the feature exists to non-owners — behave like an unknown
  // route and just send them home. No cookies set, no hint leaked.
  const res = NextResponse.redirect(new URL(isOwner ? to : '/', req.url))
  if (!isOwner) return res

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  }

  if (hasValidKey) res.cookies.set(OWNER_COOKIE, await ownerToken(), cookieOpts)

  if (searchParams.get('logout') === '1') {
    res.cookies.delete(OWNER_COOKIE)
    res.cookies.delete(REGION_COOKIE)
  } else if (region === 'US' || region === 'IN') {
    res.cookies.set(REGION_COOKIE, region, cookieOpts)
  } else if (region === 'off' || region === 'clear') {
    res.cookies.delete(REGION_COOKIE)
  }

  return res
}
