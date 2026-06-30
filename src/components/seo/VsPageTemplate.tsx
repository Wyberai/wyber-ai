import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export interface CompRow {
  feature: string
  wyber: string
  other: string
  winner: 'wyber' | 'other' | 'tie'
}

export interface FaqItem {
  q: string
  a: string
}

export interface VsPageProps {
  slug: string
  competitorName: string
  competitorUrl: string
  tagline: string
  blurb: string
  rows: CompRow[]
  faqs: FaqItem[]
  pillarNote: string // short sentence on what competitor lacks
  competitorKey: string // key used in the 'winner' field — maps to 'other' display
}

const s = {
  bg: '#09090b',
  card: '#111113',
  border: 'rgba(255,255,255,0.08)',
  text: '#fafafa',
  muted: '#71717a',
  dim: '#52525b',
  sky: '#0EA5E9',
}

const PRODUCTS = [
  { id: 'web',       label: 'Web Apps',       icon: '🖥', desc: 'Full-stack React app in minutes' },
  { id: 'mobile',    label: 'Mobile Apps',    icon: '📱', desc: 'React Native + Expo, iOS & Android' },
  { id: 'integrations', label: '27 Integrations', icon: '🔗', desc: 'Supabase, Stripe, OpenAI & more' },
  { id: 'deploy',    label: 'One-click Deploy', icon: '🚀', desc: 'Live URL in seconds' },
  { id: 'github',    label: 'GitHub Sync',    icon: '📦', desc: 'Own your code, zero lock-in' },
  { id: 'challenge', label: 'Weekly Challenge', icon: '🏆', desc: 'Win credits every week' },
]

export function VsPageTemplate({
  slug,
  competitorName,
  competitorUrl,
  tagline,
  blurb,
  rows,
  faqs,
  pillarNote,
}: VsPageProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `https://wyberai.com/vs/${slug}`,
        name: `WyberAi vs ${competitorName} (2026)`,
        description: blurb,
        url: `https://wyberai.com/vs/${slug}`,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://wyberai.com' },
            { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://wyberai.com/vs' },
            { '@type': 'ListItem', position: 3, name: `vs ${competitorName}`, item: `https://wyberai.com/vs/${slug}` },
          ],
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/vs" style={{ fontSize: 12, color: s.muted, textDecoration: 'none', fontWeight: 500 }}>All comparisons</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Try free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: 24 }}>
          <ol style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0, margin: 0, fontSize: 12, color: s.dim }}>
            <li><Link href="/" style={{ color: s.dim, textDecoration: 'none' }}>Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/vs" style={{ color: s.dim, textDecoration: 'none' }}>Compare</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" style={{ color: s.muted }}>vs {competitorName}</li>
          </ol>
        </nav>

        {/* Hero */}
        <header style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: s.sky, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Comparison · Verified June 2026</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12, margin: '0 0 12px' }}>
            WyberAi vs {competitorName}
          </h1>
          <p style={{ fontSize: 15, color: s.muted, maxWidth: 560, margin: '12px auto 8px', lineHeight: 1.65 }}>{tagline}</p>
          <p style={{ fontSize: 11, color: s.dim }}>
            Verified June 2026 ·{' '}
            <a href={competitorUrl} target="_blank" rel="noopener noreferrer" style={{ color: s.dim }}>{competitorUrl.replace('https://', '')}</a>
            {' · '}
            <Link href="mailto:hello@wyberai.com" style={{ color: s.dim }}>Report an error</Link>
          </p>
        </header>

        {/* Six-product differentiator */}
        <section aria-labelledby="six-products-heading" style={{ marginBottom: 48, background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 14, padding: 'clamp(20px,3vw,32px)' }}>
          <h2 id="six-products-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px,2vw,20px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8, margin: '0 0 8px' }}>
            The key difference: Wyber does six things, not one
          </h2>
          <p style={{ fontSize: 13, color: s.muted, marginBottom: 20, lineHeight: 1.65 }}>
            {pillarNote} WyberAi is the only no-code platform that covers all six products from one workspace.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {PRODUCTS.map(p => (
              <div key={p.id} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.sky, marginBottom: 3 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: s.muted, lineHeight: 1.5 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section aria-labelledby="comparison-table-heading">
          <h2 id="comparison-table-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px,2vw,20px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16, margin: '0 0 16px' }}>
            Feature comparison
          </h2>
          <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${s.border}` }} role="row">
              <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feature</div>
              <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: s.sky, textTransform: 'uppercase', letterSpacing: '0.06em' }}>WyberAi</div>
              <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{competitorName}</div>
            </div>
            {rows.map((row, i) => (
              <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: i < rows.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none', background: row.winner === 'wyber' ? 'rgba(14,165,233,0.03)' : row.winner === 'other' ? 'rgba(255,255,255,0.02)' : 'transparent' }} role="row">
                <div style={{ padding: '11px 16px', fontSize: 13, color: s.muted }}>{row.feature}</div>
                <div style={{ padding: '11px 16px', fontSize: 13, fontWeight: row.winner === 'wyber' ? 700 : 400, color: row.winner === 'wyber' ? s.sky : s.text }}>{row.wyber}</div>
                <div style={{ padding: '11px 16px', fontSize: 13, fontWeight: row.winner === 'other' ? 700 : 400, color: row.winner === 'other' ? '#fafafa' : s.muted }}>{row.other}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: s.dim, textAlign: 'center', marginBottom: 40 }}>
            Pricing and features change. Verify at{' '}
            <a href={competitorUrl} target="_blank" rel="noopener noreferrer" style={{ color: s.dim }}>{competitorUrl.replace('https://', '')}</a>.
          </p>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" style={{ marginBottom: 48 }}>
          <h2 id="faq-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px,2vw,20px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 24, margin: '0 0 24px' }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faqs.map(({ q, a }) => (
              <details key={q} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px 20px' }}>
                <summary style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer', color: s.text, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  {q}
                  <span style={{ flexShrink: 0, fontSize: 18, color: s.muted }}>+</span>
                </summary>
                <p style={{ fontSize: 13, color: s.muted, lineHeight: 1.7, margin: '12px 0 0' }}>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: 'clamp(24px,4vw,40px)', background: s.card, borderRadius: 14, border: `1px solid ${s.border}` }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8, margin: '0 0 8px' }}>Try WyberAi free</h2>
          <p style={{ fontSize: 14, color: s.muted, marginBottom: 20 }}>50 credits/month free. Build a web app, mobile app, or AI agent in minutes. No credit card required.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: s.sky, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Start building free →
          </Link>
        </section>

        {/* See also */}
        <nav aria-label="Other comparisons" style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: s.dim, marginBottom: 10 }}>Also compare:</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['Lovable', '/vs/lovable'], ['Bolt.new', '/vs/bolt'], ['v0', '/vs/v0'], ['Replit', '/vs/replit'], ['Cursor', '/vs/cursor']]
              .filter(([, href]) => href !== `/vs/${slug}`)
              .map(([label, href]) => (
                <Link key={href} href={href} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${s.border}`, fontSize: 12, color: s.muted, textDecoration: 'none' }}>
                  vs {label}
                </Link>
              ))}
          </div>
        </nav>
      </div>

      <style>{` details summary::-webkit-details-marker { display: none; } details[open] summary span { transform: rotate(45deg); display: inline-block; }`}</style>
    </div>
  )
}
