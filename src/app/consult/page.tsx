import Link from 'next/link'
import type { Metadata } from 'next'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'Free Founder Call — WyberAi',
  description: 'Have an app idea but don\'t know where to start? Book a free 15-min call with our Founder. We\'ll scope it, quote it, and give you a clear path. No commitment.',
  openGraph: {
    title: 'Free Founder Call — WyberAi',
    description: 'Have an app idea but don\'t know where to start? 15 minutes with our Founder. Free. No strings attached.',
  },
}

const CAL_LINK = 'https://cal.com/wyberai/wyber-ai-build-consultation'

const WHAT_HAPPENS = [
  {
    icon: '🗣️',
    title: 'You describe your idea',
    desc: 'No deck, no brief needed. Just tell us in plain English what you want to build — the problem, the user, the rough vision.',
  },
  {
    icon: '🔍',
    title: 'We ask the right questions',
    desc: 'What features matter on day one vs later. What\'s your timeline. What budget range you\'re working with. We\'ve scoped hundreds of these.',
  },
  {
    icon: '📋',
    title: 'You get a firm quote',
    desc: 'Before the call ends: a price, a delivery date, and exactly what\'s included. Not a range — a number.',
  },
  {
    icon: '🛠️',
    title: 'We build it (if you want)',
    desc: 'Take the quote and build it yourself on WyberAi, or hire us to build it for you. No pressure either way.',
  },
]

const OBJECTIONS = [
  { q: 'Is this actually free?', a: 'Yes. No card, no payment. The only ask is that you\'re seriously thinking about building something — slots are limited and we want to spend them on real ideas.' },
  { q: 'Do I need to have everything figured out?', a: 'No. Half the value of this call is helping you figure out what to build first. Come with a rough idea, we\'ll help you make it concrete.' },
  { q: 'Am I obligated to hire WyberAi afterward?', a: 'Not at all. Take the quote and do whatever you want with it — build it yourself, hire someone else, or come back to us when you\'re ready.' },
  { q: 'How long does it actually take?', a: '15 minutes on Google Meet. We respect your time — we\'ve done enough of these to know exactly what to ask.' },
]

const s = {
  bg: '#09090b',
  card: '#111115',
  border: 'rgba(255,255,255,0.07)',
  text: '#fafafa',
  muted: '#71717a',
  sky: '#0EA5E9',
  green: '#22c55e',
}

export default function ConsultPage() {
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display, system-ui, sans-serif)' }}>

      {/* Minimal nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: s.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Pricing</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
        </div>
      </nav>

      {/* Radial glow */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '900px', height: '600px', background: 'radial-gradient(ellipse at top, rgba(14,165,233,0.12) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,32px) 80px', position: 'relative', zIndex: 1 }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 12, fontWeight: 700, color: s.green, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.green, display: 'inline-block' }} />
            Free · 15 min · Google Meet · Worldwide
          </div>

          <h1 style={{ fontSize: 'clamp(32px,5.5vw,58px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 20 }}>
            Have an app idea but<br />
            <span style={{ color: s.sky }}>don&apos;t know where to start?</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: s.muted, maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.75 }}>
            Book a free 15-min call with our Founder. Tell us your idea — we&apos;ll scope it, quote it, and give you a clear path forward. <strong style={{ color: s.text }}>No commitment. No pitch. Just honest advice.</strong>
          </p>

          {/* Trust badges */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
            {['⏱ 15 minutes', '🎥 Google Meet', '🌍 Worldwide', '💳 No card required'].map(b => (
              <span key={b} style={{ fontSize: 13, color: s.muted, background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.border}`, borderRadius: 20, padding: '6px 14px' }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Cal.com embed */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${s.border}`, boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>
            <iframe
              src={`${CAL_LINK}?embed=true&theme=dark`}
              style={{ width: '100%', height: '680px', border: 'none', display: 'block' }}
              title="Book your free WyberAi founder call"
            />
          </div>
        </div>

        {/* What happens */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 8 }}>What happens in 15 minutes</h2>
          <p style={{ fontSize: 14, color: s.muted, textAlign: 'center', marginBottom: 32 }}>We&apos;ve scoped enough apps to know exactly what to ask.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {WHAT_HAPPENS.map((step, i) => (
              <div key={i} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 14, padding: '22px 20px', position: 'relative' }}>
                <div style={{ fontSize: 26, marginBottom: 12 }}>{step.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.7 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Founder block */}
        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 'clamp(24px,4vw,40px)', marginBottom: 72, display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 28, color: '#fff', flexShrink: 0 }}>S</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Sumeet Sutar</div>
            <div style={{ fontSize: 13, color: s.sky, fontWeight: 600, marginBottom: 10 }}>Founder · WyberAi</div>
            <p style={{ fontSize: 14, color: s.muted, lineHeight: 1.7, margin: 0 }}>
              You&apos;re not talking to a sales rep or an AI chatbot — you&apos;re talking directly to the person who built WyberAi. I&apos;ve scoped and shipped hundreds of apps. I&apos;ll tell you exactly what&apos;s realistic, what it&apos;ll cost, and how long it takes.
            </p>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '16px 22px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.green }}>Free</div>
            <div style={{ fontSize: 11, color: s.muted, marginTop: 2 }}>No card required</div>
          </div>
        </div>

        {/* Objection FAQ */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 24 }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {OBJECTIONS.map(({ q, a }, i) => (
              <div key={i} style={{ padding: '20px 0', borderBottom: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{q}</div>
                <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.75 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', padding: 'clamp(28px,5vw,48px)', background: `linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(34,197,94,0.04) 100%)`, border: `1px solid rgba(14,165,233,0.15)`, borderRadius: 20 }}>
          <div style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Still not sure? Just show up.</div>
          <p style={{ fontSize: 14, color: s.muted, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.7 }}>The call is free. The worst outcome is 15 minutes and a clear answer on whether your idea is worth building.</p>
          <a href={CAL_LINK} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 10, background: s.green, color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Book your free call →
          </a>
          <div style={{ fontSize: 12, color: s.muted, marginTop: 12 }}>Available 24/7 · Usually responds same day</div>
        </div>

      </div>
    </div>
  )
}
