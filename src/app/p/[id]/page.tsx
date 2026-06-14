export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const admin = await createAdminClient()
  const { data: project } = await admin
    .from('projects')
    .select('name, thumbnail_url')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!project) return { title: 'App not found — Wyber AI' }

  return {
    title: `${project.name} — Built with Wyber AI`,
    description: `Check out ${project.name}, built in under 60 seconds with Wyber AI. No code required.`,
    openGraph: {
      title: `${project.name} — Built with Wyber AI`,
      description: 'Built in under 60 seconds with Wyber AI. No code required.',
      images: project.thumbnail_url
        ? [{ url: project.thumbnail_url, width: 1200, height: 630 }]
        : [{ url: `https://wyberai.com/api/og?title=${encodeURIComponent(project.name)}&sub=Built+with+Wyber+AI`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function PublicProjectPage({ params }: Props) {
  const { id } = await params
  const admin = await createAdminClient()

  const { data: project } = await admin
    .from('projects')
    .select('id, name, deployed_url, published_url, thumbnail_url, framework, created_at, user_id')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!project) notFound()

  const previewUrl = project.deployed_url || project.published_url || null

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
            <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.03em' }}>Wyber AI</span>
        </Link>
        <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 12px rgba(14,165,233,0.35)' }}>
          Build your own free →
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,48px) 0' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            ⚡ Built with Wyber AI
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12, lineHeight: 1.1, color: '#fafafa' }}>
            {project.name}
          </h1>
          <p style={{ fontSize: 15, color: '#71717a', lineHeight: 1.65 }}>
            This app was built in under 60 seconds using Wyber AI — no coding required.
          </p>
        </div>

        {/* Preview */}
        {previewUrl ? (
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', marginBottom: 32, background: '#111118' }}>
            {/* Browser chrome */}
            <div style={{ padding: '10px 14px', background: '#0d0d0f', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: '#52525b', textAlign: 'center', maxWidth: 300, margin: '0 auto' }}>
                {previewUrl.replace('https://', '')}
              </div>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.06)' }}>
                Open ↗
              </a>
            </div>
            <iframe
              src={previewUrl}
              style={{ width: '100%', height: 600, border: 'none', display: 'block' }}
              title={project.name}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        ) : project.thumbnail_url ? (
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 32 }}>
            <img src={project.thumbnail_url} alt={project.name} style={{ width: '100%', display: 'block' }} />
          </div>
        ) : (
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: '#111118', marginBottom: 32, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 48 }}>⚡</div>
            <div style={{ fontSize: 15, color: '#52525b' }}>Preview not available</div>
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 16, background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.12)', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Want to build something like this?</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, color: '#fafafa' }}>
            Build your own app in 60 seconds
          </div>
          <div style={{ fontSize: 14, color: '#71717a', marginBottom: 24 }}>No code required. 50 free credits. No card needed.</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ padding: '13px 28px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(14,165,233,0.35)' }}>
              Start building free →
            </Link>
            <Link href="/gallery" style={{ padding: '13px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 14, textDecoration: 'none' }}>
              Browse 118 templates
            </Link>
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
