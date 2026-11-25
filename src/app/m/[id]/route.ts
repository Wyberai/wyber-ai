export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest } from 'next/server'
import { mobileSharePage } from '@/lib/rnw-preview/share-page'
import { createServiceClient } from '@/lib/supabase/server'

// Permanent, shareable, PHONE-FRAMED preview for a generated mobile app.
//
// Mobile projects don't publish to a web URL like web apps do, so users had no
// link to open/share/test in a browser (the in-app preview was inline HTML with
// no address). This GET route IS that link: /m/<projectId>. It loads the project
// files, bundles them with the SAME react-native-web engine the in-app preview
// uses (bundleRnApp), and serves the running app inside a phone-shaped frame —
// device-sized on desktop so it reads as a phone (not a wide web page), and
// full-bleed on real mobile browsers.
//
// Access model: served via the service client so anyone with the (unguessable
// UUID) link can view it — the intended "share to test" behaviour. Only the
// rendered app is exposed, same as any deployed web app exposes its own JS.

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Fresh-ish: repeated views are cheap, but an edit shows within ~30s.
      'cache-control': 'public, s-maxage=30, stale-while-revalidate=300',
    },
  })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const db = createServiceClient()
    const { data } = await db.from('projects').select('name,files,project_type').eq('id', id).maybeSingle()
    const page = await mobileSharePage(data)
    return htmlResponse(page.html, page.status)
  } catch {
    return htmlResponse('<!doctype html><title>Preview</title><p>Preview is temporarily unavailable. Please try again in a moment.</p>', 503)
  }
}
