'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

function useTypewriter(words: string[], speed = 80, pause = 2000) {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wordIndex % words.length];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1));
        if (text.length === word.length) setTimeout(() => setDeleting(true), pause);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length === 0) { setDeleting(false); setWordIndex(i => i + 1); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [text, deleting, wordIndex, words, speed, pause]);
  return text;
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useScrollReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function FeatureCard({ icon, title, body, delay = 0 }: { icon: string; title: string; body: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 22px', transition: `opacity 0.5s ${delay}ms, transform 0.5s ${delay}ms`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }} className="feature-card">
      <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}

const DEMO_LINES = [
  { delay: 0,    color: '#8B8BA8', text: '> Build me a SaaS dashboard with dark mode' },
  { delay: 800,  color: '#A78BFA', text: '⚡ Planning: analyzing request...' },
  { delay: 1600, color: '#3DD68C', text: '✓ Created src/App.tsx' },
  { delay: 2000, color: '#3DD68C', text: '✓ Created src/components/Sidebar.tsx' },
  { delay: 2400, color: '#3DD68C', text: '✓ Created src/components/Charts.tsx' },
  { delay: 2800, color: '#3DD68C', text: '✓ Created src/components/StatsCard.tsx' },
  { delay: 3200, color: '#3DD68C', text: '✓ Updated src/index.css (dark theme)' },
  { delay: 3800, color: '#F0F0F4', text: '⬡ Preview ready · 5 files · 0 errors' },
];

function DemoTerminal() {
  const { ref, visible } = useScrollReveal();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!visible) return;
    DEMO_LINES.forEach((line, i) => { setTimeout(() => setShown(i + 1), line.delay); });
  }, [visible]);
  return (
    <div ref={ref} style={{ background: '#0A0A12', border: '1px solid #2A2A3A', borderRadius: 12, padding: '20px 22px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, lineHeight: 1.8, minHeight: 220 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['#FF5F57','#FFBD2E','#28C840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
      </div>
      {DEMO_LINES.slice(0, shown).map((line, i) => (
        <div key={i} style={{ color: line.color, display: 'flex', alignItems: 'center', gap: 8 }}>
          {line.text}
          {i === shown - 1 && shown < DEMO_LINES.length && (
            <span style={{ display: 'inline-block', width: 2, height: 14, background: '#A78BFA', animation: 'blink 1s step-end infinite' }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const typed = useTypewriter(['React apps', 'Vue dashboards', 'landing pages', 'SaaS tools', 'web games', 'portfolios'], 70, 2200);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 60, background: scrolled ? 'rgba(13,13,15,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent', transition: 'all 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/icon.svg" alt="Wyber AI" style={{ width: 28, height: 28 }} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em' }}>Wyber <span style={{ color: '#7C3AED' }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[['Pricing', '/pricing'], ['Templates', '/templates'], ['vs Lovable', '/vs/lovable'], ['Status', '/status']].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }} className="nav-link">{label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', padding: '7px 14px' }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: 14, padding: '8px 18px', borderRadius: 8, background: '#7C3AED', color: 'white', textDecoration: 'none', fontWeight: 500, boxShadow: '0 0 20px rgba(124,58,237,0.35)' }} className="cta-btn">
            Start free →
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 24px 70px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 32, fontSize: 12, color: '#A78BFA', fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3DD68C', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
          More credits than Lovable · Half the price
        </div>

        <h1 style={{ fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.08, margin: '0 0 20px' }}>
          Build{' '}
          <span style={{ color: '#7C3AED', display: 'inline-block', minWidth: 280, textAlign: 'left' }}>
            {typed}<span style={{ animation: 'blink 1s step-end infinite', borderRight: '3px solid #7C3AED', marginLeft: 2 }}/>
          </span>
          <br />with one prompt
        </h1>

        <p style={{ fontSize: 19, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 44px' }}>
          Wyber AI generates production-ready apps with live preview, GitHub sync, and one-click deploy. React, Vue, Vanilla, Next.js. No lock-in. Ever.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <Link href="/signup" style={{ padding: '14px 32px', borderRadius: 10, background: '#7C3AED', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: 16, boxShadow: '0 4px 32px rgba(124,58,237,0.4)' }} className="cta-btn">
            Start building free →
          </Link>
          <Link href="/pricing" style={{ padding: '14px 24px', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: 15, background: 'var(--bg-surface)' }}>
            See pricing
          </Link>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>50 free credits · No credit card · No lock-in</p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, background: 'var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {[
            { label: 'Free credits/month', value: 50, sub: 'Lovable gives 30' },
            { label: 'Pro plan credits', value: 400, sub: 'Lovable gives 250 for $25' },
            { label: 'Frameworks supported', value: 4, sub: 'React, Vue, Vanilla, Next' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-surface)', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                <Counter target={s.value} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 10px' }}>Watch it build</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>One prompt. Real code. Instant preview.</p>
        </div>
        <DemoTerminal />
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 12px' }}>Everything Lovable has. And more.</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: 0 }}>Built by developers who got frustrated paying for bugs they didn't write.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 14 }}>
          <FeatureCard delay={0}   icon="⚡" title="50 free credits/month" body="Lovable gives you 30. We give you 50. And we don't charge credits when the AI makes a mistake — only successful generations cost credits." />
          <FeatureCard delay={60}  icon="◎" title="Visual click-to-edit" body="Click any element in the live preview. Edit text, colors, spacing. Changes go straight into your source code." />
          <FeatureCard delay={120} icon="⬡" title="Multi-framework" body="React, Vue, Vanilla JS, Next.js. Lovable is React-only. Your tech choice, your app." />
          <FeatureCard delay={180} icon="◈" title="Agent Mode" body="Describe a full feature. Agent Mode breaks it into steps, executes each one, and commits the result." />
          <FeatureCard delay={240} icon="✦" title="Theme system" body="One-click brand themes. Set your colors, font, and radius once. Every component inherits your brand." />
          <FeatureCard delay={300} icon="⌥" title="GitHub auto-commit" body="Every generation commits to your repo automatically. Full version history. Restore any state with one click." />
          <FeatureCard delay={360} icon="↥" title="One-click deploy" body="Ship to a live URL in 30 seconds via Vercel. Free subdomain. Custom domain on Pro." />
          <FeatureCard delay={420} icon="🛡" title="AI Security Review" body="Every deployment scans for vulnerabilities — hardcoded keys, missing auth, open endpoints. Built-in from day one." />
          <FeatureCard delay={480} icon="⊞" title="15+ templates" body="SaaS dashboard, CRM, Kanban, invoice generator, chat app, portfolio — one click to a full working app." />
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0A0A12, #0F0818)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16, padding: '36px 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛡</div>
          <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.02em' }}>We don't charge you for AI mistakes</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, margin: '0 0 20px' }}>
            Lovable charges credits even when it breaks your code. A recent audit found 91.5% of Lovable-generated apps had at least one vulnerability. Wyber AI only deducts credits on successful generations, and every deploy gets a security scan first.
          </p>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', color: '#A78BFA', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Start building safely →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 32 }}>Wyber AI vs Lovable</h2>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', background: 'var(--bg-elevated)', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Feature</span>
            <span style={{ fontSize: 12, color: '#A78BFA', fontWeight: 700, textAlign: 'center' }}>⚡ Wyber AI</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 500 }}>Lovable</span>
          </div>
          {[
            ['Free credits/month', '50', '30'],
            ['Pro credits', '400 / $15', '250 / $25'],
            ['Charge for AI errors', '✕ Never', '✓ Always'],
            ['Frameworks', 'React, Vue, Vanilla, Next', 'React only'],
            ['Security scan on deploy', '✓ Built-in', '✓ Paid only'],
            ['Agent Mode', '✓', '✓'],
            ['Visual editor', '✓', '✓'],
            ['GitHub sync', '✓', '✓ Paid'],
            ['Template gallery', '15+ templates', 'Limited'],
            ['Export code', '✓ Always free', '✓ Always free'],
            ['Credit transparency', '✓ Per-generation', '✕ Hidden'],
          ].map(([label, wyber, lov]) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '11px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500, textAlign: 'center' }}>{wyber}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>{lov}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px 100px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 16 }}>Ready to ship?</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 32 }}>50 free credits. No card. No lock-in. Your code, always.</p>
        <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 12, background: '#7C3AED', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 17, boxShadow: '0 8px 40px rgba(124,58,237,0.45)' }} className="cta-btn">
          ⚡ Start building free
        </Link>
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/icon.svg" alt="" style={{ width: 22, height: 22 }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>© 2025 Wyber AI. Build without limits.</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Pricing', '/pricing'], ['Templates', '/templates'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['vs Lovable', '/vs/lovable']].map(([l, h]) => (
            <Link key={h} href={h} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }} className="nav-link">{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:0.5;transform:scale(0.9)}50%{opacity:1;transform:scale(1.1)} }
        .feature-card:hover { border-color: rgba(124,58,237,0.4) !important; background: var(--bg-elevated) !important; }
        .nav-link:hover { color: var(--text-primary) !important; }
        .cta-btn:hover { filter: brightness(1.12); transform: translateY(-1px); }
      `}</style>
    </div>
  );
}