import { NextRequest, NextResponse } from 'next/server'

// GET /api/composio/callback?status=success|failed&connectionId=ca_XXX&toolkit=gmail
// Called by Composio after OAuth completes — this is loaded in the popup window.
// We return an HTML page that posts a message to the opener and closes itself.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') || 'success'
  const toolkit = searchParams.get('toolkit') || ''
  const connectionId = searchParams.get('connectionId') || ''
  const success = status !== 'failed' && status !== 'error'

  // Post a message to the opener window, then close the popup.
  // The opener (ConfigPanel or Settings) listens for this message to refresh status.
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Connecting...</title>
  <style>
    body { margin: 0; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; background: #09090b; font-family: 'Space Grotesk', system-ui, sans-serif; color: #fafafa; }
    .card { text-align: center; padding: 40px; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    .title { font-size: 18px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em; }
    .sub { font-size: 13px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✓' : '✗'}</div>
    <div class="title">${success ? 'Connected!' : 'Connection failed'}</div>
    <div class="sub">${success ? 'You can close this window.' : 'Please try again.'}</div>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'composio_oauth_result',
          success: ${success},
          toolkit: ${JSON.stringify(toolkit)},
          connectionId: ${JSON.stringify(connectionId)},
        }, '*');
      }
    } catch (e) {}
    setTimeout(() => window.close(), 1500);
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
