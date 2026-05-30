export const PORTFOLIO: Record<string, string> = {
'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
:root{--bg:#09090b;--surface:#111113;--elevated:#18181b;--border:rgba(255,255,255,0.07);--text:#fafafa;--text-2:#a1a1aa;--text-3:#52525b;--accent:#0EA5E9;--r:8px;--r-lg:12px;font-family:'Space Grotesk',sans-serif}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{min-height:100%}
body{background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}button{font-family:inherit;cursor:pointer}a{color:inherit;text-decoration:none}
.dot-grid{background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:24px 24px}`,
'src/App.tsx': `import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Contact from './components/Contact'
import './index.css'
export default function App(){
  return <div style={{minHeight:'100vh',background:'var(--bg)'}}>
    <Navbar/><Hero/><Skills/><Projects/><Experience/><Contact/>
  </div>
}`,
'src/components/Navbar.tsx': `const LINKS=['About','Skills','Projects','Experience','Contact']
export default function Navbar(){
  const scroll=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'})
  return <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:56,background:'rgba(9,9,11,0.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(16px,5vw,80px)'}}>
    <span style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:16,letterSpacing:'-0.04em'}}>Alex<span style={{color:'var(--accent)'}}>.</span></span>
    <div style={{display:'flex',gap:24}} className="hide-mobile">
      {LINKS.map(l=><button key={l} onClick={()=>scroll(l.toLowerCase())} style={{background:'none',border:'none',color:'var(--text-2)',fontSize:13,fontWeight:500,cursor:'pointer',transition:'color 0.15s'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='var(--text)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='var(--text-2)'}>{l}</button>)}
    </div>
    <a href="mailto:hello@alexdev.io" style={{padding:'6px 16px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',color:'var(--text)',fontSize:12,fontWeight:600,transition:'all 0.15s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLElement).style.color='var(--accent)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.color='var(--text)'}}>Hire me</a>
    <style>{'.hide-mobile{display:flex}@media(max-width:768px){.hide-mobile{display:none}}'}</style>
  </nav>
}`,
'src/components/Hero.tsx': `import { useState, useEffect } from 'react'
const ROLES=['Full-Stack Developer','React Engineer','UI/UX Enthusiast','Open Source Contributor']
export default function Hero(){
  const [i,setI]=useState(0)
  useEffect(()=>{const t=setInterval(()=>setI(n=>(n+1)%ROLES.length),2500);return()=>clearInterval(t)},[])
  return <section id="about" className="dot-grid" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'80px clamp(16px,5vw,80px) 60px',textAlign:'center'}}>
    <div style={{position:'absolute',top:'45%',left:'50%',transform:'translate(-50%,-50%)',width:500,height:300,background:'radial-gradient(ellipse,rgba(14,165,233,0.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
    <div>
      <div style={{width:88,height:88,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#8b5cf6)',margin:'0 auto 20px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,border:'3px solid rgba(14,165,233,0.3)'}}>👨‍💻</div>
      <div style={{fontSize:13,fontWeight:600,color:'var(--accent)',marginBottom:12,letterSpacing:'0.06em',textTransform:'uppercase'}}>Available for work</div>
      <h1 style={{fontFamily:'Sora,sans-serif',fontSize:'clamp(36px,6vw,64px)',fontWeight:800,letterSpacing:'-0.04em',marginBottom:8}}>Hi, I\'m Alex Rodriguez</h1>
      <h2 style={{fontFamily:'Sora,sans-serif',fontSize:'clamp(20px,3vw,32px)',fontWeight:700,color:'var(--accent)',marginBottom:20,minHeight:40}}>{ROLES[i]}</h2>
      <p style={{fontSize:'clamp(15px,1.5vw,18px)',color:'var(--text-2)',maxWidth:540,margin:'0 auto 32px',lineHeight:1.7}}>I build fast, beautiful, accessible web applications. 5+ years shipping products used by 200k+ users.</p>
      <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
        <button onClick={()=>document.getElementById('projects')?.scrollIntoView({behavior:'smooth'})} style={{padding:'11px 24px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:700,boxShadow:'0 4px 20px rgba(14,165,233,0.3)',transition:'all 0.15s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none'}}>View my work</button>
        <a href="/resume.pdf" style={{padding:'11px 24px',borderRadius:'var(--r)',border:'1px solid var(--border)',color:'var(--text-2)',fontSize:14,fontWeight:600,transition:'all 0.15s',display:'inline-flex',alignItems:'center',gap:6}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLElement).style.color='var(--accent)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.color='var(--text-2)'}}>Download CV ↓</a>
      </div>
      <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:24}}>
        {[['GitHub','⌥'],['LinkedIn','in'],['Twitter','𝕏'],['Dribbble','🏀']].map(([l,i])=><button key={l} style={{width:38,height:38,borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text-2)',fontSize:12,fontWeight:700,transition:'all 0.15s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLElement).style.color='var(--accent)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.color='var(--text-2)'}} title={l}>{i}</button>)}
      </div>
    </div>
  </section>
}`,
'src/components/Skills.tsx': `const SKILLS=[
  {cat:'Frontend',items:['React','TypeScript','Next.js','Tailwind','Vite','Redux']},
  {cat:'Backend',items:['Node.js','Python','Fastify','PostgreSQL','Redis','Prisma']},
  {cat:'Cloud & DevOps',items:['AWS','Vercel','Docker','GitHub Actions','Supabase','Cloudflare']},
  {cat:'Design',items:['Figma','Framer','Storybook','Radix UI','shadcn/ui','Lucide']},
]
export default function Skills(){
  return <section id="skills" style={{padding:'80px clamp(16px,5vw,80px)',borderTop:'1px solid var(--border)'}}>
    <div style={{maxWidth:900,margin:'0 auto'}}>
      <h2 style={{fontFamily:'Sora,sans-serif',fontSize:32,fontWeight:800,letterSpacing:'-0.03em',textAlign:'center',marginBottom:40}}>Tech Stack</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
        {SKILLS.map(s=><div key={s.cat} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:18}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12}}>{s.cat}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {s.items.map(i=><span key={i} style={{fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:6,background:'var(--elevated)',color:'var(--text-2)',border:'1px solid var(--border)',transition:'all 0.15s',cursor:'default'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLElement).style.color='var(--accent)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.color='var(--text-2)'}}>{i}</span>)}
          </div>
        </div>)}
      </div>
    </div>
  </section>
}`,
'src/components/Projects.tsx': `const PROJECTS=[
  {name:'FinanceFlow',desc:'Real-time personal finance tracker with AI categorization, budget alerts, and multi-bank sync. Used by 18k+ users.',stack:['React','Node.js','Plaid API','PostgreSQL'],stars:847,live:'financeflow.app',color:'#10b981',emoji:'💰'},
  {name:'DevBoard',desc:'Developer dashboard aggregating GitHub PRs, Jira tickets, Slack messages, and CI/CD pipelines in one view.',stack:['Next.js','TypeScript','GitHub API','Redis'],stars:1203,live:'devboard.io',color:'#0EA5E9',emoji:'🔧'},
  {name:'DesignSystem',desc:'Open-source React component library with 80+ components, dark mode, and full accessibility support.',stack:['React','Storybook','Radix UI','CSS-in-JS'],stars:2891,live:'ds.alexdev.io',color:'#8b5cf6',emoji:'🎨'},
  {name:'ShipFast',desc:'Boilerplate for SaaS products with auth, billing, email, and analytics pre-configured and ready to deploy.',stack:['Next.js','Supabase','Stripe','Resend'],stars:634,live:'shipfast.dev',color:'#f59e0b',emoji:'🚀'},
]
export default function Projects(){
  return <section id="projects" style={{padding:'80px clamp(16px,5vw,80px)',borderTop:'1px solid var(--border)'}}>
    <div style={{maxWidth:900,margin:'0 auto'}}>
      <h2 style={{fontFamily:'Sora,sans-serif',fontSize:32,fontWeight:800,letterSpacing:'-0.03em',textAlign:'center',marginBottom:8}}>Selected Work</h2>
      <p style={{textAlign:'center',color:'var(--text-2)',marginBottom:36,fontSize:15}}>Projects I\'ve built and shipped to real users.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(380px,1fr))',gap:16}}>
        {PROJECTS.map(p=><div key={p.name} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden',transition:'all 0.2s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=p.color+'60';(e.currentTarget as HTMLElement).style.transform='translateY(-3px)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.transform='none'}}>
          <div style={{height:120,background:p.color+'12',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,borderBottom:'1px solid var(--border)'}}>{p.emoji}</div>
          <div style={{padding:18}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <h3 style={{fontSize:16,fontWeight:700,letterSpacing:'-0.02em'}}>{p.name}</h3>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <span style={{fontSize:11,color:'var(--text-3)'}}>⭐ {p.stars.toLocaleString()}</span>
              </div>
            </div>
            <p style={{fontSize:13,color:'var(--text-2)',lineHeight:1.6,marginBottom:12}}>{p.desc}</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:12}}>
              {p.stack.map(t=><span key={t} style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:p.color+'18',color:p.color}}>{t}</span>)}
            </div>
            <div style={{display:'flex',gap:8}}>
              <a href={'https://'+p.live} style={{flex:1,textAlign:'center',padding:'7px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:12,fontWeight:600}}>Live Demo ↗</a>
              <button style={{flex:1,padding:'7px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'transparent',color:'var(--text)',fontSize:12}}>Source Code</button>
            </div>
          </div>
        </div>)}
      </div>
    </div>
  </section>
}`,
'src/components/Experience.tsx': `const JOBS=[
  {company:'Vercel',role:'Senior Software Engineer',period:'2023 — Present',desc:'Building the Next.js ecosystem and developer experience tools used by 1M+ developers worldwide.',tags:['Next.js','TypeScript','Edge Runtime']},
  {company:'Stripe',role:'Frontend Engineer',period:'2021 — 2023',desc:'Redesigned the Stripe Dashboard, reducing page load by 40% and improving developer onboarding.',tags:['React','CSS','Performance']},
  {company:'Figma',role:'UI Engineer (Contract)',period:'2020 — 2021',desc:'Built plugin marketplace and developer tools. Wrote documentation used by 200k+ plugin developers.',tags:['TypeScript','WebGL','APIs']},
]
export default function Experience(){
  return <section id="experience" style={{padding:'80px clamp(16px,5vw,80px)',borderTop:'1px solid var(--border)'}}>
    <div style={{maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontFamily:'Sora,sans-serif',fontSize:32,fontWeight:800,letterSpacing:'-0.03em',textAlign:'center',marginBottom:36}}>Experience</h2>
      <div style={{display:'flex',flexDirection:'column',gap:0}}>
        {JOBS.map((j,i)=><div key={j.company} style={{display:'flex',gap:20}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{width:12,height:12,borderRadius:'50%',background:'var(--accent)',flexShrink:0,marginTop:4}}/>
            {i<JOBS.length-1&&<div style={{width:2,flex:1,background:'var(--border)',margin:'6px 0'}}/>}
          </div>
          <div style={{paddingBottom:28}}>
            <div style={{display:'flex',gap:8,alignItems:'baseline',flexWrap:'wrap',marginBottom:2}}>
              <span style={{fontSize:15,fontWeight:700}}>{j.role}</span>
              <span style={{fontSize:13,color:'var(--accent)',fontWeight:600}}>@ {j.company}</span>
            </div>
            <div style={{fontSize:12,color:'var(--text-3)',marginBottom:8}}>{j.period}</div>
            <p style={{fontSize:13,color:'var(--text-2)',lineHeight:1.65,marginBottom:10}}>{j.desc}</p>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {j.tags.map(t=><span key={t} style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:4,background:'rgba(14,165,233,0.1)',color:'var(--accent)'}}>{t}</span>)}
            </div>
          </div>
        </div>)}
      </div>
    </div>
  </section>
}`,
'src/components/Contact.tsx': `import { useState } from 'react'
export default function Contact(){
  const [sent,setSent]=useState(false)
  return <section id="contact" style={{padding:'80px clamp(16px,5vw,80px)',borderTop:'1px solid var(--border)'}}>
    <div style={{maxWidth:560,margin:'0 auto',textAlign:'center'}}>
      <h2 style={{fontFamily:'Sora,sans-serif',fontSize:32,fontWeight:800,letterSpacing:'-0.03em',marginBottom:8}}>Let\'s work together</h2>
      <p style={{color:'var(--text-2)',marginBottom:32,fontSize:15,lineHeight:1.6}}>I\'m open to freelance projects, full-time roles, and interesting collaborations. Let\'s build something great.</p>
      {sent?<div style={{padding:24,borderRadius:'var(--r-lg)',border:'1px solid rgba(34,197,94,0.3)',background:'rgba(34,197,94,0.05)',color:'#22c55e',fontSize:14,fontWeight:600}}>Message sent! I\'ll reply within 24 hours 🎉</div>:<div style={{display:'flex',flexDirection:'column',gap:10,textAlign:'left'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <input placeholder="Your name" style={{padding:'10px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13,outline:'none',fontFamily:'inherit'}} onFocus={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--accent)'} onBlur={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--border)'}/>
          <input placeholder="Email address" style={{padding:'10px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13,outline:'none',fontFamily:'inherit'}} onFocus={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--accent)'} onBlur={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--border)'}/>
        </div>
        <input placeholder="Subject" style={{padding:'10px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13,outline:'none',fontFamily:'inherit'}} onFocus={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--accent)'} onBlur={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--border)'}/>
        <textarea placeholder="Tell me about your project..." rows={4} style={{padding:'10px 12px',borderRadius:'var(--r)',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13,outline:'none',resize:'none',fontFamily:'inherit'}} onFocus={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--accent)'} onBlur={e=>(e.currentTarget as HTMLElement).style.borderColor='var(--border)'}/>
        <button onClick={()=>setSent(true)} style={{padding:'12px',borderRadius:'var(--r)',border:'none',background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:700,boxShadow:'0 4px 20px rgba(14,165,233,0.3)',transition:'all 0.15s'}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='none'}>Send message →</button>
      </div>}
    </div>
  </section>
}`,
}
