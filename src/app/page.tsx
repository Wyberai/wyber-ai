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
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    title: 'Instant generation',
    desc: 'Describe your app in plain English. Wyber AI asks the right questions, then builds production-ready React code — no setup, no configuration.',
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
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    title: '130+ templates',
    desc: 'Start from 130+ professionally designed templates — dashboards, CRMs, e-commerce, healthcare, finance. Instant load, fully editable.',
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg>,
    title: '12 integrations',
    desc: 'Connect Stripe, Supabase, OpenAI, Mapbox, Twilio and more with one click. Your app gets wired up automatically.',
  },
]

const STATS = [
  { value: '5,000+', label: 'AI Agents' },
  { value: '130+', label: 'App templates' },
  { value: '30s', label: 'Avg build time' },
  { value: '0', label: 'Setup required' },
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
          {[['Gallery', '/gallery'], ['Agents', '/agents'], ['Community', '/community'], ['Pricing', '/pricing']].map(([l, h]) => (
            <Link key={l} href={h} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 13, color: '#71717a', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fafafa'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#71717a'}>
              {l}
            </Link>
          ))}<div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />
          {user
            ? <Link href="/dashboard" style={{ padding: '7px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Dashboard →</Link>
            : <>
                <Link href="/login" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, color: '#a1a1aa', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
                <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 20px rgba(14,165,233,0.25)' }}>Start free →</Link>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: 'pulse 2s infinite' }} />
            AI-powered · Built for builders
          </div>

          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(38px,6vw,72px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 22 }}>
            Build apps and AI agents<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              from one prompt
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.8vw,19px)', color: '#71717a', lineHeight: 1.65, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
            Describe your app or pick from 5,000+ AI agents. Wyber generates production-ready code, wires real tools, and deploys live — in under 30 seconds.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/signup" style={{ padding: '14px 28px', borderRadius: 10, background: '#6366f1', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(14,165,233,0.35)', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
              Start building free →
            </Link>
            <Link href="/agents" style={{ padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'; (e.currentTarget as HTMLElement).style.color = '#fafafa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#a1a1aa' }}>
              Browse 5,000+ agents →
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
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Try it — no sign-up needed</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.03em' }}>Type a prompt. See it generate live.</h2>
        </div>
        <LiveDemo />
      </section>

      {/* Features */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Everything you need</div>
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
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.03em' }}>Apps. Agents. Automations.</h2>
            <p style={{ fontSize:15, color:'#71717a', marginTop:10, maxWidth:500, margin:'10px auto 0' }}>One platform. Three capabilities. Zero setup.</p>
          </div>

          {/* Three pillar cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20, marginBottom:60 }}>
            {[
              {
                icon:'🎨', color:'#6366f1', label:'APPS',
                title:'Build any app from a prompt',
                desc:'Type what you want. Wyber generates production-ready React code, deploys to Vercel, and wires a real Supabase database — in under 30 seconds.',
                steps:['Describe your app in plain English','Preview builds automatically in 8 seconds','One-click deploy to live URL','Visual editing for any element'],
                cta:'Build an app →', href:'/signup'
              },
              {
                icon:'🤖', color:'#8b5cf6', label:'AGENTS',
                title:'Deploy AI agents for any workflow',
                desc:'Browse 5,000+ pre-built agents across 18 industries. Connect your own tools (Slack, HubSpot, Gmail, Airtable), click Run, and let Claude execute.',
                steps:['Pick from 5,000+ agents','Connect your API keys (encrypted)','Click Run — Claude executes steps','Full audit log of every action'],
                cta:'Browse agents →', href:'/agents'
              },
              {
                icon:'⚡', color:'#f59e0b', label:'AUTOMATIONS',
                title:'Build visual automation flows',
                desc:'Drag-and-drop flow builder. Triggers → AI reasoning → Actions. Schedule runs, wire 12+ tools, branch on conditions. No code needed.',
                steps:['Add trigger (webhook, schedule, Slack)','AI step: Claude decides what to do','Action: send message, update CRM, log data','Run on schedule or on demand'],
                cta:'Build a flow →', href:'/flows'
              },
            ].map(pillar => (
              <div key={pillar.label} style={{ background:'#111118', border:`1px solid ${pillar.color}20`, borderRadius:14, padding:24, display:'flex', flexDirection:'column' }}>
                <div style={{ fontSize:11, fontWeight:800, color:pillar.color, letterSpacing:'0.1em', marginBottom:10 }}>{pillar.icon} {pillar.label}</div>
                <div style={{ fontSize:17, fontWeight:700, marginBottom:8, letterSpacing:'-0.02em' }}>{pillar.title}</div>
                <div style={{ fontSize:13, color:'#71717a', lineHeight:1.65, marginBottom:16 }}>{pillar.desc}</div>
                <div style={{ flex:1 }}>
                  {pillar.steps.map((step, i) => (
                    <div key={i} style={{ display:'flex', gap:8, marginBottom:7, alignItems:'flex-start' }}>
                      <span style={{ color:pillar.color, fontSize:12, fontWeight:800, flexShrink:0, marginTop:1 }}>0{i+1}</span>
                      <span style={{ fontSize:12, color:'#a1a1aa', lineHeight:1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
                <Link href={pillar.href} style={{ marginTop:20, display:'block', textAlign:'center', padding:'9px 0', borderRadius:8, border:`1px solid ${pillar.color}40`, background:`${pillar.color}10`, color:pillar.color, fontSize:13, fontWeight:700, textDecoration:'none' }}>
                  {pillar.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Original 4-step flow — kept, just renamed */}
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#6366f1', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>App building</div>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(22px,2.5vw,32px)', fontWeight:800, letterSpacing:'-0.03em' }}>From prompt to live app</h3>
          </div>
          <div className="wyber-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { num: '01', title: 'Describe your app', desc: 'Type what you want. Wyber AI generates production-ready React code — no templates, no drag-and-drop, just real code.', component: <GenerateAnimation /> },
              { num: '02', title: 'Preview in 8 seconds', desc: 'Live preview builds automatically. Click elements to edit them. Change anything — the preview updates instantly.', component: <DeployAnimation /> },
              { num: '03', title: 'Edit visually', desc: 'Click any element in the preview to edit it directly. Describe the change and it happens — no code needed.', component: <VisualEditAnimation /> },
              { num: '04', title: 'Deploy to a live URL', desc: 'One click publishes to Vercel. GitHub sync, custom domains, and full source code export included.', component: <DatabaseAnimation /> },
            ].map(s => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {s.component}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', letterSpacing: '0.1em', marginBottom: 6 }}>{s.num}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.65 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table — Taskade-style */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign:'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Why Wyber AI</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.03em' }}>One platform. Apps and agents.</h2>
            <p style={{ fontSize: 15, color: '#71717a', marginTop: 12 }}>Everything competitors charge extra for — included.</p>
          </div>

          <div className="wyber-comparison" style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign:'left', padding:'12px 16px', color:'#52525b', fontWeight:600 }}>Capability</th>
                  <th style={{ textAlign:'center', padding:'12px 16px', background:'rgba(99,102,241,0.08)', color:'#6366f1', fontWeight:700, borderRadius:'8px 8px 0 0' }}>Wyber AI</th>
                  <th style={{ textAlign:'center', padding:'12px 16px', color:'#52525b', fontWeight:600 }}>Lovable</th>
                  <th style={{ textAlign:'center', padding:'12px 16px', color:'#52525b', fontWeight:600 }}>Bolt</th>
                  <th style={{ textAlign:'center', padding:'12px 16px', color:'#52525b', fontWeight:600 }}>Taskade</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cap:'App generation from prompt', wyber:'✅', lovable:'✅', bolt:'✅', taskade:'✅' },
                  { cap:'5,000+ AI agent library', wyber:'✅', lovable:'❌', bolt:'❌', taskade:'Templates only' },
                  { cap:'Agent execution with real tools', wyber:'✅', lovable:'❌', bolt:'❌', taskade:'✅' },
                  { cap:'Credits never expire', wyber:'✅', lovable:'❌', bolt:'❌', taskade:'❌' },
                  { cap:'Supabase database integration', wyber:'✅', lovable:'✅', bolt:'Partial', taskade:'❌' },
                  { cap:'Clone any app one-click', wyber:'✅', lovable:'❌', bolt:'❌', taskade:'✅' },
                  { cap:'Community gallery', wyber:'✅', lovable:'❌', bolt:'❌', taskade:'✅' },
                  { cap:'Price per month', wyber:'$18.99', lovable:'$25', bolt:'$20', taskade:'$8–$50' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background: i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding:'11px 16px', color:'#a1a1aa', fontWeight:500 }}>{row.cap}</td>
                    <td style={{ padding:'11px 16px', textAlign:'center', background:'rgba(99,102,241,0.04)', fontWeight:700, color:row.wyber==='✅'?'#22c55e':row.wyber==='❌'?'#52525b':'#f0f0f5' }}>{row.wyber}</td>
                    <td style={{ padding:'11px 16px', textAlign:'center', color:row.lovable==='✅'?'#a1a1aa':row.lovable==='❌'?'#3f3f46':'#a1a1aa' }}>{row.lovable}</td>
                    <td style={{ padding:'11px 16px', textAlign:'center', color:row.bolt==='✅'?'#a1a1aa':row.bolt==='❌'?'#3f3f46':'#a1a1aa' }}>{row.bolt}</td>
                    <td style={{ padding:'11px 16px', textAlign:'center', color:row.taskade==='✅'?'#a1a1aa':row.taskade==='❌'?'#3f3f46':'#a1a1aa' }}>{row.taskade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign:'center', marginTop:32 }}>
            <Link href="/signup" style={{ display:'inline-block', padding:'12px 28px', borderRadius:10, background:'#6366f1', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none' }}>
              Start building free →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.03em' }}>Builders love Wyber AI</h2>
          </div>
          <div className="wyber-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ padding: 22, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 22, marginBottom: 14, color: '#6366f1' }}>"</div>
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


      {/* Done for you strip */}
      <section style={{ padding: 'clamp(32px,4vw,48px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 32px', borderRadius: 16, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Done for you</div>
            <div style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Have an idea but don't want to build it yourself?</div>
            <div style={{ fontSize: 13, color: '#71717a' }}>Book a $99 consultation — we scope, quote, and build your app. Simple in 24hrs, Medium in 3 days, Complex in 1 week.</div>
          </div>
          <a href="/setup-call" style={{ padding: '11px 22px', borderRadius: 9, background: '#8b5cf6', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Book a session →
          </a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(80px,10vw,140px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(30px,4vw,52px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1 }}>One prompt.<br /><span style={{ background:'linear-gradient(135deg,#6366f1,#6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Infinite possibilities.</span></h2>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, marginBottom: 32 }}>Build apps, deploy AI agents, and automate workflows — all from a single prompt. Start with 15 free credits, no card required.</p>
          <div className="wyber-hero-btns" style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/signup" style={{ display: 'inline-block', padding: '16px 36px', borderRadius: 12, background: '#6366f1', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}>
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
        <div style={{ display: 'flex', gap: 20 }}>
          {/* Product Hunt badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <a href="https://www.producthunt.com/products/wyber-ai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-wyber-ai" target="_blank" rel="noopener noreferrer">
              <img alt="Wyber AI on Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1160357&theme=dark&t=1780291241806" />
            </a>
          </div>

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
