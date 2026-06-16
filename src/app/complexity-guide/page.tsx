import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'Simple vs Medium vs Complex Apps — WyberAi Build Guide',
  description: 'Understand what counts as a simple, medium, or complex app before booking a done-for-you build session with WyberAi.',
}

const TIERS = [
  {
    name: 'Simple',
    delivery: '24 hours',
    color: '#22c55e',
    icon: '⚡',
    desc: 'Single-purpose apps with no database, no auth, and 1–3 screens. Typically a landing page, tool, or static display.',
    examples: ['Landing page or coming soon page','Personal portfolio website','Single-tool app (calculator, converter, generator)','Static dashboard with hardcoded data','Email capture / waitlist page','Event or product launch page','Pricing or comparison page','Resume / profile page'],
    notIncluded: ['User login or accounts','Real database (data resets on refresh)','Payment processing','Email sending'],
  },
  {
    name: 'Medium',
    delivery: '3 working days',
    color: '#0EA5E9',
    icon: '🔧',
    desc: '3–6 screens with a real database, user authentication, and basic CRUD operations. A functioning MVP that real users can sign up for and use.',
    examples: ['SaaS MVP with 3–5 core features','Booking or appointment system','Simple CRM or contact manager','Project or task management tool','Invoice generator with client records','Membership site with login','Basic e-commerce store (products + cart)','Admin dashboard with data tables'],
    notIncluded: ['Multiple user roles (admin vs user)','Payment processing','Third-party API integrations','Real-time features (live chat, notifications)'],
  },
  {
    name: 'Complex',
    delivery: '1 week',
    color: '#8b5cf6',
    icon: '🏗️',
    desc: 'Full-featured products with multiple user roles, payments, integrations, and 6+ screens. Production-ready SaaS or internal tools.',
    examples: ['Full SaaS with subscription billing','Multi-role app (admin + user + guest)','Marketplace or multi-vendor platform','App with Stripe or Dodo Payments','Platform with email automation','App with third-party API integrations','Real-time features (notifications, live updates)','Multi-tenant app (each customer gets own workspace)'],
    notIncluded: ['Mobile apps (iOS/Android native)','AI/ML model training','Hardware integrations','Legacy system migrations'],
  },
]

const SIGNALS = [
  { q: 'Needs user accounts?', simple: '✗', medium: '✓', complex: '✓' },
  { q: 'Saves data permanently?', simple: '✗', medium: '✓', complex: '✓' },
  { q: 'Handles payments?', simple: '✗', medium: '✗', complex: '✓' },
  { q: 'Multiple user roles?', simple: '✗', medium: '✗', complex: '✓' },
  { q: 'Third-party integrations?', simple: '✗', medium: '✗', complex: '✓' },
  { q: 'Number of screens', simple: '1–2', medium: '3–6', complex: '6+' },
  { q: 'Delivery', simple: '24 hrs', medium: '3 days', complex: '1 week' },
]

export default function ComplexityGuidePage() {
  const s = { bg:'#09090b',card:'#111113',border:'rgba(255,255,255,0.08)',text:'#fafafa',muted:'#71717a',sky:'#0EA5E9' }
  return (
    <div style={{minHeight:'100vh',background:s.bg,color:s.text,fontFamily:"'Space Grotesk', sans-serif"}}>
      <nav style={{padding:'0 clamp(16px,4vw,48px)',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${s.border}`,position:'sticky',top:0,zIndex:100,background:'rgba(9,9,11,0.95)',backdropFilter:'blur(16px)'}}>
        <Link href="/" style={{fontFamily:"'Sora', sans-serif",fontWeight:800,fontSize:14,textDecoration:'none',color:s.text,display:'flex',alignItems:'center',gap:8}}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
        <Link href="/setup-call" style={{padding:'7px 16px',borderRadius:8,background:s.sky,color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>Book a session →</Link>
      </nav>
      <div style={{maxWidth:900,margin:'0 auto',padding:'clamp(40px,6vw,80px) clamp(16px,4vw,48px)'}}>
        <div style={{marginBottom:48}}>
          <div style={{fontSize:11,fontWeight:700,color:s.sky,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Build complexity guide</div>
          <h1 style={{fontFamily:"'Sora', sans-serif",fontSize:'clamp(28px,5vw,46px)',fontWeight:800,letterSpacing:'-0.04em',marginBottom:16,lineHeight:1.1}}>Simple, Medium, or Complex?</h1>
          <p style={{fontSize:15,color:s.muted,maxWidth:560,lineHeight:1.75}}>Use this to estimate your timeline before booking. Still unsure? Book a consultation — we'll scope it on the call and give you a firm quote and delivery date.</p>
        </div>

        {/* Quick table */}
        <div style={{background:s.card,border:`1px solid ${s.border}`,borderRadius:14,overflow:'hidden',marginBottom:44}}>
          <div style={{padding:'14px 20px',borderBottom:`1px solid ${s.border}`,fontSize:14,fontWeight:700}}>Quick reference</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${s.border}`}}>
              <th style={{padding:'10px 20px',textAlign:'left',fontSize:11,fontWeight:600,color:s.muted,textTransform:'uppercase'}}>Signal</th>
              {[['Simple ⚡','#22c55e'],['Medium 🔧','#0EA5E9'],['Complex 🏗️','#8b5cf6']].map(([h,c])=>(
                <th key={h} style={{padding:'10px 16px',textAlign:'center',fontSize:11,fontWeight:700,color:c,textTransform:'uppercase'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{SIGNALS.map((row,i)=>(
              <tr key={row.q} style={{borderBottom:`1px solid ${s.border}`,background:i%2===0?'rgba(255,255,255,0.01)':'transparent'}}>
                <td style={{padding:'12px 20px',fontSize:13}}>{row.q}</td>
                {[row.simple,row.medium,row.complex].map((val,j)=>(
                  <td key={j} style={{padding:'12px 16px',fontSize:13,textAlign:'center',fontWeight:600,color:val==='✗'?s.muted:val==='✓'?['#22c55e','#0EA5E9','#8b5cf6'][j]:s.text}}>{val}</td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>

        {/* Tiers */}
        <div style={{display:'flex',flexDirection:'column',gap:18,marginBottom:44}}>
          {TIERS.map(tier=>(
            <div key={tier.name} style={{background:s.card,border:`1px solid ${tier.color}30`,borderRadius:16,padding:28,borderLeft:`4px solid ${tier.color}`}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:10}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:26}}>{tier.icon}</span>
                  <div>
                    <div style={{fontFamily:"'Sora', sans-serif",fontSize:20,fontWeight:800,color:tier.color}}>{tier.name}</div>
                    <div style={{fontSize:12,color:s.muted}}>Delivered in {tier.delivery}</div>
                  </div>
                </div>
                <div style={{padding:'5px 14px',borderRadius:20,background:`${tier.color}15`,border:`1px solid ${tier.color}40`,fontSize:12,fontWeight:700,color:tier.color}}>⏱ {tier.delivery}</div>
              </div>
              <p style={{fontSize:14,color:s.muted,lineHeight:1.7,marginBottom:20}}>{tier.desc}</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:tier.color,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>✓ Included examples</div>
                  {tier.examples.map(ex=>(
                    <div key={ex} style={{display:'flex',gap:8,marginBottom:6}}>
                      <span style={{color:tier.color,fontSize:12,flexShrink:0}}>✓</span>
                      <span style={{fontSize:13,color:s.muted}}>{ex}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'#ef4444',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>✗ Not at this tier</div>
                  {tier.notIncluded.map(ex=>(
                    <div key={ex} style={{display:'flex',gap:8,marginBottom:6}}>
                      <span style={{color:'#ef4444',fontSize:12,flexShrink:0}}>✗</span>
                      <span style={{fontSize:13,color:s.muted}}>{ex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{textAlign:'center',padding:36,background:s.card,borderRadius:14,border:`1px solid ${s.border}`}}>
          <div style={{fontSize:20,fontWeight:700,fontFamily:"'Sora', sans-serif",marginBottom:8}}>Not sure which tier?</div>
          <div style={{fontSize:14,color:s.muted,marginBottom:20}}>That's what the consultation is for. Describe your idea, we scope it, you get a firm quote and timeline.</div>
          <Link href="/setup-call" style={{display:'inline-block',padding:'12px 28px',borderRadius:10,background:s.sky,color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>Book a consultation →</Link>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
