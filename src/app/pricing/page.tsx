'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    credits: 10,
    dailyCredits: 5,
    maxMonthly: 50,
    color: '#52525b',
    features: [
      '10 monthly credits',
      '5 daily credits (up to 50/month)',
      'Unlimited projects',
      'Live preview & export',
      'Community support',
    ],
    cta: 'Start free',
    ctaHref: '/signup',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 18.99,
    annualPrice: 15.99,
    credits: 150,
    dailyCredits: 8,
    maxMonthly: 390,
    color: '#0EA5E9',
    features: [
      '150 monthly credits',
      '8 daily credits (up to 390/month)',
      'Credit rollovers',
      'On-demand credit top-ups',
      'GitHub sync',
      'Custom domains',
      'Remove Wyber badge',
      'Priority support',
    ],
    cta: 'Start Pro',
    ctaHref: null,
    planKey: 'pro_monthly',
    highlight: true,
    badge: 'MOST POPULAR',
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 37.99,
    annualPrice: 31.99,
    credits: 150,
    dailyCredits: 8,
    maxMonthly: 390,
    color: '#8b5cf6',
    features: [
      'Everything in Pro',
      'SSO & team workspace',
      'Role-based access',
      'Audit logs',
      'Design templates',
      'Security center',
      'Personal projects',
      'Dedicated support',
    ],
    cta: 'Start Business',
    ctaHref: null,
    planKey: 'business_monthly',
    highlight: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    credits: null,
    dailyCredits: null,
    maxMonthly: null,
    color: '#f59e0b',
    features: [
      'Everything in Business',
      'Volume-based credit pricing',
      'Dedicated onboarding',
      'Custom connectors',
      'SCIM provisioning',
      'SLA guarantees',
      'Custom contracts',
    ],
    cta: 'Contact us',
    ctaHref: 'mailto:hello@wyberai.com',
    highlight: false,
  },
]

const TOPUPS = [
  { credits: 50,  price: 9.99,  key: 'topup_50',  label: 'Small top-up' },
  { credits: 150, price: 24.99, key: 'topup_150', label: 'Medium top-up' },
  { credits: 500, price: 69.99, key: 'topup_500', label: 'Large top-up' },
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

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setUser(data.user))
    })
  }, [])

  const handleCheckout = async (planKey: string) => {
    setLoading(planKey)
    try {
      const key = annual && planKey.includes('monthly') ? planKey.replace('monthly', 'annual') : planKey
      const res = await fetch('/api/dodo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey: key }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (res.status === 401) {
        // Not logged in — redirect to signup then back
        window.location.href = '/signup?next=/pricing'
      } else {
        console.error('Checkout error:', data)
        alert(`Error: ${data.error || 'Unknown error'}. Contact hello@wyberai.com`)
      }
    } catch (err) {
      alert('Network error. Please try again.')
    }
    setLoading(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav style={{ padding: '16px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo size={26} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: '-0.03em' }}>Wyber AI</span>
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{user
            ? <>
                <Link href="/dashboard" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>Dashboard</Link>
                <Link href="/settings?tab=billing" style={{ padding: '7px 18px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>My Plan</Link>
              </>
            : <>
                <Link href="/login" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none' }}>Sign in</Link>
                <Link href="/signup" style={{ padding: '7px 18px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Get started free</Link>
              </>
          }
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14, lineHeight: 1.1 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: 16, color: '#71717a', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.65 }}>
            Up to 50% more credits than competitors at 75% of the price. Credits roll over, top-ups never expire.
          </p>

          {/* Annual toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px', borderRadius: 12, background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: !annual ? '#fafafa' : 'transparent', color: !annual ? '#09090b' : '#71717a', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: annual ? '#fafafa' : 'transparent', color: annual ? '#09090b' : '#71717a', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s' }}>
              Annual
              <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 20, background: '#22c55e', color: '#fff' }}>SAVE 16%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginBottom: 60 }}>
          {PLANS.map(p => (
            <div key={p.id} style={{ position: 'relative', padding: 24, borderRadius: 16, background: p.highlight ? 'rgba(14,165,233,0.05)' : '#111113', border: `1px solid ${p.highlight ? '#0EA5E9' : 'rgba(255,255,255,0.07)'}`, display: 'flex', flexDirection: 'column' }}>
              {p.badge && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#0EA5E9', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>
                  {p.badge}
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{p.name}</div>

              <div style={{ marginBottom: 16 }}>
                {p.monthlyPrice === null ? (
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800 }}>Custom</div>
                ) : p.monthlyPrice === 0 ? (
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em' }}>$0</div>
                ) : (
                  <>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em' }}>
                      ${annual ? p.annualPrice : p.monthlyPrice}
                      <span style={{ fontSize: 14, fontWeight: 400, color: '#52525b' }}>/mo</span>
                    </div>
                    {annual && <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>Billed annually · Save ${(((p.monthlyPrice || 0) - (p.annualPrice || 0)) * 12).toFixed(0)}/year</div>}
                  </>
                )}
              </div>

              {p.maxMonthly && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: p.color + '10', border: `1px solid ${p.color}25`, marginBottom: 16, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: p.color }}>{p.credits} monthly</span>
                  <span style={{ color: '#71717a' }}> + {p.dailyCredits} daily</span>
                  <span style={{ color: '#52525b', fontSize: 11 }}> = up to {p.maxMonthly}/mo</span>
                </div>
              )}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#a1a1aa', alignItems: 'flex-start' }}>
                    <span style={{ color: p.color, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                  </div>
                ))}
              </div>

              {p.ctaHref ? (
                <Link href={p.ctaHref} style={{ display: 'block', padding: '10px', borderRadius: 9, textAlign: 'center', background: p.highlight ? '#0EA5E9' : 'rgba(255,255,255,0.06)', color: p.highlight ? '#fff' : '#a1a1aa', fontSize: 13, fontWeight: 700, textDecoration: 'none', border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.15s' }}>
                  {p.cta}
                </Link>
              ) : (
                <button
                  onClick={() => p.planKey && handleCheckout(p.planKey)}
                  disabled={loading === p.planKey}
                  style={{ width: '100%', padding: '10px', borderRadius: 9, border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)', background: p.highlight ? '#0EA5E9' : 'rgba(255,255,255,0.06)', color: p.highlight ? '#fff' : '#a1a1aa', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  {loading === p.planKey ? 'Loading...' : p.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Top-ups */}
        <div style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Credit top-ups</h2>
          <p style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>Need more credits? Top up anytime. These credits never expire — ever.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {TOPUPS.map(t => (
              <div key={t.key} style={{ padding: 18, borderRadius: 12, background: '#111113', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700 }}>{t.credits} credits</div>
                  <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>${(t.price / t.credits).toFixed(3)}/credit · never expires</div>
                </div>
                <button onClick={() => handleCheckout(t.key)} disabled={loading === t.key}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  ${t.price}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Credit estimator callout */}
        <div style={{ padding: 24, borderRadius: 16, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.2)', marginBottom: 60, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>💡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Always know what you're spending before you build</div>
            <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.65 }}>
              Wyber AI shows you the estimated credit cost before every generation. Type your prompt, see the estimate, build with confidence. No surprises.
            </div>
          </div>
        </div>

        {/* Compare vs Lovable */}
        <div style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20 }}>How we compare</h2>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['', 'Lovable Pro', 'Wyber AI Pro', 'Difference'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Monthly price', '$25/mo', '$18.99/mo', '24% cheaper'],
                  ['Annual price', '$21/mo', '$15.99/mo', '24% cheaper'],
                  ['Monthly credits', '100', '150', '50% more'],
                  ['Daily credits', '5/day', '8/day', '60% more'],
                  ['Max credits/month', '~250', '~390', '56% more'],
                  ['Credit rollovers', '✓', '✓', 'Same'],
                  ['Top-ups available', 'Pro+ only', 'Everyone', 'Better'],
                  ['Top-up credits expire', 'Yes', 'Never', 'Better'],
                  ['Credit estimate before build', '✗', '✓', 'Unique'],
                ].map(([label, lovable, wyber, diff]) => (
                  <tr key={label} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{label}</td>
                    <td style={{ padding: '12px 16px', color: '#71717a' }}>{lovable}</td>
                    <td style={{ padding: '12px 16px', color: '#0EA5E9', fontWeight: 600 }}>{wyber}</td>
                    <td style={{ padding: '12px 16px', color: '#22c55e', fontSize: 12 }}>{diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Special programs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 60 }}>
          {[
            { icon: '💬', title: 'Discord Community', desc: 'Ask questions, share builds, get feature previews. Join 100+ builders on Wyber AI Discord.', cta: 'Join free', href: 'https://discord.gg/A5KsFv2P' },
            { icon: '🎓', title: 'Wyber for Students', desc: '50% off Pro with valid student email. Learning to build? Build for less.', cta: 'Apply now', href: 'mailto:students@wyberai.com' },
            { icon: '🏢', title: 'Wyber for Startups', desc: '3 months free Pro for pre-seed startups. Build your MVP without burning runway.', cta: 'Apply now', href: 'mailto:startups@wyberai.com' },
            { icon: '🎁', title: 'Gift Credits', desc: 'Send credits to a builder you know. A great gift for founders and developers.', cta: 'Send a gift', href: 'mailto:hello@wyberai.com' },
          ].map(p => (
            <div key={p.title} style={{ padding: 18, borderRadius: 12, background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{p.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.6, marginBottom: 12 }}>{p.desc}</div>
              <Link href={p.href} style={{ fontSize: 12, fontWeight: 700, color: '#0EA5E9', textDecoration: 'none' }}>{p.cta} →</Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>FAQ</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { q: 'Do credits expire?', a: 'Monthly credits reset on the 1st of each month with rollover included. Top-up credits never expire — they stay in your account indefinitely.' },
            { q: 'What is a credit?', a: 'One credit roughly equals one AI generation. Simple edits cost 0.5 credits. Full apps cost 3–8 credits. We show you the estimate before you build so there are no surprises.' },
            { q: 'Can I use top-ups on a free plan?', a: 'Yes. Unlike Lovable, top-ups are available to everyone — you don\'t need a subscription to buy extra credits.' },
            { q: 'How does daily credits work?', a: 'Pro and Business users get 8 bonus credits every day on top of their monthly allocation. Unused daily credits don\'t roll over, but your monthly credits do.' },
            { q: 'Can I switch plans?', a: 'Yes, upgrade or downgrade anytime. When upgrading, your credit balance is topped up immediately.' },
            { q: 'Do you offer refunds?', a: 'Unused credits from top-ups are refundable within 7 days. Subscription refunds follow standard billing terms.' },
          ].map(({ q, a }) => (
            <div key={q} style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.65 }}>{a}</div>
            </div>
          ))}
        </div>

      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
