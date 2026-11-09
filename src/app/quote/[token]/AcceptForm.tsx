'use client'

import { useState } from 'react'

export default function AcceptForm({ token, totalLabel }: { token: string; totalLabel: string }) {
  const [name, setName] = useState('')
  const [agree, setAgree] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending'); setError(null)
    try {
      const res = await fetch(`/api/quote/${token}/accept`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, agree }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) { setError(j.error || 'Something went wrong. Please try again.'); setState('idle'); return }
      setState('done')
    } catch {
      setError('Network problem. Please try again.'); setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div role="status" style={{ background: '#ecfdf3', border: '1px solid #b7ebcb', borderRadius: 10, padding: '14px 16px', fontSize: 15 }}>
        <strong>Thank you, {name.trim().split(' ')[0]}.</strong> Your acceptance is recorded. We will confirm payment and delivery details with you in writing.
      </div>
    )
  }

  const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 9, border: '1px solid #cdd3df', fontSize: 15, fontFamily: 'inherit' }
  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>Accept this quote ({totalLabel})</div>
      <label style={{ display: 'grid', gap: 5, fontSize: 13, color: '#4b5563' }}>
        Your full name
        <input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={100} autoComplete="name" style={field} />
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5 }}>
        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 3 }} />
        <span>I have read the scope, price and terms above and I accept this quote.</span>
      </label>
      {error && <div role="alert" style={{ color: '#b91c1c', fontSize: 14 }}>{error}</div>}
      <button type="submit" disabled={state === 'sending' || !agree || name.trim().length < 2} style={{ padding: '13px 18px', borderRadius: 10, border: 'none', background: '#0EA5E9', color: '#03111c', fontSize: 16, fontWeight: 800, cursor: 'pointer', opacity: state === 'sending' || !agree || name.trim().length < 2 ? 0.55 : 1 }}>
        {state === 'sending' ? 'Sending…' : 'Accept quote'}
      </button>
    </form>
  )
}
