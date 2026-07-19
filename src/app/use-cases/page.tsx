import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { USE_CASES } from './[slug]/data'

export const metadata: Metadata = {
  title: 'Use Cases — Build Web Apps & Mobile Apps | WyberAi',
  description: 'Explore how WyberAi helps you build web apps and mobile apps from plain English — no code required.',
  alternates: { canonical: 'https://wyberai.com/use-cases' },
  openGraph: { title: 'Use Cases — WyberAi', description: 'Build web apps and mobile apps from plain English. No code required.' },
}

/* Space-journey brand surfaces (see globals.css --brand-*) */
const s = { bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)', sky: '#0EA5E9', green: '#10b981', amber: '#f59e0b' }

const PILLAR_COLORS: Record<string, string> = { web: s.sky, mobile: '#F97316' }

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'WyberAi Use Cases',
  description: 'Explore how WyberAi helps you build web apps and mobile apps from plain English.',
  url: 'https://wyberai.com/use-cases',
}

export default function UseCasesIndex() {
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Try free →</Link>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <header style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
            What can you build with WyberAi?
          </h1>
          <p style={{ fontSize: 15, color: s.muted, maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            From web dashboards to mobile apps — all from plain English, no coding required.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {USE_CASES.filter(uc => uc.pillar === 'web' || uc.pillar === 'mobile').map(uc => {
            const color = PILLAR_COLORS[uc.pillar] ?? s.sky
            return (
              <Link key={uc.slug} href={`/use-cases/${uc.slug}`} style={{ display: 'block', background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 'clamp(18px,3vw,28px)', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, fontSize: 10, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 10 }}>
                      {uc.pillarLabel}
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px', color: s.text }}>
                      {uc.h1}
                    </h2>
                    <p style={{ fontSize: 13, color: s.muted, lineHeight: 1.6, margin: 0 }}>{uc.tagline}</p>
                  </div>
                  <div style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 8, background: `${color}15`, border: `1px solid ${color}25`, fontSize: 13, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                    Read guide →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div style={{ marginTop: 56, textAlign: 'center', padding: 'clamp(24px,4vw,40px)', background: s.card, borderRadius: 14, border: `1px solid ${s.border}` }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Start building free — 50 credits/month</h2>
          <p style={{ fontSize: 14, color: s.muted, margin: '0 0 20px' }}>No credit card required. First app in minutes.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: s.sky, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Start building free →
          </Link>
        </div>
      </div>

    </div>
  )
}
