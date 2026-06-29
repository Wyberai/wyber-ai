'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { WyberLogo } from '@/components/shared/WyberLogo';
import { Footer } from '@/components/shared/FooterClient';

const BRAND = '#0EA5E9';

const IcoCheck = ({ color = '#22c55e' }: { color?: string }) => (
  <svg width="10" height="10" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

function WindowChrome({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 12, alignItems: 'center' }}>
      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }} />
      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
      <span style={{ marginLeft: 8, color: '#52525b', fontSize: 10 }}>{title}</span>
    </div>
  );
}

function WebAppMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: 'monospace', fontSize: 11 }}>
      <WindowChrome title="wyberai.com — Live Build" />
      {[
        { done: true,  active: false, label: 'Prompt received',       detail: '"Build a CRM with pipeline view"' },
        { done: true,  active: false, label: 'Generating React code', detail: '14 files · Supabase schema' },
        { done: true,  active: false, label: 'Pushing to GitHub',     detail: 'wyberai/crm-abc123' },
        { done: false, active: true,  label: 'Deployed to Vercel',    detail: 'crm-abc123.vercel.app' },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.active ? BRAND : s.done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${s.active ? BRAND : s.done ? '#22c55e' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            {s.done && !s.active && <IcoCheck />}
            {s.active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />}
          </div>
          <div>
            <div style={{ color: s.active ? '#fafafa' : s.done ? '#a1a1aa' : '#52525b', fontWeight: s.active ? 700 : 500, fontSize: 11 }}>{s.label}</div>
            <div style={{ color: '#3f3f46', fontSize: 10, marginTop: 2 }}>{s.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: 'monospace', fontSize: 11 }}>
      <WindowChrome title="wyberai.com — Mobile Build" />
      {[
        { done: true,  active: false, label: 'Scaffold Expo project',   detail: 'TypeScript · React Native' },
        { done: true,  active: false, label: 'Generate 9 screens',       detail: 'Auth, home, profile, cart…' },
        { done: false, active: true,  label: 'Live preview ready',       detail: 'scan QR to open on device' },
        { done: false, active: false, label: 'Export for App Store',     detail: 'EAS Build · IPA / APK' },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.active ? '#f97316' : s.done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${s.active ? '#f97316' : s.done ? '#22c55e' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            {s.done && !s.active && <IcoCheck />}
            {s.active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />}
          </div>
          <div>
            <div style={{ color: s.active ? '#fafafa' : s.done ? '#a1a1aa' : '#52525b', fontWeight: s.active ? 700 : 500, fontSize: 11 }}>{s.label}</div>
            <div style={{ color: '#3f3f46', fontSize: 10, marginTop: 2 }}>{s.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmployeeMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11 }}>
      <WindowChrome title="wyberai.com — AI Employees" />
      {[
        { emoji: '📣', name: 'Marketing Manager', dept: 'Marketing · daily 09:00', status: 'Active', color: '#22c55e', detail: 'Drafted competitor analysis and 3 blog outlines' },
        { emoji: '🎯', name: 'Sales Manager', dept: 'Sales · daily 08:00', status: 'Active', color: '#22c55e', detail: 'Qualified 12 inbound leads, updated CRM pipeline' },
        { emoji: '📊', name: 'Finance Manager', dept: 'Finance · weekly Mon', status: 'Running', color: BRAND, detail: 'Building monthly P&L report…' },
      ].map(a => (
        <div key={a.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>{a.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: '#fafafa', fontSize: 11 }}>{a.name}</div>
            <div style={{ color: '#52525b', fontSize: 10, marginTop: 1 }}>{a.dept}</div>
            <div style={{ color: '#71717a', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.detail}</div>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: `${a.color}15`, color: a.color, border: `1px solid ${a.color}30`, flexShrink: 0 }}>{a.status}</span>
        </div>
      ))}
    </div>
  );
}

function WorkflowMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11 }}>
      <WindowChrome title="wyberai.com — Workflows" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[
          { label: 'Trigger', detail: 'New form submission', color: '#a855f7', icon: '⚡' },
          { label: 'AI Step', detail: 'Classify lead quality', color: BRAND, icon: '🤖' },
          { label: 'Branch', detail: 'Score ≥ 7 → notify sales', color: '#22c55e', icon: '🔀' },
          { label: 'Action', detail: 'Post to #leads in Slack', color: '#f59e0b', icon: '📢' },
        ].map((n, i, arr) => (
          <div key={n.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${n.color}22`, borderRadius: 8, width: '100%' }}>
              <span>{n.icon}</span>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, color: n.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{n.label}</span>
                <div style={{ color: '#a1a1aa', fontSize: 10 }}>{n.detail}</div>
              </div>
            </div>
            {i < arr.length - 1 && <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)', marginLeft: 22 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function GTMMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11 }}>
      <WindowChrome title="wyberai.com — GTM Engine" />
      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>ICP Match · 142 leads found</div>
        {[
          { label: 'Title', value: 'VP Engineering, CTO' },
          { label: 'Company', value: 'SaaS · 50–500 employees' },
          { label: 'Signal', value: 'Raised Series A in last 6mo' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#52525b' }}>{r.label}</span>
            <span style={{ color: '#a1a1aa', fontWeight: 600 }}>{r.value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { day: 'Day 0', type: '✉️ Email', detail: 'Personalised cold intro sent', color: '#10b981' },
          { day: 'Day 3', type: '⏳ Wait', detail: 'Watching for reply / open', color: '#52525b' },
          { day: 'Day 4', type: '✉️ Email', detail: 'Case study follow-up queued', color: '#10b981' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 7 }}>
            <span style={{ fontSize: 9, color: '#3f3f46', width: 30, flexShrink: 0 }}>{s.day}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.type}</span>
            <span style={{ fontSize: 10, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PRODUCTS = [
  {
    key: 'web',
    label: 'Web Apps',
    emoji: '🌐',
    accent: BRAND,
    heading: 'Describe it. It builds.',
    body: 'Type what you want in plain English. Wyber generates production-ready React code, provisions a database, and deploys to a live URL — in minutes.',
    bullets: ['Fresh code every time — no stale templates', 'Self-healing preview — errors fix themselves', 'GitHub push · Vercel deploy · custom domains'],
    cta: 'Start building',
    href: '/gallery',
    mockup: <WebAppMockup />,
  },
  {
    key: 'mobile',
    label: 'Mobile Apps',
    emoji: '📱',
    accent: '#f97316',
    heading: 'Describe it. Ship to iOS.',
    body: 'Generate a real React Native app with Expo. Preview on your phone via QR code. Export a ready-to-publish project.',
    bullets: ['React Native + Expo · camera, GPS, biometrics', 'Push notifications · in-app purchases', 'App Store submission guide included'],
    cta: 'Start building',
    href: '/templates/mobile',
    mockup: <MobileMockup />,
  },
] as const;

// ── AI Employee launch spotlight — carousel hyping the Marketing Manager ──────
const MM_SLIDES = [
  {
    tag: 'Launching Mon · Jul 6',
    title: 'Meet your new AI employee',
    sub: 'The Marketing Manager — the first of a new AI employee every Monday.',
    bullets: ['Onboards in minutes, then runs on its own schedule', 'Reports back to you after every shift', 'Works while you sleep'],
    accent: '#a855f7',
  },
  {
    tag: 'Not an agent',
    title: 'An employee commands an army of agents',
    sub: 'Don\'t mistake it for a single agent. Each WyberAI employee orchestrates 200+ specialized agents to get real work done.',
    bullets: ['1 employee → 200+ agents on tap', 'Delegates the right agent to each task', 'You manage one colleague, not 200 tools'],
    accent: BRAND,
  },
  {
    tag: 'What it does',
    title: 'A full marketing department in one hire',
    sub: 'The Marketing Manager plans and ships across your whole funnel.',
    bullets: ['Content engine — blogs, social, email, landing copy', 'Competitor & market intel on a schedule', 'Campaign planning + multi-channel publishing', 'Weekly performance digest in your inbox'],
    accent: '#22c55e',
  },
  {
    tag: 'How it thinks',
    title: 'Plan → delegate → execute → report',
    sub: 'It breaks a goal into a plan, assigns each step to the best agent, runs the tools, reviews the output, and sends you the result.',
    bullets: ['Connects 30+ tools (Gmail, Slack, LinkedIn, HubSpot…)', 'Self-checks its own work before it ships', 'Escalates to you only when it matters'],
    accent: '#f59e0b',
  },
] as const;

function AIEmployeeSpotlight() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % MM_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const s = MM_SLIDES[i];
  return (
    <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0b0b0e', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${s.accent}14 0%, transparent 65%)`, pointerEvents: 'none', transition: 'background 0.5s' }} />
      <div style={{ maxWidth: 920, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', fontSize: 12, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', animation: 'pulse 2s infinite' }} />
            New every Monday
          </div>
        </div>

        <div style={{ background: '#111113', border: `1px solid ${s.accent}30`, borderRadius: 20, padding: 'clamp(28px,4vw,48px)', minHeight: 280, display: 'grid', gridTemplateColumns: '1fr', gap: 8, transition: 'border-color 0.5s' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.accent, marginBottom: 4, transition: 'color 0.5s' }}>{s.tag}</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8 }}>{s.title}</h2>
          <p style={{ fontSize: 'clamp(14px,1.6vw,17px)', color: '#a1a1aa', lineHeight: 1.6, maxWidth: 620, marginBottom: 12 }}>{s.sub}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px,100%), 1fr))', gap: 10 }}>
            {s.bullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 14, color: '#d4d4d8' }}>
                <IcoCheck color={s.accent} /><span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {MM_SLIDES.map((sl, idx) => (
            <button key={idx} onClick={() => setI(idx)} aria-label={`Slide ${idx + 1}`}
              style={{ width: idx === i ? 28 : 8, height: 8, borderRadius: 8, border: 'none', background: idx === i ? sl.accent : 'rgba(255,255,255,0.15)', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link href="/coming-soon?product=AI+Employees" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 11, background: '#a855f7', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(168,85,247,0.35)' }}>
            Get notified when it drops →
          </Link>
        </div>
      </div>
    </section>
  );
}

// Homepage FAQ — visible accordion + matching FAQPage schema (AEO). The
// "Who makes WyberAi?" answer explicitly names SignalPulse Technologies to
// correct stale Knowledge Graph data.
const HOME_FAQS: [string, string][] = [
  ['What is WyberAi?', 'WyberAi is an AI platform that turns plain-English prompts into production-ready web and mobile apps. Describe what you want and it generates fresh React code, provisions a database, and deploys to a live URL — in minutes, no engineers needed.'],
  ['Who makes WyberAi?', 'WyberAi is built and operated by SignalPulse Technologies, a US-based software company.'],
  ['Can WyberAi build mobile apps?', 'Yes. WyberAi generates real React Native (Expo) mobile apps you can preview on your phone via QR code and export for the App Store — from the same prompt-based workflow as web apps.'],
  ['Do I need to know how to code?', 'No. You describe your app in plain English. WyberAi writes the code, wires up auth, database, and APIs, and deploys it. You can still push to GitHub and own the code if you want.'],
  ['How is WyberAi different from template builders?', 'WyberAi generates fresh code from scratch every time — never stale templates. Builds self-heal their own errors, ship full-stack (auth, database, APIs), and you own the code via GitHub with zero lock-in.'],
  ['How much does WyberAi cost?', 'You can start free with 50 credits, no credit card required. Paid plans start at $29/month, and one-time credit top-ups never expire.'],
]

export default function HomePage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setUser(data.user));
    });
  }, []);

  const product = PRODUCTS[activeProduct];

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif", overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        <div className="wyb-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {([['Web Apps', '/gallery'], ['Mobile Apps', '/templates/mobile'], ['Pricing', '/pricing']] as [string, string][]).map(([l, h]) => (
            <Link key={l} href={h} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 13, color: '#71717a', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fafafa'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#71717a'}>
              {l}
            </Link>
          ))}
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />
          {user
            ? <Link href="/dashboard" style={{ padding: '7px 16px', borderRadius: 8, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Dashboard →</Link>
            : <>
                <Link href="/login" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, color: '#a1a1aa', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
                <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 20px rgba(14,165,233,0.25)' }}>Start free →</Link>
              </>
          }
        </div>
        <button className="wyb-nav-hamburger" onClick={() => setMobileMenuOpen(o => !o)} aria-label="Toggle menu"
          style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 22, height: 2, background: '#a1a1aa', borderRadius: 1, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <div style={{ width: 22, height: 2, background: mobileMenuOpen ? 'transparent' : '#a1a1aa', borderRadius: 1 }} />
          <div style={{ width: 22, height: 2, background: '#a1a1aa', borderRadius: 1, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 99, background: 'rgba(9,9,11,0.98)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {([['Web Apps', '/gallery'], ['Mobile Apps', '/templates/mobile'], ['Pricing', '/pricing']] as [string, string][]).map(([l, h]) => (
            <Link key={l} href={h} onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 4px', fontSize: 16, fontWeight: 600, color: '#a1a1aa', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'block', minHeight: 44 }}>{l}</Link>
          ))}
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user
              ? <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ padding: '13px 0', textAlign: 'center', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'block' }}>Dashboard →</Link>
              : <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ padding: '13px 0', textAlign: 'center', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 15, textDecoration: 'none', display: 'block' }}>Sign in</Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} style={{ padding: '13px 0', textAlign: 'center', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'block' }}>Start free →</Link>
                </>
            }
          </div>
        </div>
      )}

      {/* ── BUILD CHALLENGE BANNER ──────────────────────────────────── */}
      <Link href="/challenge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '10px 20px', background: 'linear-gradient(90deg, rgba(168,85,247,0.15), rgba(14,165,233,0.15))', borderBottom: '1px solid rgba(168,85,247,0.2)', textDecoration: 'none', color: '#fafafa', fontSize: 13, fontWeight: 600 }}>
        <span style={{ fontSize: 16 }}>🏆</span>
        <span>Weekly Build Challenge — <span style={{ color: '#a855f7' }}>$500 in prizes every week</span> — New winners every Sunday</span>
        <span style={{ color: '#a855f7', fontSize: 12 }}>Enter now →</span>
      </Link>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(80px,12vw,160px) clamp(20px,4vw,48px) clamp(60px,8vw,100px)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(14,165,233,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 12, fontWeight: 600, color: BRAND, marginBottom: 24 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
            Now live — Web Apps & Mobile Apps
          </div>

          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(40px,7vw,80px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.0, marginBottom: 20 }}>
            Vibe code with{' '}<br />
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, #a855f7)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              WyberAi
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(16px,2vw,22px)', color: '#a1a1aa', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 40px' }}>
            Describe your web or mobile app in plain English. AI builds it, deploys it, and gives you a live URL — in minutes, not months.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', borderRadius: 12, background: BRAND, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(14,165,233,0.35)', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
              Start building — it's free →
            </Link>
            <button onClick={() => setShowDemo(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.03)', color: '#e4e4e7', fontSize: 16, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLElement).style.color = '#fafafa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLElement).style.color = '#e4e4e7' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: BRAND }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="#fff"><path d="M3 2l7 4-7 4z" /></svg>
              </span>
              Watch the demo
            </button>
          </div>

          <p style={{ fontSize: 13, color: '#52525b' }}>No credit card required · Starts at $29/mo · Cancel anytime</p>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ─────────────────────────────────────────── */}
      <section style={{ padding: '32px clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'clamp(24px,5vw,64px)', flexWrap: 'wrap' }}>
          {[
            { value: '2,400+', label: 'apps built' },
            { value: '30s', label: 'avg build time' },
            { value: '4.9/5', label: 'user rating' },
            { value: '99.9%', label: 'uptime' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#fafafa', fontFamily: "'Sora', sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Employee spotlight hidden until launch */}

      {/* ── HOW IT WORKS — 3 steps ──────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', background: '#0b0b0e' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em' }}>From idea to live app in 3 steps</h2>
          </div>
          <div className="wyb-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
            {[
              { step: '01', title: 'Describe your app', desc: 'Tell Wyber what you want in plain English — or drop in screenshots, Figma files, or docs.', color: BRAND },
              { step: '02', title: 'AI builds it live', desc: 'Watch as AI generates production-ready code in real-time. Fresh code every time — never stale templates.', color: '#a855f7' },
              { step: '03', title: 'Ship it', desc: 'Deploy to a live URL with one click. Connect your domain, push to GitHub, iterate with simple feedback.', color: '#22c55e' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: s.color + '12', border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Sora', sans-serif" }}>{s.step}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fafafa', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>{s.title}</div>
                <p style={{ fontSize: 14, color: '#71717a', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS — interactive tabs with mockups ────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Products</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Web apps & mobile apps, one platform
            </h2>
            <p style={{ fontSize: 15, color: '#71717a', marginTop: 8 }}>Everything you need to build, launch, and grow — in one place.</p>
          </div>

          {/* Product pills */}
          <div className="wyb-product-pills" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 40, flexWrap: 'wrap' }}>
            {PRODUCTS.map((p, i) => (
              <button key={p.key} onClick={() => setActiveProduct(i)}
                style={{ padding: '8px 18px', borderRadius: 20, border: `1px solid ${i === activeProduct ? p.accent + '50' : 'rgba(255,255,255,0.08)'}`, background: i === activeProduct ? p.accent + '15' : 'transparent', color: i === activeProduct ? p.accent : '#71717a', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{p.emoji}</span> {p.label}
                {(p as any).soon && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#52525b', fontWeight: 700 }}>SOON</span>}
              </button>
            ))}
          </div>

          {/* Active product detail */}
          <div className="wyb-product-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12, color: '#fafafa', lineHeight: 1.15 }}>
                {product.heading}
              </h3>
              <p style={{ fontSize: 15, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 24 }}>
                {product.body}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {product.bullets.map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#a1a1aa' }}>
                    <IcoCheck color={product.accent} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link href={product.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: product.accent, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 20px ${product.accent}30` }}>
                {product.cta} →
              </Link>
            </div>
            <div>{product.mockup}</div>
          </div>
        </div>
      </section>

      {/* ── WHY WYBER ────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', background: '#0b0b0e', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Why WyberAi</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Not another template marketplace
            </h2>
          </div>
          <div className="wyb-why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: '⚡', title: 'Fresh code, every time', desc: 'No drag-and-drop. No stale templates. AI writes real React + Tailwind CSS from scratch for every project.', color: BRAND },
              { icon: '🔄', title: 'Self-healing builds', desc: 'Build errors? The AI detects them and fixes itself. No debugging, no Stack Overflow rabbit holes.', color: '#22c55e' },
              { icon: '🚀', title: 'One-click deploy', desc: 'Your app goes live on Vercel with a real URL. Connect your domain, share with the world — in seconds.', color: '#f97316' },
              { icon: '📦', title: 'Full-stack out of the box', desc: 'Auth, database, API routes, file uploads — generated and wired up. Not just a pretty frontend.', color: '#a855f7' },
              { icon: '🔗', title: 'GitHub integration', desc: 'Push to your own repo. Own your code. Fork it, extend it, hire devs later if you want. Zero lock-in.', color: '#10b981' },
              { icon: '💬', title: 'Iterate in English', desc: '"Make the header sticky." "Add dark mode." "Show a chart instead of a table." Just tell it what to change.', color: '#f43f5e' },
            ].map(f => (
              <div key={f.title} style={{ padding: '24px', background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = f.color + '30'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fafafa', marginBottom: 6, fontFamily: "'Sora', sans-serif" }}>{f.title}</div>
                <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14 }}>
            Simple, transparent pricing
          </h2>
          <p style={{ fontSize: 15, color: '#71717a', maxWidth: 520, margin: '0 auto 44px' }}>Start free. Upgrade when you need more builds. All features included on every plan.</p>

          <div className="wyb-plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 48 }}>
            {[
              { name: 'Starter', price: '$29', credits: '150', color: '#22c55e', highlight: false },
              { name: 'Builder', price: '$79', credits: '500', color: BRAND, highlight: true, badge: 'MOST POPULAR' },
              { name: 'Pro', price: '$199', credits: '1,500', color: '#8b5cf6', highlight: false, badge: 'BEST VALUE' },
            ].map(p => (
              <div key={p.name} style={{ background: p.highlight ? 'linear-gradient(160deg,#0d1a26,#0d1218)' : '#111113', border: `1px solid ${p.highlight ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '24px 20px', position: 'relative' }}>
                {(p as any).badge && <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: p.highlight ? BRAND : '#8b5cf6', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>{(p as any).badge}</div>}
                <div style={{ fontSize: 12, fontWeight: 700, color: p.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, justifyContent: 'center', marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, color: '#fafafa' }}>{p.price}</span>
                  <span style={{ fontSize: 12, color: '#52525b' }}>/mo</span>
                </div>
                <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>{p.credits} credits</div>
                <div style={{ fontSize: 11, color: '#52525b', marginTop: 3 }}>All features unlocked</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'left', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 28px 24px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Done-for-you</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: '#fafafa', marginBottom: 4 }}>We build it for you</div>
                <div style={{ fontSize: 13, color: '#71717a', maxWidth: 420 }}>Prefer to hand it off? Book a $99 scoping call — the fee is credited toward your build.</div>
              </div>
              <a href="/setup-call" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: '#f97316', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
                Book $99 consultation →
              </a>
            </div>
            <div className="wyb-builds-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { name: 'Simple Build', price: '$199', delivery: '24 hours', color: '#22c55e', icon: '⚡', desc: 'Landing pages, portfolios, tools. No auth or database.' },
                { name: 'Medium Build', price: '$399', delivery: '3 working days', color: BRAND, icon: '🔧', desc: 'SaaS MVP with auth + database. 3–6 screens, real accounts.', badge: 'Most common' },
                { name: 'Complex Build', price: '$799', delivery: '1 week', color: '#8b5cf6', icon: '🏗️', desc: 'Full SaaS with payments, multi-roles, integrations.' },
              ].map(b => (
                <div key={b.name} style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px', position: 'relative' }}>
                  {(b as any).badge && <div style={{ position: 'absolute', top: -10, left: 14, background: BRAND, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.06em' }}>{(b as any).badge}</div>}
                  <div style={{ fontSize: 18, marginBottom: 8 }}>{b.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: b.color, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>{b.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: '#fafafa' }}>{b.price}</span>
                    <span style={{ fontSize: 11, color: '#52525b' }}>{b.delivery}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#71717a', lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/pricing" style={{ display: 'inline-block', marginTop: 16, padding: '12px 28px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(14,165,233,0.25)' }}>
            See full pricing →
          </Link>
        </div>
      </section>

      {/* ── FAQ (with FAQPage schema for AEO) ───────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0b0b0e' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.04em' }}>Questions, answered</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {HOME_FAQS.map(([q, a], i) => (
              <details key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '18px 0' }}>
                <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#e4e4e7', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  {q}<span style={{ color: '#52525b', fontSize: 18, flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ fontSize: 14, color: '#71717a', lineHeight: 1.7, marginTop: 12, marginBottom: 0 }}>{a}</p>
              </details>
            ))}
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: HOME_FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
          }).replace(/</g, '\\u003c') }}
        />
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px,10vw,140px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,165,233,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(32px,5vw,60px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.05 }}>
            Stop dreaming.<br />
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, #a855f7)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Start shipping.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, maxWidth: 480, margin: '0 auto 32px' }}>
            Your next app is one prompt away. Describe it, watch it build, ship it today.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 12, background: BRAND, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(14,165,233,0.35)' }}>
              Start for free →
            </Link>
            <Link href="/pricing" style={{ display: 'inline-block', padding: '16px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 16, fontWeight: 500, textDecoration: 'none' }}>
              View pricing →
            </Link>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: '#3f3f46' }}>No credit card required · 50 free credits on signup · Cancel anytime</div>
        </div>
      </section>

      {/* Demo modal */}
      {showDemo && (
        <div onClick={() => setShowDemo(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px,4vw,48px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 1100, aspectRatio: '16 / 9', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <button onClick={() => setShowDemo(false)} aria-label="Close"
              style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            <iframe src="/demo-intro.html" title="WyberAi demo" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
          </div>
        </div>
      )}

      {/* Featured on TAAFT */}
      <section style={{ padding: '32px clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="https://theresanaiforthat.com/ai/wyberai/?ref=featured&v=11040803" target="_blank" rel="nofollow noopener" style={{ display: 'inline-block', lineHeight: 0 }}>
          <img width="280" src="https://media.theresanaiforthat.com/featured-on-taaft.png?width=600" alt="Featured on There's An AI For That" />
        </a>
      </section>

      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 768px) {
          .wyb-nav-desktop { display: none !important; }
          .wyb-nav-hamburger { display: flex !important; }
          .wyb-plans-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .wyb-steps { grid-template-columns: 1fr !important; gap: 32px !important; }
          .wyb-product-pills { gap: 6px !important; }
          .wyb-product-pills button { font-size: 11px !important; padding: 5px 10px !important; }
          .wyb-builds-grid { grid-template-columns: 1fr !important; }
          .wyb-why-grid { grid-template-columns: 1fr !important; }
          .wyb-product-detail { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .wyb-plans-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .wyb-why-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 769px) {
          .wyb-nav-hamburger { display: none !important; }
        }
      `}</style>
    </div>
  );
}
