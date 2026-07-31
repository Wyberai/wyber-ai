'use client'
import { useState, useEffect } from 'react'
import { track } from '@/lib/track'

type Currency = 'USD' | 'INR'

interface PlanConfig {
  id: string
  name: string
  monthlyPrice: string
  annualPrice: string
  annualTotal: string
  annualSavings: string
  savingsPct: string
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
    annualSavings: 'Save $72/yr',
    savingsPct: '20%',
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
    annualSavings: 'Save $192/yr',
    savingsPct: '20%',
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
    annualSavings: 'Save ₹1,200/yr',
    savingsPct: '20%',
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
    annualSavings: 'Save ₹3,600/yr',
    savingsPct: '20%',
    credits: '150 credits/mo',
    dailyDrip: '6 daily',
    monthlyKey: 'starter_monthly',
    annualKey: 'starter_annual',
    color: '#0ea5e9',
    highlight: true,
    perks: ['~5 full builds/mo', 'Priority Opus model', 'Everything in Spark'],
  },
]

// Countdown resets every time the modal is first opened in a session.
// Stored in sessionStorage (not localStorage) so it's always fresh each visit.
const TIMER_KEY = 'wy_upgrade_offer_session_v3'
const OFFER_MS = 15 * 60 * 1000 // 15 minutes — tight urgency window

function useOfferCountdown() {
  const [timeLeft, setTimeLeft] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    let startStr = sessionStorage.getItem(TIMER_KEY)
    if (!startStr) {
      startStr = String(Date.now())
      sessionStorage.setItem(TIMER_KEY, startStr)
    }
    const endTs = parseInt(startStr, 10) + OFFER_MS

    const tick = () => {
      const remaining = endTs - Date.now()
      if (remaining <= 0) { setExpired(true); setTimeLeft(''); return }
      const m = Math.floor(remaining / 60000)
      const s = Math.floor((remaining % 60000) / 1000)
      setTimeLeft(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return { timeLeft, expired }
}

export function UpgradeModal({ open, onClose, currency, trigger = 'out-of-credits' }: {
  open: boolean
  onClose: () => void
  currency: Currency
  trigger?: 'nudge' | 'out-of-credits'
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [showMonthly, setShowMonthly] = useState(false)
  const { timeLeft, expired } = useOfferCountdown()
  const plans = currency === 'INR' ? PLANS_INR : PLANS_USD

  if (!open) return null

  const startCheckout = async (planKey: string, plan: PlanConfig, billing: 'annual' | 'monthly') => {
    setLoading(planKey)
    setCheckoutError(null)
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
        setCheckoutError(d.error || 'Could not start checkout. Please try again or contact support.')
        track('editor_upgrade_modal_checkout_failed', { planKey, currency, billing, error: d.error || 'no_url' })
      }
    } catch (err) {
      tab?.close()
      setCheckoutError('Could not start checkout. Please try again or contact support.')
      track('editor_upgrade_modal_checkout_failed', { planKey, currency, billing, error: String(err) })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
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
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#f97316', textTransform: 'uppercase', marginBottom: 8 }}>
            {trigger === 'out-of-credits' ? "YOU'VE RUN OUT OF CREDITS" : 'ANNUAL PLAN — SAVE 20%'}
          </div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa', fontFamily: 'var(--font-display)' }}>
            {trigger === 'out-of-credits' ? 'Keep building.' : 'Lock in your annual rate.'}
          </h2>

          {/* Countdown */}
          {!expired && timeLeft ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '6px 14px', borderRadius: 20, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.35)' }}>
              <span style={{ fontSize: 10, color: '#f97316', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Annual price locks in</span>
              <span style={{ fontSize: 14, color: '#fb923c', fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', minWidth: 42 }}>{timeLeft}</span>
            </div>
          ) : (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: '#71717a' }}>Annual billing. Cancel any time.</p>
          )}

          {/* Social proof */}
          <div style={{ marginTop: 10, fontSize: 11, color: '#52525b' }}>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>●</span> {currency === 'INR' ? '120+ builders' : '200+ builders'} upgraded to annual this month
          </div>
        </div>

        {/* Plan cards — annual pricing shown by default */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {plans.map(plan => {
            const planKey = plan.annualKey
            const isLoading = loading === planKey
            return (
              <div
                key={plan.id}
                style={{
                  flex: 1,
                  background: plan.highlight ? 'linear-gradient(160deg,#0d1a26,#0a1318)' : '#111113',
                  border: `1px solid ${plan.highlight ? 'rgba(14,165,233,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14,
                  padding: '18px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: plan.highlight ? '0 0 30px rgba(14,165,233,0.1)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg,#0ea5e9,#7c3aed)',
                    color: '#fff',
                    fontSize: 9, fontWeight: 800, padding: '3px 12px', borderRadius: 20,
                    letterSpacing: '0.08em', whiteSpace: 'nowrap',
                  }}>BEST VALUE</div>
                )}

                <div style={{ fontSize: 11, fontWeight: 700, color: plan.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{plan.name}</div>

                {/* Price — annual with monthly strikethrough */}
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#52525b', textDecoration: 'line-through', marginRight: 6 }}>{plan.monthlyPrice}</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
                    {plan.annualPrice}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: '#71717a' }}>{plan.annualTotal}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>{plan.annualSavings}</span>
                </div>

                <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
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
                  onClick={() => startCheckout(planKey, plan, 'annual')}
                  disabled={!!loading}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 9,
                    background: isLoading
                      ? '#1a1a22'
                      : plan.highlight
                        ? 'linear-gradient(135deg,#0ea5e9,#7c3aed)'
                        : 'rgba(255,255,255,0.07)',
                    border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    color: isLoading ? '#52525b' : '#fff',
                    fontSize: 13, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: plan.highlight && !isLoading ? '0 4px 24px rgba(14,165,233,0.35)' : 'none',
                    transition: 'all 0.15s',
                    marginTop: 'auto',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {isLoading ? 'Redirecting…' : `Get ${plan.name} Annual →`}
                </button>
              </div>
            )
          })}
        </div>

        {checkoutError && (
          <div style={{ marginTop: 8, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', fontSize: 11.5, color: '#f87171', textAlign: 'center' }}>
            {checkoutError}
          </div>
        )}

        {/* Monthly fallback — hidden by default, shown on demand */}
        {showMonthly && (
          <div style={{ marginTop: 8, padding: '12px 14px', borderRadius: 10, background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 8 }}>Monthly billing (no savings)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {plans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => startCheckout(plan.monthlyKey, plan, 'monthly')}
                  disabled={!!loading}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  {loading === plan.monthlyKey ? 'Redirecting…' : `${plan.name} ${plan.monthlyPrice}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#52525b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 12 12"><path d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 1.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm0 1v2.25l1.5 1" stroke="#52525b" strokeWidth="1.2" strokeLinecap="round" fill="none"/></svg>
            30-day money-back guarantee · Cancel any time
          </div>
          <button
            onClick={() => { setShowMonthly(v => !v); track('editor_upgrade_modal_monthly_toggle') }}
            style={{ fontSize: 11, color: '#3f3f46', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#71717a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3f3f46' }}
          >
            {showMonthly ? 'Hide monthly options' : 'Need to pay month-to-month instead? →'}
          </button>
        </div>
      </div>
    </div>
  )
}
