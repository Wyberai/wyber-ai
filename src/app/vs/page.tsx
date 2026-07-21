import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { localeAlternates } from '@/lib/i18n/hreflang'

export const metadata: Metadata = {
  title: 'WyberAi vs Competitors (2026) — Honest Comparisons',
  description: 'Compare WyberAi to Lovable, Bolt.new, v0, Replit, and Cursor. See how pricing, credits, and the six-product difference (web + mobile + agents + workflows + AI employees) stack up.',
  alternates: { canonical: 'https://wyberai.com/vs', languages: localeAlternates('/vs') },
  openGraph: { title: 'WyberAi vs Competitors (2026)', description: 'Compare WyberAi to every major AI builder.', url: 'https://wyberai.com/vs' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'WyberAi vs Competitors',
  description: 'Compare WyberAi to Lovable, Bolt.new, v0, Replit, and Cursor. Verified June 2026.',
  url: 'https://wyberai.com/vs',
}

const COMPARISONS = [
  {
    slug: 'lovable',
    name: 'Lovable',
    url: 'lovable.dev',
    tag: 'AI web app builder',
    summary: 'WyberAi offers ~56% more credits at a lower price, plus mobile apps, agents, and workflows Lovable doesn\'t have.',
    wyberWins: ['300 credits/month on Builder ($99)', 'Top-ups never expire', 'Mobile + agents + workflows + AI employees + GTM', '6 products vs Lovable\'s 1'],
  },
  {
    slug: 'bolt',
    name: 'Bolt.new',
    url: 'bolt.new',
    tag: 'AI web app builder',
    summary: 'WyberAi uses fixed-credit pricing (no token surprises) and adds mobile apps, agents, and workflows Bolt doesn\'t offer.',
    wyberWins: ['Predictable fixed credits', 'Daily bonus credits', 'Guided for non-technical users', 'Mobile + agents + workflows'],
  },
  {
    slug: 'v0',
    name: 'v0 by Vercel',
    url: 'v0.dev',
    tag: 'UI component generator',
    summary: 'v0 generates UI components. WyberAi generates complete full-stack apps — plus mobile, agents, and workflows.',
    wyberWins: ['Complete app in one generation', 'Database + auth included', 'No assembly required', 'Mobile + agents + workflows'],
  },
  {
    slug: 'replit',
    name: 'Replit',
    url: 'replit.com',
    tag: 'Cloud IDE',
    summary: 'Replit is an IDE for developers. WyberAi is a no-code builder for founders — faster, cheaper, and more predictable.',
    wyberWins: ['No coding knowledge needed', 'Predictable fixed credits', '< 60 second app generation', 'Mobile + agents + workflows'],
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    url: 'cursor.com',
    tag: 'AI code editor',
    summary: 'Cursor makes developers faster. WyberAi builds complete apps from plain English — no developer needed.',
    wyberWins: ['Zero coding required', 'App in A few minutes', 'Live preview + one-click deploy', 'Mobile + agents + workflows'],
  },
  {
    slug: 'softr',
    name: 'Softr',
    url: 'softr.io',
    tag: 'No-code platform',
    summary: 'Softr hosts your app on their platform from $269/mo for Business. WyberAi generates real React code you own — web + mobile — from $29/mo.',
    wyberWins: ['Real code, GitHub export, zero lock-in', 'Native mobile apps (React Native)', 'Live database security scan', 'A tenth of the price for solo founders'],
  },
]

/* Space-journey brand surfaces (see globals.css --brand-*) */
const s = { bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)', sky: 'var(--brand-accent)' }

export default function VsIndex() {
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
          <div className="mk-eyebrow" style={{ marginBottom: 12 }}>VERIFIED JUNE 2026</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
            WyberAi vs Every Alternative
          </h1>
          <p style={{ fontSize: 15, color: s.muted, maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            Honest, up-to-date comparisons. WyberAi ships full-stack web apps and native mobile apps from one workspace — with deploy, integrations, and GitHub code ownership built in.
          </p>
        </header>

        {/* Six products banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 56 }}>
          {[['🖥','Web Apps','Full-stack React app'],['📱','Mobile Apps','React Native + Expo'],['🔗','27 Integrations','Supabase, Stripe, OpenAI...'],['🚀','One-click Deploy','Live URL in seconds'],['📦','GitHub Sync','Own your code'],['🏆','Weekly Challenge','$500 in prizes']].map(([icon,label,sub])=>(
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
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: s.text }}>
                      WyberAi vs {c.name}
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
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Try WyberAi free — 50 credits/month</h2>
          <p style={{ fontSize: 14, color: s.muted, margin: '0 0 20px' }}>Web app, mobile app, AI agent, or workflow. No credit card required.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: s.sky, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Start building free →
          </Link>
        </div>
      </div>

    </div>
  )
}
