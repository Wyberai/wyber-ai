import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buildAppManifest } from '@/lib/pwa/manifest'
import { getOrCreateIcon } from '@/lib/pwa/icon'

// PWA endpoints for published apps served on the MAIN domain
// (wyberai.com/app/{slug}). Each app is its own installable PWA on the shared
// origin — distinct manifest id/start_url/scope per slug. The subdomain /
// custom-domain path serves the equivalent via serve-custom-domain.
// Nothing was ever routed under /app/{slug}/* before, so unknown paths keep
// 404ing exactly as they did.
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string; pwa: string[] }> }) {
  const { slug, pwa } = await ctx.params
  const file = pwa.join('/')

  if (!['manifest.webmanifest', 'pwa-icon-192.png', 'pwa-icon-512.png'].includes(file)) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Public endpoint for public apps only — same visibility rule as the page.
  const supabase = await createServiceClient()
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, thumbnail_url')
    .eq('subdomain', slug)
    .eq('is_public', true)
    .single()
  if (!project) return new NextResponse('Not found', { status: 404 })

  if (file === 'manifest.webmanifest') {
    const base = `/app/${slug}`
    const manifest = buildAppManifest(project, {
      startUrl: base,
      id: base,
      scope: base,
      iconBase: `${base}/`,
    })
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  const size = file === 'pwa-icon-512.png' ? 512 : 192
  const png = await getOrCreateIcon(supabase, project, size)
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
