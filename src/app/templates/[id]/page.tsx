export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const admin = await createAdminClient()
  const { data: app } = await admin.from('prebuilt_apps').select('name, description, category').eq('id', id).single()
  if (!app) return { title: 'Template not found' }
  return {
    title: `Build a ${app.name} with AI — Wyber AI Template`,
    description: `${app.description} Build it instantly with Wyber AI — no coding required. Free to start.`,
    openGraph: {
      title: `Build a ${app.name} with AI`,
      description: app.description,
      images: [{ url: `https://wyberai.com/api/og?title=Build%20a%20${encodeURIComponent(app.name)}%20with%20AI`, width: 1200, height: 630 }],
    },
  }
}

export default async function TemplatePage({ params }: Props) {
  const { id } = await params
  const admin = await createAdminClient()
  const { data: app } = await admin.from('prebuilt_apps').select('*').eq('id', id).single()
  if (!app) notFound()

  const { data: related } = await admin.from('prebuilt_apps')
    .select('id, name, category').eq('category', app.category).neq('id', id).limit(4)

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14, textDecoration: 'none', color: '#fafafa' }}>Wyber AI</Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/gallery" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>Gallery</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <div style={{ fontSize: 12, color: '#52525b', marginBottom: 28 }}>
          <Link href="/" style={{ color: '#52525b', textDecoration: 'none' }}>Home</Link>
          {' → '}
          <Link href="/gallery" style={{ color: '#52525b', textDecoration: 'none' }}>Gallery</Link>
          {' → '}
          <span style={{ color: '#a1a1aa' }}>{app.name}</span>
        </div>

        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>{app.category}</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14, lineHeight: 1.1 }}>Build a {app.name} with AI</h1>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, marginBottom: 28 }}>{app.description}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={`/signup?template=${app.id}`} style={{ padding: '13px 28px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
              Build this app free →
            </Link>
            <Link href="/pricing" style={{ padding: '13px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 14, textDecoration: 'none' }}>
              See pricing
            </Link>
          </div>
        </div>

        <div style={{ padding: 24, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>What you get instantly</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {['Production-ready React code', 'Live preview URL', 'GitHub repo sync', 'Supabase database ready', 'One-click Vercel deploy', 'Full source code export'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a1a1aa' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                {f}
              </div>
            ))}
          </div>
        </div>

        {app.keywords?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Related searches</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {app.keywords.map((k: string) => (
                <span key={k} style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: '#71717a' }}>#{k}</span>
              ))}
            </div>
          </div>
        )}

        {related && related.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>More {app.category} apps</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {related.map((r: { id: string; name: string }) => (
                <Link key={r.id} href={`/templates/${r.id}`} style={{ padding: '14px', borderRadius: 10, background: '#111113', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none', color: '#fafafa', fontSize: 13, fontWeight: 600, display: 'block' }}>
                  {r.name}
                  <div style={{ fontSize: 11, color: '#0EA5E9', marginTop: 4 }}>Build free →</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
