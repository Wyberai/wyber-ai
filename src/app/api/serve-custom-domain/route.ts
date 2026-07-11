import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { buildAppManifest } from '@/lib/pwa/manifest'
import { getOrCreateIcon } from '@/lib/pwa/icon'

// Paths with dedicated handling on a published app's origin. Everything else
// falls through to the existing behavior (serve index.html) — these MUST stay
// exact matches so no custom-domain route that worked before changes behavior.
const PWA_PATHS = new Set(['/manifest.webmanifest', '/pwa-icon-192.png', '/pwa-icon-512.png'])

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
      .select('id, name, files, thumbnail_url')
      .in('custom_domain', variants)
      .eq('custom_domain_verified', true)
      .eq('is_public', true)
      .limit(1)

    const project = projects?.[0]
    if (!project) return new NextResponse('App not found', { status: 404 })

    // PWA endpoints on the app's own origin. The proxy rewrites EVERY path on
    // a custom domain here, so /manifest.webmanifest and the icons must be
    // answered explicitly — otherwise they'd get index.html back.
    const path = req.nextUrl.searchParams.get('path') || '/'
    if (PWA_PATHS.has(path)) {
      if (path === '/manifest.webmanifest') {
        const manifest = buildAppManifest(project, {
          startUrl: '/',
          id: '/',
          scope: '/',
          iconBase: '/',
        })
        return NextResponse.json(manifest, {
          headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
      const size = path === '/pwa-icon-512.png' ? 512 : 192
      const png = await getOrCreateIcon(admin, project, size)
      return new NextResponse(new Uint8Array(png), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

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
