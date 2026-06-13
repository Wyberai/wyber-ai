'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { LiveDemo } from '@/components/shared/LiveDemo';
import { GenerateAnimation, DeployAnimation, VisualEditAnimation, DatabaseAnimation } from '@/components/shared/ProductAnimations';
import { WyberLogo } from '@/components/shared/WyberLogo';

const BRAND = '#0EA5E9';

const STATS = [
  { value: '5,000+', label: 'AI Agents' },
  { value: '81+', label: 'App templates' },
  { value: '30s',   label: 'Avg build time' },
  { value: '0',     label: 'Setup required' },
];

// ─── Inline SVG icons ────────────────────────────────────────────────────────

const IcoMonitor  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const IcoPhone    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
const IcoCpu      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>;
const IcoZap      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IcoChat     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
const IcoCheck    = ({ color = '#22c55e' }: { color?: string }) => <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>;
const IcoZapSm    = ({ color = BRAND }: { color?: string }) => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IcoBrain    = ({ color = '#a855f7' }: { color?: string }) => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M9.5 2A2.5 2.5 0 017 4.5v0A2.5 2.5 0 014.5 7H4a2 2 0 00-2 2v2a2 2 0 002 2h.5A2.5 2.5 0 017 15.5v0A2.5 2.5 0 019.5 18h5A2.5 2.5 0 0117 15.5v0A2.5 2.5 0 0119.5 13H20a2 2 0 002-2V9a2 2 0 00-2-2h-.5A2.5 2.5 0 0117 4.5v0A2.5 2.5 0 0114.5 2z"/></svg>;
const IcoDiamond  = ({ color = '#f59e0b' }: { color?: string }) => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polygon points="12 2 22 9 18 21 6 21 2 9"/></svg>;
const IcoSend     = ({ color = '#22c55e' }: { color?: string }) => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;

// ─── Mockups ──────────────────────────────────────────────────────────────────

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

function StepRow({ done, active, label, detail }: { done: boolean; active?: boolean; label: string; detail: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: active ? BRAND : done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? BRAND : done ? '#22c55e' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        {done && !active && <IcoCheck />}
        {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />}
      </div>
      <div>
        <div style={{ color: active ? '#fafafa' : done ? '#a1a1aa' : '#52525b', fontWeight: active ? 700 : 500, fontSize: 11 }}>{label}</div>
        <div style={{ color: '#3f3f46', fontSize: 10, marginTop: 2 }}>{detail}</div>
      </div>
    </div>
  );
}

function AppMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: 'monospace', fontSize: 11 }}>
      <WindowChrome title="wyberai.com — Live Build" />
      <StepRow done label="Prompt received" detail='"Build a CRM with pipeline view"' />
      <StepRow done label="Generating React components" detail="14 files · Supabase schema" />
      <StepRow done label="Pushing to GitHub" detail="wyberai/crm-abc123" />
      <StepRow done={false} active label="Deployed to Vercel" detail="crm-abc123.vercel.app" />
    </div>
  );
}

function MobileMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: 'monospace', fontSize: 11 }}>
      <WindowChrome title="wyberai.com — Mobile Build" />
      {/* Phone frame */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div style={{ width: 72, background: '#111', border: '2px solid #262a36', borderRadius: 14, padding: '10px 6px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 20, height: 3, borderRadius: 2, background: '#262a36', marginBottom: 6 }} />
          <div style={{ width: '100%', background: '#0d0d10', borderRadius: 6, padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {['Workouts', 'Calories', 'Sleep', 'Goals'].map(s => (
              <div key={s} style={{ height: 7, borderRadius: 2, background: s === 'Workouts' ? `${BRAND}40` : 'rgba(255,255,255,0.06)' }} />
            ))}
          </div>
          <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #262a36', marginTop: 4 }} />
        </div>
      </div>
      <StepRow done label="Prompt received" detail='"Build a fitness tracker app"' />
      <StepRow done label="Generating React Native screens" detail="Expo · 8 components" />
      <StepRow done label="Live preview ready" detail="Scan to open on your phone" />
      <StepRow done={false} active label="Export project" detail="fitness-app · ready to publish" />
    </div>
  );
}

function AgentMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontSize: 11 }}>
      <WindowChrome title="Lead Qualifier Agent — Running" />
      <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#fafafa', fontSize: 12 }}>
            <IcoCpu />
            Lead Qualifier
          </div>
          <div style={{ background: '#22c55e', color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20 }}>RUNNING</div>
        </div>
        <div style={{ color: '#71717a', fontSize: 10, marginTop: 4 }}>Connected: HubSpot · Gmail · Slack</div>
      </div>
      <div style={{ background: '#050508', borderRadius: 8, padding: 10, fontFamily: 'monospace' }}>
        <div style={{ color: '#52525b', fontSize: 9, marginBottom: 6, letterSpacing: '0.05em' }}>EXECUTION LOG</div>
        {[
          { t: '09:42:01', msg: 'Fetched 24 new leads from HubSpot', c: '#a1a1aa' },
          { t: '09:42:03', msg: 'Scoring lead: john@acme.com → 87/100', c: '#22c55e' },
          { t: '09:42:04', msg: 'Drafted outreach email via Gmail', c: '#a1a1aa' },
          { t: '09:42:05', msg: 'Posted to #sales-alerts on Slack', c: BRAND },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, minWidth: 0 }}>
            <span style={{ color: '#3f3f46', flexShrink: 0 }}>{l.t}</span>
            <span style={{ color: l.c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{l.msg}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
          <span style={{ color: '#22c55e', fontSize: 10 }}>3 leads qualified · 0 errors</span>
        </div>
      </div>
    </div>
  );
}

function FlowMockup() {
  const nodes = [
    { type: 'TRIGGER',   label: 'New signup webhook',              color: BRAND,     Icon: IcoZapSm },
    { type: 'AI STEP',   label: 'Claude: Write welcome email',     color: '#a855f7', Icon: IcoBrain },
    { type: 'CONDITION', label: 'Plan = Pro?',                     color: '#f59e0b', Icon: IcoDiamond },
    { type: 'ACTION',    label: 'Send Slack alert to #onboarding', color: '#22c55e', Icon: IcoSend },
  ];
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontSize: 11 }}>
      <WindowChrome title="Onboarding Flow — Visual Builder" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {nodes.map((node, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ background: `${node.color}12`, border: `1px solid ${node.color}35`, borderRadius: 8, padding: '7px 14px', width: '85%', display: 'flex', alignItems: 'center', gap: 8 }}>
              <node.Icon color={node.color} />
              <div>
                <div style={{ fontSize: 9, color: node.color, fontWeight: 800, letterSpacing: '0.05em' }}>{node.type}</div>
                <div style={{ color: '#d4d4d8', fontSize: 11, fontWeight: 600 }}>{node.label}</div>
              </div>
              <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            </div>
            {i < nodes.length - 1 && <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', color: '#3f3f46', fontSize: 10 }}>
        <span>Last run: 2 min ago</span>
        <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}><IcoCheck color="#22c55e" /> 142 runs · 0 failures</span>
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ eyebrow, heading, body, mockup, ctaLabel, ctaHref, accentBorder = false, Icon }: {
  eyebrow: string; heading: string; body: string; mockup: React.ReactNode;
  ctaLabel: string; ctaHref: string; accentBorder?: boolean;
  Icon: React.FC;
}) {
  return (
    <div style={{ background: '#111113', border: `1px solid ${accentBorder ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.08)'}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          <Icon />
          {eyebrow}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>{heading}</div>
        <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.7 }}>{body}</div>
      </div>
      {mockup}
      <Link href={ctaHref} style={{ display: 'block', textAlign: 'center', padding: '9px 0', borderRadius: 8, border: `1px solid rgba(14,165,233,0.3)`, background: `rgba(14,165,233,0.08)`, color: BRAND, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
        {ctaLabel}
      </Link>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 0, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        {/* Desktop nav — hidden below 768px via CSS */}
        <div className="wyb-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {([['Gallery', '/gallery'], ['Templates', '/templates'], ['Mobile', '/templates/mobile'], ['Agents', '/agents'], ['Workflows', '/workflows'], ['Pricing', '/pricing']] as [string, string][]).map(([l, h]) => (
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
        {/* Hamburger — shown below 768px via CSS */}
        <button
          className="wyb-nav-hamburger"
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label="Toggle menu"
          style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ width: 22, height: 2, background: mobileMenuOpen ? '#fafafa' : '#a1a1aa', borderRadius: 1, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <div style={{ width: 22, height: 2, background: mobileMenuOpen ? 'transparent' : '#a1a1aa', borderRadius: 1, transition: 'all 0.2s' }} />
          <div style={{ width: 22, height: 2, background: mobileMenuOpen ? '#fafafa' : '#a1a1aa', borderRadius: 1, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </nav>
      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 99, background: 'rgba(9,9,11,0.98)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {([['Gallery', '/gallery'], ['Templates', '/templates'], ['Mobile', '/templates/mobile'], ['Agents', '/agents'], ['Workflows', '/workflows'], ['Pricing', '/pricing']] as [string, string][]).map(([l, h]) => (
            <Link key={l} href={h} onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 4px', fontSize: 16, fontWeight: 600, color: '#a1a1aa', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'block', minHeight: 44 }}>
              {l}
            </Link>
          ))}
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user
              ? <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ padding: '13px 0', textAlign: 'center', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', minHeight: 44, display: 'block' }}>Dashboard →</Link>
              : <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ padding: '13px 0', textAlign: 'center', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 15, fontWeight: 500, textDecoration: 'none', minHeight: 44, display: 'block' }}>Sign in</Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} style={{ padding: '13px 0', textAlign: 'center', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', minHeight: 44, display: 'block', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>Start free →</Link>
                </>
            }
          </div>
        </div>
      )}

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(60px,10vw,120px) clamp(20px,4vw,48px)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 50% at 20% 40%, rgba(14,165,233,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 80% 60%, rgba(14,165,233,0.07) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 50% 90%, rgba(14,165,233,0.05) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: `rgba(14,165,233,0.1)`, border: `1px solid rgba(14,165,233,0.2)`, fontSize: 12, fontWeight: 700, color: BRAND, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND, animation: 'pulse 2s infinite' }} />
            A new category of AI platform
          </div>

          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(38px,6vw,76px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 22 }}>
            The AI platform that<br />
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, #38bdf8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              builds, thinks, and acts.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.8vw,20px)', color: '#71717a', lineHeight: 1.65, maxWidth: 580, margin: '0 auto 12px' }}>
            Web. Mobile. Agents. Workflows.
          </p>
          <p style={{ fontSize: 'clamp(13px,1.5vw,16px)', color: '#52525b', lineHeight: 1.65, maxWidth: 520, margin: '0 auto 36px' }}>
            One platform. One prompt. Zero setup.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            <Link href="/signup" style={{ padding: '14px 32px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 24px rgba(14,165,233,0.35)`, transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
              Start free — 50 credits/month →
            </Link>
            <Link href="/agents" style={{ padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(14,165,233,0.3)`; (e.currentTarget as HTMLElement).style.color = '#fafafa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#a1a1aa' }}>
              Browse 5,000+ agents →
            </Link>
          </div>

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
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Try it — no sign-up needed</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.03em' }}>Type a prompt. See it generate live.</h2>
        </div>
        <LiveDemo />
      </section>

      {/* Four Products */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>One platform. Four superpowers.</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              Web. Mobile. Agents. Workflows.
            </h2>
            <p style={{ fontSize: 16, color: '#71717a', marginTop: 14, maxWidth: 480, margin: '14px auto 0' }}>
              Every tool your product needs — built, wired, and running from a single prompt.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 24 }}>
            <ProductCard
              eyebrow="Web Apps"
              heading="Describe it. It builds."
              body="Type what you want. Wyber generates production-ready React code, provisions a Supabase database, and deploys to Vercel — in under 30 seconds. No drag-and-drop. Real code. Start from one of 81+ gallery templates or build from scratch."
              mockup={<AppMockup />}
              ctaLabel="Build a web app →"
              ctaHref="/dashboard?new=app"
              accentBorder
              Icon={IcoMonitor}
            />
            <ProductCard
              eyebrow="Mobile Apps"
              heading="Describe it. Ship to iOS & Android."
              body="Type what you want. Wyber generates a real React Native app with Expo, gives you a live preview you can interact with, and exports a ready-to-publish project. One prompt — a working mobile app on both platforms."
              mockup={<MobileMockup />}
              ctaLabel="Build a mobile app →"
              ctaHref="/dashboard?new=mobile"
              Icon={IcoPhone}
            />
            <ProductCard
              eyebrow="AI Agents"
              heading="Pick one. It executes."
              body="Browse 5,000+ pre-built agents across 18 industries. Connect your tools — Slack, HubSpot, Gmail, Airtable. Click Run. Claude executes every step with a full audit log."
              mockup={<AgentMockup />}
              ctaLabel="Browse agents →"
              ctaHref="/agents"
              Icon={IcoCpu}
            />
            <ProductCard
              eyebrow="Workflows"
              heading="Draw it. It runs."
              body="Visual drag-and-drop flow builder. Wire triggers, AI reasoning steps, and actions together. Branch on conditions. Schedule runs. No code — just connect the nodes and go."
              mockup={<FlowMockup />}
              ctaLabel="Build a workflow →"
              ctaHref="/flows"
              Icon={IcoZap}
            />
          </div>
        </div>
      </section>

      {/* App Build Steps */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>App building</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.03em' }}>From prompt to live app</h2>
            <p style={{ fontSize: 14, color: '#71717a', marginTop: 10 }}>Four steps. Under 30 seconds.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 20 }}>
            {[
              { num: '01', title: 'Describe your app', desc: 'Type what you want in plain English. Wyber generates production-ready React code — no templates, no drag-and-drop, just real code.', component: <GenerateAnimation /> },
              { num: '02', title: 'Preview in 8 seconds', desc: 'Live preview builds automatically. Click elements to edit them. Change anything — the preview updates instantly.', component: <DeployAnimation /> },
              { num: '03', title: 'Edit visually', desc: 'Click any element in the preview to edit it directly. Describe the change and it happens — no code needed.', component: <VisualEditAnimation /> },
              { num: '04', title: 'Deploy to a live URL', desc: 'One click publishes to Vercel. GitHub sync, custom domains, and full source code export included.', component: <DatabaseAnimation /> },
            ].map(s => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {s.component}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: BRAND, letterSpacing: '0.1em', marginBottom: 6 }}>{s.num}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.65 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community / Discord */}
      <section style={{ padding: 'clamp(40px,5vw,60px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, padding: '24px 28px', borderRadius: 16, background: `rgba(14,165,233,0.06)`, border: `1px solid rgba(14,165,233,0.15)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `rgba(14,165,233,0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IcoChat />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Join the WyberAi community</div>
              <div style={{ fontSize: 13, color: '#71717a' }}>Ask questions, share what you're building, get early feature previews</div>
            </div>
          </div>
          <a href="https://discord.gg/A5KsFv2P" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', borderRadius: 9, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Join Discord →
          </a>
        </div>
      </section>

      {/* Done for you */}
      <section style={{ padding: 'clamp(32px,4vw,48px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 32px', borderRadius: 16, background: `rgba(14,165,233,0.05)`, border: `1px solid rgba(14,165,233,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Done for you</div>
            <div style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Have an idea but don't want to build it yourself?</div>
            <div style={{ fontSize: 13, color: '#71717a' }}>Book a $99 consultation — we scope, quote, and build your app. Simple in 24hrs, Medium in 3 days, Complex in 1 week.</div>
          </div>
          <a href="/setup-call" style={{ padding: '11px 22px', borderRadius: 9, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Book a session →
          </a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(80px,10vw,140px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,165,233,0.08) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(32px,5vw,60px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.05 }}>
            One prompt.<br />
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, #38bdf8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Infinite possibilities.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, maxWidth: 480, margin: '0 auto 32px' }}>
            Build web and mobile apps, deploy AI agents, and automate workflows — all from a single prompt. Start with 50 free credits/month, no card required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 12, background: BRAND, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: `0 8px 32px rgba(14,165,233,0.35)` }}>
              Start for free →
            </Link>
            <Link href="/agents" style={{ display: 'inline-block', padding: '16px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 16, fontWeight: 500, textDecoration: 'none' }}>
              Browse agents →
            </Link>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: '#3f3f46' }}>50 credits/month free · No credit card · No setup</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <WyberLogo markSize={20} wordmarkSize={13} />
          <span style={{ fontSize: 12, color: '#3f3f46' }}>· A product by SignalPulse Technologies · © 2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <a href="https://www.producthunt.com/products/wyber-ai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-wyber-ai" target="_blank" rel="noopener noreferrer">
            <img alt="WyberAi on Product Hunt" width="200" height="44" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1160357&theme=dark&t=1780291241806" />
          </a>
          {([['Privacy', '/privacy'], ['Terms', '/terms'], ['Pricing', '/pricing'], ['Mobile', '/templates/mobile'], ['Workflows', '/workflows'], ['Blog', '/blog'], ['Discord', 'https://discord.gg/A5KsFv2P']] as [string, string][]).map(([l, h]) => (
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
