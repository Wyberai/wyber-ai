import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  // Prefer the query param set by the proxy rewrite, but fall back to the Host
  // header — headers always survive a rewrite even if query params are dropped.
  const raw = req.nextUrl.searchParams.get('domain') || req.headers.get('host')

  if (!raw) return new NextResponse('Not found', { status: 404 })

  // Normalize: lowercase, strip port. Users connect either the apex or the www
  // variant, so match both — visitors reach the app from either host.
  const domain = raw.toLowerCase().replace(/:\d+$/, '')
  const variants = domain.startsWith('www.')
    ? [domain, domain.slice(4)]
    : [domain, `www.${domain}`]

  try {
    const admin = await createAdminClient()

    const { data: projects } = await admin
      .from('projects')
      .select('id, name, files')
      .in('custom_domain', variants)
      .eq('custom_domain_verified', true)
      .eq('is_public', true)
      .limit(1)

    const project = projects?.[0]
    if (!project) return new NextResponse('App not found', { status: 404 })

    // Get built HTML from Supabase Storage
    const { data: fileData } = await admin.storage
      .from('published-apps')
      .download(`${project.id}/index.html`)

    if (!fileData) return new NextResponse('App not built yet', { status: 404 })

    const html = await fileData.text()

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'ALLOWALL',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (err: any) {
    return new NextResponse('Error: ' + err.message, { status: 500 })
  }
}
