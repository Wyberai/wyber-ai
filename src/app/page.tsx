'use client';
import { LiveDemo } from '@/components/shared/LiveDemo';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';

function WyberLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

function useTypewriter(words: string[], speed = 60, pause = 2000) {
  const [text, setText] = useState('');
  const [wi, setWi] = useState(0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[wi % words.length];
    const t = setTimeout(() => {
      if (!del) {
        setText(word.slice(0, text.length + 1));
        if (text.length === word.length) setTimeout(() => setDel(true), pause);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length === 0) { setDel(false); setWi(i => i + 1); }
      }
    }, del ? speed / 2 : speed);
    return () => clearTimeout(t);
  }, [text, del, wi]);
  return text;
}

const WORDS = ['a React dashboard', 'a SaaS product', 'a customer portal', 'an e-commerce store', 'an internal tool', 'a booking system'];

const FEATURES = [
  { tag: '01', title: 'Describe what you want', body: 'Plain English. No Figma, no briefs. Type what you need and watch it appear. Even rough ideas produce something real in under 60 seconds.', demo: 'hero' },
  { tag: '02', title: 'Live preview alongside your code', body: 'Files stream as you watch. A fully interactive preview loads beside the code. Iterate, refine, make it yours -- all in the same window.', demo: 'preview' },
  { tag: '03', title: 'Pay only for what works', body: 'Credits deduct on success only. AI mistakes? Fixed free. Every time. No hidden charges, no credit burns on errors.', demo: 'credits' },
  { tag: '04', title: 'Ship to production today', body: 'Deploy to Vercel in one click. Connect your domain. Real users, real URL -- before your day is over.', demo: 'deploy' },
];

const INTEGRATIONS = [
  'Supabase', 'Airtable', 'HubSpot', 'Slack', 'Anthropic', 'ElevenLabs',
  'Stripe', 'Resend', 'PostHog', 'GitHub', 'Vercel', 'Linear',
  'Notion', 'Mixpanel', 'OpenAI', 'Figma', 'Twilio', 'Salesforce',
];

export default function HomePage() {
  const { theme, toggle } = useTheme();
  const typed = useTypewriter(WORDS);
  const [stats, setStats] = useState({ projects: 1000, users: 500 });
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      if (d.projects) setStats(d);
    }).catch(() => {});
  }, []);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#000000' : '#FFFFFF', color: isDark ? '#F5F5F5' : '#111111', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px,4vw,48px)',
        background: scrolled ? (isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)') : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <WyberLogo size={26} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.05em', color: isDark ? '#F5F5F5' : '#111111' }}>
            Wyber<span style={{ color: '#0EA5E9' }}>AI</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hide-mobile">
          {[['Founders', '/founders'], ['Marketers', '/marketers'], ['Pricing', '/pricing'], ['Blog', '/blog']].map(([l, h]) => (
            <Link key={h} href={h} style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = isDark ? '#F5F5F5' : '#111111'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}>
              {l}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggle} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: isDark ? '#F5F5F5' : '#111111', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isDark ? '☀' : '◑'}
          </button>
          <Link href="/login" style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', padding: '6px 14px', fontWeight: 500 }} className="hide-mobile">Sign in</Link>
          <Link href="/signup" style={{ fontSize: 13, fontWeight: 700, padding: '8px 20px', borderRadius: 9, background: '#0EA5E9', color: '#fff', letterSpacing: '-0.01em', boxShadow: '0 0 24px rgba(14,165,233,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0284C7'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0EA5E9'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
            Start free
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(100px,14vw,160px) clamp(20px,4vw,40px) clamp(60px,8vw,100px)', textAlign: 'center', position: 'relative' }}>

        {/* Glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(14,165,233,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, border: '1px solid rgba(14,165,233,0.25)', background: 'rgba(14,165,233,0.06)', fontSize: 11, fontWeight: 600, color: '#0EA5E9', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 32 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Now live
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(44px,8vw,96px)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.0, color: isDark ? '#FFFFFF' : '#000000', marginBottom: 8, maxWidth: 900 }}>
          Turn plain English into
        </h1>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(44px,8vw,96px)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.0, color: '#0EA5E9', marginBottom: 32, minHeight: 'clamp(52px,9vw,108px)' }}>
          {typed}<span style={{ animation: 'blink 1s step-end infinite', color: '#0EA5E9', fontWeight: 300 }}>|</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', lineHeight: 1.6, maxWidth: 560, marginBottom: 48 }}>
          React, Next.js, Vue, or Vanilla JS -- with live preview, GitHub sync, and one-click deploy. Free to start. No card required.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 64 }}>
          <Link href="/signup" style={{ fontSize: 15, fontWeight: 700, padding: '14px 32px', borderRadius: 10, background: '#0EA5E9', color: '#fff', letterSpacing: '-0.02em', boxShadow: '0 0 40px rgba(14,165,233,0.35)', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0284C7'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(14,165,233,0.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0EA5E9'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(14,165,233,0.35)'; }}>
            Start building free
          </Link>
          <Link href="/pricing" style={{ fontSize: 15, fontWeight: 500, padding: '14px 28px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#0EA5E9'; (e.currentTarget as HTMLElement).style.color = '#0EA5E9'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'; (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'; }}>
            See pricing
          </Link>
        </div>

        {/* Hero demo placeholder -- replace src with your recorded video */}
        <div style={{ width: '100%', maxWidth: 900, borderRadius: 16, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, boxShadow: isDark ? '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(14,165,233,0.1)' : '0 40px 120px rgba(0,0,0,0.15)', position: 'relative' }}>
          <div style={{ background: isDark ? '#111111' : '#F5F5F5', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
            {['#FF5F57','#FFBD2E','#28CA41'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>wyberai.com</div>
          </div>
          {/* REPLACE THIS with: <video autoPlay muted loop playsInline src="/demo.mp4" style={{ width: '100%', display: 'block' }} /> */}
          <div style={{ height: 480, background: isDark ? '#0A0A0A' : '#FAFAFA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>
            <div style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>Record your demo and replace this with a video</div>
            <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', fontFamily: 'var(--font-mono)' }}>{'<video autoPlay muted loop src="/demo.mp4" />'}</div>
          </div>
        </div>
      </section>

      {/* Live Interactive Demo */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36, maxWidth: 600, margin: '0 auto 36px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Try it yourself — no sign-up needed</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>Type a prompt. Get a real app.</h2>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65 }}>See exactly what Wyber AI builds. Describe your app and watch it generate live.</p>
        </div>
        <LiveDemo />
      </section>

      {/* HOW IT WORKS -- feature sections */}
      {FEATURES.map((f, i) => (
        <section key={i} style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(60px,10vw,120px) clamp(20px,4vw,48px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>{f.tag}</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 400, letterSpacing: '-0.025em', color: isDark ? '#FFFFFF' : '#000000', lineHeight: 1.1, marginBottom: 20 }}>
              {f.title}
            </h2>
            <p style={{ fontSize: 17, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', lineHeight: 1.75 }}>{f.body}</p>
          </div>
          {/* Video placeholder per feature -- replace with actual clips */}
          <div style={{ order: i % 2 === 0 ? 1 : 0, borderRadius: 14, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, background: isDark ? '#0A0A0A' : '#F5F5F5', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.08)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, margin: '0 auto 10px' }}>▶</div>
              <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>Feature {f.tag} demo</div>
            </div>
          </div>
        </section>
      ))}

      {/* INTEGRATIONS */}
      <section style={{ padding: 'clamp(60px,10vw,120px) clamp(20px,4vw,48px)', textAlign: 'center', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Integrations</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 400, letterSpacing: '-0.025em', color: isDark ? '#FFFFFF' : '#000000', marginBottom: 16, lineHeight: 1.1 }}>
          Connect your entire stack
        </h2>
        <p style={{ fontSize: 17, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', marginBottom: 52 }}>35+ connectors. Add any from the IDE in one click.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
          {INTEGRATIONS.map(name => (
            <div key={name} style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', fontSize: 13, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontWeight: 500, transition: 'all 0.15s', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)'; (e.currentTarget as HTMLElement).style.color = '#0EA5E9'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'; }}>
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* PRICING TEASER */}
      <section style={{ padding: 'clamp(60px,10vw,120px) clamp(20px,4vw,48px)', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>Pricing</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 400, letterSpacing: '-0.025em', color: isDark ? '#FFFFFF' : '#000000', textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Start free. Scale as you ship.
          </h2>
          <p style={{ fontSize: 17, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'center', marginBottom: 52 }}>50 free credits every month. No card required. Upgrade when you need more.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { name: 'Free', price: '$0', credits: '50 credits/month', features: ['React, Next.js, Vue, Vanilla JS', 'Live preview', 'GitHub sync', 'Export ZIP'] },
              { name: 'Starter', price: '$15', credits: '400 credits/month', features: ['Everything in Free', 'Private projects', 'Priority generation', 'Email support'], highlight: false },
              { name: 'Pro', price: '$39', credits: '1,200 credits/month', features: ['Everything in Starter', 'Custom domains', 'MCP server access', 'API access'], highlight: true },
            ].map(tier => (
              <div key={tier.name} style={{ padding: '28px 24px', borderRadius: 14, border: tier.highlight ? '1px solid rgba(14,165,233,0.4)' : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, background: tier.highlight ? 'rgba(14,165,233,0.05)' : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', position: 'relative' }}>
                {tier.highlight && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, padding: '2px 12px', borderRadius: 20, background: '#0EA5E9', color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Most popular</div>}
                <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tier.name}</div>
                <div style={{ fontSize: 40, fontWeight: 700, color: isDark ? '#FFFFFF' : '#000000', letterSpacing: '-0.04em', marginBottom: 4 }}>{tier.price}<span style={{ fontSize: 14, fontWeight: 400, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>/mo</span></div>
                <div style={{ fontSize: 12, color: '#0EA5E9', fontWeight: 600, marginBottom: 20 }}>{tier.credits}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {tier.features.map(f => (
                    <div key={f} style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: '#0EA5E9', flexShrink: 0, fontSize: 11, fontWeight: 700 }}>+</span>{f}
                    </div>
                  ))}
                </div>
                <Link href={tier.name === 'Free' ? '/signup' : '/pricing'} style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 8, background: tier.highlight ? '#0EA5E9' : 'transparent', border: `1px solid ${tier.highlight ? '#0EA5E9' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`, color: tier.highlight ? '#fff' : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}>
                  {tier.name === 'Free' ? 'Start for free' : `Get ${tier.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(80px,12vw,140px) clamp(20px,4vw,48px)', textAlign: 'center', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px,6vw,72px)', fontWeight: 400, letterSpacing: '-0.03em', color: isDark ? '#FFFFFF' : '#000000', marginBottom: 20, lineHeight: 1.05 }}>
          Your idea deserves<br />to be built.
        </h2>
        <p style={{ fontSize: 18, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', marginBottom: 40 }}>50 free credits. No card. Start in 30 seconds.</p>
        <Link href="/signup" style={{ display: 'inline-block', fontSize: 16, fontWeight: 700, padding: '16px 40px', borderRadius: 10, background: '#0EA5E9', color: '#fff', letterSpacing: '-0.02em', boxShadow: '0 0 60px rgba(14,165,233,0.4)', transition: 'all 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0284C7'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0EA5E9'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
          Start building free
        </Link>
        <div style={{ marginTop: 20, fontSize: 13, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }}>
          {stats.projects.toLocaleString()}+ apps built · {stats.users.toLocaleString()}+ builders · Free to start
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, padding: 'clamp(32px,5vw,56px) clamp(20px,4vw,48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <WyberLogo size={22} />
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.04em', color: isDark ? '#F5F5F5' : '#111111' }}>Wyber<span style={{ color: '#0EA5E9' }}>AI</span></span>
            </div>
            <p style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', lineHeight: 1.6 }}>Turn plain English into production apps. Built by SignalPulse Technologies.</p>
          </div>
          {[
            { title: 'Product', links: [['Pricing', '/pricing'], ['Templates', '/templates'], ['Connectors', '/connectors'], ['Changelog', '/changelog']] },
            { title: 'Solutions', links: [['Founders', '/founders'], ['Marketers', '/marketers'], ['Designers', '/designers']] },
            { title: 'Company', links: [['Blog', '/blog'], ['Security', '/security'], ['Community', '/community'], ['Affiliates', '/affiliates']] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map(([l, h]) => (
                  <Link key={h} href={h} style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = isDark ? '#F5F5F5' : '#111111'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}>
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1100, margin: '32px auto 0', paddingTop: 24, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }}>
            2026 SignalPulse Technologies LLC. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', 'mailto:hello@wyberai.com']].map(([l, h]) => (
              <Link key={h} href={h} style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.2)} }
        @media(max-width:768px) { .hide-mobile{display:none!important} }
      `}</style>
    </div>
  );
}
