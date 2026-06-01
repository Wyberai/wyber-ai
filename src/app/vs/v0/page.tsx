import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Wyber AI vs v0 by Vercel (2026) — Feature & Pricing Comparison',
  description: 'Honest comparison of Wyber AI and v0 by Vercel. Features, pricing, and who each tool is best for. Updated June 2026.',
  openGraph: { images: [{ url: 'https://wyberai.com/api/og?title=Wyber%20AI%20vs%20v0%20by%20Vercel&sub=Honest%20comparison%20%E2%80%94%20June%202026', width: 1200, height: 630 }] },
}

// All claims verified June 2026. Sources: v0.dev pricing page, wyberai.com/pricing
// v0 is primarily a UI/component generator — different category from Wyber AI.
const ROWS = [
  { feature: 'Primary use case',        wyber: 'Full-stack app builder', v0: 'UI / component generator',   winner: 'tie',   note: 'Very different tools — v0 generates React components' },
  { feature: 'Target user',             wyber: 'Non-technical founders', v0: 'Developers & designers',     winner: 'tie',   note: 'v0 output needs a developer to integrate' },
  { feature: 'Base price',              wyber: '$18.99/mo',              v0: '$20/mo (Pro)',               winner: 'wyber', note: 'v0 Pro at $20/mo' },
  { feature: 'Full-stack output',       wyber: '✓ Complete app',         v0: 'Frontend only',             winner: 'wyber', note: 'v0 generates UI components, not full applications' },
  { feature: 'Database provisioning',   wyber: '✓ Auto (Supabase)',      v0: '✗',                         winner: 'wyber', note: 'v0 does not provision databases' },
  { feature: 'Authentication',          wyber: '✓ Built-in',            v0: '✗ Manual integration',       winner: 'wyber', note: 'v0 UI components require dev to add auth' },
  { feature: 'One-click deploy',        wyber: '✓ Vercel',              v0: 'Via Vercel',                 winner: 'tie',   note: 'Both can deploy to Vercel' },
  { feature: 'GitHub sync',             wyber: '✓',                     v0: '✓',                         winner: 'tie',   note: 'Both integrate with GitHub' },
  { feature: 'Prebuilt app library',    wyber: '130+ at 0 cost',        v0: 'Component library',          winner: 'wyber', note: 'Different — v0 has component blocks, not full apps' },
  { feature: 'Credit estimate upfront', wyber: '✓',                     v0: '✗',                         winner: 'wyber', note: 'Wyber shows credit cost before generating' },
  { feature: 'Design system quality',   wyber: 'Good',                  v0: '✓ Excellent',               winner: 'v0',    note: 'v0 produces very high quality UI by Vercel design team' },
  { feature: 'Figma import',            wyber: 'Coming soon',           v0: '✓',                         winner: 'v0',    note: 'v0 can import from Figma' },
  { feature: 'Non-technical users',     wyber: '✓ Guided',              v0: 'Developer-focused',          winner: 'wyber', note: 'v0 output requires dev knowledge to use' },
  { feature: 'India/APAC pricing',      wyber: '✓ INR soon',            v0: 'USD only',                  winner: 'wyber', note: 'Local currency billing coming to Wyber AI' },
]

function WyberLogo({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
}

export default function VsV0() {
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
          <h1 style={{fontFamily:"'Sora', sans-serif",fontSize:'clamp(26px,4vw,44px)',fontWeight:800,letterSpacing:'-0.04em',marginBottom:12}}>Wyber AI vs v0 by Vercel</h1>
          <p style={{fontSize:14,color:s.muted,maxWidth:560,margin:'0 auto 8px'}}>v0 is a world-class UI component generator by the Vercel design team. Wyber AI is a full-stack app builder. They solve different problems.</p>
          <p style={{fontSize:11,color:'#52525b'}}>Verified June 2026 · Sources: v0.dev · <Link href="mailto:hello@wyberai.com" style={{color:'#52525b'}}>Report an error</Link></p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:32}}>
          {[{label:'Wyber AI wins',v:wyberWins,c:s.sky},{label:'v0 wins',v:v0Wins,c:'#a1a1aa'},{label:'Ties / depends',v:ties,c:'#52525b'}].map(({label,v,c})=>(
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
            <div style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'0.06em'}}>v0 by Vercel</div>
          </div>
          {ROWS.map((row,i)=>(
            <div key={row.feature} title={row.note} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderBottom:i<ROWS.length-1?`1px solid rgba(255,255,255,0.04)`:'none',background:row.winner==='wyber'?'rgba(14,165,233,0.03)':row.winner==='v0'?'rgba(255,255,255,0.02)':'transparent'}}>
              <div style={{padding:'11px 16px',fontSize:13,color:s.muted}}>{row.feature}</div>
              <div style={{padding:'11px 16px',fontSize:13,fontWeight:row.winner==='wyber'?700:400,color:row.winner==='wyber'?s.sky:s.text,display:'flex',alignItems:'center',gap:5}}>
                {row.winner==='wyber'&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={s.sky} strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                {row.wyber}
              </div>
              <div style={{padding:'11px 16px',fontSize:13,fontWeight:row.winner==='v0'?700:400,color:row.winner==='v0'?'#fafafa':s.muted,display:'flex',alignItems:'center',gap:5}}>
                {row.winner==='v0'&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                {row.v0}
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,color:'#52525b',textAlign:'center',marginBottom:40}}>v0 pricing changes frequently. Verify current plans at <a href="https://v0.dev" target="_blank" rel="noopener noreferrer" style={{color:'#52525b'}}>v0.dev</a>.</div>
        <div style={{textAlign:'center',padding:36,background:s.card,borderRadius:14,border:`1px solid ${s.border}`}}>
          <h2 style={{fontFamily:"'Sora', sans-serif",fontSize:22,fontWeight:800,marginBottom:8}}>Need a full app, not just UI components?</h2>
          <p style={{fontSize:14,color:s.muted,marginBottom:20}}>Wyber AI gives you auth, database, and deployment — not just the frontend.</p>
          <Link href="/signup" style={{display:'inline-block',padding:'12px 28px',borderRadius:10,background:s.sky,color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>Start building free →</Link>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
