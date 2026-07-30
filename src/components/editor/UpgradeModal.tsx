'use client'
import { useState, useEffect } from 'react'
import { track } from '@/lib/track'

type Currency = 'USD' | 'INR'
type Billing = 'monthly' | 'annual'

interface PlanConfig {
  id: string
  name: string
  monthlyPrice: string
  annualPrice: string
  annualTotal: string
  annualSavings: string
  credits: string
  dailyDrip: string
  monthlyKey: string
  annualKey: string
  color: string
  highlight?: boolean
  perks: string[]
}

const PLANS_USD: PlanConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: '$29/mo',
    annualPrice: '$23/mo',
    annualTotal: 'billed $276/yr',
    annualSavings: 'Save $72',
    credits: '150 credits/mo',
    dailyDrip: '6 daily',
    monthlyKey: 'starter_monthly',
    annualKey: 'starter_annual',
    color: '#22c55e',
    perks: ['~5 full builds/mo', 'All project types', 'Deploy + GitHub free'],
  },
  {
    id: 'builder',
    name: 'Builder',
    monthlyPrice: '$79/mo',
    annualPrice: '$63/mo',
    annualTotal: 'billed $756/yr',
    annualSavings: 'Save $192',
    credits: '500 credits/mo',
    dailyDrip: '20 daily',
    monthlyKey: 'builder_monthly',
    annualKey: 'builder_annual',
    color: '#0ea5e9',
    highlight: true,
    perks: ['~16 full builds/mo', 'Priority Opus model', 'Everything in Starter'],
  },
]

const PLANS_INR: PlanConfig[] = [
  {
    id: 'spark',
    name: 'Spark',
    monthlyPrice: '₹499/mo',
    annualPrice: '₹399/mo',
    annualTotal: 'billed ₹4,788/yr',
    annualSavings: 'Save ₹1,200',
    credits: '50 credits/mo',
    dailyDrip: '2 daily',
    monthlyKey: 'spark_monthly',
    annualKey: 'spark_annual',
    color: '#f59e0b',
    perks: ['~1–2 builds/mo', 'All project types', 'Deploy + GitHub free'],
  },
  {
    id: 'starter_inr',
    name: 'Starter',
    monthlyPrice: '₹1,499/mo',
    annualPrice: '₹1,199/mo',
    annualTotal: 'billed ₹14,388/yr',
    annualSavings: 'Save ₹3,600',
    credits: '150 credits/mo',
    dailyDrip: '6 daily',
    monthlyKey: 'starter_monthly',
    annualKey: 'starter_annual',
    color: '#0ea5e9',
    highlight: true,
    perks: ['~5 full builds/mo', 'Priority Opus model', 'Everything in Spark'],
  },
]

const TIMER_KEY = 'wy_upgrade_offer_start_v2'
const OFFER_MS = 24 * 60 * 60 * 1000

function useOfferCountdown() {
  const [timeLeft, setTimeLeft] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    let startStr = localStorage.getItem(TIMER_KEY)
    if (!startStr) {
      startStr = String(Date.now())
      localStorage.setItem(TIMER_KEY, startStr)
    }
    const endTs = parseInt(startStr, 10) + OFFER_MS

    const tick = () => {
      const remaining = endTs - Date.now()
      if (remaining <= 0) { setExpired(true); setTimeLeft(''); return }
      const h = Math.floor(remaining / 3600000)
      const m = Math.floor((remaining % 3600000) / 60000)
      const s = Math.floor((remaining % 60000) / 1000)
      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return { timeLeft, expired }
}

export function UpgradeModal({ open, onClose, currency }: { open: boolean; onClose: () => void; currency: Currency }) {
  const [billing, setBilling] = useState<Billing>('annual')
  const [loading, setLoading] = useState<string | null>(null)
  const { timeLeft, expired } = useOfferCountdown()
  const plans = currency === 'INR' ? PLANS_INR : PLANS_USD

  if (!open) return null

  const startCheckout = async (plan: PlanConfig) => {
    const planKey = billing === 'annual' ? plan.annualKey : plan.monthlyKey
    setLoading(planKey)
    track('editor_upgrade_modal_plan_clicked', { planKey, currency, billing })
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
      }
    } catch {
      tab?.close()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0c0c0e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '28px 24px',
          width: '100%',
          maxWidth: 520,
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none', border: 'none', color: '#52525b',
            cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4,
          }}
        >×</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#f97316', textTransform: 'uppercase', marginBottom: 8 }}>
            YOU'VE RUN OUT OF CREDITS
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa', fontFamily: 'var(--font-display)' }}>
            Keep building.
          </h2>
          {/* Countdown urgency */}
          {!expired && timeLeft ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '5px 12px', borderRadius: 20, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <span style={{ fontSize: 10, color: '#f97316', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Special offer expires in</span>
              <span style={{ fontSize: 13, color: '#fb923c', fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>{timeLeft}</span>
            </div>
          ) : (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#71717a' }}>Upgrade to get more credits and build faster.</p>
          )}
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', background: '#18181b', borderRadius: 10, padding: 3, gap: 2, border: '1px solid rgba(255,255,255,0.07)' }}>
            <button
              onClick={() => { setBilling('annual'); track('editor_upgrade_modal_billing_toggle', { billing: 'annual' }) }}
              style={{
                padding: '6px 16px', borderRadius: 8, border: 'none',
                background: billing === 'annual' ? 'linear-gradient(135deg,#0ea5e9,#7c3aed)' : 'transparent',
                color: billing === 'annual' ? '#fff' : '#71717a',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              Annual
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 20,
                background: billing === 'annual' ? 'rgba(255,255,255,0.2)' : 'rgba(34,197,94,0.15)',
                color: billing === 'annual' ? '#fff' : '#22c55e',
                letterSpacing: '0.06em',
              }}>2 MONTHS FREE</span>
            </button>
            <button
              onClick={() => { setBilling('monthly'); track('editor_upgrade_modal_billing_toggle', { billing: 'monthly' }) }}
              style={{
                padding: '6px 16px', borderRadius: 8, border: 'none',
                background: billing === 'monthly' ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: billing === 'monthly' ? '#d4d4d8' : '#52525b',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'flex', gap: 10 }}>
          {plans.map(plan => {
            const isAnnual = billing === 'annual'
            const planKey = isAnnual ? plan.annualKey : plan.monthlyKey
            const isLoading = loading === planKey
            return (
              <div
                key={plan.id}
                style={{
                  flex: 1,
                  background: plan.highlight ? 'linear-gradient(160deg,#0d1a26,#0a1318)' : '#111113',
                  border: `1px solid ${plan.highlight ? (isAnnual ? 'rgba(14,165,233,0.45)' : 'rgba(14,165,233,0.35)') : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14,
                  padding: '18px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: plan.highlight && isAnnual ? '0 0 24px rgba(14,165,233,0.08)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                    background: isAnnual ? 'linear-gradient(90deg,#0ea5e9,#7c3aed)' : '#0ea5e9',
                    color: '#fff',
                    fontSize: 9, fontWeight: 800, padding: '2px 10px', borderRadius: 20,
                    letterSpacing: '0.08em', whiteSpace: 'nowrap',
                  }}>{isAnnual ? 'BEST VALUE' : 'MOST POPULAR'}</div>
                )}

                <div style={{ fontSize: 11, fontWeight: 700, color: plan.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{plan.name}</div>

                {/* Price */}
                <div style={{ marginBottom: 2 }}>
                  {isAnnual && (
                    <span style={{ fontSize: 11, color: '#52525b', textDecoration: 'line-through', marginRight: 5 }}>{plan.monthlyPrice}</span>
                  )}
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                </div>

                {isAnnual && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: '#71717a' }}>{plan.annualTotal}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>{plan.annualSavings}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 4, margin: '8px 0 12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>{plan.credits}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: `${plan.color}12`, border: `1px solid ${plan.color}30`, color: plan.color }}>{plan.dailyDrip}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                  {plan.perks.map(p => (
                    <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 11, color: '#a1a1aa' }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 2 }}><path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" fill="none" /></svg>
                      {p}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => startCheckout(plan)}
                  disabled={!!loading}
                  style={{
                    width: '100%', padding: '11px 0', borderRadius: 9,
                    background: isLoading
                      ? '#1a1a22'
                      : plan.highlight
                        ? (isAnnual ? 'linear-gradient(135deg,#0ea5e9,#7c3aed)' : '#0ea5e9')
                        : 'rgba(255,255,255,0.06)',
                    border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    color: isLoading ? '#52525b' : '#fff',
                    fontSize: 12, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: plan.highlight && !isLoading && isAnnual ? '0 4px 20px rgba(14,165,233,0.3)' : 'none',
                    transition: 'all 0.15s',
                    marginTop: 'auto',
                  }}
                >
                  {isLoading
                    ? 'Redirecting…'
                    : isAnnual
                      ? `Get ${plan.name} Annual`
                      : `Upgrade to ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#52525b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 12 12"><path d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 1.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm0 1v2.25l1.5 1" stroke="#52525b" strokeWidth="1.2" strokeLinecap="round" fill="none"/></svg>
            30-day money-back guarantee
          </div>
          <a
            href="/pricing"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('editor_upgrade_modal_see_all_plans')}
            style={{ fontSize: 11, color: '#3f3f46', textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#71717a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3f3f46' }}
          >
            See all plans →
          </a>
        </div>
      </div>
    </div>
  )
}
