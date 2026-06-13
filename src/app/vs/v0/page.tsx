import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'Wyber AI vs v0 by Vercel (2026) — Honest Comparison',
  description: 'Honest comparison of Wyber AI and Bolt.new. Features, pricing, and who each tool is best for. Verified June 2026.',
}

const ROWS = [
  { feature: 'Primary use case',        wyber: 'Full-stack app builder', v0: 'UI / component generator', winner: 'tie'   },
  { feature: 'Base price',              wyber: '$18.99/mo',              v0: '$20/mo (Pro)',              winner: 'wyber' },
  { feature: 'Full-stack output',       wyber: '✓ Complete app',         v0: 'Frontend only',            winner: 'wyber' },
  { feature: 'Database provisioning',   wyber: '✓ Auto (Supabase)',      v0: '✗',                        winner: 'wyber' },
  { feature: 'Authentication',          wyber: '✓ Built-in',             v0: '✗ Manual integration',     winner: 'wyber' },
  { feature: 'One-click deploy',        wyber: '✓ Vercel',               v0: 'Via Vercel',               winner: 'tie'   },
  { feature: 'GitHub sync',             wyber: '✓',                      v0: '✓',                        winner: 'tie'   },
  { feature: 'Prebuilt app library',    wyber: '81+ at 0 cost',         v0: 'Component library',        winner: 'wyber' },
  { feature: 'Credit estimate upfront', wyber: '✓',                      v0: '✗',                        winner: 'wyber' },
  { feature: 'Design system quality',   wyber: 'Good',                   v0: '✓ Excellent',              winner: 'v0'    },
  { feature: 'Figma import',            wyber: 'Coming soon',            v0: '✓',                        winner: 'v0'    },
  { feature: 'Non-technical users',     wyber: '✓ Guided',               v0: 'Developer-focused',        winner: 'wyber' },
  { feature: 'India/APAC pricing',      wyber: '✓ INR soon',             v0: 'USD only',                 winner: 'wyber' },
]

const s = {bg:'#09090b',card:'#111113',border:'rgba(255,255,255,0.08)',text:'#fafafa',muted:'#71717a',sky:'#0EA5E9'}

export default function VsV0() {
  return (
    <div style={{minHeight:'100vh',background:s.bg,color:s.text,fontFamily:"'Space Grotesk', sans-serif"}}>
      <nav style={{padding:'0 clamp(16px,4vw,48px)',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${s.border}`,position:'sticky',top:0,zIndex:100,background:'rgba(9,9,11,0.9)',backdropFilter:'blur(16px)'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:9,textDecoration:'none',color:'inherit'}}><WyberLogo markSize={22} wordmarkSize={14} /></Link>
        <Link href="/signup" style={{padding:'7px 16px',borderRadius:8,background:s.sky,color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>Try free →</Link>
      </nav>
      <div style={{maxWidth:900,margin:'0 auto',padding:'clamp(40px,6vw,72px) clamp(16px,4vw,48px)'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:11,fontWeight:700,color:s.sky,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Comparison</div>
          <h1 style={{fontFamily:"'Sora', sans-serif",fontSize:'clamp(26px,4vw,44px)',fontWeight:800,letterSpacing:'-0.04em',marginBottom:12}}>Wyber AI vs v0 by Vercel</h1>
          <p style={{fontSize:14,color:s.muted,maxWidth:540,margin:'0 auto 8px'}}>v0 by Vercel generates beautiful UI components. Wyber AI builds full-stack apps with database, auth, and deployment. Wyber AI is built for non-technical founders who want more credits at a lower price.</p>
          <p style={{fontSize:11,color:'#52525b'}}>Verified June 2026 · <a href="https://v0.dev" target="_blank" rel="noopener noreferrer" style={{color:'#52525b'}}>v0.dev</a> · <Link href="mailto:hello@wyberai.com" style={{color:'#52525b'}}>Report an error</Link></p>
        </div>
        <div style={{background:s.card,border:`1px solid ${s.border}`,borderRadius:14,overflow:'hidden',marginBottom:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderBottom:`1px solid ${s.border}`}}>
            <div style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'0.06em'}}>Feature</div>
            <div style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:s.sky,textTransform:'uppercase',letterSpacing:'0.06em'}}>Wyber AI</div>
            <div style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'0.06em'}}>v0 by Vercel</div>
          </div>
          {ROWS.map((row,i)=>(
            <div key={row.feature} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderBottom:i<ROWS.length-1?`1px solid rgba(255,255,255,0.04)`:'none',background:row.winner==='wyber'?'rgba(14,165,233,0.03)':row.winner==='v0'?'rgba(255,255,255,0.02)':'transparent'}}>
              <div style={{padding:'11px 16px',fontSize:13,color:s.muted}}>{row.feature}</div>
              <div style={{padding:'11px 16px',fontSize:13,fontWeight:row.winner==='wyber'?700:400,color:row.winner==='wyber'?s.sky:s.text}}>{row.wyber}</div>
              <div style={{padding:'11px 16px',fontSize:13,fontWeight:row.winner==='v0'?700:400,color:row.winner==='v0'?'#fafafa':s.muted}}>{row.v0}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,color:'#52525b',textAlign:'center',marginBottom:40}}>Bolt uses a token-based model — some rows are approximate. Verify at <a href="https://v0.dev" target="_blank" rel="noopener noreferrer" style={{color:'#52525b'}}>v0.dev</a>.</div>
        <div style={{textAlign:'center',padding:36,background:s.card,borderRadius:14,border:`1px solid ${s.border}`}}>
          <h2 style={{fontFamily:"'Sora', sans-serif",fontSize:22,fontWeight:800,marginBottom:8}}>Try Wyber AI free</h2>
          <p style={{fontSize:14,color:s.muted,marginBottom:20}}>50 credits/month free, no card required. Build your first app in under 60 seconds.</p>
          <Link href="/signup" style={{display:'inline-block',padding:'12px 28px',borderRadius:10,background:s.sky,color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>Start building free →</Link>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
