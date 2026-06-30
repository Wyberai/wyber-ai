import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'Pay for your WyberAi Build',
  description: 'Complete payment for your WyberAi app build.',
  robots: 'noindex',
}

const BUILDS = [
  {
    name: 'Simple Build',
    price: '$199',
    delivery: '24 hours',
    color: '#22c55e',
    icon: '⚡',
    link: 'https://checkout.dodopayments.com/buy/pdt_0Ng4nveFV1qZ31hP5cR2d',
    includes: ['Landing pages, portfolios, tools','No auth or database required','GitHub repo + Vercel deploy','7-day support window'],
  },
  {
    name: 'Medium Build',
    price: '$399',
    delivery: '3 working days',
    color: '#0EA5E9',
    icon: '🔧',
    badge: 'Most common',
    link: 'https://checkout.dodopayments.com/buy/pdt_0Ng4o4Slt7VZfJr1AS2mb',
    includes: ['SaaS MVPs with auth + database','3–6 screens, real user accounts','GitHub repo + Vercel deploy','14-day support window'],
  },
  {
    name: 'Complex Build',
    price: '$799',
    delivery: '1 week',
    color: '#8b5cf6',
    icon: '🏗️',
    link: 'https://checkout.dodopayments.com/buy/pdt_0Ng4oEF3oofJnrbHmuuDO',
    includes: ['Full SaaS with payments + multi-roles','6+ screens, third-party integrations','GitHub repo + Vercel deploy','30-day support window'],
  },
]

export default function PayPage() {
  const s = { bg:'#09090b', card:'#111113', border:'rgba(255,255,255,0.08)', text:'#fafafa', muted:'#71717a', sky:'#0EA5E9' }

  return (
    <div style={{ minHeight:'100vh', background:s.bg, color:s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding:'0 clamp(16px,4vw,48px)', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${s.border}`, background:'rgba(9,9,11,0.95)', backdropFilter:'blur(16px)' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight:800, fontSize:14, textDecoration:'none', color:s.text, display:'flex', alignItems:'center', gap:8 }}>
          <WyberLogo markSize={22} wordmarkSize={14} />
        </Link>
      </nav>

      <div style={{ maxWidth:800, margin:'0 auto', padding:'clamp(40px,6vw,72px) clamp(16px,4vw,48px)' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize:'clamp(26px,4vw,38px)', fontWeight:800, letterSpacing:'-0.04em', marginBottom:10 }}>Complete your build payment</h1>
          <p style={{ fontSize:14, color:s.muted }}>Select the tier we agreed on during your consultation. Your $99 consultation fee has been credited.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:16, marginBottom:40 }}>
          {BUILDS.map(b => (
            <div key={b.name} style={{ background:s.card, border:`1px solid ${b.badge ? b.color+'50' : s.border}`, borderRadius:16, padding:24, display:'flex', flexDirection:'column', position:'relative', borderTop:`3px solid ${b.color}` }}>
              {b.badge && (
                <div style={{ position:'absolute', top:-11, right:16, padding:'2px 10px', borderRadius:20, background:b.color, color:'#fff', fontSize:10, fontWeight:700 }}>{b.badge}</div>
              )}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:22 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:b.color, fontFamily: 'var(--font-display)' }}>{b.name}</div>
                    <div style={{ fontSize:11, color:s.muted }}>⏱ {b.delivery}</div>
                  </div>
                </div>
                <div style={{ fontSize:32, fontWeight:800, fontFamily: 'var(--font-display)', marginBottom:4 }}>{b.price}</div>
              </div>
              <div style={{ flex:1, marginBottom:18 }}>
                {b.includes.map(item => (
                  <div key={item} style={{ display:'flex', gap:7, marginBottom:6 }}>
                    <span style={{ color:b.color, fontSize:12, flexShrink:0 }}>✓</span>
                    <span style={{ fontSize:12, color:s.muted }}>{item}</span>
                  </div>
                ))}
              </div>
              <a href={b.link} style={{ display:'block', padding:'12px', borderRadius:9, background:b.badge ? b.color : 'transparent', border:`1px solid ${b.color}`, color:b.badge ? '#fff' : b.color, fontSize:13, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
                Pay {b.price} →
              </a>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', fontSize:13, color:s.muted, padding:'20px', background:s.card, borderRadius:12, border:`1px solid ${s.border}` }}>
          Not sure which tier applies to your project? <Link href="/complexity-guide" style={{ color:s.sky, textDecoration:'none', fontWeight:600 }}>See the complexity guide →</Link>
          <br/><br/>
          Wrong tier or have a question? <a href="mailto:hello@wyberai.com" style={{ color:s.sky, textDecoration:'none', fontWeight:600 }}>Email us →</a>
        </div>
      </div>

    </div>
  )
}
