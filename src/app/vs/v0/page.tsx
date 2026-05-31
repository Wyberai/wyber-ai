import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Wyber AI vs v0 by Vercel — Comparison 2026',
  description: 'Wyber AI vs v0: full-stack apps vs UI components. See which AI builder is right for your project. Updated May 2026.',
  openGraph: { images: [{ url: 'https://wyberai.com/api/og?title=Wyber%20AI%20vs%20v0%20by%20Vercel&sub=Full%20comparison%20%E2%80%94%202026', width: 1200, height: 630 }] },
}

function WyberLogo({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
}

const ROWS = [
  ['Starting price',         '$18.99/mo',     '$20/mo',            'wyber'],
  ['Full-stack apps',        '✓ Complete',    'Frontend only',     'wyber'],
  ['Database provisioning',  '✓ Auto',        '✗',                 'wyber'],
  ['Auth out of the box',    '✓',             '✗',                 'wyber'],
  ['Credit estimate upfront','✓ Unique',      '✗',                 'wyber'],
  ['Prebuilt app library',   '60+ apps',      'Component library', 'wyber'],
  ['Deploy to Vercel',       '✓',             '✓ Native',          'tie'],
  ['GitHub sync',            '✓',             '✓',                 'tie'],
  ['UI design quality',      'High',          'Highest in class',  'v0'],
  ['Component-level editing','App-level',     '✓ Component',       'v0'],
  ['Non-technical users',    '✓ Guided',      'Developer-focused', 'wyber'],
  ['Credits never expire',   '✓',             'N/A',               'wyber'],
  ['India/APAC pricing',     '✓ INR soon',    'USD only',          'wyber'],
]

export default function VSV0Page() {
  const wyberWins = ROWS.filter(r => r[3] === 'wyber').length
  const v0Wins = ROWS.filter(r => r[3] === 'v0').length
  const ties = ROWS.filter(r => r[3] === 'tie').length
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo size={24}/><span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14 }}>Wyber AI</span></Link>
        <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Try free →</Link>
      </nav>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Honest comparison · Updated May 2026</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14 }}>Wyber AI vs v0 by Vercel</h1>
          <p style={{ fontSize: 16, color: '#71717a', maxWidth: 500, margin: '0 auto' }}>v0 excels at generating beautiful UI components. Wyber AI builds complete full-stack apps — with database, auth, and deployment included.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, marginBottom: 40, alignItems: 'center' }}>
          <div style={{ padding: 20, borderRadius: 14, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', textAlign: 'center' }}>
            <WyberLogo size={32}/><div style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, color: '#0EA5E9', margin: '8px 0 2px' }}>{wyberWins}</div>
            <div style={{ fontSize: 12, color: '#71717a' }}>categories won</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: '#52525b', fontWeight: 600 }}>{ties} tied</div>
          <div style={{ padding: 20, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>▲</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, color: '#a1a1aa', margin: '0 0 2px' }}>{v0Wins}</div>
            <div style={{ fontSize: 12, color: '#71717a' }}>categories won</div>
          </div>
        </div>
        <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#111113', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['Feature', 'Wyber AI', 'v0 by Vercel'].map((h, i) => <div key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: i === 1 ? '#0EA5E9' : '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>)}
          </div>
          {ROWS.map((row, i) => (
            <div key={row[0]} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: i < ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: row[3] === 'wyber' ? 'rgba(14,165,233,0.03)' : 'transparent' }}>
              <div style={{ padding: '12px 16px', fontSize: 13, color: '#a1a1aa' }}>{row[0]}</div>
              <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: row[3] === 'wyber' ? 700 : 400, color: row[3] === 'wyber' ? '#0EA5E9' : '#fafafa', display: 'flex', alignItems: 'center', gap: 5 }}>
                {row[3] === 'wyber' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                {row[1]}
              </div>
              <div style={{ padding: '12px 16px', fontSize: 13, color: row[3] === 'v0' ? '#fafafa' : '#52525b' }}>{row[2]}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 16, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Need a full app, not just components?</h2>
          <p style={{ fontSize: 14, color: '#71717a', marginBottom: 24 }}>15 free credits. No credit card. Full-stack in 60 seconds.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/signup" style={{ padding: '12px 28px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Build for free →</Link>
            <Link href="/pricing" style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 14, textDecoration: 'none' }}>See pricing</Link>
          </div>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
