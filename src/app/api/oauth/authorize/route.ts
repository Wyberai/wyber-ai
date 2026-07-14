import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClient, createAuthCode } from '@/lib/oauth/store'

// Consent decision handler. The consent page (/oauth/authorize) POSTs here with
// the user's approve/deny choice. On approve we mint a one-time authorization
// code bound to the logged-in user + PKCE challenge and redirect back to the
// client's registered redirect URI.
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const decision = String(form.get('decision') ?? '')
  const clientId = String(form.get('client_id') ?? '')
  const redirectUri = String(form.get('redirect_uri') ?? '')
  const codeChallenge = String(form.get('code_challenge') ?? '')
  const scope = String(form.get('scope') ?? 'mcp')
  const state = String(form.get('state') ?? '')

  // Re-validate the client + redirect on the server (never trust the form alone).
  const client = await getClient(clientId)
  if (!client || !client.redirect_uris.includes(redirectUri)) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Unknown client or redirect URI' }, { status: 400 })
  }

  const back = (params: Record<string, string>) => {
    const u = new URL(redirectUri)
    for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v)
    return NextResponse.redirect(u.toString(), 303)
  }

  // Must be signed in (the page gates this, but enforce again here).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return back({ error: 'access_denied', state })

  if (decision !== 'approve') return back({ error: 'access_denied', state })
  if (!codeChallenge) return back({ error: 'invalid_request', state })

  try {
    const code = await createAuthCode({ clientId, userId: user.id, redirectUri, codeChallenge, scope })
    return back({ code, state })
  } catch (e) {
    return back({ error: 'server_error', state })
  }
}
