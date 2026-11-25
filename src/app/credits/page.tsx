import type { Metadata } from 'next'
import { creditCost, IMAGE_GEN_COST } from '@/lib/credits'
export const metadata: Metadata = { title: 'Credits & Pricing', description: 'Understand how WyberAi credits work and what each generation costs.' }

export default function CreditsPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px', fontFamily: 'var(--font-display)', color: '#fafafa' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>Credits & Pricing</h1>
      <p style={{ fontSize: 16, color: '#9aa8bb', marginBottom: 48, lineHeight: 1.6 }}>Transparent pricing. No hidden costs. You always know exactly what you are spending.</p>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.02em' }}>What uses credits</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            ['App build', `${creditCost('saas-build', 'fast', 'small')}–${creditCost('saas-build', 'default', 'xl')} credits`, `Priced by size and shown before you start: ${creditCost('saas-build', 'fast', 'small')} for a small app up to ${creditCost('saas-build', 'fast', 'xl')} for a very large one. A build we classify as complex is charged at the higher rate (${creditCost('saas-build', 'default', 'medium')} / ${creditCost('saas-build', 'default', 'large')} / ${creditCost('saas-build', 'default', 'xl')}).`],
            ['Small edit', `${creditCost('small-edit', 'fast')} credits`, 'A small change, fix, or refinement to an existing build. Larger changes are priced by size.'],
            ['Build plan (Plan Mode)', `${creditCost('plan', 'default')} credits`, 'Feature/flow plan you can edit before building'],
            ['Image generation', `${IMAGE_GEN_COST} credit`, 'AI-generated image during a build or from the Images panel'],
            ['HD image regenerate', `${creditCost('hero-image-gen')} credits`, 'High-quality hero image'],
            ['Security or SEO scan', `${creditCost('seo-scan')} credits`, 'Full checklist run on your project files inside the editor. The public scan at /tools is free.'],
            ['Voiceover', `${creditCost('audio-gen')} credits`, 'Narration generation'],
            ['Mobile preview', `${creditCost('preview-access')} credits`, 'Per viewer, per project, per day'],
            ['Template load', '0 credits', 'Instant template loading — always free'],
            ['Auto-fix errors', '0 credits', 'Always free'],
            ['Export ZIP', '0 credits', 'Download your code — always free'],
            ['Deploy to Vercel', '0 credits', 'One-click deployment — always free'],
            ['GitHub push', '0 credits', 'Push to any repo — always free'],
          ].map(([action, cost, desc]) => (
            <div key={action as string} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 10, background: '#0d141e', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{action}</div>
                <div style={{ fontSize: 12, color: '#8797ab', marginTop: 2 }}>{desc}</div>
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
            { plan: 'Starter',  price: '$29',  credits: 450,   color: '#22c55e' },
            { plan: 'Builder',  price: '$79',  credits: 1500,  color: '#0EA5E9' },
            { plan: 'Pro',      price: '$199', credits: 4500,  color: '#a78bfa' },
            { plan: 'Growth',   price: '$399', credits: 12000, color: '#f59e0b' },
            { plan: 'Scale',    price: '$799', credits: 30000, color: '#f97316' },
          ].map(({ plan, price, credits, color }) => (
            <div key={plan} style={{ padding: 20, borderRadius: 12, background: '#0d141e', border: `1px solid ${color}30` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 }}>{plan}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 4 }}>{price}<span style={{ fontSize: 13, fontWeight: 400, color: '#8797ab' }}>/mo</span></div>
              <div style={{ fontSize: 14, fontWeight: 700, color }}>{credits >= 99999 ? 'Unlimited' : credits.toLocaleString()} credits</div>
              <div style={{ fontSize: 11, color: '#8797ab', marginTop: 4 }}>{credits >= 99999 ? 'Never runs out' : `~${Math.floor(credits / creditCost('saas-build', 'fast', 'small'))} small builds`}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 20, borderRadius: 12, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.2)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#0EA5E9' }}>How we compare</h3>
        <p style={{ fontSize: 13, color: '#9aa8bb', lineHeight: 1.8 }}>WyberAi Starter gives you <strong style={{ color: '#0EA5E9' }}>450 credits for $29/month</strong> — every plan includes web and mobile apps, deploy and GitHub export; Builder and above add Supabase, custom domains and badge-free publishing. Credits work across every product.</p>
        <p style={{ fontSize: 11, color: '#8797ab', marginTop: 12 }}>Monthly credits roll over. Top-up credits never expire. Credits are non-refundable once used.</p>
      </section>
    </div>
  )
}
