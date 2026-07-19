import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authorizeUrl } from '@/lib/supabase-management'
import { randomBytes } from 'crypto'

/**
 * Kick off the Supabase "Connect" OAuth flow. Sets a single-use, httpOnly state
 * cookie (CSRF) carrying the projectId, then redirects to Supabase's consent
 * screen. The callback verifies the cookie.
 */
// This route opens in a POPUP — a raw JSON error body would just sit there as
// a dead end the user can't act on. Errors instead render a tiny page that
// posts the failure back to the editor (which shows it in the connect modal)
// and closes itself, mirroring the callback route's behavior.
function popupError(message: string) {
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#09090b;color:#e4e4e7;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px">
<script>
  try {
    window.opener && window.opener.postMessage(${JSON.stringify({ type: 'wyber:supabase-oauth-result', success: false, error: message })}, window.location.origin);
  } catch (e) {}
  window.close();
</script>
<p>${message} — you can close this tab.</p>
</body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return popupError('You need to be signed in to connect Supabase')

  const projectId = new URL(req.url).searchParams.get('projectId')
  if (!projectId) return popupError('Missing project — reopen the editor and try again')

  const nonce = randomBytes(16).toString('hex')
  const state = `${nonce}.${projectId}`

  let redirectTo: string
  try {
    redirectTo = authorizeUrl(state)
  } catch (e) {
    console.error('[supabase/start] authorizeUrl failed:', String(e))
    return popupError('Supabase connect is not configured — please contact support')
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
