import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Short trackable link for distribution posts: /go?s=<channel>.
// Logs the source server-side (fire-and-forget), then redirects to the homepage
// with utm params. Gives real per-channel click counts since on-site analytics
// was empty. Unknown/absent source still redirects cleanly.
const SOURCES: Record<string, string> = {
  x: 'x', li: 'linkedin', th: 'threads', bs: 'bluesky',
  ih: 'indiehackers', yt: 'youtube', tt: 'tiktok', ig: 'instagram', hn: 'hackernews',
}

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get('s') || '').toLowerCase().slice(0, 16)
  const source = SOURCES[code] || (code || 'direct')

  try {
    const admin = createServiceClient()
    // fire-and-forget — never delay the redirect
    admin.from('traffic_hits').insert({
      source,
      ref: req.headers.get('referer'),
      ua: (req.headers.get('user-agent') || '').slice(0, 300) || null,
    }).then(() => {}, () => {})
  } catch { /* best-effort */ }

  const dest = new URL('/', req.nextUrl.origin)
  dest.searchParams.set('utm_source', source)
  dest.searchParams.set('utm_medium', 'social')
  dest.searchParams.set('utm_campaign', 'leak-check')
  return NextResponse.redirect(dest)
}
