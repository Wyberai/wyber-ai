import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/secrets-crypto'
import { exchangeCode } from '@/lib/supabase-management'

/**
 * Supabase OAuth callback. Verifies the CSRF state cookie, exchanges the code
 * for tokens, stores them encrypted under service='supabase-oauth' for this
 * project, then bounces the user back to the editor to pick/create a project.
 */
// The OAuth start is opened in a popup (not a same-tab redirect) so the
// editor tab — and its in-memory chat history — never navigates away. This
// callback runs inside that popup, so it closes itself and hands the result
// back via postMessage rather than redirecting the popup into the full app.
function popupResponse(payload: { success: boolean; projectId?: string; error?: string }) {
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#09090b;color:#e4e4e7;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px">
<script>
  try {
    window.opener && window.opener.postMessage(${JSON.stringify({ type: 'wyber:supabase-oauth-result', ...payload })}, window.location.origin);
  } catch (e) {}
  window.close();
</script>
<p>${payload.success ? 'Supabase connected — this tab will close automatically.' : 'Something went wrong connecting Supabase — you can close this tab and try again.'}</p>
</body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieState = req.cookies.get('sb_oauth_state')?.value

  const fail = (msg: string) => popupResponse({ success: false, error: msg })

  if (!code || !state) return fail('Missing code or state')
  // CSRF: the returned state must match the cookie we set in /start.
  if (!cookieState || cookieState !== state) return fail('Invalid state')

  const projectId = state.split('.')[1]
  if (!projectId) return fail('Malformed state')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not signed in')

  let tokens
  try {
    tokens = await exchangeCode(code)
  } catch (e) {
    return fail('Authorization failed: ' + String(e).slice(0, 120))
  }

  const { error } = await supabase.from('project_connectors').upsert({
    project_id: projectId,
    user_id: user.id,
    service: 'supabase-oauth',
    api_key: encrypt(tokens.access_token),
    config: {
      refresh_token: encrypt(tokens.refresh_token),
      expires_at: Date.now() + tokens.expires_in * 1000,
    },
    connected_at: new Date().toISOString(),
  }, { onConflict: 'project_id,service' })

  if (error) return fail('Could not save connection: ' + error.message)

  // The editor tab is listening for this postMessage — it opens the project
  // picker itself instead of us redirecting the popup into the full app.
  const res = popupResponse({ success: true, projectId })
  res.cookies.delete('sb_oauth_state')
  return res
}
