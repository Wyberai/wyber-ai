import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { StartBuildButton } from '../build/StartBuildButton'
import { ExampleDashboard } from './ExampleDashboard'
import { WidgetPicker } from './WidgetPicker'
import { CsvDashboardPreview } from './CsvDashboardPreview'

// Standalone ad/outbound landing page — distinct from the /build/ecommerce-seller-dashboard
// pSEO page. That page targets organic search; this one is built for paid traffic and cold
// email: pain point first, a full example with zero clicks, then let the visitor pick exactly
// what they want built.
export const metadata: Metadata = {
  title: 'Your Margins, Inventory & Orders — One Dashboard',
  description: 'Tracking margin, inventory, and orders across Amazon, Shopify, and Etsy in three logins and a spreadsheet? Build the dashboard that actually shows you what\'s happening.',
  alternates: { canonical: 'https://wyberai.com/ecommerce' },
  robots: { index: true, follow: true },
}

const s = { bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)' }
const color = '#0EA5E9'

const DEFAULT_PROMPT =
  'Build an ecommerce seller dashboard web app: an Orders page to log sales from any channel (Amazon, Shopify, Etsy, or custom) with channel, sale price, fee, and cost attached; a Products page tracking stock shared across channels with a low-stock indicator; a Margin page showing profit per order by channel and month; and a Dashboard page summarizing revenue, margin, and channel breakdown.'

const FEATURES = [
  { title: 'Pick what you need', desc: 'Margin, inventory, multi-channel orders, or all of it — the dashboard is only the pieces you actually asked for.' },
  { title: 'Real margin, not a guess', desc: 'Fee and cost columns are calculated per order and per channel — the number that actually matters.' },
  { title: 'Upload instead of retyping', desc: 'Already tracking sales in a spreadsheet? Drop the export in and skip manual entry.' },
  { title: 'One dashboard, every channel', desc: 'Sell in three places today, five next year — add a channel by describing it, not by paying for a new tier.' },
]

const FAQS = [
  { q: 'Do I need to pick every widget right now?', a: 'No — start with what you need today. Every follow-up ("add a returns page", "add a supplier list") is a 2-credit edit once you\'re building.' },
  { q: 'What file formats can I upload?', a: '.csv, .xlsx, and .xls — export your orders from Amazon Seller Central, Shopify, Etsy, or any spreadsheet and drop it in.' },
  { q: 'Is my sales data safe?', a: 'The upload preview is parsed entirely in your browser using client-side JavaScript — the file is never sent to a server or stored anywhere.' },
  { q: 'Does the real dashboard connect live to Amazon or Shopify?', a: 'Not out of the box — it\'s built around your export files or manual entry, which avoids depending on marketplace APIs that can change or get revoked. A bulk-import screen can always be added once you\'re building.' },
  { q: 'What does it cost to build?', a: 'The 50 free monthly credits cover your first build (30 credits); small edits after that are 2 credits each. No card required to start.' },
]

export default function EcommerceDashboardLanding() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Minimal nav — no distracting exits on a paid-traffic landing page */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}` }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: color, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Try free →</Link>
      </nav>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: 'clamp(32px,6vw,72px) clamp(16px,4vw,48px) clamp(48px,8vw,96px)' }}>

        {/* Hero — leads with the pain point, not the tool */}
        <header style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
            For sellers on Amazon, Shopify & Etsy
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,46px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 16px', lineHeight: 1.15 }}>
            Your margin, your inventory, your orders — scattered across three logins and a spreadsheet that never quite adds up.
          </h1>
          <p style={{ fontSize: 17, color: s.muted, maxWidth: 580, margin: '0 auto 28px', lineHeight: 1.65 }}>
            See what one dashboard could look like below — then pick exactly what yours should track.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#example" style={{ padding: '13px 28px', borderRadius: 10, background: color, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>See it built out ↓</a>
            <a href="#build" style={{ padding: '13px 28px', borderRadius: 10, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Skip to building →</a>
          </div>
        </header>

        {/* The generic example — full picture, zero clicks, honestly labeled as sample data */}
        <section id="example" style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 18, padding: 'clamp(20px,4vw,32px)', marginBottom: 56, scrollMarginTop: 80 }}>
          <ExampleDashboard />
        </section>

        {/* Build yours — the widget picker composes the real build prompt */}
        <section id="build" style={{ marginBottom: 56, scrollMarginTop: 80 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Pick what your dashboard tracks</h2>
          <p style={{ fontSize: 14, color: s.muted, margin: '0 0 24px' }}>Start with these, add more once you're building — nothing here is final.</p>
          <WidgetPicker />
        </section>

        {/* CSV upload — secondary path for anyone who already has an export handy */}
        <section style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 18, padding: 'clamp(20px,4vw,32px)', marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>Already tracking sales in a spreadsheet?</h2>
          <p style={{ fontSize: 13, color: s.muted, margin: '0 0 20px' }}>Drop in your orders export and see your real numbers instead of the sample above — no signup, nothing leaves your browser.</p>
          <CsvDashboardPreview />
        </section>

        {/* Features */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 14 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.text, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly challenge nudge — real numbers, verified against /challenge */}
        <section style={{ marginBottom: 64, textAlign: 'center', padding: '24px', border: `1px solid ${s.border}`, borderRadius: 14 }}>
          <div style={{ fontSize: 15, color: s.muted }}>
            Build it this week and enter the <Link href="/challenge" style={{ color, textDecoration: 'none', fontWeight: 700 }}>Weekly Build Challenge</Link> — winners get up to 2,000 free credits, that's 60+ more builds, free.
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 24px' }}>Questions sellers ask</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FAQS.map((faq, i) => (
              <details key={i} style={{ borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
                <summary style={{ padding: '16px 20px', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: s.text, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, userSelect: 'none' }}>
                  {faq.q}
                  <span style={{ color: s.dim, fontSize: 18, flexShrink: 0 }}>+</span>
                </summary>
                <div style={{ padding: '0 20px 18px', fontSize: 14, color: s.muted, lineHeight: 1.7, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>{faq.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <div style={{ textAlign: 'center', padding: 'clamp(24px,4vw,40px)', background: s.card, borderRadius: 14, border: `1px solid ${s.border}` }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Start building for free — 50 credits/month</h2>
          <p style={{ fontSize: 14, color: s.muted, margin: '0 0 20px' }}>No credit card required. Live in minutes.</p>
          <StartBuildButton prompt={DEFAULT_PROMPT} target="web" slug="ecommerce-footer" label="Build my dashboard →" color={color} variant="compact" />
        </div>
      </div>
      <style>{` details summary::-webkit-details-marker{display:none}`}</style>
    </div>
  )
}
