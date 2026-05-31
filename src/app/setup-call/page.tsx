'use client'
import Link from 'next/link'
import { useEffect } from 'react'

const CALENDLY_URL = 'https://calendly.com/hello-wyberai'

const PACKAGES = [
  {
    name: 'Starter Build',
    price: '$199',
    duration: '60 min',
    color: '#0EA5E9',
    desc: 'Landing pages, simple tools, or MVPs with 2–3 screens.',
    includes: [
      '60-min live build session on Google Meet',
      '1 complete app delivered',
      'GitHub repo + Vercel deployment',
      '7-day follow-up support via email',
    ],
  },
  {
    name: 'Pro Build',
    price: '$399',
    duration: '90 min',
    color: '#8b5cf6',
    desc: 'Full SaaS products — auth, database, payments, dashboard.',
    includes: [
      '90-min live build session',
      'Full-stack app with Supabase + auth',
      'Payments integrated (Dodo/Stripe)',
      'GitHub repo + Vercel deploy',
      '14-day follow-up support',
      'Session recording sent to you',
    ],
    badge: 'Most popular',
  },
  {
    name: 'Agency Build',
    price: '$799',
    duration: '3 hrs',
    color: '#10b981',
    desc: 'For agencies building client apps. 2 calls, full docs, white-label ready.',
    includes: [
      '2 × 90-min sessions',
      '2 apps or 1 complex build',
      'Client handover documentation',
      'White-label ready codebase',
      '30-day follow-up support',
      'Both session recordings',
    ],
  },
]

const HOW = [
  { n: '01', title: 'Book your slot', desc: 'Pick a time below. In the notes field, mention which package (Starter/Pro/Agency) and a one-line description of what you want to build.' },
  { n: '02', title: 'We confirm & invoice', desc: 'We\'ll confirm your slot within 2 hours and send a payment link. Session is locked in once payment is received.' },
  { n: '03', title: 'Live build session', desc: 'Join the Google Meet call. You describe, we build in real time using Wyber AI. You give feedback, we iterate until it\'s right.' },
  { n: '04', title: 'You own it', desc: 'GitHub repo, live Vercel URL, and source code — all yours. Post-session support included for any tweaks.' },
]

const FAQ = [
  { q: 'What can you build in a session?', a: 'Anything Wyber AI can generate — SaaS dashboards, booking systems, landing pages, internal tools, CRMs, portfolios, e-commerce stores. Email us first if you\'re unsure about feasibility.' },
  { q: 'Do I need a Wyber AI subscription?', a: 'No. We handle the build on our end. You receive the completed code and can deploy it to your own accounts.' },
  { q: 'When do I pay?', a: 'After booking, we\'ll send a payment link. Payment is required before the session to confirm your slot.' },
  { q: 'What if I\'m not happy with the result?', a: 'We iterate during the session until you\'re satisfied. Post-session support is also included for follow-up tweaks.' },
  { q: 'Can I request a specific tech stack?', a: 'Yes — our default is Next.js + Supabase + Vercel, but we can accommodate React + Firebase, or other stacks. Mention it when booking.' },
]

export default function SetupCallPage() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const s = {
    bg: '#09090b',
    card: '#111113',
    border: 'rgba(255,255,255,0.08)',
    text: '#fafafa',
    muted: '#71717a',
    sky: '#0EA5E9',
  }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14, textDecoration: 'none', color: '#fafafa', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
          Wyber AI
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>← Back to pricing</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, fontWeight: 700, color: s.sky, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            Done-for-you builds
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px,5vw,50px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16 }}>
            We build your app.<br/>You watch it happen live.
          </h1>
          <p style={{ fontSize: 15, color: s.muted, maxWidth: 500, margin: '0 auto', lineHeight: 1.75 }}>
            Book a 1-on-1 session. Describe what you need, and we'll build it end-to-end on a live Google Meet call — no coding required on your end.
          </p>
        </div>

        {/* Packages */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 56 }}>
          {PACKAGES.map(pkg => (
            <div key={pkg.name} style={{ background: s.card, border: `1px solid ${pkg.badge ? pkg.color + '50' : s.border}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', position: 'relative', borderTop: `3px solid ${pkg.color}` }}>
              {pkg.badge && (
                <div style={{ position: 'absolute', top: -11, right: 18, padding: '3px 12px', borderRadius: 20, background: pkg.color, color: '#fff', fontSize: 10, fontWeight: 700 }}>
                  {pkg.badge}
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: pkg.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{pkg.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>{pkg.price}</span>
                  <span style={{ fontSize: 12, color: s.muted }}>{pkg.duration}</span>
                </div>
                <p style={{ fontSize: 13, color: s.muted, lineHeight: 1.6 }}>{pkg.desc}</p>
              </div>
              <div style={{ flex: 1, marginBottom: 18 }}>
                {pkg.includes.map(item => (
                  <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
                    <span style={{ color: pkg.color, fontSize: 13, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 12, color: s.muted, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', padding: '11px', borderRadius: 9, background: pkg.badge ? pkg.color : 'transparent', border: `1px solid ${pkg.color}`, color: pkg.badge ? '#fff' : pkg.color, fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                Book {pkg.name} →
              </a>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Sora', sans-serif", marginBottom: 20, textAlign: 'center' }}>How it works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {HOW.map(step => (
              <div key={step.n} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: s.sky, letterSpacing: '0.1em', marginBottom: 8 }}>{step.n}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, fontFamily: "'Sora', sans-serif" }}>{step.title}</div>
                <div style={{ fontSize: 12, color: s.muted, lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendly embed */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Sora', sans-serif", marginBottom: 6, textAlign: 'center' }}>Pick a time</div>
          <div style={{ fontSize: 13, color: s.muted, textAlign: 'center', marginBottom: 20 }}>Add a note specifying which package (Starter / Pro / Agency) and what you want to build.</div>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${s.border}` }}>
            <div
              className="calendly-inline-widget"
              data-url={`${CALENDLY_URL}?hide_gdpr_banner=1&background_color=111113&text_color=fafafa&primary_color=0EA5E9`}
              style={{ minWidth: '320px', height: '700px' }}
            />
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Sora', sans-serif", marginBottom: 20 }}>FAQ</div>
          {FAQ.map(({ q, a }) => (
            <div key={q} style={{ padding: '16px 0', borderBottom: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.7 }}>{a}</div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', padding: 36, background: s.card, borderRadius: 14, border: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Sora', sans-serif", marginBottom: 6 }}>Have questions first?</div>
          <div style={{ fontSize: 13, color: s.muted, marginBottom: 18 }}>Email us and we'll confirm feasibility before you book.</div>
          <a href="mailto:hello@wyberai.com?subject=Build Session Enquiry" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 9, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            hello@wyberai.com →
          </a>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
