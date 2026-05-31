import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Book a Build Session — Wyber AI',
  description: 'Need help building your app? Book a 1-on-1 session with the Wyber AI team. We build your app end-to-end on a live call.',
}

const PACKAGES = [
  {
    name: 'Starter Build',
    price: '$199',
    duration: '60 min',
    color: '#0EA5E9',
    desc: 'Perfect for landing pages, simple tools, or MVPs with 2–3 screens.',
    includes: [
      '60-minute live build session',
      '1 complete app delivered',
      'GitHub repo handover',
      'Vercel deployment',
      '7-day follow-up support via email',
    ],
    cta: 'Book Starter',
    href: 'mailto:hello@wyberai.com?subject=Starter Build Session&body=Hi, I\'d like to book a Starter Build session.',
  },
  {
    name: 'Pro Build',
    price: '$399',
    duration: '90 min',
    color: '#8b5cf6',
    desc: 'For full SaaS products — auth, database, payments, dashboard, and more.',
    includes: [
      '90-minute live build session',
      'Full-stack app with Supabase',
      'Auth + payments integrated',
      'GitHub repo + Vercel deploy',
      '14-day follow-up support',
      'Recording of the session',
    ],
    cta: 'Book Pro',
    href: 'mailto:hello@wyberai.com?subject=Pro Build Session&body=Hi, I\'d like to book a Pro Build session.',
    badge: 'Most popular',
  },
  {
    name: 'Agency Build',
    price: '$799',
    duration: '3 hours',
    color: '#10b981',
    desc: 'For agencies building client apps. Includes strategy, build, and handover documentation.',
    includes: [
      '3-hour build session (split across 2 calls)',
      '2 complete apps or 1 complex app',
      'Full documentation for client handover',
      'White-label ready',
      '30-day follow-up support',
      'Session recordings',
    ],
    cta: 'Book Agency',
    href: 'mailto:hello@wyberai.com?subject=Agency Build Session&body=Hi, I\'d like to book an Agency Build session.',
  },
]

const FAQ = [
  { q: 'How does the session work?', a: 'You book a time slot and we jump on a Zoom/Google Meet call. You describe what you want to build and we build it live using Wyber AI, customising and iterating in real time until you\'re happy with it.' },
  { q: 'What can you build in a session?', a: 'Anything Wyber AI can generate — SaaS dashboards, booking systems, landing pages, internal tools, CRMs, portfolios, and more. If you\'re unsure, email us first and we\'ll confirm feasibility.' },
  { q: 'Do I need a Wyber AI account?', a: 'No — we handle the entire build during the session. You\'ll receive the code via GitHub and can deploy it to your own accounts.' },
  { q: 'What if I\'m not happy with the result?', a: 'We iterate during the session until you\'re satisfied. We also offer 7–30 days of follow-up support via email for any tweaks.' },
  { q: 'Can I pay after the session?', a: 'Payment is required upfront to secure your time slot. We use Dodo Payments for secure checkout.' },
]

function WyberLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  )
}

export default function SetupCallPage() {
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
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo size={24}/>
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14 }}>Wyber AI</span>
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>← Pricing</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 12, fontWeight: 700, color: s.sky, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            Done-for-you builds
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(30px,5vw,52px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1 }}>
            We build your app.<br/>You watch it happen live.
          </h1>
          <p style={{ fontSize: 16, color: s.muted, maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
            Book a 1-on-1 session with the Wyber AI team. Describe what you need, and we'll build it end-to-end on a live call — no coding required on your end.
          </p>
        </div>

        {/* Packages */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 60 }}>
          {PACKAGES.map(pkg => (
            <div key={pkg.name} style={{ background: s.card, border: `1px solid ${pkg.badge ? pkg.color + '40' : s.border}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', position: 'relative', borderTop: `3px solid ${pkg.color}` }}>
              {pkg.badge && (
                <div style={{ position: 'absolute', top: -12, right: 20, padding: '3px 12px', borderRadius: 20, background: pkg.color, color: '#fff', fontSize: 11, fontWeight: 700 }}>
                  {pkg.badge}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: pkg.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pkg.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>{pkg.price}</span>
                  <span style={{ fontSize: 13, color: s.muted }}>{pkg.duration}</span>
                </div>
                <p style={{ fontSize: 13, color: s.muted, lineHeight: 1.6 }}>{pkg.desc}</p>
              </div>
              <div style={{ flex: 1, marginBottom: 20 }}>
                {pkg.includes.map(item => (
                  <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ color: pkg.color, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: s.muted }}>{item}</span>
                  </div>
                ))}
              </div>
              <a href={pkg.href} style={{ display: 'block', padding: '12px', borderRadius: 10, background: pkg.badge ? pkg.color : 'transparent', border: `1px solid ${pkg.color}`, color: pkg.badge ? '#fff' : pkg.color, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                {pkg.cta}
              </a>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 60 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora', sans-serif", marginBottom: 24, textAlign: 'center' }}>How it works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { n: '01', title: 'Book & pay', desc: 'Click any package above and email us. We confirm your slot within 24 hours.' },
              { n: '02', title: 'Describe your app', desc: 'Fill out a short form before the call — what you want, who it\'s for, key features.' },
              { n: '03', title: 'Live build session', desc: 'We hop on a call and build your app in real time. You give feedback, we iterate.' },
              { n: '04', title: 'You get the code', desc: 'GitHub repo, live Vercel URL, and post-session support. Yours to keep forever.' },
            ].map(step => (
              <div key={step.n} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: s.sky, letterSpacing: '0.1em', marginBottom: 8 }}>{step.n}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, fontFamily: "'Sora', sans-serif" }}>{step.title}</div>
                <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 60 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora', sans-serif", marginBottom: 24 }}>FAQ</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FAQ.map(({ q, a }) => (
              <div key={q} style={{ padding: '18px 0', borderBottom: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{q}</div>
                <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.7 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: 40, background: s.card, borderRadius: 16, border: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora', sans-serif", marginBottom: 8 }}>Not sure which package is right?</div>
          <div style={{ fontSize: 14, color: s.muted, marginBottom: 20 }}>Email us and we'll recommend the best fit for your project.</div>
          <a href="mailto:hello@wyberai.com?subject=Build Session Enquiry" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: s.sky, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Email us →
          </a>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
