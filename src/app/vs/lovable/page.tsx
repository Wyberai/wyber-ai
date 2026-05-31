import type { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

export const metadata: Metadata = {
  title: 'Wyber AI vs Lovable — Honest Comparison',
  description: 'Wyber AI vs Lovable: feature comparison, pricing, and credits. See why builders are switching to Wyber AI.',
}

const ROWS = [
  { feature: 'Starting price',         wyber: '$18.99/mo',    lovable: '$25/mo',       winner: 'wyber' },
  { feature: 'Monthly credits',         wyber: '150 credits',  lovable: '100 credits',  winner: 'wyber' },
  { feature: 'Daily bonus credits',     wyber: '8/day',        lovable: '5/day',        winner: 'wyber' },
  { feature: 'Max credits/month',       wyber: '~390',         lovable: '~250',         winner: 'wyber' },
  { feature: 'Credit rollovers',        wyber: '✓',            lovable: '✓',            winner: 'tie' },
  { feature: 'Top-up credits',          wyber: 'Anyone',       lovable: 'Pro+ only',    winner: 'wyber' },
  { feature: 'Top-up credits expire',   wyber: 'Never',        lovable: 'With sub',     winner: 'wyber' },
  { feature: 'Credit estimate upfront', wyber: '✓ Unique',     lovable: '✗',            winner: 'wyber' },
  { feature: 'Prebuilt app library',    wyber: '60+ instant',  lovable: 'Templates',    winner: 'wyber' },
  { feature: 'Visual click-to-edit',    wyber: '✓',            lovable: '✓',            winner: 'tie' },
  { feature: 'GitHub sync',             wyber: '✓',            lovable: '✓',            winner: 'tie' },
  { feature: 'Custom domains',          wyber: '✓',            lovable: 'Pro+',         winner: 'wyber' },
  { feature: 'Supabase auto-provision', wyber: '✓',            lovable: '✓',            winner: 'tie' },
  { feature: 'Deploy to Vercel',        wyber: '✓',            lovable: '✗',            winner: 'wyber' },
  { feature: 'Export source code',      wyber: '✓ Always',     lovable: '✓',            winner: 'tie' },
  { feature: 'Remove branding',         wyber: '✓',            lovable: 'Pro+',         winner: 'wyber' },
  { feature: 'AI model',                wyber: 'Claude Sonnet', lovable: 'Claude',      winner: 'tie' },
  { feature: 'Real-time collaboration', wyber: 'Coming soon',  lovable: '✓',            winner: 'lovable' },
  { feature: 'SSO',                     wyber: 'Business',     lovable: 'Business',     winner: 'tie' },
  { feature: 'India/APAC pricing',      wyber: '✓ INR soon',   lovable: 'USD only',     winner: 'wyber' },
]

function WyberLogo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  )
}

export default function VSPage() {
  const wyberWins = ROWS.filter(r => r.winner === 'wyber').length
  const lovableWins = ROWS.filter(r => r.winner === 'lovable').length
  const ties = ROWS.filter(r => r.winner === 'tie').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--mkt-bg)', color: 'var(--mkt-text)', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo size={24} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: '-0.03em' }}>Wyber AI</span>
        </Link>
<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><ThemeToggle /><Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Try free →</Link></div>
      </nav>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
            Honest comparison · Updated May 2026
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(30px,5vw,52px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14, lineHeight: 1.1 }}>
            Wyber AI vs Lovable
          </h1>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.65, maxWidth: 480, margin: '0 auto' }}>
            Both tools build apps from prompts using Claude AI. Here's every meaningful difference, with no spin.
          </p>
        </div>

        {/* Score cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, marginBottom: 40, alignItems: 'center' }}>
          <div style={{ padding: 20, borderRadius: 14, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', textAlign: 'center' }}>
            <WyberLogo size={32} />
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, color: '#0EA5E9', margin: '8px 0 2px' }}>{wyberWins}</div>
            <div style={{ fontSize: 12, color: '#71717a' }}>categories won</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: '#52525b', fontWeight: 600 }}>
            <div>{ties} tied</div>
          </div>
          <div style={{ padding: 20, borderRadius: 14, background: '#111113', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ff4545', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>♥</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, color: '#a1a1aa', margin: '8px 0 2px' }}>{lovableWins}</div>
            <div style={{ fontSize: 12, color: '#71717a' }}>categories won</div>
          </div>
        </div>

        {/* Comparison table */}
        <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 40 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#111113', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feature</div>
            <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wyber AI</div>
            <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lovable</div>
          </div>
          {ROWS.map((row, i) => (
            <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: i < ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: row.winner === 'wyber' ? 'rgba(14,165,233,0.03)' : 'transparent', transition: 'background 0.15s' }}>
              <div style={{ padding: '12px 16px', fontSize: 13, color: '#a1a1aa' }}>{row.feature}</div>
              <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: row.winner === 'wyber' ? 700 : 400, color: row.winner === 'wyber' ? '#0EA5E9' : '#fafafa', display: 'flex', alignItems: 'center', gap: 6 }}>
                {row.winner === 'wyber' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                {row.wyber}
              </div>
              <div style={{ padding: '12px 16px', fontSize: 13, color: row.winner === 'lovable' ? '#fafafa' : '#52525b' }}>{row.lovable}</div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 16, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>Ready to switch?</h2>
          <p style={{ fontSize: 14, color: '#71717a', marginBottom: 24 }}>Import your Lovable projects or start fresh. 15 free credits, no card needed.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ padding: '12px 28px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
              Start free on Wyber AI →
            </Link>
            <Link href="/pricing" style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', fontSize: 14, textDecoration: 'none' }}>
              Compare pricing
            </Link>
          </div>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
