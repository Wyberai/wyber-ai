import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

// Pull SEO signals out of the generated app's <head> so the PUBLISHED page
// (what crawlers actually fetch) carries the app's real title/description/OG/
// structured-data — not the generic WyberAi shell. The app content itself stays
// in a sandboxed iframe for XSS safety; this hoists just the metadata up.
function metaContent(html: string, key: 'name' | 'property', val: string): string | undefined {
  const v = val.replace(/[:]/g, '\\$&')
  const re1 = new RegExp(`<meta[^>]+${key}=["']${v}["'][^>]+content=["']([^"']*)["']`, 'i')
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${key}=["']${v}["']`, 'i')
  return html.match(re1)?.[1] ?? html.match(re2)?.[1]
}

interface AppSeo {
  title?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  jsonLd?: string
}

function extractSeo(html: string): AppSeo {
  const decode = (s?: string) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  return {
    title: decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()),
    description: decode(metaContent(html, 'name', 'description')),
    ogTitle: decode(metaContent(html, 'property', 'og:title')),
    ogDescription: decode(metaContent(html, 'property', 'og:description')),
    ogImage: decode(metaContent(html, 'property', 'og:image')),
    ogType: decode(metaContent(html, 'property', 'og:type')) || 'website',
    jsonLd: html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)?.[1]?.trim(),
  }
}

async function loadHtml(slug: string): Promise<{ name: string; html: string; ownerPlan: string } | null> {
  // Service client, not the session client: this is a PUBLIC page (anonymous
  // visitors, shared links, the mobile app's in-app browser). The `projects`
  // RLS policy doesn't grant anon SELECT on is_public rows, so the session
  // client returned null for everyone but the logged-in owner — the app then
  // showed the "Building your app…" fallback forever. Still filtered to
  // is_public=true, so no private project is ever readable here.
  const supabase = await createServiceClient()
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, user_id')
    .eq('subdomain', slug)
    .eq('is_public', true)
    .single()
  if (!project) return null
  const { data: fileData } = await supabase.storage.from('published-apps').download(`${project.id}/index.html`)
  if (!fileData) return null
  // Owner's plan decides the "Built with WyberAi" badge (free = badge, paid =
  // clean app). RLS hides other users' profile rows from the session client,
  // so this lookup needs the service client; a failed lookup falls back to
  // 'free' — matching the profiles schema default — so the badge fails toward
  // showing, never toward silently removing a free-tier attribution.
  let ownerPlan = 'free'
  try {
    const { data: owner } = await supabase
      .from('profiles').select('plan').eq('id', project.user_id).single()
    if (owner?.plan) ownerPlan = String(owner.plan)
  } catch { /* fall back to free */ }
  return { name: project.name, html: await fileData.text(), ownerPlan }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const loaded = await loadHtml(slug)
  if (!loaded) return { title: 'App — WyberAi', description: 'Built with WyberAi' }

  const seo = extractSeo(loaded.html)
  const title = seo.title || `${loaded.name} — Built with WyberAi`
  const description = seo.description || 'Built with WyberAi'
  const canonical = `https://${slug}.wyberai.app`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      url: canonical,
      type: (seo.ogType as 'website') || 'website',
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
  }
}

export default async function PublishedAppPage({ params }: Props) {
  const { slug } = await params
  const loaded = await loadHtml(slug)

  if (!loaded) {
    // App not built yet — show a building page
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: '#71717a', fontSize: 14 }}>Building your app...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const { name, html, ownerPlan } = loaded
  // Hoist the app's JSON-LD up to the real document so crawlers + rich results
  // see it (iframe/srcdoc structured data is not attributed to the page).
  // SECURITY: this runs in the wyberai.com origin (not the sandboxed iframe), so
  // the user-controlled block must be parsed + re-serialized as pure JSON and have
  // every "<" escaped — otherwise a crafted </script> payload could break out.
  let safeJsonLd: string | undefined
  const rawJsonLd = extractSeo(html).jsonLd
  if (rawJsonLd) {
    try { safeJsonLd = JSON.stringify(JSON.parse(rawJsonLd)).replace(/</g, '\\u003c') } catch { safeJsonLd = undefined }
  }

  return (
    <>
      {safeJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      )}
      {/* Free-tier attribution — paid plans publish clean, unbranded apps. */}
      {ownerPlan === 'free' && (
        <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>Built with</span>
          <a href="https://wyberai.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', textDecoration: 'none', fontFamily: 'var(--font-sans)' }}>WyberAi</a>
        </div>
      )}
      {/* Sandboxed iframe prevents XSS from user-generated app HTML executing in the wyberai.com origin */}
      <iframe
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
        title={name}
      />
    </>
  )
}
