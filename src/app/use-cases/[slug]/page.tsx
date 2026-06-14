import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { USE_CASES } from './data'

export function generateStaticParams() {
  return USE_CASES.map(uc => ({ slug: uc.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const uc = USE_CASES.find(u => u.slug === slug)
  if (!uc) return {}
  return {
    title: uc.metaTitle,
    description: uc.metaDesc,
    alternates: { canonical: `https://wyberai.com/use-cases/${uc.slug}` },
    openGraph: { title: uc.metaTitle, description: uc.metaDesc, url: `https://wyberai.com/use-cases/${uc.slug}` },
  }
}

const s = { bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.08)', text: '#fafafa', muted: '#71717a', dim: '#52525b', sky: '#0EA5E9', green: '#10b981', amber: '#f59e0b', violet: '#8b5cf6' }

const PILLAR_COLORS: Record<string, string> = { web: s.sky, mobile: s.violet, agents: s.green, workflows: s.amber }

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const uc = USE_CASES.find(u => u.slug === slug)
  if (!uc) notFound()

  const color = PILLAR_COLORS[uc.pillar] ?? s.sky

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: uc.metaTitle,
        description: uc.metaDesc,
        url: `https://wyberai.com/use-cases/${uc.slug}`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: uc.faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/use-cases" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Use Cases</Link>
          <Link href="/pricing" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Pricing</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: color, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Try free →</Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px clamp(16px,4vw,48px) 0', display: 'flex', gap: 6, fontSize: 12, color: s.dim, alignItems: 'center' }}>
        <Link href="/" style={{ color: s.dim, textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link href="/use-cases" style={{ color: s.dim, textDecoration: 'none' }}>Use Cases</Link>
        <span>›</span>
        <span style={{ color: s.muted }}>{uc.h1}</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,48px)' }}>

        {/* Hero */}
        <header style={{ marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
            {uc.pillarLabel}
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,4vw,46px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 18px', lineHeight: 1.12 }}>
            {uc.h1}
          </h1>
          <p style={{ fontSize: 17, color: s.muted, maxWidth: 640, lineHeight: 1.65, margin: '0 0 28px' }}>
            {uc.tagline}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={uc.ctaHref} style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: color, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              {uc.ctaLabel}
            </Link>
            <Link href="/pricing" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              See pricing →
            </Link>
          </div>
        </header>

        {/* Body paragraphs */}
        <div style={{ marginBottom: 56 }}>
          {uc.body.map((para, i) => (
            <p key={i} style={{ fontSize: 16, color: s.muted, lineHeight: 1.75, margin: '0 0 18px', maxWidth: 720 }}>{para}</p>
          ))}
        </div>

        {/* Features grid */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
            Everything you need, nothing you don't
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {uc.features.map((f, i) => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 14 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.text, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Starter prompt */}
        <section style={{ marginBottom: 64, background: s.card, borderRadius: 14, padding: 'clamp(20px,3vw,32px)', border: `1px solid ${color}25` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Ready-to-use starter prompt</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>Copy this prompt and paste it into Wyber AI</h2>
          <div style={{ background: '#0d0d10', borderRadius: 10, padding: '16px 20px', border: `1px solid ${s.border}`, fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, fontFamily: 'monospace', marginBottom: 20, whiteSpace: 'pre-wrap' }}>
            {uc.promptExample}
          </div>
          <Link href={uc.ctaHref} style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 9, background: color, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Try this prompt free →
          </Link>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {uc.faqs.map((faq, i) => (
              <details key={i} style={{ borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
                <summary style={{ padding: '16px 20px', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: s.text, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, userSelect: 'none' }}>
                  {faq.q}
                  <span style={{ color: s.dim, fontSize: 18, flexShrink: 0 }}>+</span>
                </summary>
                <div style={{ padding: '0 20px 18px', fontSize: 14, color: s.muted, lineHeight: 1.7, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA footer */}
        <div style={{ textAlign: 'center', padding: 'clamp(24px,4vw,40px)', background: s.card, borderRadius: 14, border: `1px solid ${s.border}` }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Start building for free — 50 credits/month</h2>
          <p style={{ fontSize: 14, color: s.muted, margin: '0 0 20px' }}>No credit card required. Your first app in under 60 seconds.</p>
          <Link href={uc.ctaHref} style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: color, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            {uc.ctaLabel}
          </Link>
        </div>

        {/* See also */}
        <div style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 12, color: s.dim, marginBottom: 12 }}>Compare Wyber AI</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['lovable','bolt','v0','replit','cursor'].map(slug => (
              <Link key={slug} href={`/vs/${slug}`} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, textDecoration: 'none', background: s.card }}>
                vs {slug.charAt(0).toUpperCase() + slug.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap'); details summary::-webkit-details-marker{display:none}`}</style>
    </div>
  )
}
