import Link from 'next/link'
import type { Metadata } from 'next'
import { WyberLogo } from '@/components/shared/WyberLogo'

// Dedicated landing page for the US small-business-automation Meta campaign
// (scripts/meta-ad-us-founder-call.mjs) — a separate route rather
// than a query-param variant on /consult, per direction, modeled on the
// structure of /setup-call (dedicated managed-build page, real delivery
// tiers, no dollar figures shown pre-call). The concrete deliverable is
// framed as a DASHBOARD/VIEW — a single place that shows bookings, records,
// and payments together — not a generic "app" or "MVP", since that's the
// specific promise this campaign is selling.
//
// No pricing anywhere on this page, same reasoning as the ad creative: the
// $99–399 managed-build tiers only come up on the free call itself, never
// as a marketed figure alongside an offer — see the compliance note in
// meta-ad-us-founder-call.mjs for why that separation matters.

export const metadata: Metadata = {
  title: 'Free Business Automation Call — WyberAi',
  description: 'Still running your business on spreadsheets, texts, and sticky notes? Book a free 30-min call. We\'ll show you exactly what\'s worth automating — then build it for you.',
  openGraph: {
    title: 'Free Business Automation Call — WyberAi',
    description: 'Stop doing by hand what could run itself. 30 minutes, free, no pitch.',
  },
}

const CAL_LINK = 'https://cal.com/wyberai/wyber-ai-build-consultation'

const STEPS = [
  { n: '01', icon: '🗒️', title: 'Tell us what\'s scattered', desc: 'This call is free — just tell us what you\'re currently using to run things: spreadsheets, group texts, sticky notes, three apps that don\'t talk to each other.' },
  { n: '02', icon: '📅', title: 'Pick a time', desc: 'Book any slot — available 24/7 including weekends.' },
  { n: '03', icon: '💬', title: 'We scope your dashboard', desc: '30 minutes on Google Meet. You describe what\'s scattered, we ask the right questions, and map out the one dashboard that replaces it.' },
  { n: '04', icon: '🛠️', title: 'We build & deliver', desc: 'GitHub repo, live URL, walkthrough video. Support included.' },
]

const TIERS = [
  { name: 'Simple', delivery: '24 hours', color: '#22c55e', icon: '⚡', examples: 'Single-view dashboards, booking pages, simple trackers' },
  { name: 'Medium', delivery: '3 working days', color: '#0EA5E9', icon: '🔧', examples: 'Multi-tool dashboards with login + database — bookings, records, payments together' },
  { name: 'Complex', delivery: '1 week', color: '#8b5cf6', icon: '🏗️', examples: 'Full business dashboard with payments, multi-user access, integrations' },
]

const FAQ = [
  { q: 'Is this really free?', a: 'Yes — no payment, no card required. We ask that you only book if you\'re seriously considering doing this, since slots are limited and we want to spend them on real businesses.' },
  { q: 'What exactly will I get from the call?', a: 'A clear plan for the one dashboard that replaces what you\'re currently juggling — what it would show, what it would need — and a fixed quote if you want our team to build it for you.' },
  { q: 'Am I obligated to buy anything afterward?', a: 'Not at all. Take the plan and build it yourself with WyberAi, or hire us — no pressure either way.' },
  { q: 'Do I need to have everything figured out first?', a: 'No. Just tell us what you\'re currently using to run your business. We\'ll figure out what one dashboard should replace.' },
  { q: 'What if I\'m not very techy?', a: 'That\'s exactly who this is for. You don\'t touch any code — our team designs and builds it, you just use it.' },
]

export default function UsConsultingPage() {
  const s = { bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.08)', text: '#fafafa', muted: '#71717a', sky: '#0EA5E9', green: '#22c55e' }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: s.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Pricing</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, fontWeight: 700, color: s.sky, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Free 30-min automation call</div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,46px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16 }}>Still running your business by hand?<br />Get the one dashboard that fixes it.</h1>
          <p style={{ fontSize: 15, color: s.muted, maxWidth: 520, margin: '0 auto 20px', lineHeight: 1.75 }}>You&apos;re already running a business — you don&apos;t have time to become a developer too. Tell us what you&apos;re tracking by hand: spreadsheets, texts, sticky notes, tools that don&apos;t talk to each other. We&apos;ll show you exactly what&apos;s worth automating, then build the one dashboard that replaces it — bookings, records, and payments, all in one view.</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.green }} />
            <span style={{ fontSize: 12, color: s.green, fontWeight: 600 }}>Available 24/7 · Google Meet · No card required</span>
          </div>
        </div>

        {/* Free banner */}
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 14, padding: '18px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Free consultation</div>
            <div style={{ fontSize: 12, color: s.muted }}>No payment, no card required. Please only book if you&apos;re seriously considering this — slots are limited.</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: s.green }}>Free</div>
        </div>

        {/* Cal.com embed */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>Pick a time</div>
          <div style={{ fontSize: 13, color: s.muted, textAlign: 'center', marginBottom: 18 }}>Available 24/7 · Google Meet · Worldwide</div>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${s.border}` }}>
            <iframe
              src={`${CAL_LINK}?embed=true&theme=dark`}
              style={{ width: '100%', height: '700px', border: 'none' }}
              title="Book your free WyberAi dashboard scoping call"
            />
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 18, textAlign: 'center' }}>How it works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12 }}>
            {STEPS.map(step => (
              <div key={step.n} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{step.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: s.sky, letterSpacing: '0.1em', marginBottom: 5 }}>{step.n}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: s.muted, lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* What we build */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>What we build</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12 }}>
            {TIERS.map(t => (
              <div key={t.name} style={{ background: s.card, border: `1px solid ${t.color}30`, borderRadius: 12, padding: 18, borderTop: `3px solid ${t.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: t.color }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: s.muted }}>⏱ {t.delivery}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: s.muted, lineHeight: 1.6 }}>{t.examples}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Founder block */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 'clamp(24px,4vw,36px)', marginBottom: 44, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, color: '#fff', flexShrink: 0 }}>S</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Sumeet Sutar</div>
            <div style={{ fontSize: 13, color: s.sky, fontWeight: 600, marginBottom: 8 }}>Founder · WyberAi</div>
            <p style={{ fontSize: 13, color: s.muted, lineHeight: 1.7, margin: 0 }}>You&apos;re not talking to a sales rep or an AI chatbot — you&apos;re talking directly to the person who built WyberAi. Tell me what you&apos;re juggling, and within 24 hours I&apos;ll send you a precise plan: what one dashboard would replace it, and what it costs.</p>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Common questions</div>
          {FAQ.map(({ q, a }) => (
            <div key={q} style={{ padding: '14px 0', borderBottom: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{q}</div>
              <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.7 }}>{a}</div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', padding: 32, background: s.card, borderRadius: 14, border: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Questions before booking?</div>
          <div style={{ fontSize: 13, color: s.muted, marginBottom: 16 }}>Email us — usually reply within a few hours.</div>
          <a href="mailto:hello@wyberai.com?subject=Dashboard Scoping Call Enquiry" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 9, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>hello@wyberai.com →</a>
        </div>
      </div>
    </div>
  )
}
