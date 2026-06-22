'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { WyberLogo } from '@/components/shared/WyberLogo';

const BRAND = '#0EA5E9';

// ─── Icons ─────────────────────────────────────────────────────────────────────
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

// ─── Per-product mockups ────────────────────────────────────────────────────────
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

function AgentMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11 }}>
      <WindowChrome title="wyberai.com — AI Agents" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { emoji: '📧', name: 'Lead Qualifier',   status: 'Running', color: '#22c55e', detail: 'Scanned 142 emails · 9 leads found' },
          { emoji: '📊', name: 'Report Builder',   status: 'Done',    color: BRAND,    detail: 'Monthly PDF sent to Slack' },
          { emoji: '🔍', name: 'SEO Auditor',      status: 'Queued',  color: '#71717a', detail: 'Starts in 2 min' },
        ].map(a => (
          <div key={a.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>{a.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#fafafa', fontSize: 11 }}>{a.name}</div>
              <div style={{ color: '#52525b', fontSize: 10, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.detail}</div>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: a.color === '#71717a' ? 'rgba(255,255,255,0.05)' : `${a.color}15`, color: a.color, border: `1px solid ${a.color}30`, flexShrink: 0 }}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11 }}>
      <WindowChrome title="wyberai.com — Workflows" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[
          { label: 'Trigger', detail: 'New form submission',        color: '#a855f7', icon: '⚡' },
          { label: 'AI Step', detail: 'Classify lead quality',      color: BRAND,    icon: '🤖' },
          { label: 'Branch',  detail: 'Score ≥ 7 → notify sales',  color: '#22c55e', icon: '🔀' },
          { label: 'Action',  detail: 'Post to #leads in Slack',    color: '#f59e0b', icon: '📢' },
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

function EmployeeMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11 }}>
      <WindowChrome title="wyberai.com — AI Employees" />
      {[
        { emoji: '📧', name: 'Email Marketing Manager', dept: 'Marketing · daily 09:00', status: 'Active', color: '#22c55e', detail: 'Sent weekly digest to 2,400 subscribers' },
        { emoji: '🧑‍💼', name: 'SDR (Sales Dev Rep)',    dept: 'Sales · daily 08:00',    status: 'Active', color: '#22c55e', detail: 'Qualified 12 inbound leads this morning' },
        { emoji: '📊', name: 'Finance Analyst',         dept: 'Finance · weekly Mon',   status: 'Running', color: BRAND,     detail: 'Building monthly P&L report…' },
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
      <div style={{ fontSize: 10, color: '#3f3f46', textAlign: 'center', paddingTop: 4 }}>Emails you a summary after every run · No oversight needed</div>
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
          { day: 'Day 3', type: '⏳ Wait',  detail: 'Watching for reply / open',   color: '#52525b' },
          { day: 'Day 4', type: '✉️ Email', detail: 'Case study follow-up queued', color: '#10b981' },
          { day: 'Day 7', type: '📞 Call',  detail: 'Script ready in your dialer', color: '#f97316' },
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

// ─── Product config ─────────────────────────────────────────────────────────────
const PILLARS = [
  {
    key: 'web',
    label: '🌐 Web Apps',
    eyebrow: 'Web Apps',
    accent: BRAND,
    heading: 'Describe it.\nIt builds.',
    body: 'Type what you want. Wyber generates production-ready React code from scratch, provisions Supabase, and deploys to Vercel — in a few minutes.',
    bullets: ['Always fresh code — never stale templates', 'Self-healing preview — errors fix themselves', 'Team collaboration · Figma import · Cmd+K'],
    cta: 'Build a web app →',
    href: '/signup',
    mockup: <WebAppMockup />,
  },
  {
    key: 'mobile',
    label: '📱 Mobile Apps',
    eyebrow: 'Mobile Apps',
    accent: '#f97316',
    heading: 'Describe it.\nShip to iOS.',
    body: 'Generate a real React Native app with Expo, get a live preview, and export a ready-to-publish project — one prompt. No Xcode knowledge required.',
    bullets: ['React Native + Expo · camera, GPS, biometrics', 'Push notifications · RevenueCat in-app purchases', 'App Store submission guide · OTA updates'],
    cta: 'Build a mobile app →',
    href: '/dashboard?new=mobile',
    mockup: <MobileMockup />,
  },
  {
    key: 'employees',
    label: '🤖 AI Employees',
    eyebrow: 'AI Employees',
    accent: '#a855f7',
    heading: 'Hire one.\nChat with it.',
    body: 'Hire AI department heads — Marketing Manager, Sales Lead, Ops Director. They connect your tools, run tasks on schedule, and you chat with them like colleagues. Each one has persistent memory and learns your business.',
    bullets: ['Department heads: Marketing, Sales, Finance, Ops, Engineering, HR', 'Chat interface — instruct them in plain English', 'Connects 30+ tools · runs on schedule · emails you results'],
    cta: 'Hire an AI employee →',
    href: '/ai-employees',
    mockup: <EmployeeMockup />,
  },
  {
    key: 'workflows',
    label: '🔀 Workflows',
    eyebrow: 'Workflows',
    accent: '#22c55e',
    heading: 'Draw it.\nIt runs.',
    body: 'Visual flow builder. Wire triggers, AI steps, and actions. Branch on conditions. Schedule runs. No code, no YAML.',
    bullets: ['Drag-and-drop canvas · sub-workflows · parallel execution', 'Error handling · data transforms · loops · delays', 'Webhook triggers · schedule triggers · 12+ tool integrations'],
    cta: 'Build a workflow →',
    href: '/workflows',
    mockup: <WorkflowMockup />,
  },
  {
    key: 'gtm',
    label: '🎯 GTM Engine',
    eyebrow: 'GTM Engine',
    accent: '#10b981',
    heading: 'Define your ICP.\nWyber fills your pipeline.',
    body: 'Describe who you sell to. Wyber finds matching leads, enriches them with verified emails and signals, and launches a multi-step sequence across email, call, and LinkedIn — all from one canvas.',
    bullets: ['Intent signals · waterfall enrichment · lead scoring', 'A/B testing · email warmup · CRM sync', 'Meeting booking · AI personalization · visitor tracking'],
    cta: 'Open GTM Engine →',
    href: '/gtm',
    mockup: <GTMMockup />,
  },
] as const;

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePillar, setActivePillar] = useState(0);

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setUser(data.user));
    });
  }, []);

  const pillar = PILLARS[activePillar];

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif", overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href={user ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        <div className="wyb-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {([['Web Apps', '/signup'], ['Mobile Apps', '/signup'], ['AI Employees', '/coming-soon?product=AI+Employees'], ['Pricing', '/pricing']] as [string, string][]).map(([l, h]) => (
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
          {([['Web Apps', '/signup'], ['Mobile Apps', '/signup'], ['AI Employees', '/coming-soon?product=AI+Employees'], ['Pricing', '/pricing']] as [string, string][]).map(([l, h]) => (
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

      {/* ── HERO — Lovable-inspired: clean, single CTA ─────────────────── */}
      <section style={{ position: 'relative', minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(80px,12vw,160px) clamp(20px,4vw,48px) clamp(60px,8vw,100px)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(14,165,233,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(40px,7vw,80px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.0, marginBottom: 20 }}>
            Build something<br />
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, #a855f7)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              with WyberAi
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(16px,2vw,22px)', color: '#71717a', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 40px' }}>
            Create apps, deploy agents, and automate your business by chatting with AI
          </p>

          {/* Single input CTA — like Lovable */}
          <div style={{ maxWidth: 520, margin: '0 auto 48px', position: 'relative' }}>
            <Link href="/signup" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.4)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12l2 2 4-4"/></svg>
              <span style={{ flex: 1, textAlign: 'left', color: '#52525b', fontSize: 15 }}>Describe the app you want to build...</span>
              <span style={{ padding: '8px 18px', borderRadius: 8, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700 }}>Start free →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── MEET WYBERAI — 3 steps, Lovable-style ──────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', background: '#0b0b0e' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em' }}>Meet WyberAi</h2>
          </div>
          <div className="wyb-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
            {[
              { step: '01', title: 'Start with an idea', desc: 'Describe the app, agent, or workflow you want to create — or drop in screenshots and docs.', color: BRAND },
              { step: '02', title: 'Watch it come to life', desc: 'AI builds your project in real-time. Fresh code every time — never stale templates. Preview as it builds.', color: '#a855f7' },
              { step: '03', title: 'Refine and ship', desc: 'Iterate with simple feedback. Deploy to a live URL, connect tools, and automate — all in one click.', color: '#22c55e' },
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

      {/* ── DISCOVER PRODUCTS — card grid like Lovable templates ────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Six products, one platform
            </h2>
            <p style={{ fontSize: 15, color: '#71717a', marginTop: 8 }}>Everything you need to build, launch, and grow — in one place.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px,100%), 1fr))', gap: 14 }}>
            {[
              { emoji: '🌐', title: 'Web Apps', desc: 'Describe any app in plain English. AI generates production-ready React code, previews live, deploys to Vercel.', color: BRAND, href: '/signup' },
              { emoji: '📱', title: 'Mobile Apps', desc: 'Generate React Native + Expo apps for iOS and Android. Preview on your phone via QR code.', color: '#f97316', href: '/signup' },
              { emoji: '🤖', title: 'AI Employees', desc: 'AI department heads that think like 10-year veterans. Memory, reasoning, and human-in-the-loop approval. Not chatbots.', color: '#a855f7', href: '/coming-soon?product=AI+Employees', soon: true },
              { emoji: '🔀', title: 'Workflows', desc: 'Visual automations with AI reasoning at every step. Connect tools, schedule runs, let AI handle the logic.', color: '#22c55e', href: '/coming-soon?product=Workflows', soon: true },
              { emoji: '🎯', title: 'GTM Engine', desc: 'Define your ICP, find leads, launch multi-channel outreach — all AI-personalized. Your pipeline on autopilot.', color: '#10b981', href: '/coming-soon?product=GTM+Engine', soon: true },
            ].map(p => (
              <Link key={p.title} href={p.href} style={{ display: 'block', background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '24px', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = p.color + '44'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${p.color}15` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{p.emoji}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fafafa', marginBottom: 6, fontFamily: "'Sora', sans-serif" }}>{p.title}</div>
                <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, margin: '0 0 16px' }}>{p.desc}</p>
                {(p as any).soon
                  ? <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: p.color + '15', color: p.color, border: `1px solid ${p.color}25` }}>Coming soon — join waitlist</span>
                  : <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>Start building →</span>
                }
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA removed — hero CTA is enough */}

      {/* ── Pricing preview ─────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14 }}>
            Simple, transparent pricing.
          </h2>
          <p style={{ fontSize: 15, color: '#71717a', maxWidth: 520, margin: '0 auto 44px' }}>Build web apps and mobile apps today. AI Employees, Workflows, and GTM Engine coming soon — same credits, same subscription.</p>

          {/* Plans — forced 4-column row */}
          <div className="wyb-plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 48 }}>
            {[
              { name: 'Starter',  price: '$29',  credits: '150',    color: '#22c55e', highlight: false },
              { name: 'Builder',  price: '$79',  credits: '500',    color: BRAND,     highlight: false, badge: 'MOST POPULAR' },
              { name: 'Pro',      price: '$199', credits: '1,500',  color: '#8b5cf6', highlight: true,  badge: 'BEST VALUE' },
              { name: 'Growth',   price: '$399', credits: '4,000',  color: '#f59e0b', highlight: false },
              { name: 'Scale',    price: '$799', credits: '10,000', color: '#f97316', highlight: false },
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

          {/* Done-for-you builds */}
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
                { name: 'Simple Build', price: '$199', delivery: '24 hours',        color: '#22c55e', icon: '⚡', desc: 'Landing pages, portfolios, tools. No auth or database.' },
                { name: 'Medium Build', price: '$399', delivery: '3 working days',  color: BRAND,     icon: '🔧', desc: 'SaaS MVP with auth + database. 3–6 screens, real accounts.', badge: 'Most common' },
                { name: 'Complex Build', price: '$799', delivery: '1 week',         color: '#8b5cf6', icon: '🏗️', desc: 'Full SaaS with payments, multi-roles, integrations.' },
              ].map(b => (
                <div key={b.name} style={{ background: '#111113', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 12, padding: '16px', position: 'relative' }}>
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

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px,10vw,140px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,165,233,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(32px,5vw,60px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.05 }}>
            Build it. Automate it.<br />
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, #a855f7)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ship it today.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, maxWidth: 480, margin: '0 auto 32px' }}>
            Describe what you want. AI builds it in minutes. No engineers, no setup, no stale templates.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 12, background: BRAND, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(14,165,233,0.35)' }}>
              Start for free →
            </Link>
            <Link href="/pricing" style={{ display: 'inline-block', padding: '16px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 16, fontWeight: 500, textDecoration: 'none' }}>
              View pricing →
            </Link>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: '#3f3f46' }}>Starts at $29/mo · 30 min setup · Cancel anytime</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <WyberLogo markSize={20} wordmarkSize={13} />
          <span style={{ fontSize: 12, color: '#3f3f46' }}>· A product by SignalPulse Technologies · © 2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {([['Privacy', '/privacy'], ['Terms', '/terms'], ['Pricing', '/pricing'], ['Employees', '/employees'], ['Blog', '/blog']] as [string, string][]).map(([l, h]) => (
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
        @media (max-width: 768px) {
          .wyb-nav-desktop { display: none !important; }
          .wyb-nav-hamburger { display: flex !important; }
          .wyb-plans-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .wyb-testimonials { grid-template-columns: 1fr !important; }
          .wyb-steps { grid-template-columns: 1fr !important; gap: 32px !important; }
          .wyb-demo-split { grid-template-columns: 1fr !important; }
          .wyb-trust-logos { gap: 16px !important; }
          .wyb-product-pills { gap: 6px !important; }
          .wyb-product-pills button { font-size: 11px !important; padding: 5px 10px !important; }
          .wyb-quick-grid { grid-template-columns: 1fr !important; }
          .wyb-builds-grid { grid-template-columns: 1fr !important; }
          .wyb-roi-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .wyb-plans-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .wyb-testimonials { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 769px) {
          .wyb-nav-hamburger { display: none !important; }
        }
      `}</style>
    </div>
  );
}
