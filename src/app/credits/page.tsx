import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Credits & Pricing — WyberAi', description: 'Understand how WyberAi credits work and what each generation costs.' }

export default function CreditsPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px', fontFamily: 'Space Grotesk, sans-serif', color: '#fafafa' }}>
      <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>Credits & Pricing</h1>
      <p style={{ fontSize: 16, color: '#a1a1aa', marginBottom: 48, lineHeight: 1.6 }}>Transparent pricing. No hidden costs. You always know exactly what you are spending.</p>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.02em' }}>What uses credits</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            ['Standard generation', '1 credit', 'Describe an app or request changes'],
            ['Premium generation', '2 credits', 'Complex builds with larger context'],
            ['Template load', '0 credits', 'Instant template loading — always free'],
            ['Auto-fix errors', '0 credits', 'When we cause an error, fixing it is free'],
            ['Export ZIP', '0 credits', 'Download your code — always free'],
            ['Deploy to Vercel', '0 credits', 'One-click deployment — always free'],
            ['GitHub sync', '0 credits', 'Push to GitHub — always free'],
            ['Version history', '0 credits', 'Save and restore snapshots — always free'],
          ].map(([action, cost, desc]) => (
            <div key={action as string} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 10, background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{action}</div>
                <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>{desc}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: cost === '0 credits' ? '#22c55e' : '#0EA5E9', whiteSpace: 'nowrap', padding: '3px 10px', borderRadius: 20, background: cost === '0 credits' ? 'rgba(34,197,94,0.1)' : 'rgba(14,165,233,0.1)' }}>
                {cost}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.02em' }}>Plans</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { plan: 'Starter', price: '$49', credits: 500, color: '#0EA5E9' },
            { plan: 'Growth', price: '$149', credits: 2000, color: '#8b5cf6' },
            { plan: 'Scale', price: '$399', credits: 6000, color: '#10b981' },
          ].map(({ plan, price, credits, color }) => (
            <div key={plan} style={{ padding: 20, borderRadius: 12, background: '#111113', border: `1px solid ${color}30` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 }}>{plan}</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 4 }}>{price}<span style={{ fontSize: 13, fontWeight: 400, color: '#71717a' }}>/mo</span></div>
              <div style={{ fontSize: 14, fontWeight: 700, color }}>{credits >= 99999 ? 'Unlimited' : credits.toLocaleString()} credits</div>
              <div style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>{credits >= 99999 ? 'Never runs out' : `~${credits} generations`}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 20, borderRadius: 12, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.2)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#0EA5E9' }}>How we compare</h3>
        <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.8 }}>WyberAi Starter gives you <strong style={{ color: '#0EA5E9' }}>500 credits for $49/month</strong> — unlimited projects, all 5 product types, and up to 3 AI Employees included.</p>
        <p style={{ fontSize: 11, color: '#52525b', marginTop: 12 }}>Monthly credits roll over. Top-up credits never expire. Credits are non-refundable once used.</p>
      </section>
    </div>
  )
}
