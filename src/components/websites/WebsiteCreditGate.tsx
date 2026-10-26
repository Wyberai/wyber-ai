'use client'
import { useState } from 'react'
import { websiteLaunchEstimate } from '@/lib/credits'
import { track } from '@/lib/track'

// Upfront credit check for builds started from /websites (founder decision
// 2026-10-26): a complete website — build, photos, SEO + AI-search pass,
// edits — uses about websiteLaunchEstimate().min credits at today's prices,
// so the build only starts once the balance covers that. The pending prompt
// stays in localStorage (DashboardClient re-stashes it), so after paying the
// user lands back on /dashboard and the build starts on its own.

const STUDIO = { key: 'topup_2000', credits: 200, INR: '₹1,999', USD: '$99' }

export function WebsiteCreditGate({
  have, currency, businessName, onReady, onCancel,
}: {
  have: number
  currency: 'INR' | 'USD'
  businessName?: string | null
  onReady: () => void
  onCancel: () => void
}) {
  const est = websiteLaunchEstimate()
  const [balance, setBalance] = useState(have)
  const [busy, setBusy] = useState<'pay' | 'check' | null>(null)
  const [error, setError] = useState('')
  const short = Math.max(0, est.min - balance)

  const pay = async () => {
    setBusy('pay'); setError('')
    track('websites_gate_checkout_clicked', { have: balance, need: est.min, currency })
    try {
      const res = await fetch('/api/dodo/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planKey: STUDIO.key, currency }) })
      const d = await res.json()
      if (d.url) window.location.href = d.url
      else setError(d.error || 'Could not start checkout. Please try again.')
    } catch { setError('Could not start checkout. Please try again.') }
    finally { setBusy(null) }
  }

  // Credits land via the payment webhook a few seconds after checkout returns.
  const recheck = async () => {
    setBusy('check'); setError('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      const { data } = user ? await sb.from('profiles').select('credits').eq('id', user.id).single() : { data: null }
      const now = Number(data?.credits ?? balance)
      setBalance(now)
      if (now >= est.min) { track('websites_gate_passed', { have: now }); onReady() }
      else setError(`You have ${now} credits — ${est.min - now} more needed. If you just paid, give it a few seconds.`)
    } finally { setBusy(null) }
  }

  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2, #111114)', border: '1px solid var(--border, #27272a)', borderRadius: 16, padding: 24, width: 440, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--text, #fafafa)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
            {businessName ? `${businessName}’s complete website` : 'Your complete website'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2, #a1a1aa)', lineHeight: 1.55 }}>
            A launch-ready site uses about <strong style={{ color: 'var(--text, #fafafa)' }}>{est.min}–{est.max} credits</strong> at our normal prices. You have {balance}.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
          {est.steps.map(s => (
            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--text2, #a1a1aa)' }}>
              <span>{s.label}</span>
              <span style={{ color: 'var(--text, #fafafa)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{s.max ? `${s.credits}–${s.max}` : s.credits}</span>
            </div>
          ))}
        </div>
        {short > 0 ? (
          <button onClick={pay} disabled={busy !== null} style={{ background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {busy === 'pay' ? 'Opening checkout…' : `Get the Studio pack · ${STUDIO.credits} credits · ${STUDIO[currency]}`}
          </button>
        ) : (
          <button onClick={onReady} style={{ background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Build my website
          </button>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={recheck} disabled={busy !== null} style={{ background: 'none', border: 'none', color: 'var(--text2, #a1a1aa)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit' }}>
            {busy === 'check' ? 'Checking…' : 'I’ve paid — check my credits'}
          </button>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text3, #71717a)', fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Not now</button>
        </div>
        {error && <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>}
      </div>
    </div>
  )
}
