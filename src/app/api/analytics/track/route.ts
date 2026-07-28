import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Public beacon endpoint — called from an anonymous visitor's browser via
// the snippet injected into every published app, not from an authenticated
// WyberAi session. No auth check by design; RLS on page_views additionally
// restricts inserts to sane shape and reads to the project owner only.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.projectId || !body?.sessionId) {
      return NextResponse.json({ error: 'Missing projectId or sessionId' }, { status: 400, headers: CORS_HEADERS })
    }

    const admin = await createAdminClient()
    await admin.from('page_views').insert({
      project_id: String(body.projectId).slice(0, 100),
      path: String(body.path || '/').slice(0, 500),
      referrer: body.referrer ? String(body.referrer).slice(0, 500) : null,
      session_id: String(body.sessionId).slice(0, 100),
      user_agent: req.headers.get('user-agent')?.slice(0, 300) || null,
    })

    // Always 204 regardless of insert outcome — a tracking beacon must never
    // surface an error to the visitor's browser or retry-storm the endpoint.
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
  } catch {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
  }
}
