import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { StartBuildButton } from '../../build/StartBuildButton'
import { CsvDashboardPreview } from './CsvDashboardPreview'

// Standalone ad/outbound landing page — distinct from the /build/ecommerce-seller-dashboard
// pSEO page. That page targets organic search; this one is built for paid traffic and cold
// email, and leads with an interactive proof (upload your file, see it now) instead of copy.
export const metadata: Metadata = {
  title: 'Upload Your Sales Data — See Your Ecommerce Dashboard',
  description: 'Drop in your Amazon, Shopify, or Etsy orders export and see real revenue, margin, and channel breakdown instantly — processed in your browser, never uploaded.',
  alternates: { canonical: 'https://wyberai.com/lp/ecommerce-dashboard' },
  robots: { index: true, follow: true },
}

const s = { bg: 'var(--brand-bg)', card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)' }
const color = '#0EA5E9'

const PROMPT =
  'Build an ecommerce seller dashboard web app: a CSV/Excel import screen to upload an orders export and auto-map columns for date, channel, sale amount, fee, and cost; a Dashboard page showing total revenue, fees, and net margin broken down by channel and by month from the imported data; a Products page tracking stock shared across channels with a low-stock indicator; and a Channels page to manage the fee percentage for each place I sell.'

const FEATURES = [
  { title: 'Upload, don\'t re-enter', desc: 'Export orders from Amazon, Shopify, or Etsy as CSV or Excel and drop it straight in — no manual data entry to get started.' },
  { title: 'Real margin, not a guess', desc: 'Once it\'s built, your fee and cost columns are calculated per order and per channel — the number that actually matters.' },
  { title: 'Your file, your browser', desc: 'This preview never touches a server. Your saved dashboard, once you build it, runs on a database only you can access.' },
  { title: 'One dashboard, every channel', desc: 'Sell in three places today, five next year — the dashboard scales by describing a new channel, not paying for a new tier.' },
]

const FAQS = [
  { q: 'What file formats can I upload?', a: '.csv, .xlsx, and .xls — export your orders from Amazon Seller Central, Shopify, Etsy, or any spreadsheet and drop it in.' },
  { q: 'Is my sales data safe?', a: 'This preview is parsed entirely in your browser using client-side JavaScript — the file is never sent to a server or stored anywhere.' },
  { q: 'What if it doesn\'t detect my columns correctly?', a: 'The preview does its best guess from your column names. When you build the real version, you describe your exact export format and it\'s mapped precisely — a one-time setup, not a recurring struggle.' },
  { q: 'Does the real dashboard connect live to Amazon or Shopify?', a: 'Not out of the box — it\'s built around your export files, which avoids depending on marketplace APIs that can change or get revoked. You can always ask for a bulk-import screen once you\'re building.' },
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

        {/* Hero */}
        <header style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
            For sellers on Amazon, Shopify & Etsy
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 16px', lineHeight: 1.12 }}>
            Upload your sales export.<br />See your real margin in seconds.
          </h1>
          <p style={{ fontSize: 17, color: s.muted, maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            Drop in a CSV or Excel export from Amazon, Shopify, or Etsy below — no signup, nothing sent to a server. See exactly what a dashboard built around your numbers would look like.
          </p>
        </header>

        {/* The interactive proof — this IS the pitch */}
        <section style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 18, padding: 'clamp(20px,4vw,32px)', marginBottom: 48 }}>
          <CsvDashboardPreview />
        </section>

        {/* Bridge to build CTA */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 15, color: s.muted, marginBottom: 18 }}>Like what you see? Turn it into a live dashboard you own — saved, always up to date, yours.</p>
          <StartBuildButton prompt={PROMPT} target="web" slug="lp-ecommerce-dashboard" label="Build my dashboard, free →" color={color} />
        </div>

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
          <StartBuildButton prompt={PROMPT} target="web" slug="lp-ecommerce-dashboard" label="Build my dashboard →" color={color} variant="compact" />
        </div>
      </div>
      <style>{` details summary::-webkit-details-marker{display:none}`}</style>
    </div>
  )
}
