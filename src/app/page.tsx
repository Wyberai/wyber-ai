'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { LiveDemo } from '@/components/shared/LiveDemo';
import { GenerateAnimation, DeployAnimation, VisualEditAnimation, DatabaseAnimation } from '@/components/shared/ProductAnimations';

function WyberLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

const FEATURES = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    title: 'Instant generation',
    desc: 'Describe your app in plain English. Get production-ready React code in under 30 seconds. No setup, no configuration.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10M12 2a15.3 15.3 0 00-4 10 15.3 15.3 0 004 10M2 12h20"/></svg>,
    title: 'One-click deploy',
    desc: 'Deploy to Vercel instantly. Get a live URL in seconds. Custom domains, GitHub sync, full source code export — all included.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
    title: 'Full-stack ready',
    desc: 'Add a real Postgres database, authentication, and file storage with one click. Wyber AI provisions Supabase automatically.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    title: 'Visual editing',
    desc: 'Click any element in the preview to edit it directly. No code needed. Just describe the change you want and it happens.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    title: '80+ templates',
    desc: 'Start from a professionally designed template — dashboards, CRMs, e-commerce, healthcare, finance. Instant load, fully editable.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg>,
    title: '12 integrations',
    desc: 'Connect Stripe, Supabase, OpenAI, Mapbox, Twilio and more with one click. Your app gets wired up automatically.',
  },
]

const STATS = [
  { value: '80+', label: 'Templates' },
  { value: '30s', label: 'Avg generation' },
  { value: '0', label: 'Setup required' },
  { value: '∞', label: 'Projects on paid' },
]

const TESTIMONIALS = [
  { quote: 'Built my entire SaaS dashboard in 4 minutes. No code. Just described what I wanted.', name: 'Early user', role: 'Founder' },
  { quote: 'Replaced 3 weeks of frontend work with a single prompt. My team was shocked.', name: 'Beta tester', role: 'CTO' },
  { quote: 'The visual editing feature is insane. I clicked a button and changed its color in 2 seconds.', name: 'Designer', role: 'Product designer' },
]

export default function HomePage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setUser(data.user))
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo size={26} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em' }}>Wyber AI</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[['Compare', '/vs/lovable'], ['Pricing', '/pricing'], ['Blog', '/blog']].map(([l, h]) => (
            <Link key={l} href={h} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 13, color: '#71717a', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fafafa'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#71717a'}>
              {l}
            </Link>
          ))}<div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />
          {user
            ? <Link href="/dashboard" style={{ padding: '7px 16px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Dashboard →</Link>
            : <>
                <Link href="/login" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, color: '#a1a1aa', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
                <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 20px rgba(14,165,233,0.25)' }}>Start free →</Link>
              </>
          }
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(60px,10vw,120px) clamp(20px,4vw,48px)', overflow: 'hidden' }}>
        {/* Mesh gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(14,165,233,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 80% 60%, rgba(139,92,246,0.12) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 50% 90%, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 12, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', animation: 'pulse 2s infinite' }} />
            AI-powered · Built for builders
          </div>

          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(38px,6vw,72px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 22 }}>
            Turn your idea into<br />
            <span style={{ background: 'linear-gradient(135deg, #0EA5E9, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              a live app
            </span>
            {' '}before lunch
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.8vw,19px)', color: '#71717a', lineHeight: 1.65, marginBottom: 36, maxWidth: 540, margin: '0 auto 36px' }}>
            Describe your app in plain English. Wyber AI generates production-ready code, deploys it live, and wires up a real database — in under a minute.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/signup" style={{ padding: '14px 28px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(14,165,233,0.35)', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
              Start building free →
            </Link>
            <Link href="/pricing" style={{ padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)'; (e.currentTarget as HTMLElement).style.color = '#fafafa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#a1a1aa' }}>
              View pricing
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#fafafa' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#52525b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo */}
      <section style={{ padding: '0 clamp(16px,4vw,48px) clamp(60px,8vw,100px)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Try it — no sign-up needed</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.03em' }}>Type a prompt. See it generate live.</h2>
        </div>
        <LiveDemo />
      </section>

      {/* Features */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Everything you need</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.03em' }}>Not just a frontend generator</h2>
            <p style={{ fontSize: 15, color: '#71717a', marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>Full-stack apps with real databases, auth, and deployments. Everything Lovable has, at 75% of the price.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ padding: 22, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.25)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.03em' }}>From idea to live app in minutes</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { num: '01', title: 'Describe your app', desc: 'Type what you want in plain English. Wyber AI generates production-ready React code instantly.', component: <GenerateAnimation /> },
              { num: '02', title: 'Deploy with one click', desc: 'Get a live URL in seconds. GitHub sync, custom domains, full source code export included.', component: <DeployAnimation /> },
              { num: '03', title: 'Edit visually', desc: 'Click any element in the preview to edit it directly. No code needed — just describe the change.', component: <VisualEditAnimation /> },
              { num: '04', title: 'Add a real database', desc: 'One click provisions a Postgres database, auth, and storage. Your app becomes truly full-stack.', component: <DatabaseAnimation /> },
            ].map(s => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {s.component}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#0EA5E9', letterSpacing: '0.1em', marginBottom: 6 }}>{s.num}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.65 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison vs Lovable */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(14,165,233,0.02)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Why Wyber AI</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 40 }}>50% more credits at 75% of the price</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Lovable Pro', price: '$25/mo', credits: '~250 credits/mo', note: 'Credits reset monthly', bad: true },
              { label: 'Wyber AI Pro', price: '$18.99/mo', credits: '~390 credits/mo', note: 'Credits roll over', bad: false },
            ].map(c => (
              <div key={c.label} style={{ padding: 20, borderRadius: 12, background: c.bad ? '#111113' : 'rgba(14,165,233,0.05)', border: `1px solid ${c.bad ? 'rgba(255,255,255,0.07)' : 'rgba(14,165,233,0.2)'}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.bad ? '#52525b' : '#0EA5E9', marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 4 }}>{c.price}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.bad ? '#a1a1aa' : '#0EA5E9', marginBottom: 4 }}>{c.credits}</div>
                <div style={{ fontSize: 11, color: '#52525b' }}>{c.bad ? '⚠️' : '✓'} {c.note}</div>
              </div>
            ))}
          </div>
          <Link href="/pricing" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
            See full pricing →
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.03em' }}>Builders love Wyber AI</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ padding: 22, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 22, marginBottom: 14, color: '#0EA5E9' }}>"</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: '#a1a1aa', marginBottom: 16 }}>{t.quote}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#52525b' }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Community */}
      <section style={{ padding: 'clamp(40px,5vw,60px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, padding: '24px 28px', borderRadius: 16, background: 'rgba(88,101,242,0.08)', border: '1px solid rgba(88,101,242,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(88,101,242,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>💬</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Join the Wyber AI community</div>
              <div style={{ fontSize: 13, color: '#71717a' }}>Ask questions, share what you're building, get early feature previews</div>
            </div>
          </div>
          <a href="https://discord.gg/A5KsFv2P" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', borderRadius: 9, background: '#5865F2', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Join Discord →
          </a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(80px,10vw,140px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(30px,4vw,52px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1 }}>Start building today.<br />Free, forever.</h2>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, marginBottom: 32 }}>15 free credits on signup. No credit card required. Deploy your first app in under a minute.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '16px 36px', borderRadius: 12, background: '#0EA5E9', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(14,165,233,0.35)', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(14,165,233,0.45)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(14,165,233,0.35)' }}>
            Build your first app free →
          </Link>
          <div style={{ marginTop: 16, fontSize: 12, color: '#3f3f46' }}>No credit card · 15 free credits · Cancel anytime</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <WyberLogo size={20} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '-0.03em', color: '#71717a' }}>Wyber AI</span>
          <span style={{ fontSize: 12, color: '#3f3f46' }}>· A product by SignalPulse Technologies · © 2026</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Pricing', '/pricing'], ['Blog', '/blog'], ['Discord', 'https://discord.gg/A5KsFv2P']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: '#52525b', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a1a1aa'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#52525b'}>
              {l}
            </Link>
          ))}
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
