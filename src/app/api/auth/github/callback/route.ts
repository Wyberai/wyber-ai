import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')

  if (!code) return NextResponse.redirect('/dashboard?error=github_denied')

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token
    if (!accessToken) throw new Error('No access token')

    // Get GitHub user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
    })
    const githubUser = await userRes.json()

    // Save to Supabase
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect('/login')

    await supabase.from('github_connections').upsert({
      user_id: user.id,
      github_user_id: githubUser.id,
      github_username: githubUser.login,
      github_avatar: githubUser.avatar_url,
      access_token: accessToken,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    // Parse state for project redirect
    let projectId = ''
    try { projectId = JSON.parse(Buffer.from(state || '', 'base64').toString()).projectId } catch {}

    const redirect = projectId ? `/project/${projectId}?github=connected` : '/dashboard?github=connected'
    return NextResponse.redirect(redirect)
  } catch (err) {
    console.error('GitHub OAuth error:', err)
    return NextResponse.redirect('/dashboard?error=github_failed')
  }
}
