import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/secrets-crypto'
import { exchangeCode } from '@/lib/supabase-management'

/**
 * Supabase OAuth callback. Verifies the CSRF state cookie, exchanges the code
 * for tokens, stores them encrypted under service='supabase-oauth' for this
 * project, then bounces the user back to the editor to pick/create a project.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieState = req.cookies.get('sb_oauth_state')?.value
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || url.origin).replace(/\/$/, '')

  const fail = (msg: string) =>
    NextResponse.redirect(`${appUrl}/dashboard?supabase_error=${encodeURIComponent(msg)}`)

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

  // Back to the editor; the UI opens the project picker on this flag.
  const res = NextResponse.redirect(`${appUrl}/project/${projectId}?supabase=pick`)
  res.cookies.delete('sb_oauth_state')
  return res
}
