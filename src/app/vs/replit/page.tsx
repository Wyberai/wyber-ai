import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Wyber AI vs Replit — Honest Comparison 2026',
  description: 'Wyber AI vs Replit: full feature comparison, pricing, and credits. 50% more credits at 75% of the price. Updated May 2026.',
  openGraph: {
    title: 'Wyber AI vs Replit — Which is better?',
    description: 'Honest comparison: features, pricing, credits. Updated May 2026.',
    images: [{ url: 'https://wyberai.com/api/og?title=Wyber%20AI%20vs%20Replit&sub=Honest%20comparison%20%E2%80%94%20Updated%202026', width: 1200, height: 630 }],
  },
}

function WyberLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  )
}

const ROWS = [
  ['Starting price',         '$18.99/mo',     '$25/mo',         'wyber'],
  ['Annual price',           '$15.99/mo',     '$20/mo',         'wyber'],
  ['Monthly credits',        '150',           '~100',           'wyber'],
  ['Daily bonus credits',    '8/day',         'None',           'wyber'],
  ['Max credits/month',      '~390',          '~300',           'wyber'],
  ['Credit estimate upfront','✓ Unique',      '✗',              'wyber'],
  ['Credits never expire',   '✓ Top-ups',     '✗',              'wyber'],
  ['Prebuilt app library',   '60+ instant',   'Templates',      'wyber'],
  ['Deploy to Vercel',       '✓',             '✓',              'tie'],
  ['Deploy to Netlify',      'Coming soon',   '✓',              'replit'],
  ['GitHub sync',            '✓',             '✓',              'tie'],
  ['Custom domains',         '✓',             'Limited',        'wyber'],
  ['Supabase auto-provision','✓ One click',   'Manual',         'wyber'],
  ['Visual click-to-edit',   '✓',             '✗',              'wyber'],
  ['WebContainer runtime',   '✗',             '✓ In-browser',   'replit'],
  ['AI model',               'Claude Sonnet', 'Multiple',       'tie'],
  ['India/APAC pricing',     '✓ INR soon',    'USD only',       'wyber'],
]

export default function VSReplitPage() {
  const wyberWins = ROWS.filter(r => r[3] === 'wyber').length
  const replitWins = ROWS.filter(r => r[3] === 'replit').length
  const ties = ROWS.filter(r => r[3] === 'tie').length
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo size={24} /><span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14 }}>Wyber AI</span></Link>
        <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Try free →</Link>
      </nav>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Honest comparison · Updated May 2026</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14, lineHeight: 1.1 }}>Wyber AI vs Replit</h1>
          <p style={{ fontSize: 16, color: '#71717a', maxWidth: 500, margin: '0 auto' }}>Replit is a full cloud IDE with persistent environments, real backend, and AI assistance. Wyber AI is the simpler, more affordable alternative for non-technical builders. Wyber AI is the affordable, non-technical-first alternative with more credits and a lower price.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, marginBottom: 40, alignItems: 'center' }}>
          <div style={{ padding: 20, borderRadius: 14, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', textAlign: 'center' }}>
            <WyberLogo size={32} />
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, color: '#0EA5E9', margin: '8px 0 2px' }}>{wyberWins}</div>
            <div style={{ fontSize: 12, color: '#71717a' }}>categories won</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: '#52525b', fontWeight: 600 }}>{ties} tied</div>
          <div style={{ padding: 20, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, color: '#a1a1aa', margin: '0 0 2px' }}>{replitWins}</div>
            <div style={{ fontSize: 12, color: '#71717a' }}>categories won</div>
          </div>
        </div>
        <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#111113', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['Feature', 'Wyber AI', 'Replit'].map((h, i) => <div key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: i === 1 ? '#0EA5E9' : '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>)}
          </div>
          {ROWS.map((row, i) => (
            <div key={row[0]} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: i < ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: row[3] === 'wyber' ? 'rgba(14,165,233,0.03)' : 'transparent' }}>
              <div style={{ padding: '12px 16px', fontSize: 13, color: '#a1a1aa' }}>{row[0]}</div>
              <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: row[3] === 'wyber' ? 700 : 400, color: row[3] === 'wyber' ? '#0EA5E9' : '#fafafa', display: 'flex', alignItems: 'center', gap: 5 }}>
                {row[3] === 'wyber' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                {row[1]}
              </div>
              <div style={{ padding: '12px 16px', fontSize: 13, color: row[3] === 'replit' ? '#fafafa' : '#52525b' }}>{row[2]}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 16, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>Try Wyber AI free</h2>
          <p style={{ fontSize: 14, color: '#71717a', marginBottom: 24 }}>15 free credits. No credit card. Deploy your first app in under 60 seconds.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/signup" style={{ padding: '12px 28px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Start free on Wyber AI →</Link>
            <Link href="/pricing" style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 14, textDecoration: 'none' }}>Compare pricing</Link>
          </div>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
