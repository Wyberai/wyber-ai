'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { WyberLogo } from '@/components/shared/WyberLogo';

const BRAND = '#0EA5E9';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IcoCheck = ({ color = '#22c55e' }: { color?: string }) => (
  <svg width="10" height="10" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);
const IcoMonitor  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const IcoPhone    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
const IcoCpu      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>;
const IcoZap      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IcoPeople   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;

// ─── Window chrome ────────────────────────────────────────────────────────────

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

// ─── AI Employee mockup (hero) ────────────────────────────────────────────────

function EmployeeMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18, fontSize: 11, fontFamily: "'Space Grotesk', sans-serif" }}>
      <WindowChrome title="WyberAi — AI Employees" />

      {/* Employee card */}
      <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 22 }}>📧</div>
          <div>
            <div style={{ fontWeight: 700, color: '#fafafa', fontSize: 12 }}>Inbox Manager</div>
            <div style={{ color: '#71717a', fontSize: 10 }}>AI SDR · runs daily at 09:00</div>
          </div>
          <div style={{ marginLeft: 'auto', background: '#22c55e', color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20 }}>ACTIVE</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['GMAIL', 'HUBSPOT', 'SLACK'].map(t => (
            <span key={t} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(14,165,233,0.1)', color: BRAND, border: '1px solid rgba(14,165,233,0.2)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Live run log */}
      <div style={{ background: '#050508', borderRadius: 8, padding: 10, fontFamily: 'monospace' }}>
        <div style={{ color: '#52525b', fontSize: 9, letterSpacing: '0.05em', marginBottom: 6 }}>TODAY'S RUN — 09:00 UTC</div>
        {[
          { t: '09:00:01', msg: 'Fetched 31 emails from Gmail inbox', c: '#a1a1aa' },
          { t: '09:00:03', msg: 'Identified 7 leads mentioning "pricing"', c: '#22c55e' },
          { t: '09:00:05', msg: 'Drafted personalised replies × 7', c: '#a1a1aa' },
          { t: '09:00:08', msg: 'Logged all leads to HubSpot CRM', c: BRAND },
          { t: '09:00:09', msg: 'Posted summary to #sales-alerts', c: '#a855f7' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, minWidth: 0 }}>
            <span style={{ color: '#3f3f46', flexShrink: 0 }}>{l.t}</span>
            <span style={{ color: l.c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{l.msg}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
          <span style={{ color: '#22c55e', fontSize: 10 }}>7 leads qualified · digest sent · 0 errors</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
        {[{ label: 'Leads today', value: '7', color: '#22c55e' }, { label: 'Emails sent', value: '7', color: BRAND }, { label: 'CRM entries', value: '7', color: '#a855f7' }].map(k => (
          <div key={k.label} style={{ background: '#0d0d11', borderRadius: 7, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: k.color, fontFamily: "'Sora', sans-serif" }}>{k.value}</div>
            <div style={{ fontSize: 9, color: '#52525b', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Builder mockup ───────────────────────────────────────────────────────────

function BuilderMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: 'monospace', fontSize: 11 }}>
      <WindowChrome title="wyberai.com — Live Build" />
      {[
        { done: true,  active: false, label: 'Prompt received',          detail: '"Build a CRM with pipeline view"' },
        { done: true,  active: false, label: 'Generating React code',    detail: '14 files · Supabase schema' },
        { done: true,  active: false, label: 'Pushing to GitHub',        detail: 'wyberai/crm-abc123' },
        { done: false, active: true,  label: 'Deployed to Vercel',       detail: 'crm-abc123.vercel.app' },
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

// ─── Product feature card ─────────────────────────────────────────────────────

function ProductCard({ eyebrow, heading, body, mockup, ctaLabel, ctaHref, highlight = false, Icon }: {
  eyebrow: string; heading: string; body: string; mockup: React.ReactNode;
  ctaLabel: string; ctaHref: string; highlight?: boolean; Icon: React.FC;
}) {
  return (
    <div style={{ background: '#111113', border: `1px solid ${highlight ? 'rgba(14,165,233,0.18)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          <Icon />{eyebrow}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>{heading}</div>
        <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.7 }}>{body}</div>
      </div>
      {mockup}
      <Link href={ctaHref} style={{ display: 'block', textAlign: 'center', padding: '9px 0', borderRadius: 8, border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.08)', color: BRAND, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
        {ctaLabel}
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setUser(data.user));
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif", overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        <div className="wyb-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {([['AI Employees', '/employees'], ['Web Apps', '/gallery'], ['Mobile', '/templates/mobile'], ['Agents', '/agents'], ['Workflows', '/workflows'], ['Pricing', '/pricing']] as [string, string][]).map(([l, h]) => (
            <Link key={l} href={h} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 13, color: '#71717a', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
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
          {([['AI Employees', '/employees'], ['Web Apps', '/gallery'], ['Mobile', '/templates/mobile'], ['Agents', '/agents'], ['Workflows', '/workflows'], ['Pricing', '/pricing']] as [string, string][]).map(([l, h]) => (
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

      {/* ── HERO — AI Employees first ───────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(60px,10vw,120px) clamp(20px,4vw,48px)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(14,165,233,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 80% 60%, rgba(14,165,233,0.07) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 50% 90%, rgba(14,165,233,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 12, fontWeight: 700, color: BRAND, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND, animation: 'pulse 2s infinite' }} />
            Introducing AI Employees — 100 roles available
          </div>

          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(38px,6vw,80px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.0, marginBottom: 24 }}>
            Hire AI that works<br />
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, #38bdf8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              while you sleep.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.8vw,20px)', color: '#71717a', lineHeight: 1.65, maxWidth: 640, margin: '0 auto 14px' }}>
            AI Employees that qualify leads, run campaigns, manage ops — on a schedule, with real tools, reporting KPIs every day. Plus a full platform to build the apps they run on.
          </p>

          <p style={{ fontSize: 13, color: '#52525b', marginBottom: 36 }}>
            Starts at $49/mo · 30-minute setup · No engineers needed
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            <Link href="/employees" style={{ padding: '14px 32px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(14,165,233,0.35)' }}>
              Browse 100 employees →
            </Link>
            <Link href="/signup" style={{ padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
              Start building free
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { value: '100', label: 'AI Employee roles' },
              { value: '30+', label: 'Tool integrations' },
              { value: '24/7', label: 'Automated runs' },
              { value: '$49', label: 'Starts at /mo' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#fafafa' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#52525b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Employee showcase ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>AI Employees</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 14 }}>
              Hire once. Works every day.
            </h2>
            <p style={{ fontSize: 15, color: '#71717a', maxWidth: 520, margin: '0 auto' }}>
              Each AI Employee connects to your tools, follows your process, and reports KPIs — without being asked.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px,100%), 1fr))', gap: 24, alignItems: 'start' }}>
            {/* Live run mockup */}
            <div style={{ gridColumn: 'span 1' }}>
              <EmployeeMockup />
            </div>

            {/* How it works steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { num: '01', icon: '🎯', title: 'Browse 100 templates', body: 'Sales, marketing, ops, finance — pick a role from our library of 100 pre-built AI employees. Each comes with default instructions and KPI targets.' },
                { num: '02', icon: '🏢', title: 'Onboard with your context', body: 'Tell them about your company, products, and tone of voice. Upload docs. They use this on every run — no re-briefing needed.' },
                { num: '03', icon: '🔗', title: 'Connect your tools', body: 'Link Gmail, Slack, HubSpot, Notion, and 30+ more in one click. Employees use real tools — not simulated ones.' },
                { num: '04', icon: '📊', title: 'Watch them work & report', body: 'Scheduled runs land in your inbox as digest emails with KPI scores. Log in to see the full run history, action log, and trends.' },
              ].map(s => (
                <div key={s.num} style={{ display: 'flex', gap: 14, padding: '16px', background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                  <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: BRAND, letterSpacing: '0.08em', marginBottom: 4 }}>{s.num}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', marginBottom: 5 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.6 }}>{s.body}</div>
                  </div>
                </div>
              ))}

              <Link href="/employees" style={{ display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(14,165,233,0.25)' }}>
                Browse all 100 employees →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Popular employee roles ────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px,5vw,60px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>100 roles across 10 departments</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(20px,2.5vw,36px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              From sales to ops — every role covered
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px,100%), 1fr))', gap: 12 }}>
            {[
              { emoji: '📧', name: 'AI SDR', dept: 'Sales' },
              { emoji: '📊', name: 'Campaign Manager', dept: 'Marketing' },
              { emoji: '🤝', name: 'Customer Success', dept: 'Support' },
              { emoji: '📝', name: 'Content Writer', dept: 'Content' },
              { emoji: '💰', name: 'Revenue Analyst', dept: 'Finance' },
              { emoji: '🔍', name: 'Lead Researcher', dept: 'Sales' },
              { emoji: '📱', name: 'Social Media Mgr', dept: 'Marketing' },
              { emoji: '⚙️', name: 'Ops Coordinator', dept: 'Operations' },
              { emoji: '🧑‍💻', name: 'Dev Standup Bot', dept: 'Engineering' },
              { emoji: '📣', name: 'PR Monitor', dept: 'Comms' },
            ].map(role => (
              <Link key={role.name} href="/employees" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.25)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}>
                <span style={{ fontSize: 20 }}>{role.emoji}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e4e4e7' }}>{role.name}</div>
                  <div style={{ fontSize: 10, color: '#52525b' }}>{role.dept}</div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/employees" style={{ fontSize: 13, color: BRAND, textDecoration: 'none', fontWeight: 600 }}>See all 100 roles →</Link>
          </div>
        </div>
      </section>

      {/* ── Also build apps section ───────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>One platform. Five superpowers.</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              Employees run on top of everything WyberAi builds
            </h2>
            <p style={{ fontSize: 15, color: '#71717a', marginTop: 14, maxWidth: 520, margin: '14px auto 0' }}>
              Your AI employees can trigger flows, generate apps, and chat with agents — all within one platform.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 20 }}>
            <ProductCard eyebrow="AI Employees" heading="Hire. Onboard. Done." body="100 pre-built roles — SDRs, campaign managers, ops coordinators. Each runs on your tools, reports KPIs, and sends you a daily digest." mockup={<div style={{ fontSize: 32, textAlign: 'center', padding: '20px 0' }}>🤖 📧 📊 🔍 📝</div>} ctaLabel="Browse employees →" ctaHref="/employees" highlight Icon={IcoPeople} />
            <ProductCard eyebrow="Web Apps" heading="Describe it. It builds." body="Type what you want. Wyber generates production-ready React code, provisions Supabase, and deploys to Vercel — in under 30 seconds." mockup={<BuilderMockup />} ctaLabel="Build a web app →" ctaHref="/dashboard?new=app" Icon={IcoMonitor} />
            <ProductCard eyebrow="Mobile Apps" heading="Describe it. Ship to iOS." body="Generate a real React Native app with Expo, get a live preview, and export a ready-to-publish project — one prompt." mockup={<div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, textAlign: 'center', fontSize: 48 }}>📱</div>} ctaLabel="Build a mobile app →" ctaHref="/dashboard?new=mobile" Icon={IcoPhone} />
            <ProductCard eyebrow="AI Agents" heading="Pick one. It executes." body="5,000 pre-built agents across 18 industries. Connect tools — Slack, HubSpot, Gmail. Click Run. Full audit log included." mockup={<div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, textAlign: 'center', fontSize: 48 }}>⚡</div>} ctaLabel="Browse agents →" ctaHref="/agents" Icon={IcoCpu} />
            <ProductCard eyebrow="Workflows" heading="Draw it. It runs." body="Visual flow builder. Wire triggers, AI steps, and actions. Branch on conditions. Schedule runs. No code." mockup={<div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, textAlign: 'center', fontSize: 48 }}>🔀</div>} ctaLabel="Build a workflow →" ctaHref="/flows" Icon={IcoZap} />
          </div>
        </div>
      </section>

      {/* ── Pricing preview ──────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14 }}>
            Replace a $60K hire for $49/mo
          </h2>
          <p style={{ fontSize: 15, color: '#71717a', maxWidth: 480, margin: '0 auto 44px' }}>One AI SDR that qualifies leads 24/7 pays for itself before the first invoice.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px,100%), 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { name: 'Starter', price: '$49', period: '/mo', employees: '3 AI Employees', credits: '500 credits', color: BRAND },
              { name: 'Growth', price: '$149', period: '/mo', employees: '10 AI Employees', credits: '2,000 credits', color: BRAND, highlight: true },
              { name: 'Scale', price: '$399', period: '/mo', employees: 'Unlimited employees', credits: '6,000 credits', color: '#8b5cf6' },
            ].map(p => (
              <div key={p.name} style={{ background: p.highlight ? 'linear-gradient(160deg,#0d1a26,#0d1218)' : '#111113', border: `1px solid ${p.highlight ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '22px 20px', position: 'relative' }}>
                {p.highlight && <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: BRAND, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>MOST POPULAR</div>}
                <div style={{ fontSize: 12, fontWeight: 700, color: p.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 34, fontWeight: 800, color: '#fafafa' }}>{p.price}</span>
                  <span style={{ fontSize: 12, color: '#52525b' }}>{p.period}</span>
                </div>
                <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 4 }}>{p.employees}</div>
                <div style={{ fontSize: 12, color: '#52525b' }}>{p.credits}</div>
              </div>
            ))}
          </div>
          <Link href="/pricing" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(14,165,233,0.25)' }}>
            See full pricing →
          </Link>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px,10vw,140px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(32px,5vw,60px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.05 }}>
            Your team just got<br />
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, #38bdf8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>infinitely scalable.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, maxWidth: 480, margin: '0 auto 32px' }}>
            Hire your first AI employee today. They'll be working by tonight.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/employees" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 12, background: BRAND, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(14,165,233,0.35)' }}>
              Hire your first employee →
            </Link>
            <Link href="/pricing" style={{ display: 'inline-block', padding: '16px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 16, fontWeight: 500, textDecoration: 'none' }}>
              View pricing →
            </Link>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: '#3f3f46' }}>Starts at $49/mo · 30 min setup · Cancel anytime</div>
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
