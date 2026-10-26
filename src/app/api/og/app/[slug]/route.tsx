import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Share card (1200x630) for a published app — the preview image WhatsApp,
// LinkedIn, X and Slack show when someone shares the app's link. Generated
// apps almost never set their own og:image, so without this every shared link
// rendered as a bare URL. Used as the og:image fallback in
// src/app/app/[slug]/page.tsx and offered as a download in the Launch Kit.
//
// It's the USER's app, so the card leads with their name, description and
// brand colour (the app's own --primary token). WyberAi appears only as the
// small "Built with WyberAi" mark, and only for free-plan owners — same rule
// as the badge on the published page.

const FALLBACK = { solid: '#0EA5E9', glow: 'rgba(14,165,233,0.30)' }

function attr(html: string, name: string): string | undefined {
  const re1 = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i')
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, 'i')
  return html.match(re1)?.[1] ?? html.match(re2)?.[1]
}

// Generated apps declare `--primary: 221 83% 53%` (shadcn-style HSL parts).
function primaryColor(html: string): { solid: string; glow: string } {
  const m = html.match(/--primary:\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/)
  if (!m) return FALLBACK
  const l = Number(m[3])
  // Very dark or very light primaries vanish on the dark card — fall back.
  if (l < 25 || l > 85) return FALLBACK
  return { solid: `hsl(${m[1]}, ${m[2]}%, ${m[3]}%)`, glow: `hsla(${m[1]}, ${m[2]}%, ${m[3]}%, 0.30)` }
}

function clip(s: string, n: number) {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= n) return t
  // Cut at the last word boundary, and drop dangling separators ("— &").
  const cut = t.slice(0, n - 1)
  const atWord = cut.lastIndexOf(' ') > n * 0.6 ? cut.slice(0, cut.lastIndexOf(' ')) : cut
  return `${atWord.replace(/[\s—–\-&,:;]+$/, '')}…`
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { origin } = new URL(req.url)

  let name = 'Untitled app'
  let desc = ''
  let accent = FALLBACK
  let showBadge = true
  try {
    const supabase = await createServiceClient()
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, description, user_id')
      .eq('subdomain', slug)
      .eq('is_public', true)
      .single()
    if (project) {
      name = project.name || name
      desc = project.description || ''
      const { data: file } = await supabase.storage.from('published-apps').download(`${project.id}/index.html`)
      if (file) {
        const html = await file.text()
        desc = attr(html, 'description') || desc
        accent = primaryColor(html)
      }
      const { data: owner } = await supabase.from('profiles').select('plan').eq('id', project.user_id).single()
      showBadge = !owner?.plan || owner.plan === 'free'
    }
  } catch { /* render the generic card rather than failing the image */ }

  const [semibold, bold] = await Promise.all([
    fetch(new URL('/fonts/GeneralSans-600.ttf', origin)).then(r => r.arrayBuffer()),
    fetch(new URL('/fonts/GeneralSans-700.ttf', origin)).then(r => r.arrayBuffer()),
  ])

  const title = clip(name, 48)
  const initial = title.charAt(0).toUpperCase() || 'A'

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0b0b0e', padding: '72px 80px', fontFamily: 'General Sans', position: 'relative' }}>
        {/* Accent wash in the app's own colour */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 85% 0%, ${accent.glow} 0%, rgba(0,0,0,0) 55%)`, display: 'flex' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: accent.solid, display: 'flex' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 76, height: 76, borderRadius: 20, background: accent.solid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, fontWeight: 700, color: '#ffffff' }}>
            {initial}
          </div>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color: '#a1a1aa', letterSpacing: '-0.01em' }}>
            {`wyberai.com/app/${slug}`}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 980 }}>
          <div style={{ display: 'flex', fontSize: title.length > 28 ? 64 : 80, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.035em', lineHeight: 1.04 }}>
            {title}
          </div>
          {desc ? (
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: '#a1a1aa', lineHeight: 1.35 }}>
              {clip(desc, 120)}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderRadius: 9999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 22, fontWeight: 600, color: '#e4e4e7' }}>
            <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#22c55e', display: 'flex' }} />
            Live now · tap to open
          </div>
          {showBadge ? (
            <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: '#71717a' }}>Built with WyberAi</div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'General Sans', data: semibold, weight: 600, style: 'normal' },
        { name: 'General Sans', data: bold, weight: 700, style: 'normal' },
      ],
      // Shared links get re-fetched by every chat app's crawler — cache at the
      // edge; a republish shows the new card within a day (or bust with ?v=).
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    },
  )
}
