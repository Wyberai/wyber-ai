import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'GitHub not configured' }, { status: 503 })

  const projectId = req.nextUrl.searchParams.get('projectId') || ''
  const state = Buffer.from(JSON.stringify({ projectId, ts: Date.now() })).toString('base64')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.com'}/api/auth/github/callback`,
    scope: 'repo user:email',
    state,
  })

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
}
