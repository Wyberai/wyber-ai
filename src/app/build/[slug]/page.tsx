import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { BUILD_PAGES, CATEGORY_LABELS, getBuildPage } from '../data'
import { StartBuildButton } from '../StartBuildButton'

export function generateStaticParams() {
  return BUILD_PAGES.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = getBuildPage(slug)
  if (!page) return {}
  return {
    title: page.metaTitle,
    description: page.metaDesc,
    alternates: { canonical: `https://wyberai.com/build/${page.slug}` },
    openGraph: { title: page.metaTitle, description: page.metaDesc, url: `https://wyberai.com/build/${page.slug}` },
  }
}

/* Space-journey brand surfaces (see globals.css --brand-*) */
const s = { bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)', sky: '#0EA5E9' }

const TARGET_COLORS = { web: '#0EA5E9', mobile: '#a855f7' } as const

const HOW_IT_WORKS = [
  { step: '01', title: 'Describe it', desc: 'Paste the starter prompt below (or write your own) — screens, data, and rules in plain English.' },
  { step: '02', title: 'AI engineers it', desc: 'WyberAi generates the full app — UI, database schema, auth — self-heals build errors, and runs a live security scan.' },
  { step: '03', title: 'Publish it', desc: 'Preview instantly, refine in chat, then publish to a live URL (or your own domain) when it\'s right.' },
]

export default async function BuildPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = getBuildPage(slug)
  if (!page) notFound()

  const color = TARGET_COLORS[page.target]
  const related = page.related.map(getBuildPage).filter((p): p is NonNullable<typeof p> => !!p)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        name: page.h1,
        description: page.metaDesc,
        step: HOW_IT_WORKS.map((h, i) => ({ '@type': 'HowToStep', position: i + 1, name: h.title, text: h.desc })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/build" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>What to Build</Link>
          <Link href="/pricing" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Pricing</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: color, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Try free →</Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px clamp(16px,4vw,48px) 0', display: 'flex', gap: 6, fontSize: 12, color: s.dim, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: s.dim, textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link href="/build" style={{ color: s.dim, textDecoration: 'none' }}>Build</Link>
        <span>›</span>
        <span style={{ color: s.muted }}>{page.noun}</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,48px)' }}>

        {/* Hero */}
        <header style={{ marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
            {CATEGORY_LABELS[page.category]} · {page.target === 'mobile' ? 'Mobile app' : 'Web app'}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,46px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 18px', lineHeight: 1.12 }}>
            {page.h1}
          </h1>
          <p style={{ fontSize: 17, color: s.muted, maxWidth: 640, lineHeight: 1.65, margin: '0 0 28px' }}>
            {page.tagline}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <StartBuildButton prompt={page.promptExample} target={page.target} slug={page.slug} label={`Build my ${page.noun} — free →`} color={color} />
            <Link href="/pricing" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              See pricing →
            </Link>
          </div>
        </header>

        {/* Body */}
        <div style={{ marginBottom: 56 }}>
          {page.body.map((para, i) => (
            <p key={i} style={{ fontSize: 16, color: s.muted, lineHeight: 1.75, margin: '0 0 18px', maxWidth: 720 }}>{para}</p>
          ))}
        </div>

        {/* What your app needs */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
            What your {page.noun} needs — and gets
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {page.features.map((f, i) => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 14 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.text, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
            From idea to live app in three steps
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            {HOW_IT_WORKS.map(h => (
              <div key={h.step} style={{ border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color, letterSpacing: '0.1em', marginBottom: 10, fontFamily: 'var(--brand-mono, monospace)' }}>{h.step}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{h.title}</div>
                <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.65 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Starter prompt */}
        <section style={{ marginBottom: 64, background: s.card, borderRadius: 14, padding: 'clamp(20px,3vw,32px)', border: `1px solid ${color}25` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Starter prompt — engineered for this build</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>The exact prompt to build your {page.noun}</h2>
          <div style={{ background: '#0d0d10', borderRadius: 10, padding: '16px 20px', border: `1px solid ${s.border}`, fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, fontFamily: 'monospace', marginBottom: 20, whiteSpace: 'pre-wrap' }}>
            {page.promptExample}
          </div>
          <StartBuildButton prompt={page.promptExample} target={page.target} slug={page.slug} label="Use this prompt free →" color={color} variant="compact" />
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
            Questions people ask about building a {page.noun}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {page.faqs.map((faq, i) => (
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
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Start building for free — 50 credits/month</h2>
          <p style={{ fontSize: 14, color: s.muted, margin: '0 0 20px' }}>No credit card required. Your {page.noun} live in minutes.</p>
          <StartBuildButton prompt={page.promptExample} target={page.target} slug={page.slug} label={`Build my ${page.noun} →`} color={color} variant="compact" />
        </div>

        {/* Related builds + pillar links */}
        <div style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${s.border}` }}>
          {related.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: s.dim, marginBottom: 12 }}>People also build</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {related.map(r => (
                  <Link key={r.slug} href={`/build/${r.slug}`} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, textDecoration: 'none', background: s.card }}>
                    {r.noun}
                  </Link>
                ))}
              </div>
            </>
          )}
          <div style={{ fontSize: 12, color: s.dim, marginBottom: 12 }}>Learn more</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={page.target === 'mobile' ? '/use-cases/build-mobile-app-with-ai' : '/use-cases/no-code-web-app-builder'} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, textDecoration: 'none', background: s.card }}>
              {page.target === 'mobile' ? 'Build mobile apps with AI' : 'No-code web app builder'}
            </Link>
            <Link href="/use-cases/secure-ai-app-builder" style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, textDecoration: 'none', background: s.card }}>
              Security-first building
            </Link>
            <Link href="/vs/lovable" style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: `1px solid ${s.border}`, color: s.muted, textDecoration: 'none', background: s.card }}>
              WyberAi vs Lovable
            </Link>
          </div>
        </div>
      </div>
      <style>{` details summary::-webkit-details-marker{display:none}`}</style>
    </div>
  )
}
