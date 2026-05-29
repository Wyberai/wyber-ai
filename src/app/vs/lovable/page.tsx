import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wyber AI vs Lovable — Better AI App Builder Alternative',
  description: 'Wyber AI gives you more credits, better UI quality, zero vendor lock-in, and no charges for AI mistakes. The best Lovable alternative in 2025.',
  keywords: ['Lovable alternative', 'better than Lovable', 'Lovable competitor', 'AI app builder', 'vibe coding alternative'],
  openGraph: {
    title: 'Wyber AI vs Lovable — The Better Alternative',
    description: 'More credits. Better UI. Zero lock-in. No charges for AI mistakes.',
  },
};

const COMPARISONS = [
  { feature: 'Free credits/month', wyber: '50', lovable: '30', winner: 'wyber' },
  { feature: 'Pro plan price', wyber: '$15/month', lovable: '$25/month', winner: 'wyber' },
  { feature: 'Pro plan credits', wyber: '400', lovable: '250', winner: 'wyber' },
  { feature: 'Charge for AI errors', wyber: '✕ Never', lovable: '✓ Always', winner: 'wyber' },
  { feature: 'Credit transparency', wyber: '✓ Per prompt', lovable: '✕ Hidden', winner: 'wyber' },
  { feature: 'Frameworks supported', wyber: 'React, Vue, Vanilla, Next', lovable: 'React only', winner: 'wyber' },
  { feature: 'Data export (pg_dump)', wyber: '✓ Self-serve', lovable: '✕ Needs support', winner: 'wyber' },
  { feature: 'Vendor lock-in', wyber: 'Zero — export anytime', lovable: 'Trapped without support', winner: 'wyber' },
  { feature: 'Weekend support', wyber: 'Self-serve architecture', lovable: '✕ No weekend support', winner: 'wyber' },
  { feature: 'Security scan before deploy', wyber: '✓ Built-in, free', lovable: '✓ Paid only', winner: 'wyber' },
  { feature: 'Mobile preview', wyber: '✓ 375/768/desktop', lovable: '✕ Manual check', winner: 'wyber' },
  { feature: 'Plan Mode', wyber: '✓ Maps steps first', lovable: '✓', winner: 'tie' },
  { feature: 'GitHub sync', wyber: '✓', lovable: '✓ Paid only', winner: 'wyber' },
  { feature: 'Visual click-to-edit', wyber: '✓', lovable: '✓', winner: 'tie' },
  { feature: 'One-click deploy', wyber: '✓ Vercel', lovable: '✓ Vercel', winner: 'tie' },
];

const PAIN_POINTS = [
  {
    title: 'Lovable charges you for their mistakes',
    body: 'When Lovable\'s AI introduces a bug while fixing another, it still deducts credits. You pay for broken code. Wyber AI has a dedicated Fix Error mode that never charges credits — only successful new generations cost credits.',
    stat: '91.5% of Lovable-generated apps contain at least one vulnerability',
  },
  {
    title: 'Lovable traps your data',
    body: 'Production apps on Lovable Cloud have no self-serve data export. No pg_dump access. No direct database credentials. Users have reported waiting hours for manual staff intervention just to disconnect their own database. Wyber AI gives you your Postgres credentials directly, one-click data export, and zero dependency on us to access your own data.',
    stat: 'Users report 15+ hour outages waiting for Lovable weekend support',
  },
  {
    title: 'Lovable\'s credits disappear faster than you expect',
    body: 'As Lovable integrated heavier models, credits started costing 5-10x more than before. A simple UI edit that cost 2 credits now costs 6. Wyber AI gives you a model toggle — fast/cheap for simple edits, premium for complex work. You control the spend.',
    stat: 'Lovable Pro: 250 credits for $25. Wyber Pro: 400 credits for $15.',
  },
  {
    title: 'Lovable is React-only',
    body: 'Every app Lovable generates is React + Tailwind. If your team uses Vue, or you want a vanilla JS tool, or you need Next.js with SSR — Lovable can\'t help. Wyber AI generates React, Vue 3, Vanilla JS, and Next.js from the same interface.',
    stat: '4 frameworks vs 1',
  },
];

export default function VsLovablePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 48px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.03em' }}>Wyber <span style={{ color: '#8b5cf6' }}>AI</span></span>
        </Link>
        <Link href="/signup" style={{ padding: '8px 20px', borderRadius: 8, background: '#7c3aed', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          Start free →
        </Link>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '80px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, padding: '5px 14px', marginBottom: 28, fontSize: 12, color: '#a78bfa', fontWeight: 500 }}>
            Lovable alternative
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 20px' }}>
            Wyber AI vs Lovable
          </h1>
          <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.65, maxWidth: 560, margin: '0 auto 40px' }}>
            More credits. Better UI quality. Zero vendor lock-in. No charges for AI mistakes. Here's the honest comparison.
          </p>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 10, background: '#7c3aed', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: 16, boxShadow: '0 4px 32px rgba(124,58,237,0.4)' }}>
            Try Wyber AI free →
          </Link>
          <p style={{ fontSize: 12, color: '#52525b', marginTop: 12 }}>50 free credits · No credit card</p>
        </div>

        {/* Comparison table */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 32 }}>Feature comparison</h2>
          <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 12, color: '#52525b', fontWeight: 500 }}>Feature</span>
              <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 700, textAlign: 'center' }}>⚡ Wyber AI</span>
              <span style={{ fontSize: 12, color: '#52525b', textAlign: 'center', fontWeight: 500 }}>Lovable</span>
            </div>
            {COMPARISONS.map((row, i) => (
              <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', padding: '13px 20px', borderBottom: i < COMPARISONS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#a1a1aa' }}>{row.feature}</span>
                <span style={{ fontSize: 13, color: row.winner === 'wyber' ? '#22c55e' : '#a1a1aa', fontWeight: row.winner === 'wyber' ? 600 : 400, textAlign: 'center' }}>{row.wyber}</span>
                <span style={{ fontSize: 13, color: row.winner === 'wyber' ? '#52525b' : '#a1a1aa', textAlign: 'center' }}>{row.lovable}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pain points */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 12 }}>Why people leave Lovable</h2>
          <p style={{ textAlign: 'center', color: '#a1a1aa', fontSize: 15, marginBottom: 40 }}>Based on real user complaints from Reddit and X.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PAIN_POINTS.map(point => (
              <div key={point.title} style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '28px 28px' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px' }}>{point.title}</h3>
                <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: 1.7, margin: '0 0 16px' }}>{point.body}</p>
                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#a78bfa', fontStyle: 'italic' }}>
                  "{point.stat}"
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(139,92,246,0.05))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 16, padding: '56px 32px' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', margin: '0 0 14px' }}>Ready to switch?</h2>
          <p style={{ color: '#a1a1aa', fontSize: 16, margin: '0 0 32px' }}>50 free credits. No card. Export your code any time. Your data belongs to you.</p>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', borderRadius: 12, background: '#7c3aed', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 17, boxShadow: '0 8px 40px rgba(124,58,237,0.45)' }}>
            ⚡ Start building free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#52525b' }}>© 2025 Wyber AI · <Link href="/" style={{ color: '#52525b', textDecoration: 'none' }}>wyberai.com</Link></p>
      </footer>
    </div>
  );
}
