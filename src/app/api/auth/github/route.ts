import { NextRequest, NextResponse } from 'next/server'

// This route is opened as a direct browser navigation (a popup, or same-tab
// fallback when the popup is blocked — see TopBar's handleGitHubPush), never
// fetched — so a JSON error response here doesn't fail gracefully in the
// app, it renders as a raw `{"error":...}` dump filling the whole window.
// A minimal HTML page reads sanely in either context (a small popup or the
// full tab) without needing cross-window messaging back to the editor.
function configErrorPage(message: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>GitHub</title></head>` +
    `<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e6edf6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center">` +
    `<div><h1 style="font-size:18px;margin-bottom:8px">Can't connect to GitHub right now</h1>` +
    `<p style="color:#8b949e;font-size:14px;max-width:360px">${message}</p></div></body></html>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) return configErrorPage('GitHub isn’t configured for this environment yet. Close this window and try again later, or contact support if this keeps happening.')

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
