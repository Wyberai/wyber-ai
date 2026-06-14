import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'Wyber AI vs Competitors (2026) — Honest Comparisons',
  description: 'Compare Wyber AI to Lovable, Bolt.new, v0, Replit, and Cursor. See how pricing, credits, and the four-pillar difference (web + mobile + agents + workflows) stack up.',
  alternates: { canonical: 'https://wyberai.com/vs' },
  openGraph: { title: 'Wyber AI vs Competitors (2026)', description: 'Compare Wyber AI to every major AI builder.', url: 'https://wyberai.com/vs' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Wyber AI vs Competitors',
  description: 'Compare Wyber AI to Lovable, Bolt.new, v0, Replit, and Cursor. Verified June 2026.',
  url: 'https://wyberai.com/vs',
}

const COMPARISONS = [
  {
    slug: 'lovable',
    name: 'Lovable',
    url: 'lovable.dev',
    tag: 'AI web app builder',
    summary: 'Wyber AI offers ~56% more credits at a lower price, plus mobile apps, agents, and workflows Lovable doesn\'t have.',
    wyberWins: ['More credits (~390 vs ~250/mo)', 'Lower Pro price ($18.99 vs $25)', 'Top-ups never expire', 'Mobile + agents + workflows'],
  },
  {
    slug: 'bolt',
    name: 'Bolt.new',
    url: 'bolt.new',
    tag: 'AI web app builder',
    summary: 'Wyber AI uses fixed-credit pricing (no token surprises) and adds mobile apps, agents, and workflows Bolt doesn\'t offer.',
    wyberWins: ['Predictable fixed credits', 'Daily bonus credits', 'Guided for non-technical users', 'Mobile + agents + workflows'],
  },
  {
    slug: 'v0',
    name: 'v0 by Vercel',
    url: 'v0.dev',
    tag: 'UI component generator',
    summary: 'v0 generates UI components. Wyber AI generates complete full-stack apps — plus mobile, agents, and workflows.',
    wyberWins: ['Complete app in one generation', 'Database + auth included', 'No assembly required', 'Mobile + agents + workflows'],
  },
  {
    slug: 'replit',
    name: 'Replit',
    url: 'replit.com',
    tag: 'Cloud IDE',
    summary: 'Replit is an IDE for developers. Wyber AI is a no-code builder for founders — faster, cheaper, and more predictable.',
    wyberWins: ['No coding knowledge needed', 'Predictable fixed credits', '< 60 second app generation', 'Mobile + agents + workflows'],
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    url: 'cursor.com',
    tag: 'AI code editor',
    summary: 'Cursor makes developers faster. Wyber AI builds complete apps from plain English — no developer needed.',
    wyberWins: ['Zero coding required', 'App in < 60 seconds', 'Live preview + one-click deploy', 'Mobile + agents + workflows'],
  },
]

const s = { bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.08)', text: '#fafafa', muted: '#71717a', dim: '#52525b', sky: '#0EA5E9' }

export default function VsIndex() {
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Try free →</Link>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <header style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: s.sky, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Verified June 2026</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
            Wyber AI vs Every Alternative
          </h1>
          <p style={{ fontSize: 15, color: s.muted, maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            Honest, up-to-date comparisons. Wyber AI is the only platform that covers all four pillars — web apps, mobile apps, AI agents, and workflows — from one workspace.
          </p>
        </header>

        {/* Four pillars banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 56 }}>
          {[['🖥','Web Apps','Full-stack React app'],['📱','Mobile Apps','React Native + Expo'],['🤖','AI Agents','250+ tool integrations'],['⚡','Workflows','Multi-step automation']].map(([icon,label,sub])=>(
            <div key={label} style={{ background: s.card, border: `1px solid rgba(14,165,233,0.15)`, borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.sky, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: s.muted }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Comparison cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
          {COMPARISONS.map(c => (
            <Link key={c.slug} href={`/vs/${c.slug}`} style={{ display: 'block', background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: 'clamp(18px,3vw,28px)', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.15s' }}
              onMouseEnter={undefined}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: s.text }}>
                      Wyber AI vs {c.name}
                    </h2>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: s.muted, border: `1px solid ${s.border}` }}>
                      {c.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: s.muted, lineHeight: 1.6, margin: '0 0 12px' }}>{c.summary}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {c.wyberWins.map(w => (
                      <span key={w} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(14,165,233,0.08)', color: s.sky, border: '1px solid rgba(14,165,233,0.2)', fontWeight: 500 }}>
                        ✓ {w}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 8, background: 'rgba(14,165,233,0.1)', border: `1px solid rgba(14,165,233,0.2)`, fontSize: 13, fontWeight: 700, color: s.sky, whiteSpace: 'nowrap' }}>
                  See comparison →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: 'clamp(24px,4vw,40px)', background: s.card, borderRadius: 14, border: `1px solid ${s.border}` }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Try Wyber AI free — 50 credits/month</h2>
          <p style={{ fontSize: 14, color: s.muted, margin: '0 0 20px' }}>Web app, mobile app, AI agent, or workflow. No credit card required.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: s.sky, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Start building free →
          </Link>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
