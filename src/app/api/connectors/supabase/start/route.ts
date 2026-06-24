import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authorizeUrl } from '@/lib/supabase-management'
import { randomBytes } from 'crypto'

/**
 * Kick off the Supabase "Connect" OAuth flow. Sets a single-use, httpOnly state
 * cookie (CSRF) carrying the projectId, then redirects to Supabase's consent
 * screen. The callback verifies the cookie.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = new URL(req.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const nonce = randomBytes(16).toString('hex')
  const state = `${nonce}.${projectId}`

  let redirectTo: string
  try {
    redirectTo = authorizeUrl(state)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  const res = NextResponse.redirect(redirectTo)
  // Single-use CSRF state, scoped to this user's browser, ~10 min.
  res.cookies.set('sb_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
