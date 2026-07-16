'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { type Currency, formatPrice } from '@/lib/currency'

const BRAND = '#0EA5E9'

// ── Plan definitions ──────────────────────────────────────────────────────────
// USD is the sticker price; INR fields are smart-localized India price points
// (not an FX conversion). `inrOnly` plans (Spark) show only in the INR view.

const PLANS = [
  {
    id: 'spark',
    name: 'Spark',
    inrOnly: true,
    monthlyPrice: 6,
    annualPrice: 5,
    monthlyPriceINR: 499,
    annualPriceINR: 399,
    planKey: 'spark_monthly',
    color: '#f59e0b',
    highlight: false,
    badge: 'INDIA ENTRY',
    tagline: 'The cheapest way to start building for real.',
    credits: 50,
    perCredit: '₹10',
    perCreditINR: '₹10',
    features: [
      '50 credits/month — never expire',
      'Web apps + mobile apps — unlimited projects',
      'AI generates fresh code every time',
      'Live preview + auto error fix',
      'One-click deploy to Vercel',
      'Pay with UPI',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 23,
    monthlyPriceINR: 1499,
    annualPriceINR: 1199,
    planKey: 'starter_monthly',
    color: '#22c55e',
    highlight: false,
    badge: null,
    tagline: 'Start building. All features included.',
    credits: 150,
    perCredit: '$0.19',
    perCreditINR: '₹10',
    features: [
      '150 credits/month — never expire',
      'Web apps + mobile apps — unlimited projects',
      'AI generates fresh code every time',
      'Live preview + auto error fix',
      'One-click deploy to Vercel',
      'GitHub push + export as ZIP',
      'Community support',
    ],
  },
  {
    id: 'builder',
    name: 'Builder',
    monthlyPrice: 79,
    annualPrice: 63,
    monthlyPriceINR: 3999,
    annualPriceINR: 3199,
    planKey: 'builder_monthly',
    color: '#0EA5E9',
    highlight: true,
    badge: 'MOST POPULAR',
    tagline: 'Ship real products every week.',
    credits: 500,
    perCredit: '$0.16',
    perCreditINR: '₹8',
    features: [
      '500 credits/month — never expire',
      'Everything in Starter',
      'Supabase database + auth integration',
      'Connect custom domains',
      'Priority build queue — your apps build first',
      'Early access to new features',
      'Priority email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 199,
    annualPrice: 159,
    monthlyPriceINR: 9999,
    annualPriceINR: 7999,
    planKey: 'pro_monthly',
    color: '#8b5cf6',
    highlight: false,
    badge: 'BEST VALUE',
    tagline: 'For teams and agencies shipping at scale.',
    credits: 1500,
    perCredit: '$0.13',
    perCreditINR: '₹6.7',
    features: [
      '1,500 credits/month — never expire',
      'Everything in Builder',
      'Multi-user org management',
      'White-label for client projects',
      'Priority access to all new features',
      'Fable model access (most powerful)',
      'Priority support + Slack channel',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    monthlyPriceINR: null,
    annualPriceINR: null,
    planKey: null,
    color: '#f59e0b',
    highlight: false,
    badge: null,
    tagline: 'For organizations with security, SSO, and audit needs.',
    credits: 0,
    perCredit: null,
    perCreditINR: null,
    features: [
      'Everything in Pro',
      'Single Sign-On (SAML / OIDC)',
      'Org-level roles & permissions',
      'Audit logs',
      'Volume-based custom pricing',
      'Dedicated onboarding',
    ],
  },
]

const TOPUPS = [
  { credits: 200,  price: 19,  priceINR: 399,  key: 'topup_200',  label: 'Boost',  desc: '~6 web builds' },
  { credits: 600,  price: 49,  priceINR: 999,  key: 'topup_600',  label: 'Power',  desc: '~20 web builds' },
  { credits: 2000, price: 99,  priceINR: 1999, key: 'topup_2000', label: 'Studio', desc: '~66 web builds', badge: 'Best value' as string | undefined },
]

const CREDIT_TABLE = [
  { action: 'Web app build (from scratch)',  cost: '30 credits', icon: '🌐' },
  { action: 'Mobile app build',              cost: '30 credits', icon: '📱' },
  { action: 'App edit / iteration',          cost: '2 credits',  icon: '✏️' },
  { action: 'Complex edit (new feature module — most powerful model)', cost: '5 credits', icon: '🧩' },
  { action: 'Build plan (Plan Mode)',        cost: '5 credits',  icon: '🗺️' },
  { action: 'Image generation',              cost: '3 credits',  icon: '🎨' },
  { action: 'Deploy / publish',              cost: 'Free',       icon: '🚀' },
  { action: 'GitHub push / ZIP export',      cost: 'Free',       icon: '📦' },
  { action: 'Auto error fix',                 cost: 'Free',       icon: '🔧' },
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
  currency,
  loading,
  onCheckout,
}: {
  plan: typeof PLANS[0]
  annual: boolean
  currency: Currency
  loading: string | null
  onCheckout: (key: string) => void
}) {
  const inr = currency === 'INR'
  const monthly = inr ? plan.monthlyPriceINR : plan.monthlyPrice
  const annualUnit = inr ? plan.annualPriceINR : plan.annualPrice
  const price = annual ? annualUnit : monthly
  const perCredit = inr ? plan.perCreditINR : plan.perCredit
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

        {price != null ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em', color: '#fafafa' }}>{formatPrice(price, currency)}</span>
            <span style={{ fontSize: 13, color: '#52525b' }}>/mo{annual ? ' · billed annually' : ''}</span>
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa' }}>Custom</div>
        )}

        {annual && price != null && monthly != null && annualUnit != null && (
          <div style={{ fontSize: 11, color: '#22c55e', marginTop: 4, fontWeight: 600 }}>
            Save {formatPrice((monthly - annualUnit) * 12, currency)}/year
          </div>
        )}
      </div>

      {/* Credit pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {plan.credits > 0 && (
          <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
            {plan.credits.toLocaleString()} credits/mo
          </div>
        )}
        {perCredit && (
          <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${plan.color}12`, border: `1px solid ${plan.color}30`, color: plan.color }}>
            {perCredit}/credit
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
      <div style={{ borderTop: '1px solid var(--brand-border)', marginBottom: 18 }} />

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

export function PricingClient({ initialCurrency }: { initialCurrency: Currency }) {
  const [annual, setAnnual] = useState(true)
  // Currency is fixed by the visitor's IP country, decided server-side. US and
  // India are FULLY separate: a US visitor sees the USD product with zero trace
  // of India, and there is no manual switch that could reveal the India entity.
  const currency = initialCurrency
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => setUser(data.user))
    })
  }, [])

  // Spark is India-only; hide it (and never show INR) outside the INR view.
  const visiblePlans = PLANS.filter(p => (currency === 'INR' ? true : !p.inrOnly))

  // Checkout opens in a NEW tab so the app (and any in-flight build/session
  // state) stays alive — same-tab navigation meant users came back via the
  // browser Back button to a remounted editor. The blank tab must be opened
  // synchronously inside the click gesture; window.open after the fetch
  // resolves gets swallowed by popup blockers. Falls back to same-tab if the
  // popup was blocked anyway.
  const startCheckout = async (planKey: string) => {
    if (!user) { window.location.href = '/login?next=/pricing'; return }
    setLoading(planKey)
    const tab = window.open('about:blank', '_blank')
    try {
      const res = await fetch('/api/dodo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey, currency }),
      })
      const d = await res.json()
      if (d.url) {
        if (tab) tab.location.href = d.url
        else window.location.href = d.url
      } else {
        tab?.close()
        alert(d.error ?? 'Checkout error')
      }
    } catch {
      tab?.close()
      alert('Network error')
    } finally {
      setLoading(null)
    }
  }

  const handleCheckout = startCheckout
  const handleTopup = startCheckout

  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-bg)', color: '#fafafa', fontFamily: 'var(--font-display)' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/challenge" style={{ fontSize: 13, color: '#a855f7', textDecoration: 'none', padding: '6px 12px', borderRadius: 7, fontWeight: 600 }}>Weekly Challenge</Link>
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
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,64px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 16 }}>
          Build apps with AI.<br />
          <span style={{ background: `linear-gradient(135deg, ${BRAND}, #38bdf8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Pay only for what you use.
          </span>
        </h1>
        <p style={{ fontSize: 'clamp(15px,1.5vw,18px)', color: '#71717a', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.65 }}>
          Every plan unlocks ALL features — web apps AND mobile apps, same credits, same workspace. No project limits, no feature gates. 50 free credits on signup.
        </p>

        {/* Annual toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--brand-bg-raised)', border: '1px solid var(--brand-border)', borderRadius: 30, padding: '5px 6px', marginBottom: 56 }}>
          <button onClick={() => setAnnual(false)} style={{ padding: '7px 18px', borderRadius: 24, background: !annual ? '#1a1a22' : 'transparent', border: !annual ? '1px solid rgba(255,255,255,0.12)' : 'none', color: !annual ? '#fafafa' : '#52525b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>Monthly</button>
          <button onClick={() => setAnnual(true)} style={{ padding: '7px 18px', borderRadius: 24, background: annual ? '#1a1a22' : 'transparent', border: annual ? '1px solid rgba(255,255,255,0.12)' : 'none', color: annual ? '#fafafa' : '#52525b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7 }}>
            Annual
            <span style={{ fontSize: 10, fontWeight: 800, background: '#22c55e', color: '#000', padding: '2px 7px', borderRadius: 10 }}>SAVE 20%</span>
          </button>
        </div>
      </section>

      {/* Plans grid */}
      <section style={{ padding: '0 clamp(16px,4vw,48px) clamp(60px,8vw,100px)' }}>
        <div className="wyb-pricing-grid" style={{ maxWidth: currency === 'INR' ? 1180 : 960, margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${visiblePlans.length}, 1fr)`, gap: 16 }}>
          {visiblePlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} annual={annual} currency={currency} loading={loading} onCheckout={handleCheckout} />
          ))}
        </div>
      </section>

      {/* What does a credit buy? */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)', borderTop: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px,100%),1fr))', gap: 40, alignItems: 'start' }}>
          {/* Credit table */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>What 1 credit buys you</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,2.5vw,30px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>Credits work across everything</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {CREDIT_TABLE.map(row => (
                <div key={row.action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--brand-bg-raised)', borderRadius: 9, gap: 12 }}>
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
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,2.5vw,30px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>One-time credit packs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TOPUPS.map(t => (
                <div key={t.key} style={{ position: 'relative', background: 'var(--brand-bg-raised)', border: '1px solid var(--brand-border)', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
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
                    {loading === t.key ? '…' : formatPrice(currency === 'INR' ? t.priceINR : t.price, currency)}
                  </button>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#3f3f46', marginTop: 14 }}>Top-up credits stack on top of your monthly plan and never expire.</p>
          </div>
        </div>
      </section>

      {/* Done-for-you builds — hidden for India (low intent there) */}
      {currency !== 'INR' && (
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)', borderTop: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Done For You</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
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
              <div key={b.name} style={{ position: 'relative', background: 'var(--brand-bg-raised)', border: `1px solid ${b.badge ? b.color + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '20px', borderTop: `3px solid ${b.color}` }}>
                {b.badge && <div style={{ position: 'absolute', top: -11, right: 14, background: b.color, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 10px', borderRadius: 20 }}>{b.badge}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: b.color }}>{b.name}</div>
                    <div style={{ fontSize: 10, color: '#52525b' }}>⏱ {b.delivery}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fafafa' }}>{b.price}</div>
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
      )}

      {/* FAQ */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)', borderTop: '1px solid var(--brand-border)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 32, textAlign: 'center' }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              ['What counts as a credit?', 'Building a web or mobile app from scratch costs 30 credits. Each edit or iteration costs 2 credits — a complex edit that builds out a whole new feature module costs 5, since it runs our most powerful model. A build plan costs 5 credits and image generation costs 3 credits. Deploy, publish, GitHub push, ZIP export, and auto error fixes are always free. Top-up packs can be added anytime and never expire.'],
              ['Are features locked behind higher plans?', 'No. Every plan unlocks all features — web apps, mobile apps, Supabase integration, 48 connectors, deploy, GitHub sync. The only difference is how many credits you get.'],
              ['Do credits roll over?', 'Yes. Unused credits carry forward every billing cycle indefinitely as long as your subscription is active.'],
              ['What tools can AI employees use?', 'Gmail, Slack, HubSpot, Notion, Google Calendar, Google Sheets, LinkedIn, Airtable, GitHub, and 20+ more via Composio. All integrations are available on every plan.'],
              ['Can I use my own domain for employees?', 'Yes. On any paid plan you can map a custom domain (netenrich.com/ai-sdr) via a simple CNAME record.'],
              ['What happens if I cancel?', 'You keep access until the end of your billing period. Your employees, KPI data, and app builds are retained for 30 days so you can export everything.'],
            ].map(([q, a], i) => (
              <details key={i} style={{ borderBottom: '1px solid var(--brand-border)', padding: '18px 0' }}>
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
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(16px,4vw,48px)', textAlign: 'center', borderTop: '1px solid var(--brand-border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(14,165,233,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 16 }}>
            Your next app is<br />
            <span style={{ background: `linear-gradient(135deg, ${BRAND}, #38bdf8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              one prompt away.
            </span>
          </h2>
          <p style={{ fontSize: 15, color: '#71717a', marginBottom: 28, lineHeight: 1.65 }}>50 free credits on signup. No credit card required. Describe your app and ship it today.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ padding: '14px 32px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(14,165,233,0.35)' }}>
              Start building for free →
            </Link>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: '#3f3f46' }}>50 free credits · No credit card · Cancel anytime</div>
        </div>
      </section>

      {/* Community programs */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)', borderTop: '1px solid var(--brand-border)', background: currency === 'INR' ? 'rgba(14,165,233,0.04)' : 'transparent' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: currency === 'INR' ? '#0EA5E9' : '#a855f7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{currency === 'INR' ? 'Rewards' : 'Community'}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>{currency === 'INR' ? 'Earn free credits — and do some good' : 'Community programs'}</h2>
            <p style={{ color: '#71717a', fontSize: 14, maxWidth: 480, margin: '0 auto' }}>{currency === 'INR' ? 'Refer, share, and give back — stack bonus credits on top of any plan.' : 'We believe in giving back. These programs reward our community for doing good.'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px,100%), 1fr))', gap: 14 }}>
            {[
              { emoji: '🎁', title: 'Refer a friend', desc: 'Invite friends to WyberAi — you both get bonus credits when they start building.', color: BRAND, reward: 'Free credits', href: '/dashboard' },
              { emoji: '🪙', title: 'Become an affiliate', desc: 'Share WyberAi and earn commission on every paid referral — great for creators.', color: '#22c55e', reward: 'Earn commission', href: '/affiliates' },
              { emoji: '📣', title: 'Build in Public', desc: 'Share what you built on X, Instagram, or Facebook with #BuiltOnWyber and get 50 free credits.', color: '#a855f7', reward: '50 free credits' },
              { emoji: '💼', title: 'Follow on LinkedIn', desc: 'Follow WyberAI on LinkedIn and get 25 bonus credits added to your account instantly.', color: '#0a66c2', reward: '25 free credits' },
              { emoji: '👽', title: 'Follow on Reddit', desc: 'Join r/WyberAI and get 25 bonus credits instantly. Share builds, get feedback, grow with us.', color: '#ff4500', reward: '25 free credits' },
              { emoji: '⭐', title: 'Review on Product Hunt', desc: 'Leave an honest review on Product Hunt and get 50 bonus credits instantly.', color: '#ff6154', reward: '50 free credits' },
              { emoji: '🩸', title: 'Blood Donor Bonus', desc: 'Donated blood in the last 90 days? Get double credits on your next purchase. Because saving lives should be rewarded.', color: '#ef4444', reward: '2x credits on purchase' },
              { emoji: '♿', title: 'Accessibility Program', desc: '50% off any plan for people with disabilities. Reviewed manually — we never ask for medical records.', color: '#a855f7', reward: '50% off any plan' },
            ].map(p => (
              <Link key={p.title} href={'href' in p && p.href ? p.href : '/community-programs'} style={{ textDecoration: 'none', background: 'var(--brand-bg-raised)', border: '1px solid var(--brand-border)', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'all 0.15s' }}>
                <div style={{ fontSize: 28 }}>{p.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>{p.title}</div>
                <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5, flex: 1 }}>{p.desc}</div>
                <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: p.color + '12', color: p.color, border: `1px solid ${p.color}25`, alignSelf: 'flex-start' }}>{p.reward}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Payment trust strip */}
      <section style={{ padding: '24px clamp(16px,4vw,48px)', borderTop: '1px solid var(--brand-border)', background: 'var(--brand-bg-raised)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <span style={{ fontSize: 12, color: '#52525b', fontWeight: 600 }}>Payments secured by</span>
            <span style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 700 }}>Dodo Payments</span>
          </div>
          {[
            { icon: '🔒', label: 'SSL encrypted' },
            { icon: '🛡️', label: 'PCI DSS compliant' },
            { icon: '↩️', label: 'Cancel anytime' },
            { icon: '💳', label: 'Visa · Mastercard · PayPal' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13 }}>{icon}</span>
              <span style={{ fontSize: 11, color: '#3f3f46' }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px clamp(16px,4vw,48px)', borderTop: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <WyberLogo markSize={20} wordmarkSize={13} />
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Community Programs', '/community-programs'], ['Blog', '/blog']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: '#52525b', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`
        
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        details[open] > summary span { transform: rotate(45deg); display: inline-block; }
        details summary::-webkit-details-marker { display: none; }
        @media (max-width: 768px) {
          .wyb-pricing-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .wyb-pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
