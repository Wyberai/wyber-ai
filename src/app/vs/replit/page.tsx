import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Wyber AI vs Replit (2026) — Feature & Pricing Comparison',
  description: 'Honest comparison of Wyber AI and Replit. Features, pricing, and who each tool is best for. Updated June 2026.',
  openGraph: { images: [{ url: 'https://wyberai.com/api/og?title=Wyber%20AI%20vs%20Replit&sub=Honest%20comparison%20%E2%80%94%20June%202026', width: 1200, height: 630 }] },
}

// All claims verified June 2026. Sources: replit.com/pricing, wyberai.com/pricing
// Note: Replit is a full cloud IDE/AI builder — different product category from Wyber AI.
const ROWS = [
  { feature: 'Primary use case',        wyber: 'AI app builder',       replit: 'Cloud IDE + AI agent',      winner: 'tie',    note: 'Different tools for different users' },
  { feature: 'Target user',             wyber: 'Non-technical',        replit: 'Developers',                winner: 'tie',    note: 'Replit has a steep learning curve for non-devs' },
  { feature: 'Core/Pro price',          wyber: '$18.99/mo',            replit: '$20/mo (Core)',             winner: 'wyber',  note: 'Replit Core $20/mo billed annually' },
  { feature: 'Cost predictability',     wyber: 'Fixed credits',        replit: 'Usage-based overages',      winner: 'wyber',  note: 'Replit bills for compute, storage, AI on top of subscription' },
  { feature: 'Free tier',               wyber: '15 credits (no card)', replit: 'Free starter (limited)',    winner: 'tie',    note: 'Both have free tiers; Replit Agent trial expires' },
  { feature: 'Prebuilt app library',    wyber: '130+ at 0 cost',       replit: 'None',                     winner: 'wyber',  note: 'Wyber prebuilts load instantly at no credit cost' },
  { feature: 'Credit estimate upfront', wyber: '✓',                    replit: '✗ Effort-based billing',   winner: 'wyber',  note: 'Replit costs vary by complexity — hard to predict' },
  { feature: 'No-code friendly',        wyber: '✓ Guided',             replit: 'Limited — dev-focused',    winner: 'wyber',  note: 'Replit assumes coding knowledge' },
  { feature: 'Full cloud IDE',          wyber: '✗',                    replit: '✓',                        winner: 'replit', note: 'Replit is a complete browser-based IDE' },
  { feature: 'Real-time collaboration', wyber: 'Coming soon',          replit: '✓',                        winner: 'replit', note: 'Replit has built-in live collaboration' },
  { feature: 'GitHub sync',             wyber: '✓',                    replit: '✓',                        winner: 'tie',    note: 'Both support GitHub' },
  { feature: 'Custom domains',          wyber: '✓',                    replit: 'Core+',                    winner: 'wyber',  note: 'Custom domains on Replit require paid plan' },
  { feature: 'Persistent backend',      wyber: 'Via Supabase',         replit: '✓ Native',                 winner: 'replit', note: 'Replit has native persistent server environments' },
  { feature: 'Language support',        wyber: 'Web apps (JS)',        replit: '50+ languages',            winner: 'replit', note: 'Replit supports Python, Go, Rust, and more' },
  { feature: 'India/APAC pricing',      wyber: '✓ INR soon',           replit: 'USD only',                 winner: 'wyber',  note: 'Local currency billing coming to Wyber AI' },
]

function WyberLogo({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
}

export default function VsReplit() {
  const s = {bg:'#09090b',card:'#111113',border:'rgba(255,255,255,0.08)',text:'#fafafa',muted:'#71717a',sky:'#0EA5E9'}

  return (
    <div style={{minHeight:'100vh',background:s.bg,color:s.text,fontFamily:"'Space Grotesk', sans-serif"}}>
      <nav style={{padding:'0 clamp(16px,4vw,48px)',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${s.border}`,position:'sticky',top:0,zIndex:100,background:'rgba(9,9,11,0.9)',backdropFilter:'blur(16px)'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:9,textDecoration:'none',color:'inherit'}}><WyberLogo size={22}/><span style={{fontFamily:"'Sora', sans-serif",fontWeight:800,fontSize:14}}>Wyber AI</span></Link>
        <Link href="/signup" style={{padding:'7px 16px',borderRadius:8,background:s.sky,color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>Try free →</Link>
      </nav>
      <div style={{maxWidth:900,margin:'0 auto',padding:'clamp(40px,6vw,72px) clamp(16px,4vw,48px)'}}>
        <div style={{marginBottom:48,textAlign:'center'}}>
          <div style={{fontSize:11,fontWeight:700,color:s.sky,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Comparison</div>
          <h1 style={{fontFamily:"'Sora', sans-serif",fontSize:'clamp(26px,4vw,44px)',fontWeight:800,letterSpacing:'-0.04em',marginBottom:12}}>Wyber AI vs Replit</h1>
          <p style={{fontSize:14,color:s.muted,maxWidth:560,margin:'0 auto 8px'}}>Replit is a full cloud IDE with an AI agent — powerful for developers. Wyber AI is an AI app builder for non-technical founders. Different tools, different audiences.</p>
          <p style={{fontSize:11,color:'#52525b'}}>Verified June 2026 · Sources: replit.com/pricing · <Link href="mailto:hello@wyberai.com" style={{color:'#52525b'}}>Report an error</Link></p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:32}}>
          {[{label:'Wyber AI wins',v:wyberWins,c:s.sky},{label:'Replit wins',v:replitWins,c:'#a1a1aa'},{label:'Ties / depends',v:ties,c:'#52525b'}].map(({label,v,c})=>(
            <div key={label} style={{background:s.card,border:`1px solid ${s.border}`,borderRadius:12,padding:16,textAlign:'center'}}>
              <div style={{fontFamily:"'Sora', sans-serif",fontSize:32,fontWeight:800,color:c,margin:'4px 0'}}>{v}</div>
              <div style={{fontSize:12,color:s.muted}}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{background:s.card,border:`1px solid ${s.border}`,borderRadius:14,overflow:'hidden',marginBottom:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderBottom:`1px solid ${s.border}`}}>
            <div style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'0.06em'}}>Feature</div>
            <div style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:s.sky,textTransform:'uppercase',letterSpacing:'0.06em'}}>Wyber AI</div>
            <div style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'0.06em'}}>Replit</div>
          </div>
          {ROWS.map((row,i)=>(
            <div key={row.feature} title={row.note} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderBottom:i<ROWS.length-1?`1px solid rgba(255,255,255,0.04)`:'none',background:row.winner==='wyber'?'rgba(14,165,233,0.03)':row.winner==='replit'?'rgba(255,255,255,0.02)':'transparent'}}>
              <div style={{padding:'11px 16px',fontSize:13,color:s.muted}}>{row.feature}</div>
              <div style={{padding:'11px 16px',fontSize:13,fontWeight:row.winner==='wyber'?700:400,color:row.winner==='wyber'?s.sky:s.text,display:'flex',alignItems:'center',gap:5}}>
                {row.winner==='wyber'&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={s.sky} strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                {row.wyber}
              </div>
              <div style={{padding:'11px 16px',fontSize:13,fontWeight:row.winner==='replit'?700:400,color:row.winner==='replit'?'#fafafa':s.muted,display:'flex',alignItems:'center',gap:5}}>
                {row.winner==='replit'&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                {row.replit}
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,color:'#52525b',textAlign:'center',marginBottom:40}}>Replit's effort-based billing means actual costs vary. Verify at <a href="https://replit.com/pricing" target="_blank" rel="noopener noreferrer" style={{color:'#52525b'}}>replit.com/pricing</a>.</div>
        <div style={{textAlign:'center',padding:36,background:s.card,borderRadius:14,border:`1px solid ${s.border}`}}>
          <h2 style={{fontFamily:"'Sora', sans-serif",fontSize:22,fontWeight:800,marginBottom:8}}>Try Wyber AI free</h2>
          <p style={{fontSize:14,color:s.muted,marginBottom:20}}>If you're non-technical and want to build a web app without writing code — Wyber AI is built for you.</p>
          <Link href="/signup" style={{display:'inline-block',padding:'12px 28px',borderRadius:10,background:s.sky,color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>Start building free →</Link>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
