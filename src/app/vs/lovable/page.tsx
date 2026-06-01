import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Wyber AI vs Lovable (2026) — Feature & Pricing Comparison',
  description: 'Honest comparison of Wyber AI and Lovable. Features, pricing, credits, and differences. Updated June 2026.',
  openGraph: {
    images: [{ url: 'https://wyberai.com/api/og?title=Wyber%20AI%20vs%20Lovable&sub=Honest%20comparison%20%E2%80%94%20Updated%202026', width: 1200, height: 630 }],
  },
}

// All claims verified June 2026. Sources: lovable.dev/pricing, wyberai.com/pricing
// Update this file whenever competitor pricing changes.
const ROWS = [
  // Pricing
  { feature: 'Base Pro price',          wyber: '$18.99/mo',      lovable: '$25/mo',          winner: 'wyber',   note: 'Lovable Pro starts at $25/mo (100 credits)' },
  { feature: 'Annual discount',         wyber: '$15.99/mo',      lovable: '~$21/mo',         winner: 'wyber',   note: 'Both offer ~20% annual discount' },
  { feature: 'Monthly credits (base)',  wyber: '150',            lovable: '100',             winner: 'wyber',   note: 'Lovable lets you buy more credits per month' },
  { feature: 'Daily bonus credits',     wyber: '8/day (~240/mo)',lovable: '5/day (~150/mo)', winner: 'wyber',   note: 'Daily credits reset at midnight UTC' },
  { feature: 'Est. total credits/mo',   wyber: '~390',           lovable: '~250',            winner: 'wyber',   note: 'Base + daily credits combined' },
  { feature: 'Credit rollovers',        wyber: '✓',              lovable: '✓',               winner: 'tie',     note: 'Both platforms roll over unused credits' },
  { feature: 'Top-up credits',          wyber: 'All plans',      lovable: 'Pro+ only',       winner: 'wyber',   note: 'Free plan cannot buy top-ups on Lovable' },
  { feature: 'Top-up expiry',           wyber: 'Never',          lovable: '12 months',       winner: 'wyber',   note: 'Lovable top-ups valid 12 months from purchase' },
  // Features
  { feature: 'Credit estimate upfront', wyber: '✓',              lovable: '✗',               winner: 'wyber',   note: 'Wyber shows estimated credits before generating' },
  { feature: 'Prebuilt app library',    wyber: '130+ instant',   lovable: 'Templates',       winner: 'wyber',   note: 'Wyber prebuilts load at zero credits' },
  { feature: 'Visual click-to-edit',    wyber: '✓',              lovable: '✓',               winner: 'tie',     note: 'Both support visual element editing' },
  { feature: 'GitHub sync',             wyber: '✓',              lovable: '✓',               winner: 'tie',     note: 'Both support GitHub integration' },
  { feature: 'Supabase integration',    wyber: '✓ Auto',         lovable: '✓ Auto',          winner: 'tie',     note: 'Both auto-provision Supabase' },
  { feature: 'Vercel deployment',       wyber: '✓',              lovable: '✓',               winner: 'tie',     note: 'Both support Vercel deployment' },
  { feature: 'Custom domains',          wyber: '✓',              lovable: 'Pro+',            winner: 'wyber',   note: 'Custom domains require Pro on Lovable' },
  { feature: 'Export source code',      wyber: '✓ Always',       lovable: '✓',               winner: 'tie',     note: 'Both let you export your code' },
  { feature: 'Remove Lovable branding', wyber: 'N/A',            lovable: 'Pro+',            winner: 'tie',     note: 'Lovable branding removed on Pro+' },
  { feature: 'Real-time collaboration', wyber: 'Coming soon',    lovable: '✓',               winner: 'lovable', note: 'Lovable supports multi-user collaboration' },
  { feature: 'Student discount',        wyber: '✓ 50% off',      lovable: '✓ 50% off',       winner: 'tie',     note: 'Both offer student discounts' },
  { feature: 'India/APAC pricing',      wyber: '✓ INR soon',     lovable: 'USD only',        winner: 'wyber',   note: 'Local currency billing coming to Wyber AI' },
]

function WyberLogo({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
}

export default function VsLovable() {
  const wyberWins = ROWS.filter(r => r.winner === 'wyber').length
  const lovableWins = ROWS.filter(r => r.winner === 'lovable').length
  const ties = ROWS.filter(r => r.winner === 'tie').length
  const s = { bg:'#09090b',card:'#111113',border:'rgba(255,255,255,0.08)',text:'#fafafa',muted:'#71717a',sky:'#0EA5E9' }

  return (
    <div style={{minHeight:'100vh',background:s.bg,color:s.text,fontFamily:"'Space Grotesk', sans-serif"}}>
      <nav style={{padding:'0 clamp(16px,4vw,48px)',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${s.border}`,position:'sticky',top:0,zIndex:100,background:'rgba(9,9,11,0.9)',backdropFilter:'blur(16px)'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:9,textDecoration:'none',color:'inherit'}}><WyberLogo size={22}/><span style={{fontFamily:"'Sora', sans-serif",fontWeight:800,fontSize:14}}>Wyber AI</span></Link>
        <Link href="/signup" style={{padding:'7px 16px',borderRadius:8,background:s.sky,color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>Try free →</Link>
      </nav>

      <div style={{maxWidth:900,margin:'0 auto',padding:'clamp(40px,6vw,72px) clamp(16px,4vw,48px)'}}>
        <div style={{marginBottom:48,textAlign:'center'}}>
          <div style={{fontSize:11,fontWeight:700,color:s.sky,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Comparison</div>
          <h1 style={{fontFamily:"'Sora', sans-serif",fontSize:'clamp(26px,4vw,44px)',fontWeight:800,letterSpacing:'-0.04em',marginBottom:12}}>Wyber AI vs Lovable</h1>
          <p style={{fontSize:14,color:s.muted,maxWidth:560,margin:'0 auto 8px'}}>Both tools build full-stack apps from AI prompts. Here are the meaningful differences — no spin.</p>
          <p style={{fontSize:11,color:'#52525b'}}>Pricing verified June 2026 · Sources: lovable.dev, wyberai.com · <Link href="mailto:hello@wyberai.com" style={{color:'#52525b'}}>Report an error</Link></p>
        </div>

        {/* Score */}
        
        {/* Table */}
        <div style={{background:s.card,border:`1px solid ${s.border}`,borderRadius:14,overflow:'hidden',marginBottom:40}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderBottom:`1px solid ${s.border}`}}>
            <div style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'0.06em'}}>Feature</div>
            <div style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:s.sky,textTransform:'uppercase',letterSpacing:'0.06em'}}>Wyber AI</div>
            <div style={{padding:'12px 16px',fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'0.06em'}}>Lovable</div>
          </div>
          {ROWS.map((row,i)=>(
            <div key={row.feature} title={row.note} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderBottom:i<ROWS.length-1?`1px solid rgba(255,255,255,0.04)`:'none',background:row.winner==='wyber'?'rgba(14,165,233,0.03)':row.winner==='lovable'?'rgba(255,255,255,0.02)':'transparent'}}>
              <div style={{padding:'11px 16px',fontSize:13,color:s.muted}}>{row.feature}</div>
              <div style={{padding:'11px 16px',fontSize:13,fontWeight:row.winner==='wyber'?700:400,color:row.winner==='wyber'?s.sky:s.text,display:'flex',alignItems:'center',gap:5}}>
                {row.winner==='wyber'&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={s.sky} strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                {row.wyber}
              </div>
              <div style={{padding:'11px 16px',fontSize:13,fontWeight:row.winner==='lovable'?700:400,color:row.winner==='lovable'?'#fafafa':s.muted,display:'flex',alignItems:'center',gap:5}}>
                {row.winner==='lovable'&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                {row.lovable}
              </div>
            </div>
          ))}
        </div>

        <div style={{fontSize:11,color:'#52525b',textAlign:'center',marginBottom:40}}>Hover any row to see source notes. All competitor data sourced from public pricing pages. Accuracy not guaranteed — verify at <a href="https://lovable.dev/pricing" target="_blank" rel="noopener noreferrer" style={{color:'#52525b'}}>lovable.dev/pricing</a>.</div>

        <div style={{textAlign:'center',padding:36,background:s.card,borderRadius:14,border:`1px solid ${s.border}`}}>
          <h2 style={{fontFamily:"'Sora', sans-serif",fontSize:22,fontWeight:800,marginBottom:8}}>Try Wyber AI free</h2>
          <p style={{fontSize:14,color:s.muted,marginBottom:20}}>15 credits, no card required. Import your Lovable projects or start fresh.</p>
          <Link href="/signup" style={{display:'inline-block',padding:'12px 28px',borderRadius:10,background:s.sky,color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>Start building free →</Link>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
