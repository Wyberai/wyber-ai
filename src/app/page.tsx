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
    body: 'Type what you want. Wyber generates production-ready React code, provisions Supabase, and deploys to Vercel — in under 30 seconds.',
    bullets: ['500+ templates · React, Vue, Svelte, Astro', 'Self-healing preview — errors fix themselves', 'Team collaboration · Figma import · Cmd+K'],
    cta: 'Build a web app →',
    href: '/dashboard?new=app',
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
    key: 'agents',
    label: '⚡ AI Agents',
    eyebrow: 'AI Agents',
    accent: '#a855f7',
    heading: 'Pick one.\nIt executes.',
    body: '5,000 pre-built agents across 18 industries. Connect tools — Slack, HubSpot, Gmail. Click Run. Full audit log included.',
    bullets: ['5,000 pre-built agents with persistent memory', 'Browser control · voice calls · 250+ tools', 'Real-time trace logs · multi-agent coordination'],
    cta: 'Browse agents →',
    href: '/agents',
    mockup: <AgentMockup />,
  },
  {
    key: 'workflows',
    label: '🔀 Workflows',
    eyebrow: 'Workflows',
    accent: '#22c55e',
    heading: 'Draw it.\nIt runs.',
    body: 'Visual flow builder. Wire triggers, AI steps, and actions. Branch on conditions. Schedule runs. No code, no YAML.',
    bullets: ['100+ templates · sub-workflows · parallel execution', 'Error handling · data transforms · loops · delays', 'Webhook triggers · 15 starter automations'],
    cta: 'Build a workflow →',
    href: '/flows',
    mockup: <WorkflowMockup />,
  },
  {
    key: 'employees',
    label: '🤖 AI Employees',
    eyebrow: 'AI Employees',
    accent: '#38bdf8',
    heading: 'Hire one.\nIt runs on autopilot.',
    body: '100 pre-built roles — the equivalent of hiring a senior specialist in Marketing, Sales, Finance, Ops, or Engineering. Each employee runs on a schedule, connects to your tools, and emails you what it did.',
    bullets: ['100 roles · browser control · voice output · phone calls', 'Slack notifications · agent-to-agent delegation', 'Human-in-the-loop escalation · KPI dashboards'],
    cta: 'Browse 100 roles →',
    href: '/employees',
    mockup: <EmployeeMockup />,
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        <div className="wyb-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {([['Web Apps', '/gallery'], ['Mobile', '/templates/mobile'], ['AI Agents', '/agents'], ['Workflows', '/workflows'], ['AI Employees', '/employees'], ['GTM', '/gtm'], ['Pricing', '/pricing']] as [string, string][]).map(([l, h]) => (
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
          {([['Web Apps', '/gallery'], ['Mobile', '/templates/mobile'], ['AI Agents', '/agents'], ['Workflows', '/workflows'], ['AI Employees', '/employees'], ['GTM', '/gtm'], ['Pricing', '/pricing']] as [string, string][]).map(([l, h]) => (
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

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(60px,10vw,120px) clamp(20px,4vw,48px)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(14,165,233,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 80% 60%, rgba(168,85,247,0.07) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 50% 90%, rgba(34,197,94,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 12, fontWeight: 700, color: BRAND, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND, animation: 'pulse 2s infinite' }} />
            The AI Business Platform
          </div>

          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(38px,6vw,78px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.0, marginBottom: 24 }}>
            From idea to live app — in seconds.<br />
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, #a855f7)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Then automate everything else.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.8vw,20px)', color: '#71717a', lineHeight: 1.65, maxWidth: 640, margin: '0 auto 14px' }}>
            Build web apps and mobile apps in plain English. Then add AI agents, automated workflows, AI employees who run on a daily schedule, and a GTM engine that fills your pipeline — all from one platform.
          </p>

          <p style={{ fontSize: 13, color: '#52525b', marginBottom: 36 }}>
            Starts at $29/mo · No engineers needed · Cancel anytime
          </p>

          {/* Six product pills */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            {PILLARS.map((p, i) => (
              <button key={p.key} onClick={() => { setActivePillar(i); document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${activePillar === i ? p.accent + '55' : 'rgba(255,255,255,0.1)'}`, background: activePillar === i ? p.accent + '15' : 'rgba(255,255,255,0.04)', color: activePillar === i ? p.accent : '#a1a1aa', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            <Link href="/signup" style={{ padding: '14px 32px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(14,165,233,0.35)' }}>
              Start for free →
            </Link>
            <Link href="/pricing" style={{ padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
              See pricing
            </Link>
          </div>

          {/* Stats — balanced across products */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { value: '500+', label: 'App templates' },
              { value: '5,000+', label: 'AI Agents' },
              { value: '100+', label: 'Workflow templates' },
              { value: '100', label: 'AI Employee roles' },
              { value: '10', label: 'GTM sequences' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#fafafa' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#52525b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
      <section style={{ padding: '32px clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0b0b0e' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#3f3f46', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 20 }}>Trusted by founders and teams building the future</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(24px,4vw,48px)', flexWrap: 'wrap', opacity: 0.5 }}>
            {['SignalPulse', 'ReconSignal', 'CloudFirst', 'NexaTech', 'VertexAI Labs', 'DataForge'].map(name => (
              <span key={name} style={{ fontSize: 15, fontWeight: 700, color: '#52525b', letterSpacing: '-0.02em', fontFamily: "'Sora', sans-serif" }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO ──────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>See it in action</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12 }}>
              Describe it. Watch it build. Ship it.
            </h2>
            <p style={{ fontSize: 15, color: '#71717a', maxWidth: 520, margin: '0 auto' }}>Type what you want in plain English. WyberAI generates every file, previews it live, and deploys — all in under a minute.</p>
          </div>

          {/* Animated terminal demo */}
          <div style={{ background: '#0d0d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>
            {/* Window chrome */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
              <span style={{ marginLeft: 12, fontSize: 11, color: '#52525b' }}>wyberai.com — Building your app</span>
            </div>
            {/* Demo content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 340 }}>
              {/* Chat side */}
              <div style={{ padding: 20, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Chat</div>
                <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '12px 12px 12px 2px', padding: '10px 14px', fontSize: 13, color: '#e4e4e7', lineHeight: 1.5, marginBottom: 12 }}>
                  Build me a project management app with a Kanban board, team members, task details with priority labels, and a dark theme.
                </div>
                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px 12px 2px 12px', padding: '10px 14px', fontSize: 12, color: '#a1a1aa', lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: '#a855f7' }}>W</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 700 }}>WyberAI</span>
                  </div>
                  Building your Kanban board with drag-and-drop columns, team avatars, priority badges, and a clean dark UI. Generating 6 files...
                </div>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['App.tsx', 'KanbanBoard.tsx', 'TaskCard.tsx', 'TeamPanel.tsx', 'index.css', 'types.ts'].map((f, i) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: i < 5 ? '#22c55e' : '#f59e0b' }}>
                      <span>{i < 5 ? '✓' : '⟳'}</span>
                      <span style={{ color: '#a1a1aa', fontFamily: 'monospace' }}>{f}</span>
                      {i < 5 && <span style={{ color: '#3f3f46', marginLeft: 'auto', fontSize: 10 }}>{(i + 1) * 0.8}s</span>}
                      {i === 5 && <span style={{ color: '#f59e0b', marginLeft: 'auto', fontSize: 10 }}>writing...</span>}
                    </div>
                  ))}
                </div>
              </div>
              {/* Preview side */}
              <div style={{ padding: 20, background: '#09090b' }}>
                <div style={{ fontSize: 10, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Live Preview</span>
                  <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                    Building
                  </span>
                </div>
                {/* Fake Kanban preview */}
                <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, height: 280, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                    {['To Do', 'In Progress', 'Done'].map(col => (
                      <div key={col} style={{ flex: 1, fontSize: 9, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                    {[
                      [{ t: 'Design homepage', p: 'High', c: '#ef4444' }, { t: 'Write API docs', p: 'Medium', c: '#f59e0b' }],
                      [{ t: 'Build auth flow', p: 'High', c: '#ef4444' }, { t: 'Setup CI/CD', p: 'Low', c: '#22c55e' }],
                      [{ t: 'Deploy v1.0', p: 'Done', c: '#22c55e' }],
                    ].map((col, ci) => (
                      <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {col.map(task => (
                          <div key={task.t} style={{ background: '#0d0d12', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '8px 7px' }}>
                            <div style={{ fontSize: 10, color: '#e4e4e7', fontWeight: 600, marginBottom: 4 }}>{task.t}</div>
                            <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: task.c + '15', color: task.c, fontWeight: 700 }}>{task.p}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0b0b0e' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>What builders say</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              They built. They shipped. They didn&apos;t look back.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {[
              { name: 'Arjun M.', role: 'Solo Founder', quote: 'I built my entire SaaS MVP in one afternoon. The AI understood my vision better than most freelancers I\'ve hired. The self-healing preview saved me hours of debugging.', avatar: 'AM', color: '#0EA5E9' },
              { name: 'Sarah K.', role: 'Marketing Lead', quote: 'The GTM Engine found 200 qualified leads in our ICP within minutes. We launched our first email sequence the same day. Our SDR couldn\'t believe it.', avatar: 'SK', color: '#10b981' },
              { name: 'Dev P.', role: 'Agency Owner', quote: 'We deliver 3x more client projects now. Build the app, set up the workflow, hire an AI employee to monitor it — all from one dashboard. Clients think we\'re a team of 20.', avatar: 'DP', color: '#8b5cf6' },
              { name: 'Lisa T.', role: 'Product Manager', quote: 'The Kanban workflow templates saved our ops team 15 hours a week. We connected Slack, HubSpot, and Gmail in minutes. No developer needed.', avatar: 'LT', color: '#f59e0b' },
            ].map(t => (
              <div key={t.name} style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.color + '15', border: `1px solid ${t.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: t.color }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#52525b' }}>{t.role}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.7, margin: 0 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display: 'flex', gap: 2, marginTop: 12 }}>
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 40 }}>
            Three steps. No engineers.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { step: '01', title: 'Describe', desc: 'Tell WyberAI what you want in plain English. A CRM, a mobile app, an outreach campaign — anything.', color: BRAND },
              { step: '02', title: 'Build', desc: 'AI generates production-ready code, previews it live, and auto-fixes any errors. Pick from 500+ templates or start custom.', color: '#a855f7' },
              { step: '03', title: 'Ship', desc: 'Deploy to Vercel in one click. Push to GitHub. Set up AI employees to run your ops on autopilot.', color: '#22c55e' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 48, fontWeight: 800, fontFamily: "'Sora', sans-serif", color: s.color + '25', letterSpacing: '-0.04em', marginBottom: 8 }}>{s.step}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fafafa', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>{s.title}</div>
                <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIX PRODUCTS SHOWCASE (tab switcher) ─────────────────────────── */}
      <section id="showcase" style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 40, overflowX: 'auto', padding: '0 0 4px' }}>
            {PILLARS.map((p, i) => (
              <button key={p.key} onClick={() => setActivePillar(i)}
                style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${activePillar === i ? p.accent + '44' : 'rgba(255,255,255,0.07)'}`, background: activePillar === i ? p.accent + '12' : 'transparent', color: activePillar === i ? p.accent : '#52525b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Active pillar content */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px,100%), 1fr))', gap: 40, alignItems: 'center' }}>
            {/* Copy */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: pillar.accent + '15', border: `1px solid ${pillar.accent}33`, fontSize: 11, fontWeight: 700, color: pillar.accent, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: pillar.accent, animation: 'pulse 2s infinite' }} />
                {pillar.eyebrow}
              </div>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 16, color: '#fafafa', whiteSpace: 'pre-line' }}>
                {pillar.heading}
              </h2>
              <p style={{ fontSize: 15, color: '#71717a', lineHeight: 1.7, marginBottom: 24, maxWidth: 440 }}>
                {pillar.body}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {pillar.bullets.map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: pillar.accent + '15', border: `1px solid ${pillar.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IcoCheck color={pillar.accent} />
                    </div>
                    <span style={{ fontSize: 13, color: '#a1a1aa' }}>{b}</span>
                  </div>
                ))}
              </div>
              <Link href={pillar.href} style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 10, background: pillar.accent, color: pillar.key === 'mobile' ? '#fff' : '#000', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 20px ${pillar.accent}33` }}>
                {pillar.cta}
              </Link>
            </div>
            {/* Mockup */}
            <div>{pillar.mockup}</div>
          </div>
        </div>
      </section>

      {/* ── Quick-link grid ────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0b0b0e' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))', gap: 12 }}>
            {PILLARS.map((p) => (
              <Link key={p.key} href={p.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 10, background: '#111113', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = p.accent + '44'; (e.currentTarget as HTMLElement).style.background = p.accent + '08' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = '#111113' }}>
                <span style={{ fontSize: 22 }}>{p.label.split(' ')[0]}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>{p.eyebrow}</div>
                  <div style={{ fontSize: 11, color: p.accent, fontWeight: 600 }}>{p.cta.replace(' →', '')}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing preview ─────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14 }}>
            One subscription. Six products.
          </h2>
          <p style={{ fontSize: 15, color: '#71717a', maxWidth: 520, margin: '0 auto 44px' }}>Credits work across every product — build an app, run an agent, hire an AI employee, or launch a GTM campaign from the same balance.</p>

          {/* Plans — forced 4-column row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 48 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
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
            Your first app goes live in 30 seconds. Your first agent runs in one click. No engineers, no setup.
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
        }
        @media (min-width: 769px) {
          .wyb-nav-hamburger { display: none !important; }
        }
      `}</style>
    </div>
  );
}
