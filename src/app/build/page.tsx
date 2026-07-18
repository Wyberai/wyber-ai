import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { CATEGORY_LABELS, pagesByCategory } from './data'

export const metadata: Metadata = {
  title: 'What Can You Build with AI? — App Ideas & Starter Prompts | WyberAi',
  description:
    'Browse apps you can build with AI in minutes — booking systems, trackers, CRMs, course platforms — each with a ready-to-paste starter prompt. No code needed.',
  alternates: { canonical: 'https://wyberai.com/build' },
}

const s = { bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)', sky: '#0EA5E9' }

export default function BuildIndexPage() {
  const groups = pagesByCategory()
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/use-cases" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Use Cases</Link>
          <Link href="/pricing" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Pricing</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Try free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,48px)' }}>
        <header style={{ marginBottom: 48 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,46px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 16px', lineHeight: 1.12 }}>
            What will you build?
          </h1>
          <p style={{ fontSize: 17, color: s.muted, maxWidth: 640, lineHeight: 1.65, margin: 0 }}>
            Every page below is a real app you can generate in minutes — with a starter prompt engineered for the WyberAi builder. Pick one, paste the prompt, and your first version is live today.
          </p>
        </header>

        {groups.map(([category, pages]) => (
          <section key={category} style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px,2vw,22px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 18px' }}>
              {CATEGORY_LABELS[category]}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {pages.map(p => (
                <Link key={p.slug} href={`/build/${p.slug}`} style={{ display: 'block', background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '18px 20px', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p.target === 'mobile' ? '#a855f7' : s.sky, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                    {p.target === 'mobile' ? 'Mobile app' : 'Web app'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: s.text, marginBottom: 6, lineHeight: 1.35 }}>{p.h1.replace(' with AI', '')}</div>
                  <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.55 }}>{p.tagline.length > 110 ? p.tagline.slice(0, 107) + '…' : p.tagline}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <div style={{ textAlign: 'center', padding: 'clamp(24px,4vw,40px)', background: s.card, borderRadius: 14, border: `1px solid ${s.border}`, marginTop: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Don&apos;t see your idea?</h2>
          <p style={{ fontSize: 14, color: s.muted, margin: '0 0 20px' }}>These are starting points, not limits — describe anything and WyberAi engineers it.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: s.sky, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Describe your app free →
          </Link>
        </div>
      </div>
    </div>
  )
}
