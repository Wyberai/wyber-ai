'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { LiveDemo } from '@/components/shared/LiveDemo';
import { GenerateAnimation, DeployAnimation, VisualEditAnimation, DatabaseAnimation } from '@/components/shared/ProductAnimations';

const BRAND = '#0EA5E9';

function WyberLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={BRAND}/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  );
}

const STATS = [
  { value: '5,000+', label: 'AI Agents' },
  { value: '130+', label: 'App templates' },
  { value: '30s', label: 'Avg build time' },
  { value: '0', label: 'Setup required' },
]

// ─── Unique visual mockups for each pillar ────────────────────────────────────

function AppMockup() {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontFamily: 'monospace', fontSize: 11 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
        <span style={{ marginLeft: 8, color: '#52525b', fontSize: 10 }}>wyberai.com — Live Build</span>
      </div>
      {[
        { step: '01', label: 'Prompt received', detail: '"Build a CRM with pipeline view"', done: true },
        { step: '02', label: 'Generating React components', detail: '14 files · Supabase schema', done: true },
        { step: '03', label: 'Pushing to GitHub', detail: 'wyberai/crm-abc123', done: true },
        { step: '04', label: 'Deployed to Vercel', detail: 'crm-abc123.vercel.app ✓', done: false, active: true },
      ].map(s => (
        <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.active ? BRAND : s.done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${s.active ? BRAND : s.done ? '#22c55e' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            {s.done && !s.active && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>}
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
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontSize: 11 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
        <span style={{ marginLeft: 8, color: '#52525b', fontSize: 10 }}>Lead Qualifier Agent — Running</span>
      </div>
      {/* Agent card */}
      <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, color: '#fafafa', fontSize: 12 }}>🤖 Lead Qualifier</div>
          <div style={{ background: '#22c55e', color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20 }}>RUNNING</div>
        </div>
        <div style={{ color: '#71717a', fontSize: 10, marginTop: 4 }}>Connected: HubSpot · Gmail · Slack</div>
      </div>
      {/* Execution log */}
      <div style={{ background: '#050508', borderRadius: 8, padding: 10, fontFamily: 'monospace' }}>
        <div style={{ color: '#52525b', fontSize: 9, marginBottom: 6, letterSpacing: '0.05em' }}>EXECUTION LOG</div>
        {[
          { t: '09:42:01', msg: 'Fetched 24 new leads from HubSpot', c: '#a1a1aa' },
          { t: '09:42:03', msg: 'Scoring lead: john@acme.com → 87/100', c: '#22c55e' },
          { t: '09:42:04', msg: 'Drafted outreach email via Gmail', c: '#a1a1aa' },
          { t: '09:42:05', msg: 'Posted to #sales-alerts on Slack ✓', c: BRAND },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
            <span style={{ color: '#3f3f46', flexShrink: 0 }}>{l.t}</span>
            <span style={{ color: l.c }}>{l.msg}</span>
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
  return (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontSize: 11 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
        <span style={{ marginLeft: 8, color: '#52525b', fontSize: 10 }}>Onboarding Flow — Visual Builder</span>
      </div>
      {/* Flow nodes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {[
          { type: 'TRIGGER', label: 'New signup webhook', color: BRAND, icon: '⚡' },
          { type: 'AI STEP', label: 'Claude: Write welcome email', color: '#a855f7', icon: '🧠' },
          { type: 'CONDITION', label: 'Plan = Pro?', color: '#f59e0b', icon: '◆' },
          { type: 'ACTION', label: 'Send Slack alert to #onboarding', color: '#22c55e', icon: '📤' },
        ].map((node, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ background: `${node.color}12`, border: `1px solid ${node.color}35`, borderRadius: 8, padding: '7px 14px', width: '85%', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{node.icon}</span>
              <div>
                <div style={{ fontSize: 9, color: node.color, fontWeight: 800, letterSpacing: '0.05em' }}>{node.type}</div>
                <div style={{ color: '#d4d4d8', fontSize: 11, fontWeight: 600 }}>{node.label}</div>
              </div>
              <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            </div>
            {i < 3 && <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', color: '#3f3f46', fontSize: 10 }}>
        <span>Last run: 2 min ago</span>
        <span style={{ color: '#22c55e' }}>✓ 142 runs · 0 failures</span>
      </div>
    </div>
  );
}

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
          {[['Gallery', '/gallery'], ['Agents', '/agents'], ['Flows', '/flows'], ['Pricing', '/pricing']].map(([l, h]) => (
            <Link key={l} href={h} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 13, color: '#71717a', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fafafa'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#71717a'}>
              {l}
            </Link>
          ))}<div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />
          {user
            ? <Link href="/dashboard" style={{ padding: '7px 16px', borderRadius: 8, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Dashboard →</Link>
            : <>
                <Link href="/login" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, color: '#a1a1aa', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
                <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 20px rgba(14,165,233,0.25)' }}>Start free →</Link>
              </>
          }
        </div>
      </nav>

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

          <p style={{ fontSize: 'clamp(15px,1.8vw,20px)', color: '#71717a', lineHeight: 1.65, marginBottom: 12, maxWidth: 580, margin: '0 auto 12px' }}>
            Apps. Agents. Automations.
          </p>
          <p style={{ fontSize: 'clamp(13px,1.5vw,16px)', color: '#52525b', lineHeight: 1.65, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
            One platform. One prompt. Zero setup.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            <Link href="/signup" style={{ padding: '14px 32px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 24px rgba(14,165,233,0.35)`, transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
              Start free — 15 credits →
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

      {/* Three Pillars — the core section */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>One platform. Three superpowers.</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              Apps. Agents. Automations.
            </h2>
            <p style={{ fontSize: 16, color: '#71717a', marginTop: 14, maxWidth: 440, margin: '14px auto 0' }}>
              Every tool your product needs — built, wired, and running from a single prompt.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {/* Apps */}
            <div style={{ background: '#111113', border: `1px solid rgba(14,165,233,0.15)`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>🎨 Apps</div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Describe it. It builds.</div>
                <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.7 }}>
                  Type what you want. Wyber generates production-ready React code, provisions a Supabase database, and deploys to Vercel — in under 30 seconds. No templates. No drag-and-drop. Real code.
                </div>
              </div>
              <AppMockup />
              <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '9px 0', borderRadius: 8, border: `1px solid rgba(14,165,233,0.3)`, background: `rgba(14,165,233,0.08)`, color: BRAND, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Build an app →
              </Link>
            </div>

            {/* Agents */}
            <div style={{ background: '#111113', border: `1px solid rgba(14,165,233,0.1)`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>🤖 Agents</div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Pick one. It executes.</div>
                <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.7 }}>
                  Browse 5,000+ pre-built agents across 18 industries. Connect your tools — Slack, HubSpot, Gmail, Airtable. Click Run. Claude executes every step with a full audit log.
                </div>
              </div>
              <AgentMockup />
              <Link href="/agents" style={{ display: 'block', textAlign: 'center', padding: '9px 0', borderRadius: 8, border: `1px solid rgba(14,165,233,0.3)`, background: `rgba(14,165,233,0.08)`, color: BRAND, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Browse agents →
              </Link>
            </div>

            {/* Automations */}
            <div style={{ background: '#111113', border: `1px solid rgba(14,165,233,0.1)`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>⚡ Automations</div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Draw it. It runs.</div>
                <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.7 }}>
                  Visual drag-and-drop flow builder. Wire triggers, AI reasoning steps, and actions together. Branch on conditions. Schedule runs. No code — just connect the nodes and go.
                </div>
              </div>
              <FlowMockup />
              <Link href="/flows" style={{ display: 'block', textAlign: 'center', padding: '9px 0', borderRadius: 8, border: `1px solid rgba(14,165,233,0.3)`, background: `rgba(14,165,233,0.08)`, color: BRAND, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Build a flow →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* App Build Steps — visual deep dive */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>App building</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.03em' }}>From prompt to live app</h2>
            <p style={{ fontSize: 14, color: '#71717a', marginTop: 10 }}>Four steps. Under 30 seconds.</p>
          </div>
          <div className="wyber-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
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
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `rgba(14,165,233,0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💬</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Join the Wyber AI community</div>
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
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
            Build apps, deploy AI agents, and automate workflows — all from a single prompt. Start with 15 free credits, no card required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 12, background: BRAND, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: `0 8px 32px rgba(14,165,233,0.35)` }}>
              Start for free →
            </Link>
            <Link href="/agents" style={{ display: 'inline-block', padding: '16px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 16, fontWeight: 500, textDecoration: 'none' }}>
              Browse agents →
            </Link>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: '#3f3f46' }}>15 free credits · No credit card · No setup</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <WyberLogo size={20} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '-0.03em', color: '#71717a' }}>Wyber AI</span>
          <span style={{ fontSize: 12, color: '#3f3f46' }}>· A product by SignalPulse Technologies · © 2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <a href="https://www.producthunt.com/products/wyber-ai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-wyber-ai" target="_blank" rel="noopener noreferrer">
            <img alt="Wyber AI on Product Hunt" width="200" height="44" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1160357&theme=dark&t=1780291241806" />
          </a>
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
