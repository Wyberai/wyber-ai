import { headers } from 'next/headers'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const CAL_LINK = 'https://cal.com/wyberai/wyber-ai-build-consultation'

const TIERS = [
  { name:'Simple',  delivery:'24 hours',       color:'#22c55e', icon:'⚡', examples:'Landing pages, portfolios, single-tool apps, static dashboards' },
  { name:'Medium',  delivery:'3 working days',  color:'#0EA5E9', icon:'🔧', examples:'SaaS MVPs, booking systems, CRMs, apps with login + database' },
  { name:'Complex', delivery:'1 week',           color:'#8b5cf6', icon:'🏗️', examples:'Full SaaS with payments, multi-role apps, marketplace platforms' },
]

// Free is a US-only, English-only offer for now (matches the pricing/homepage
// "done for you" sections, both gated with currency!=='INR' / !inr). This page
// has no such gate of its own — it's linked from /contact and /complexity-guide
// too — so eligibility is computed here from IP country rather than hardcoded,
// keeping India visitors at the original $99 paid flow regardless of entry point.
function getSteps(isFree: boolean) {
  return [
    isFree
      ? { n:'01', icon:'🎙️', title:'Tell us it\'s a real project', desc:'This call is free — please only book if you\'re seriously considering building something. Slots are limited.' }
      : { n:'01', icon:'💳', title:'Pay $99 consultation fee', desc:'Secures your slot and covers the scoping call. Credited toward your build if you proceed.' },
    { n:'02', icon:'📅', title:'Pick a time',              desc:'Book any slot — available 24/7 including weekends.' },
    { n:'03', icon:'💬', title:'We scope your app',        desc:'60 minutes on Google Meet. You describe, we ask the right questions, we give you a firm quote and delivery date.' },
    { n:'04', icon:'🛠️', title:'We build & deliver',       desc:'GitHub repo, live Vercel URL, walkthrough video. 7-day support included.' },
  ]
}

function getFaq(isFree: boolean) {
  return [
    isFree
      ? { q:'Is this really free?', a:'Yes — no payment, no card required. We ask that you only book if you\'re seriously considering building something, since slots are limited and we want to spend them on real projects.' }
      : { q:'Is the $99 refundable?', a:'Yes — fully refunded if we decide on the call that your project isn\'t a fit.' },
    isFree
      ? { q:'Am I obligated to buy a build afterward?', a:'Not at all. Take the quote and build it yourself with WyberAi, or hire us — no pressure either way.' }
      : { q:'Is it credited toward the build?', a:'Yes. If you proceed with a build, the $99 consultation fee is applied toward your total — you only pay the remaining balance.' },
    { q:'What can be built in a session?',    a:'Anything WyberAi can generate — SaaS dashboards, landing pages, booking systems, CRMs, e-commerce stores, internal tools.' },
    { q:'Do I need a WyberAi account?',      a:'No. We build on our end and hand over the code via GitHub.' },
    { q:'Can I request a specific stack?',    a:'Our default is Next.js + Supabase + Vercel. Other stacks on request — mention it when booking.' },
  ]
}

export default async function SetupCallPage() {
  const country = (await headers()).get('x-vercel-ip-country')
  const isFree = true // free globally — cost recovered during build
  const STEPS = getSteps(isFree)
  const FAQ = getFaq(isFree)
  const s = { bg:'#09090b', card:'#111113', border:'rgba(255,255,255,0.08)', text:'#fafafa', muted:'#71717a', sky:'#0EA5E9' }

  return (
    <div style={{ minHeight:'100vh', background:s.bg, color:s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding:'0 clamp(16px,4vw,48px)', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${s.border}`, position:'sticky', top:0, zIndex:100, background:'rgba(9,9,11,0.95)', backdropFilter:'blur(16px)' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight:800, fontSize:14, textDecoration:'none', color:s.text, display:'flex', alignItems:'center', gap:8 }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Link href="/pricing" style={{ fontSize:13, color:s.muted, textDecoration:'none' }}>← Pricing</Link>
          <Link href="/signup" style={{ padding:'7px 16px', borderRadius:8, background:s.sky, color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>Start free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>

        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ display:'inline-block', padding:'4px 14px', borderRadius:20, background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.2)', fontSize:11, fontWeight:700, color:s.sky, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>Done-for-you builds</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize:'clamp(28px,5vw,46px)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:16 }}>Tell us what you need.<br/>We build it for you.</h1>
          <p style={{ fontSize:15, color:s.muted, maxWidth:480, margin:'0 auto 20px', lineHeight:1.75 }}>Start with a 60-minute consultation. We scope, quote, and agree on a delivery date — then build and hand it over.</p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:20, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e' }}/>
            <span style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>Available 24/7 · Google Meet · Worldwide</span>
          </div>
        </div>

        {/* Consultation fee banner */}
        <div style={{ background: isFree ? 'rgba(34,197,94,0.06)' : 'rgba(14,165,233,0.06)', border: `1px solid ${isFree ? 'rgba(34,197,94,0.25)' : 'rgba(14,165,233,0.2)'}`, borderRadius:14, padding:'18px 24px', marginBottom:28, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>{isFree ? 'Free consultation' : '$99 consultation fee'}</div>
            <div style={{ fontSize:12, color:s.muted }}>
              {isFree
                ? "No payment, no card required. Please only book if you're seriously considering building something — slots are limited."
                : "You'll receive a payment link after booking to confirm your slot. Credited toward your build."}
            </div>
          </div>
          <div style={{ fontSize:22, fontWeight:800, color: isFree ? '#22c55e' : s.sky, fontFamily: 'var(--font-display)' }}>{isFree ? 'Free' : '$99'}</div>
        </div>

        {/* Cal.com embed — always visible */}
        <div style={{ marginBottom:44 }}>
          <div style={{ fontSize:18, fontWeight:700, fontFamily: 'var(--font-display)', marginBottom:6, textAlign:'center' }}>Pick a time</div>
          <div style={{ fontSize:13, color:s.muted, textAlign:'center', marginBottom:18 }}>Available 24/7 · Google Meet · Worldwide</div>
          <div style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${s.border}` }}>
            <iframe
              src={`${CAL_LINK}?embed=true&theme=dark`}
              style={{ width:'100%', height:'700px', border:'none' }}
              title="Book your WyberAi consultation"
            />
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginBottom:44 }}>
          <div style={{ fontSize:18, fontWeight:700, fontFamily: 'var(--font-display)', marginBottom:18, textAlign:'center' }}>How it works</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
            {STEPS.map(step => (
              <div key={step.n} style={{ background:s.card, border:`1px solid ${s.border}`, borderRadius:12, padding:18 }}>
                <div style={{ fontSize:22, marginBottom:8 }}>{step.icon}</div>
                <div style={{ fontSize:11, fontWeight:800, color:s.sky, letterSpacing:'0.1em', marginBottom:5 }}>{step.n}</div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:5, fontFamily: 'var(--font-display)' }}>{step.title}</div>
                <div style={{ fontSize:12, color:s.muted, lineHeight:1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery tiers */}
        <div style={{ marginBottom:44 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
            <div style={{ fontSize:18, fontWeight:700, fontFamily: 'var(--font-display)' }}>Delivery timelines</div>
            <Link href="/complexity-guide" style={{ fontSize:13, color:s.sky, textDecoration:'none', fontWeight:600 }}>Full complexity guide →</Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
            {TIERS.map(t => (
              <div key={t.name} style={{ background:s.card, border:`1px solid ${t.color}30`, borderRadius:12, padding:18, borderTop:`3px solid ${t.color}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:18 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:t.color, fontFamily: 'var(--font-display)' }}>{t.name}</div>
                    <div style={{ fontSize:11, color:s.muted }}>⏱ {t.delivery}</div>
                  </div>
                </div>
                <div style={{ fontSize:12, color:s.muted, lineHeight:1.6 }}>{t.examples}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom:44 }}>
          <div style={{ fontSize:18, fontWeight:700, fontFamily: 'var(--font-display)', marginBottom:18 }}>FAQ</div>
          {FAQ.map(({ q, a }) => (
            <div key={q} style={{ padding:'14px 0', borderBottom:`1px solid ${s.border}` }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:5 }}>{q}</div>
              <div style={{ fontSize:13, color:s.muted, lineHeight:1.7 }}>{a}</div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign:'center', padding:32, background:s.card, borderRadius:14, border:`1px solid ${s.border}` }}>
          <div style={{ fontSize:16, fontWeight:700, fontFamily: 'var(--font-display)', marginBottom:6 }}>Questions before booking?</div>
          <div style={{ fontSize:13, color:s.muted, marginBottom:16 }}>Email us — usually reply within a few hours.</div>
          <a href="mailto:hello@wyberai.com?subject=Build Session Enquiry" style={{ display:'inline-block', padding:'10px 22px', borderRadius:9, background:s.sky, color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>hello@wyberai.com →</a>
        </div>
      </div>

    </div>
  )

}
