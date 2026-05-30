export const SAAS_LANDING: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap');
:root {
  --bg:#09090b;--surface:#111113;--elevated:#18181b;
  --border:rgba(255,255,255,0.07);--border-2:rgba(255,255,255,0.13);
  --text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;
  --accent:#0EA5E9;--accent-2:#0284C7;--accent-glow:rgba(14,165,233,0.2);
  --success:#22c55e;--r-sm:6px;--r:8px;--r-lg:12px;
  --shadow:0 1px 3px rgba(0,0,0,0.5);--shadow-lg:0 10px 40px rgba(0,0,0,0.6);
  font-family:'Space Grotesk',sans-serif;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
button{font-family:inherit;cursor:pointer}a{text-decoration:none;color:inherit}
.dot-grid{background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:24px 24px}
.gradient-text{font-family:'Sora',sans-serif;background:linear-gradient(135deg,#fff 0%,#38BDF8 60%,#0EA5E9 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}`,

'src/App.tsx': `import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import './index.css'
export default function App() {
  return <div style={{minHeight:'100vh',background:'var(--bg)'}}>
    <Navbar /><Hero /><Features /><Pricing /><Footer />
  </div>
}`,

'src/components/Navbar.tsx': `import { useState, useEffect } from 'react'
export default function Navbar() {
  const [scrolled,setScrolled]=useState(false)
  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>40);window.addEventListener('scroll',fn);return()=>window.removeEventListener('scroll',fn)},[])
  return <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:60,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(16px,4vw,48px)',background:scrolled?'rgba(9,9,11,0.9)':'transparent',backdropFilter:scrolled?'blur(20px)':'none',borderBottom:scrolled?'1px solid var(--border)':'1px solid transparent',transition:'all 0.3s'}}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{width:28,height:28,borderRadius:7,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <span style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:16,letterSpacing:'-0.04em'}}>YourBrand</span>
    </div>
    <div style={{display:'flex',gap:32}} className="hide-mobile">
      {['Features','Pricing','Docs','Blog'].map(l=><a key={l} href="#" style={{fontSize:14,color:'var(--text-2)',transition:'color 0.15s'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='var(--text)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='var(--text-2)'}>{l}</a>)}
    </div>
    <div style={{display:'flex',gap:10,alignItems:'center'}}>
      <a href="#" style={{fontSize:13,color:'var(--text-2)',padding:'6px 14px'}}>Sign in</a>
      <button style={{fontSize:13,fontWeight:600,padding:'8px 18px',borderRadius:'var(--r-sm)',background:'var(--accent)',color:'#fff',border:'none',boxShadow:'0 0 20px var(--accent-glow)',transition:'all 0.15s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--accent-2)';(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='var(--accent)';(e.currentTarget as HTMLElement).style.transform='none'}}>Get started free</button>
    </div>
    <style>{'.hide-mobile{display:flex}@media(max-width:768px){.hide-mobile{display:none}}'}</style>
  </nav>
}`,

'src/components/Hero.tsx': `import { useState, useEffect } from 'react'
const WORDS=['your product','any idea','your vision','your SaaS']
export default function Hero() {
  const [i,setI]=useState(0)
  useEffect(()=>{const t=setInterval(()=>setI(n=>(n+1)%WORDS.length),2000);return()=>clearInterval(t)},[])
  return <section className="dot-grid" style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 clamp(16px,4vw,48px)',textAlign:'center',position:'relative',paddingTop:80}}>
    <div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:400,background:'radial-gradient(ellipse,rgba(14,165,233,0.1) 0%,transparent 70%)',pointerEvents:'none'}}/>
    <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 14px',borderRadius:9999,border:'1px solid rgba(14,165,233,0.3)',background:'rgba(14,165,233,0.08)',fontSize:12,fontWeight:600,color:'#38BDF8',marginBottom:28,letterSpacing:'0.02em'}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',animation:'pulse 2s infinite'}}/>Now in public beta
    </div>
    <h1 className="gradient-text" style={{fontSize:'clamp(40px,6vw,72px)',fontWeight:800,letterSpacing:'-0.04em',lineHeight:1.0,marginBottom:4,maxWidth:800}}>Build {WORDS[i]}</h1>
    <h1 style={{fontFamily:'Sora,sans-serif',fontSize:'clamp(40px,6vw,72px)',fontWeight:800,letterSpacing:'-0.04em',lineHeight:1.0,marginBottom:24,color:'var(--text)'}}>in minutes, not months</h1>
    <p style={{fontSize:'clamp(16px,2vw,20px)',color:'var(--text-2)',maxWidth:540,lineHeight:1.65,marginBottom:36}}>The fastest way to go from idea to shipped product. No code required. Loved by 18,000+ founders.</p>
    <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:52}}>
      <button style={{fontSize:15,fontWeight:700,padding:'13px 28px',borderRadius:'var(--r-sm)',background:'var(--accent)',color:'#fff',border:'none',boxShadow:'0 4px 24px var(--accent-glow)',transition:'all 0.15s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--accent-2)';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='var(--accent)';(e.currentTarget as HTMLElement).style.transform='none'}}>Start for free — no card needed</button>
      <button style={{fontSize:15,fontWeight:500,padding:'13px 24px',borderRadius:'var(--r-sm)',border:'1px solid var(--border-2)',background:'transparent',color:'var(--text-2)',transition:'all 0.15s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLElement).style.color='var(--accent)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border-2)';(e.currentTarget as HTMLElement).style.color='var(--text-2)'}}>Watch demo ↗</button>
    </div>
    <div style={{display:'flex',gap:48,justifyContent:'center',flexWrap:'wrap'}}>
      {[['18,000+','Founders'],['4.9/5','Product Hunt'],['99.9%','Uptime'],['< 2min','Avg build time']].map(([n,l])=><div key={l} style={{textAlign:'center'}}>
        <div style={{fontFamily:'Sora,sans-serif',fontSize:28,fontWeight:800,letterSpacing:'-0.04em',color:'var(--text)'}}>{n}</div>
        <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{l}</div>
      </div>)}
    </div>
    <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}'}</style>
  </section>
}`,

'src/components/Features.tsx': `const FEATURES=[
  {icon:'⚡',title:'Ship in minutes',desc:'From idea to live product faster than writing a brief. Our AI writes production-ready code you actually own.',stat:'2 min avg',color:'#f59e0b'},
  {icon:'🔒',title:'Enterprise security',desc:'SOC 2 Type II certified. Your data never trains our models. Self-host on your own infrastructure.',stat:'SOC 2',color:'#0EA5E9'},
  {icon:'🔌',title:'35+ integrations',desc:'Stripe, Supabase, OpenAI, Resend, and more. Connect your entire stack in one click.',stat:'35+ connectors',color:'#10b981'},
  {icon:'📊',title:'Analytics built-in',desc:'User tracking, conversion funnels, and A/B testing built into every app from day one.',stat:'Real-time',color:'#8b5cf6'},
  {icon:'🚀',title:'One-click deploy',desc:'Deploy to Vercel, Netlify, or your own server. Custom domains included on all paid plans.',stat:'< 60 seconds',color:'#ef4444'},
  {icon:'🤝',title:'Team collaboration',desc:'Share your workspace, leave comments, and ship together. Built for teams of 1 to 1,000.',stat:'Unlimited seats',color:'#f97316'},
]
export default function Features() {
  return <section style={{padding:'clamp(60px,10vw,120px) clamp(16px,4vw,48px)',borderTop:'1px solid var(--border)'}}>
    <div style={{maxWidth:1100,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:52}}>
        <div style={{fontSize:11,fontWeight:700,color:'var(--accent)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Features</div>
        <h2 style={{fontFamily:'Sora,sans-serif',fontSize:'clamp(28px,4vw,48px)',fontWeight:800,letterSpacing:'-0.03em',marginBottom:14}}>Everything you need to ship</h2>
        <p style={{fontSize:17,color:'var(--text-2)',maxWidth:520,margin:'0 auto',lineHeight:1.65}}>Stop stitching together tools. One platform for the entire product lifecycle.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
        {FEATURES.map(f=><div key={f.title} style={{padding:'24px',borderRadius:'var(--r-lg)',border:'1px solid var(--border)',background:'var(--surface)',transition:'all 0.2s',cursor:'default'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=f.color+'50';(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLElement).style.boxShadow='var(--shadow-lg)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none'}}>
          <div style={{width:44,height:44,borderRadius:'var(--r)',background:f.color+'18',border:'1px solid '+f.color+'30',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:16}}>{f.icon}</div>
          <div style={{fontSize:16,fontWeight:700,letterSpacing:'-0.02em',marginBottom:8}}>{f.title}</div>
          <div style={{fontSize:14,color:'var(--text-2)',lineHeight:1.65,marginBottom:14}}>{f.desc}</div>
          <div style={{fontSize:12,fontWeight:700,color:f.color,background:f.color+'15',padding:'3px 10px',borderRadius:9999,display:'inline-block'}}>{f.stat}</div>
        </div>)}
      </div>
    </div>
  </section>
}`,

'src/components/Pricing.tsx': `import { useState } from 'react'
const PLANS=[
  {name:'Starter',price:{m:12,y:9},desc:'Perfect for solo founders',features:['5 projects','50 generations/mo','GitHub sync','Community support'],cta:'Get started',highlight:false},
  {name:'Pro',price:{m:39,y:29},desc:'For serious builders',features:['Unlimited projects','500 generations/mo','Custom domains','Priority support','Team members (5)'],cta:'Start Pro trial',highlight:true},
  {name:'Teams',price:{m:99,y:79},desc:'For growing companies',features:['Everything in Pro','Unlimited members','SSO & audit logs','SLA guarantee','Dedicated success manager'],cta:'Contact sales',highlight:false},
]
export default function Pricing() {
  const [annual,setAnnual]=useState(true)
  return <section style={{padding:'clamp(60px,10vw,120px) clamp(16px,4vw,48px)',borderTop:'1px solid var(--border)'}}>
    <div style={{maxWidth:960,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:48}}>
        <div style={{fontSize:11,fontWeight:700,color:'var(--accent)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Pricing</div>
        <h2 style={{fontFamily:'Sora,sans-serif',fontSize:'clamp(28px,4vw,48px)',fontWeight:800,letterSpacing:'-0.03em',marginBottom:14}}>Simple, transparent pricing</h2>
        <div style={{display:'inline-flex',alignItems:'center',gap:10,background:'var(--surface)',padding:'4px',borderRadius:'var(--r)',border:'1px solid var(--border)',marginTop:8}}>
          <button onClick={()=>setAnnual(false)} style={{padding:'6px 16px',borderRadius:6,border:'none',background:!annual?'var(--elevated)':'transparent',color:!annual?'var(--text)':'var(--text-2)',fontSize:13,fontWeight:500,transition:'all 0.15s'}}>Monthly</button>
          <button onClick={()=>setAnnual(true)} style={{padding:'6px 16px',borderRadius:6,border:'none',background:annual?'var(--elevated)':'transparent',color:annual?'var(--text)':'var(--text-2)',fontSize:13,fontWeight:500,transition:'all 0.15s'}}>Annual <span style={{color:'var(--success)',fontSize:11,fontWeight:700}}>-25%</span></button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
        {PLANS.map(p=><div key={p.name} style={{padding:'28px',borderRadius:'var(--r-lg)',border:'1px solid '+p.highlight?'var(--accent)':'var(--border)'+'',background:p.highlight?'rgba(14,165,233,0.04)':'var(--surface)',position:'relative'}}>
          {p.highlight&&<div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',fontSize:10,fontWeight:700,padding:'2px 12px',borderRadius:9999,background:'var(--accent)',color:'#fff',letterSpacing:'0.04em',textTransform:'uppercase',whiteSpace:'nowrap'}}>Most popular</div>}
          <div style={{fontSize:13,fontWeight:700,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{p.name}</div>
          <div style={{fontSize:42,fontWeight:800,letterSpacing:'-0.04em',marginBottom:4}}>{annual?p.price.y:p.price.m}<span style={{fontSize:14,fontWeight:400,color:'var(--text-2)'}}>/mo</span></div>
          <div style={{fontSize:13,color:'var(--text-2)',marginBottom:20}}>{p.desc}</div>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
            {p.features.map(f=><div key={f} style={{fontSize:13,display:'flex',gap:8,alignItems:'center'}}><span style={{color:'var(--success)',fontSize:11,fontWeight:700}}>✓</span>{f}</div>)}
          </div>
          <button style={{width:'100%',padding:'10px',borderRadius:'var(--r-sm)',background:p.highlight?'var(--accent)':'transparent',border:'1px solid '+p.highlight?'var(--accent)':'var(--border-2)'+'',color:p.highlight?'#fff':'var(--text)',fontSize:13,fontWeight:600,transition:'all 0.15s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.opacity='0.85'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.opacity='1'}}>{p.cta}</button>
        </div>)}
      </div>
    </div>
  </section>
}`,

'src/components/Footer.tsx': `export default function Footer() {
  const COLS=[
    {title:'Product',links:['Features','Pricing','Changelog','Roadmap']},
    {title:'Developers',links:['Documentation','API Reference','GitHub','Status']},
    {title:'Company',links:['About','Blog','Careers','Contact']},
  ]
  return <footer style={{borderTop:'1px solid var(--border)',padding:'clamp(32px,5vw,56px) clamp(16px,4vw,48px)'}}>
    <div style={{maxWidth:1100,margin:'0 auto'}}>
      <div style={{display:'grid',gridTemplateColumns:'1.5fr repeat(3,1fr)',gap:32,marginBottom:40}} className="footer-grid">
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <div style={{width:26,height:26,borderRadius:7,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <span style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:15,letterSpacing:'-0.04em'}}>YourBrand</span>
          </div>
          <p style={{fontSize:12,color:'var(--text-3)',lineHeight:1.65,maxWidth:200}}>Turn plain English into production-ready apps. Free to start.</p>
        </div>
        {COLS.map(col=><div key={col.title}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--text-3)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14}}>{col.title}</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {col.links.map(l=><a key={l} href="#" style={{fontSize:13,color:'var(--text-2)',transition:'color 0.15s'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='var(--text)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='var(--text-2)'}>{l}</a>)}
          </div>
        </div>)}
      </div>
      <div style={{borderTop:'1px solid var(--border)',paddingTop:20,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div style={{fontSize:12,color:'var(--text-3)'}}>© 2026 YourBrand. All rights reserved.</div>
        <div style={{display:'flex',gap:16}}>
          {['Privacy','Terms','Cookies'].map(l=><a key={l} href="#" style={{fontSize:12,color:'var(--text-3)',transition:'color 0.15s'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='var(--text-2)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='var(--text-3)'}>{l}</a>)}
        </div>
      </div>
    </div>
    <style>{'@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr !important}}'}</style>
  </footer>
}`,
}
