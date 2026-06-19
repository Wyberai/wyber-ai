'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const BRAND = '#0EA5E9'

// ── Plan definitions ──────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'builder',
    name: 'Builder',
    monthlyPrice: 99,
    annualPrice: 79,
    planKey: 'builder_monthly',
    color: '#0EA5E9',
    highlight: false,
    badge: null,
    tagline: 'One person. Six products. Ship this week.',
    employeeSlots: 3,
    credits: 300,
    features: [
      '300 tasks/month — never expire',
      '3 AI Employees running on autopilot',
      'Build web & mobile apps in plain English',
      '20 web builds · 10 mobile builds included',
      'AI Agents & Workflows for any process',
      'GTM Engine — ICP setup + lead discovery',
      'Gmail, Slack, Notion, HubSpot integrations',
      'Community support',
    ],
  },
  {
    id: 'operator',
    name: 'Operator',
    monthlyPrice: 249,
    annualPrice: 199,
    planKey: 'operator_monthly',
    color: '#0EA5E9',
    highlight: false,
    badge: 'MOST POPULAR',
    tagline: 'Replace your junior team. Run ops on autopilot.',
    employeeSlots: 10,
    credits: 900,
    features: [
      '900 tasks/month — never expire',
      '10 AI Employees across any department',
      'All 30+ tool integrations unlocked',
      'GTM — campaigns, sequences + lead import',
      'Custom domain routing',
      'KPI dashboards emailed weekly',
      'Multi-user org management',
      'Priority support',
    ],
  },
  {
    id: 'founder',
    name: 'Founder',
    monthlyPrice: 499,
    annualPrice: 399,
    planKey: 'founder_monthly',
    color: '#8b5cf6',
    highlight: true,
    badge: 'NEW',
    tagline: 'Your whole go-to-market on autopilot. Zero headcount.',
    employeeSlots: -1,
    credits: 2000,
    features: [
      '2,000 tasks/month — never expire',
      'Unlimited AI Employees — every department',
      'Full GTM — visual canvas + sequences + calling',
      'AI SDR who qualifies leads while you sleep',
      'GTM Analyst emailing you weekly performance reports',
      'Multiple orgs — white-label for clients',
      'Priority run queue — your jobs go first',
      'Dedicated Slack support line',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    monthlyPrice: 999,
    annualPrice: 799,
    planKey: 'scale_monthly',
    color: '#f59e0b',
    highlight: false,
    badge: 'BEST VALUE',
    tagline: 'Agency-scale AI. Run 10+ clients without growing headcount.',
    employeeSlots: -1,
    credits: 5000,
    features: [
      '5,000 tasks/month — never expire',
      'Unlimited everything across all clients',
      'Multiple white-label orgs with custom domains',
      'Advanced KPI analytics per client',
      'Everything in Founder, plus:',
      'Quarterly strategy call with the Wyber team',
      'Volume credit pricing for heavy usage',
      'SLA commitment on run queue',
    ],
  },
]

const TOPUPS = [
  { credits: 300,  price: 24,  key: 'topup_300',  label: 'Boost',  desc: '~20 web builds' },
  { credits: 900,  price: 59,  key: 'topup_900',  label: 'Power',  desc: '~60 web builds' },
  { credits: 2000, price: 119, key: 'topup_2000', label: 'Studio', desc: '~130 web builds', badge: 'Best value' },
]

const CREDIT_TABLE = [
  { action: 'Web app build',          cost: '15 credits', icon: '🌐' },
  { action: 'Mobile app build',       cost: '15 credits', icon: '📱' },
  { action: 'App edit / iteration',   cost: '4 credits',  icon: '✏️' },
  { action: 'AI Agent run',           cost: '8 credits',  icon: '⚡' },
  { action: 'Workflow run',           cost: '4 credits',  icon: '🔀' },
  { action: 'AI Employee run',        cost: '15 credits', icon: '🤖' },
  { action: 'GTM ICP + sequence gen', cost: '20 credits', icon: '🎯' },
  { action: 'Lead enrichment',        cost: '2 credits',  icon: '👤' },
  { action: 'Image generation',       cost: '5 credits',  icon: '🎨' },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

const IcoCheck = ({ color = '#22c55e' }: { color?: string }) => (
  <svg width="11" height="11" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
)

// ── Plan card ──────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  annual,
  loading,
  onCheckout,
}: {
  plan: typeof PLANS[0]
  annual: boolean
  loading: string | null
  onCheckout: (key: string) => void
}) {
  const price = annual ? plan.annualPrice : plan.monthlyPrice
  const isLoading = loading === plan.planKey || loading === plan.planKey?.replace('monthly', 'annual')

  return (
    <div style={{
      position: 'relative',
      background: plan.highlight ? 'linear-gradient(160deg, #0d1a26 0%, #0d1218 100%)' : '#111113',
      border: `1px solid ${plan.highlight ? 'rgba(14,165,233,0.35)' : plan.id === 'scale' ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 18,
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      {plan.badge && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: plan.highlight ? BRAND : '#8b5cf6',
          color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 12px',
          borderRadius: 20, letterSpacing: '0.08em', whiteSpace: 'nowrap',
        }}>{plan.badge}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: plan.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{plan.name}</div>
        <div style={{ fontSize: 12, color: '#52525b', marginBottom: 16, lineHeight: 1.5 }}>{plan.tagline}</div>

        {price !== null ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em', color: '#fafafa' }}>${price}</span>
            <span style={{ fontSize: 13, color: '#52525b' }}>/mo{annual ? ' · billed annually' : ''}</span>
          </div>
        ) : (
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa' }}>Custom</div>
        )}

        {annual && price !== null && (
          <div style={{ fontSize: 11, color: '#22c55e', marginTop: 4, fontWeight: 600 }}>
            Save ${((plan.monthlyPrice! - plan.annualPrice!) * 12).toFixed(0)}/year
          </div>
        )}
      </div>

      {/* Employee + credit pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${plan.color}12`, border: `1px solid ${plan.color}30`, color: plan.color }}>
          {plan.employeeSlots === -1 ? 'Unlimited' : plan.employeeSlots} AI Employees
        </div>
        {plan.credits > 0 && (
          <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
            {plan.credits.toLocaleString()} credits/mo
          </div>
        )}
      </div>

      {/* CTA */}
      {plan.planKey ? (
        <button
          onClick={() => onCheckout(annual ? plan.planKey!.replace('monthly', 'annual') : plan.planKey!)}
          disabled={!!isLoading}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 10,
            background: isLoading ? '#1a1a22' : plan.highlight ? BRAND : plan.id === 'scale' ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
            border: plan.highlight || plan.id === 'scale' ? 'none' : '1px solid rgba(255,255,255,0.12)',
            color: isLoading ? '#52525b' : '#fff',
            fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', marginBottom: 22,
            boxShadow: plan.highlight && !isLoading ? '0 4px 20px rgba(14,165,233,0.3)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {isLoading ? 'Redirecting…' : `Start ${plan.name} →`}
        </button>
      ) : (
        <a
          href="mailto:hello@wyberai.com?subject=Enterprise enquiry"
          style={{
            display: 'block', width: '100%', padding: '13px 0', borderRadius: 10,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            color: '#f59e0b', fontSize: 14, fontWeight: 700, textDecoration: 'none',
            textAlign: 'center', fontFamily: 'inherit', marginBottom: 22,
          }}
        >
          Contact us →
        </a>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 18 }} />

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {plan.features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <IcoCheck color={plan.id === 'scale' ? '#8b5cf6' : plan.id === 'enterprise' ? '#f59e0b' : '#22c55e'} />
            <span style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setUser(data.user))
    })
  }, [])

  const handleCheckout = async (planKey: string) => {
    if (!user) { window.location.href = '/login?next=/pricing'; return }
    setLoading(planKey)
    try {
      const res = await fetch('/api/dodo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })
      const d = await res.json()
      if (d.url) window.location.href = d.url
      else alert(d.error ?? 'Checkout error')
    } catch {
      alert('Network error')
    } finally {
      setLoading(null)
    }
  }

  const handleTopup = async (key: string) => {
    if (!user) { window.location.href = '/login?next=/pricing'; return }
    setLoading(key)
    try {
      const res = await fetch('/api/dodo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey: key }),
      })
      const d = await res.json()
      if (d.url) window.location.href = d.url
      else alert(d.error ?? 'Checkout error')
    } catch {
      alert('Network error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/employees" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none', padding: '6px 12px', borderRadius: 7 }}>Browse employees</Link>
          {user
            ? <Link href="/dashboard" style={{ padding: '7px 16px', borderRadius: 8, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Dashboard →</Link>
            : <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Get started →</Link>
          }
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px) 0', textAlign: 'center' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(14,165,233,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', fontSize: 12, fontWeight: 700, color: BRAND, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND, animation: 'pulse 2s infinite' }} />
          Simple, transparent pricing
        </div>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(32px,5vw,64px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 16 }}>
          Hire AI. Replace busywork.<br />
          <span style={{ background: `linear-gradient(135deg, ${BRAND}, #38bdf8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Grow without headcount.
          </span>
        </h1>
        <p style={{ fontSize: 'clamp(15px,1.5vw,18px)', color: '#71717a', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.65 }}>
          One AI SDR that qualifies leads 24/7 is worth more than $249/mo. Every plan includes web &amp; mobile app building, GTM, agents, and AI employees.
        </p>

        {/* Annual toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 30, padding: '5px 6px', marginBottom: 56 }}>
          <button onClick={() => setAnnual(false)} style={{ padding: '7px 18px', borderRadius: 24, background: !annual ? '#1a1a22' : 'transparent', border: !annual ? '1px solid rgba(255,255,255,0.12)' : 'none', color: !annual ? '#fafafa' : '#52525b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>Monthly</button>
          <button onClick={() => setAnnual(true)} style={{ padding: '7px 18px', borderRadius: 24, background: annual ? '#1a1a22' : 'transparent', border: annual ? '1px solid rgba(255,255,255,0.12)' : 'none', color: annual ? '#fafafa' : '#52525b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7 }}>
            Annual
            <span style={{ fontSize: 10, fontWeight: 800, background: '#22c55e', color: '#000', padding: '2px 7px', borderRadius: 10 }}>SAVE 20%</span>
          </button>
        </div>
      </section>

      {/* Plans grid */}
      <section style={{ padding: '0 clamp(16px,4vw,48px) clamp(60px,8vw,100px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px,100%), 1fr))', gap: 20 }}>
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} annual={annual} loading={loading} onCheckout={handleCheckout} />
          ))}
        </div>
      </section>

      {/* ROI callout */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', background: 'linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(14,165,233,0.02) 100%)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 20, padding: 'clamp(28px,4vw,48px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>The math is obvious</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>One hired employee pays for Scale 40x over</h2>
            <p style={{ color: '#71717a', fontSize: 14, maxWidth: 480, margin: '0 auto' }}>A junior SDR costs $60K/yr. Your AI SDR runs 24/7 at $499/mo (Founder plan). That&apos;s a $54K saving — before counting nights, weekends, and zero onboarding time.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px,100%), 1fr))', gap: 16 }}>
            {[
              { label: 'AI SDR cost/year', value: '$4,788', sub: 'Scale plan annually', color: BRAND },
              { label: 'Human SDR cost/year', value: '$60,000+', sub: 'Salary + benefits + tools', color: '#52525b' },
              { label: 'Your saving', value: '$55,212', sub: 'Reinvest in growth', color: '#22c55e' },
              { label: 'Typical ROI', value: '12×', sub: 'On first qualified deal', color: '#a855f7' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '18px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color, letterSpacing: '-0.03em', marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fafafa', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#52525b' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What does a credit buy? */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px,100%),1fr))', gap: 40, alignItems: 'start' }}>
          {/* Credit table */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>What 1 credit buys you</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(20px,2.5vw,30px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>Credits work across everything</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {CREDIT_TABLE.map(row => (
                <div key={row.action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#111113', borderRadius: 9, gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{row.icon}</span>
                    <span style={{ fontSize: 13, color: '#a1a1aa' }}>{row.action}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: BRAND, whiteSpace: 'nowrap', background: 'rgba(14,165,233,0.08)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(14,165,233,0.15)' }}>{row.cost}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#3f3f46', marginTop: 14, lineHeight: 1.6 }}>
              Credits roll over every month. Use them for builds, agents, employees, and flows — all from the same balance.
            </p>
          </div>

          {/* Top-ups */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Need more? Top up anytime</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(20px,2.5vw,30px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>One-time credit packs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TOPUPS.map(t => (
                <div key={t.key} style={{ position: 'relative', background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  {t.badge && (
                    <div style={{ position: 'absolute', top: -10, right: 16, background: '#f59e0b', color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 9px', borderRadius: 20 }}>{t.badge}</div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>{t.credits.toLocaleString()} credits</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '2px 7px', borderRadius: 10 }}>{t.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#52525b' }}>{t.desc} · never expires</div>
                  </div>
                  <button
                    onClick={() => handleTopup(t.key)}
                    disabled={loading === t.key}
                    style={{ padding: '9px 18px', borderRadius: 9, background: loading === t.key ? '#1a1a22' : 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: loading === t.key ? '#52525b' : '#f59e0b', fontSize: 13, fontWeight: 700, cursor: loading === t.key ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {loading === t.key ? '…' : `$${t.price}`}
                  </button>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#3f3f46', marginTop: 14 }}>Top-up credits stack on top of your monthly plan and never expire.</p>
          </div>
        </div>
      </section>

      {/* Done-for-you builds */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Done For You</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
              We build it for you
            </h2>
            <p style={{ fontSize: 15, color: '#71717a', maxWidth: 480, margin: '0 auto' }}>
              Prefer to hand it off? Book a $99 scoping call. The fee is credited toward your build.
            </p>
          </div>

          {/* Consultation CTA */}
          <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.03) 100%)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 28 }}>📞</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fafafa' }}>$99 Scoping Call</div>
                  <div style={{ fontSize: 12, color: '#52525b' }}>60 min · Google Meet · credited toward build</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#71717a', margin: 0, maxWidth: 460 }}>Tell us what you need. We scope it, give you a firm quote, and build it. Consultation fee applied to your total if you proceed — fully refundable if we&apos;re not a fit.</p>
            </div>
            <a href="/setup-call" style={{ flexShrink: 0, padding: '12px 24px', borderRadius: 10, background: '#f59e0b', color: '#000', fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Book for $99 →
            </a>
          </div>

          {/* Build tiers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px,100%), 1fr))', gap: 14 }}>
            {[
              { name: 'Simple Build', price: '$199', delivery: '24 hours', color: '#22c55e', icon: '⚡', items: ['Landing pages, portfolios, tools', 'No auth or database required', 'GitHub repo + Vercel deploy', '7-day support'] },
              { name: 'Medium Build', price: '$399', delivery: '3 working days', color: BRAND, icon: '🔧', badge: 'Most common', items: ['SaaS MVP with auth + database', '3–6 screens, real user accounts', 'GitHub repo + Vercel deploy', '14-day support'] },
              { name: 'Complex Build', price: '$799', delivery: '1 week', color: '#8b5cf6', icon: '🏗️', items: ['Full SaaS with payments + multi-roles', '6+ screens, integrations', 'GitHub repo + Vercel deploy', '30-day support'] },
            ].map(b => (
              <div key={b.name} style={{ position: 'relative', background: '#111113', border: `1px solid ${b.badge ? b.color + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '20px', borderTop: `3px solid ${b.color}` }}>
                {b.badge && <div style={{ position: 'absolute', top: -11, right: 14, background: b.color, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 10px', borderRadius: 20 }}>{b.badge}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: b.color }}>{b.name}</div>
                    <div style={{ fontSize: 10, color: '#52525b' }}>⏱ {b.delivery}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: '#fafafa' }}>{b.price}</div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  {b.items.map(item => (
                    <div key={item} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
                      <span style={{ color: b.color, fontSize: 11, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 12, color: '#71717a' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <a href="/setup-call" style={{ display: 'block', padding: '10px', borderRadius: 8, background: 'transparent', border: `1px solid ${b.color}40`, color: b.color, fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                  Book a call →
                </a>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <a href="/complexity-guide" style={{ fontSize: 12, color: '#52525b', textDecoration: 'none' }}>Not sure which tier? See the complexity guide →</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 32, textAlign: 'center' }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              ['What counts as a credit?', 'Web/mobile app builds cost 15 credits, small edits 4 credits, AI agent runs 8 credits, workflow runs 4 credits, AI employee runs 15 credits, GTM ICP + sequence generation 20 credits, lead enrichment 2 credits per contact. Image generation is 5 credits. Top-up packs can be added anytime and never expire.'],
              ['Can I hire more than my plan allows?', 'Yes — you can add credit top-ups or upgrade your plan at any time. Unused credits roll over each month.'],
              ['Do credits roll over?', 'Yes. Unused credits carry forward every billing cycle indefinitely as long as your subscription is active.'],
              ['What tools can AI employees use?', 'Gmail, Slack, HubSpot, Notion, Google Calendar, Google Sheets, LinkedIn, Airtable, GitHub, and 20+ more via Composio. Operator, Founder, and Scale include all integrations.'],
              ['Can I use my own domain for employees?', 'Yes. On any paid plan you can map a custom domain (netenrich.com/ai-sdr) via a simple CNAME record. Scale supports multiple orgs, each with their own domain.'],
              ['What happens if I cancel?', 'You keep access until the end of your billing period. Your employees, KPI data, and app builds are retained for 30 days so you can export everything.'],
            ].map(([q, a], i) => (
              <details key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '18px 0' }}>
                <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#e4e4e7', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  {q}
                  <span style={{ color: '#52525b', fontSize: 18, flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.7, marginTop: 12, marginBottom: 0 }}>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(14,165,233,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 16 }}>
            Your first AI employee<br />
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, #38bdf8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              starts working tonight.
            </span>
          </h2>
          <p style={{ fontSize: 15, color: '#71717a', marginBottom: 28, lineHeight: 1.65 }}>30-minute setup. No engineers. Just describe what you need and watch it run.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ padding: '14px 32px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(14,165,233,0.35)' }}>
              Start hiring →
            </Link>
            <Link href="/employees" style={{ padding: '14px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
              Browse 100 employees
            </Link>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: '#3f3f46' }}>No credit card required to explore · Cancel anytime</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px clamp(16px,4vw,48px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <WyberLogo markSize={20} wordmarkSize={13} />
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Employees', '/employees'], ['Blog', '/blog']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: '#52525b', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        details[open] > summary span { transform: rotate(45deg); display: inline-block; }
        details summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  )
}
