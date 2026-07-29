'use client'
import { useState } from 'react'
import { track } from '@/lib/track'

type Currency = 'USD' | 'INR'

interface Plan {
  id: string
  name: string
  price: string
  credits: string
  dailyDrip: string
  planKey: string
  color: string
  highlight?: boolean
  perks: string[]
}

const PLANS_USD: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29/mo',
    credits: '150 credits/mo',
    dailyDrip: '6 daily',
    planKey: 'starter_monthly',
    color: '#22c55e',
    perks: ['~5 full builds/mo', 'All project types', 'Deploy + GitHub free'],
  },
  {
    id: 'builder',
    name: 'Builder',
    price: '$79/mo',
    credits: '500 credits/mo',
    dailyDrip: '20 daily',
    planKey: 'builder_monthly',
    color: '#0ea5e9',
    highlight: true,
    perks: ['~16 full builds/mo', 'Priority Opus model', 'Everything in Starter'],
  },
]

const PLANS_INR: Plan[] = [
  {
    id: 'spark',
    name: 'Spark',
    price: '₹499/mo',
    credits: '50 credits/mo',
    dailyDrip: '2 daily',
    planKey: 'spark_monthly',
    color: '#f59e0b',
    perks: ['~1–2 builds/mo', 'All project types', 'Deploy + GitHub free'],
  },
  {
    id: 'starter_inr',
    name: 'Starter',
    price: '₹1,499/mo',
    credits: '150 credits/mo',
    dailyDrip: '6 daily',
    planKey: 'starter_monthly',
    color: '#0ea5e9',
    highlight: true,
    perks: ['~5 full builds/mo', 'Priority Opus model', 'Everything in Spark'],
  },
]

export function UpgradeModal({ open, onClose, currency }: { open: boolean; onClose: () => void; currency: Currency }) {
  const [loading, setLoading] = useState<string | null>(null)
  const plans = currency === 'INR' ? PLANS_INR : PLANS_USD

  if (!open) return null

  const startCheckout = async (planKey: string) => {
    setLoading(planKey)
    track('editor_upgrade_modal_plan_clicked', { planKey, currency })
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
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
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
          padding: '32px 28px',
          width: '100%',
          maxWidth: 500,
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', color: '#52525b',
            cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4,
          }}
        >×</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#0ea5e9', textTransform: 'uppercase', marginBottom: 10 }}>
            YOU'VE RUN OUT OF CREDITS
          </div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa', fontFamily: 'var(--font-display)' }}>
            Keep building.
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#71717a', lineHeight: 1.5 }}>
            Upgrade to get more credits and build faster.
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'flex', gap: 12 }}>
          {plans.map(plan => (
            <div
              key={plan.id}
              style={{
                flex: 1,
                background: plan.highlight ? 'linear-gradient(160deg,#0d1a26,#0a1318)' : '#111113',
                border: `1px solid ${plan.highlight ? 'rgba(14,165,233,0.35)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 14,
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                position: 'relative',
              }}
            >
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: '#0ea5e9', color: '#fff',
                  fontSize: 9, fontWeight: 800, padding: '2px 10px', borderRadius: 20,
                  letterSpacing: '0.08em', whiteSpace: 'nowrap',
                }}>MOST POPULAR</div>
              )}

              <div style={{ fontSize: 11, fontWeight: 700, color: plan.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)', marginBottom: 2 }}>{plan.price}</div>

              <div style={{ display: 'flex', gap: 5, margin: '10px 0 14px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>{plan.credits}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: `${plan.color}12`, border: `1px solid ${plan.color}30`, color: plan.color }}>{plan.dailyDrip}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {plan.perks.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#a1a1aa' }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 2 }}><path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" fill="none" /></svg>
                    {p}
                  </div>
                ))}
              </div>

              <button
                onClick={() => startCheckout(plan.planKey)}
                disabled={!!loading}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 9,
                  background: loading === plan.planKey ? '#1a1a22' : plan.highlight ? '#0ea5e9' : 'rgba(255,255,255,0.06)',
                  border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  color: loading === plan.planKey ? '#52525b' : '#fff',
                  fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: plan.highlight && !loading ? '0 4px 16px rgba(14,165,233,0.25)' : 'none',
                  transition: 'all 0.15s',
                  marginTop: 'auto',
                }}
              >
                {loading === plan.planKey ? 'Redirecting…' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <a
            href="/pricing"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('editor_upgrade_modal_see_all_plans')}
            style={{ fontSize: 12, color: '#52525b', textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#71717a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#52525b' }}
          >
            See all plans →
          </a>
        </div>
      </div>
    </div>
  )
}
