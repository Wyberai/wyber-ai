'use client'
import Link from 'next/link'
import { useEffect } from 'react'

export default function SetupCallPage() {
  const s = { bg:'#09090b',card:'#111113',border:'rgba(255,255,255,0.08)',text:'#fafafa',muted:'#71717a',sky:'#0EA5E9' }

  const steps = [
    { n:'01', icon:'📞', title:'Book a 60-min consultation', desc:'Pick any time slot below — we\'re available 24/7. Pay the consultation fee to confirm your slot.' },
    { n:'02', icon:'💬', title:'We scope your app together', desc:'On the call, describe what you want to build. We ask the right questions, decide the complexity tier, and give you a firm quote and delivery date.' },
    { n:'03', icon:'🛠️', title:'We build it', desc:'You sit back. We build your app using Wyber AI and custom code. Simple apps in 24hrs, medium in 3 days, complex in 1 week.' },
    { n:'04', icon:'📦', title:'You receive everything', desc:'GitHub repo, live Vercel URL, and a walkthrough video. 7-day support window for any questions or small tweaks.' },
  ]

  const tiers = [
    { name:'Simple', delivery:'24 hrs', color:'#22c55e', icon:'⚡', examples:'Landing pages, single-tool apps, portfolios, static dashboards' },
    { name:'Medium', delivery:'3 working days', color:'#0EA5E9', icon:'🔧', examples:'SaaS MVPs, booking systems, CRMs, apps with login + database' },
    { name:'Complex', delivery:'1 week', color:'#8b5cf6', icon:'🏗️', examples:'Full SaaS with payments, multi-role apps, marketplace platforms' },
  ]

  const faq = [
    { q:'How much does the build cost?', a:'The consultation is $99. On the call, we quote the build based on complexity — roughly $199–299 for Simple, $399–599 for Medium, $799–1,199 for Complex. You only pay the build fee if you proceed.' },
    { q:'Is the consultation fee credited toward the build?', a:'Yes. If you proceed with a build, the $99 consultation fee is fully credited toward your total.' },
    { q:'What if I\'m not happy with the result?', a:'We include a 7-day support window post-delivery for tweaks and adjustments. We want you to be 100% happy with what you receive.' },
    { q:'What do I need to prepare before the call?', a:'Just a description of your idea — what it does, who it\'s for, and any examples of apps you like. No technical knowledge needed.' },
    { q:'Can you build with a specific tech stack?', a:'Our default is Next.js + Supabase + Vercel. We can accommodate React + Firebase or other stacks — just mention it when booking.' },
    { q:'What\'s the difference between Simple, Medium, and Complex?', a:'We have a full guide for this. The key signals are whether your app needs user accounts, a real database, payments, and how many screens it has.' },
  ]

  return (
    <div style={{minHeight:'100vh',background:s.bg,color:s.text,fontFamily:"'Space Grotesk', sans-serif"}}>
      <nav style={{padding:'0 clamp(16px,4vw,48px)',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${s.border}`,position:'sticky',top:0,zIndex:100,background:'rgba(9,9,11,0.95)',backdropFilter:'blur(16px)'}}>
        <Link href="/" style={{fontFamily:"'Sora', sans-serif",fontWeight:800,fontSize:14,textDecoration:'none',color:s.text,display:'flex',alignItems:'center',gap:8}}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
          Wyber AI
        </Link>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <Link href="/pricing" style={{fontSize:13,color:s.muted,textDecoration:'none'}}>← Pricing</Link>
          <Link href="/signup" style={{padding:'7px 16px',borderRadius:8,background:s.sky,color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>Start free →</Link>
        </div>
      </nav>

      <div style={{maxWidth:900,margin:'0 auto',padding:'clamp(40px,6vw,80px) clamp(16px,4vw,48px)'}}>

        {/* Hero */}
        <div style={{textAlign:'center',marginBottom:52}}>
          <div style={{display:'inline-block',padding:'4px 14px',borderRadius:20,background:'rgba(14,165,233,0.1)',border:'1px solid rgba(14,165,233,0.2)',fontSize:11,fontWeight:700,color:s.sky,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:16}}>Done-for-you builds</div>
          <h1 style={{fontFamily:"'Sora', sans-serif",fontSize:'clamp(28px,5vw,48px)',fontWeight:800,letterSpacing:'-0.04em',lineHeight:1.1,marginBottom:16}}>Tell us what you need.<br/>We build it for you.</h1>
          <p style={{fontSize:15,color:s.muted,maxWidth:500,margin:'0 auto 24px',lineHeight:1.75}}>Start with a 60-minute consultation. We scope your app together, agree on a price and timeline, then build and deliver it — no coding required on your end.</p>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:20,background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#22c55e'}}/>
            <span style={{fontSize:13,color:'#22c55e',fontWeight:600}}>Available 24/7 including weekends</span>
          </div>
        </div>

        {/* Consultation CTA */}
        <div style={{background:`linear-gradient(135deg, rgba(14,165,233,0.08), rgba(139,92,246,0.08))`,border:`1px solid rgba(14,165,233,0.25)`,borderRadius:16,padding:28,marginBottom:44,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:s.sky,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Start here</div>
            <div style={{fontFamily:"'Sora', sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>60-Minute Consultation</div>
            <div style={{fontSize:14,color:s.muted}}>Scope your app · Get a firm quote · Agree on delivery date</div>
            <div style={{fontSize:12,color:s.muted,marginTop:6}}>💳 Consultation fee credited toward your build if you proceed</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:38,fontWeight:800,fontFamily:"'Sora', sans-serif",color:s.sky}}>$99</div>
            <div style={{fontSize:12,color:s.muted}}>60 minutes · Google Meet</div>
          </div>
        </div>

        {/* How it works */}
        <div style={{marginBottom:44}}>
          <div style={{fontSize:18,fontWeight:700,fontFamily:"'Sora', sans-serif",marginBottom:20,textAlign:'center'}}>How it works</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
            {steps.map(step=>(
              <div key={step.n} style={{background:s.card,border:`1px solid ${s.border}`,borderRadius:12,padding:18}}>
                <div style={{fontSize:24,marginBottom:8}}>{step.icon}</div>
                <div style={{fontSize:11,fontWeight:800,color:s.sky,letterSpacing:'0.1em',marginBottom:6}}>{step.n}</div>
                <div style={{fontSize:13,fontWeight:700,marginBottom:6,fontFamily:"'Sora', sans-serif"}}>{step.title}</div>
                <div style={{fontSize:12,color:s.muted,lineHeight:1.65}}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery tiers */}
        <div style={{marginBottom:44}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
            <div style={{fontSize:18,fontWeight:700,fontFamily:"'Sora', sans-serif"}}>Delivery timelines</div>
            <Link href="/complexity-guide" style={{fontSize:13,color:s.sky,textDecoration:'none',fontWeight:600}}>See full complexity guide →</Link>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
            {tiers.map(tier=>(
              <div key={tier.name} style={{background:s.card,border:`1px solid ${tier.color}30`,borderRadius:12,padding:20,borderTop:`3px solid ${tier.color}`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <span style={{fontSize:20}}>{tier.icon}</span>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:tier.color,fontFamily:"'Sora', sans-serif"}}>{tier.name}</div>
                    <div style={{fontSize:11,color:s.muted}}>⏱ {tier.delivery}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:s.muted,lineHeight:1.6}}>{tier.examples}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendly embed */}
        <div style={{marginBottom:44}}>
          <div style={{fontSize:18,fontWeight:700,fontFamily:"'Sora', sans-serif",marginBottom:6,textAlign:'center'}}>Book your consultation</div>
          <div style={{fontSize:13,color:s.muted,textAlign:'center',marginBottom:20}}>All slots are 60 minutes · Google Meet · Available 24/7</div>
          <div style={{borderRadius:16,overflow:'hidden',border:`1px solid ${s.border}`}}>
            <div
              className="calendly-inline-widget"
              data-url="https://cal.com/wyberai/wyber-ai-build-consultation?embed=true&theme=dark"
              style={{minWidth:'320px',height:'700px'}}
            />
          </div>
        </div>

        {/* FAQ */}
        <div style={{marginBottom:44}}>
          <div style={{fontSize:18,fontWeight:700,fontFamily:"'Sora', sans-serif",marginBottom:20}}>FAQ</div>
          {faq.map(({q,a})=>(
            <div key={q} style={{padding:'16px 0',borderBottom:`1px solid ${s.border}`}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>{q}</div>
              <div style={{fontSize:13,color:s.muted,lineHeight:1.7}}>{a}</div>
            </div>
          ))}
        </div>

        <div style={{textAlign:'center',padding:36,background:s.card,borderRadius:14,border:`1px solid ${s.border}`}}>
          <div style={{fontSize:18,fontWeight:700,fontFamily:"'Sora', sans-serif",marginBottom:6}}>Have questions before booking?</div>
          <div style={{fontSize:13,color:s.muted,marginBottom:18}}>Email us and we'll respond within a few hours.</div>
          <a href="mailto:hello@wyberai.com?subject=Build Session Enquiry" style={{display:'inline-block',padding:'11px 24px',borderRadius:9,background:s.sky,color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>hello@wyberai.com →</a>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
