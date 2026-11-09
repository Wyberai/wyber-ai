'use client'

import { useState } from 'react'
import { AUDIENCES, type AudienceId } from './data'

const s = { card: '#0a0c14', border: 'rgba(255,255,255,0.16)', text: '#e6edf6', muted: '#8b94a7', sky: '#0EA5E9', bg: '#05060a' }

const field: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, background: s.bg, color: s.text,
  border: `1px solid ${s.border}`, fontSize: 15, fontFamily: 'inherit', outline: 'none',
}
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: s.muted, marginBottom: 6 }

const PLACEHOLDER: Record<AudienceId, string> = {
  software: 'e.g. We never know which client projects are running late',
  business: 'e.g. I never know which supplier invoices are missing from GSTR-2B',
  student: 'e.g. I cannot keep track of my placement rounds',
}

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

export function ExpoForm({ audience, onAudienceChange }: { audience: AudienceId; onAudienceChange: (a: AudienceId) => void }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    setError('')
    const fd = new FormData(e.currentTarget)
    const params = new URLSearchParams(window.location.search)
    const source = [params.get('utm_source'), params.get('utm_campaign')].filter(Boolean).join(' / ') || 'direct'
    try {
      const res = await fetch('/api/expo-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(fd.entries()), audience, source }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setState('error')
        return
      }
      window.fbq?.('track', 'Lead')
      setState('done')
    } catch {
      setError('Network problem. Please try again.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div style={{ marginTop: 26, maxWidth: 820, padding: 34, borderRadius: 18, background: s.card, border: '1px solid rgba(14,165,233,0.5)' }}>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Got it. Your slot request is in.</div>
        <p style={{ color: s.muted, fontSize: 15, lineHeight: 1.7, margin: 0 }}>
          We&apos;ll message you on WhatsApp to confirm a time. Find us at booth S23, and keep your pain point in mind. That is what we&apos;ll build.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 26, maxWidth: 820, padding: 'clamp(20px,4vw,34px)', borderRadius: 18, background: s.card, border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: 16 }}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0 }} />
      <div>
        <label htmlFor="expo-pain" style={label}>What is the one thing your current software cannot do? *</label>
        <textarea id="expo-pain" name="painPoint" required rows={4} maxLength={800} placeholder={PLACEHOLDER[audience]} style={{ ...field, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <div>
          <label htmlFor="expo-aud" style={label}>Which describes you?</label>
          <select id="expo-aud" value={audience} onChange={e => onAudienceChange(e.target.value as AudienceId)} style={field}>
            {AUDIENCES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="expo-day" style={label}>Which day can you come by?</label>
          <select id="expo-day" name="day" defaultValue="Any day" style={field}>
            <option>27 Nov</option>
            <option>28 Nov</option>
            <option>29 Nov</option>
            <option>Any day</option>
          </select>
        </div>
        <div>
          <label htmlFor="expo-name" style={label}>Your name *</label>
          <input id="expo-name" name="name" required maxLength={80} autoComplete="name" style={field} />
        </div>
        <div>
          <label htmlFor="expo-business" style={label}>Business or college</label>
          <input id="expo-business" name="business" maxLength={120} autoComplete="organization" style={field} />
        </div>
        <div>
          <label htmlFor="expo-wa" style={label}>WhatsApp number *</label>
          <input id="expo-wa" name="whatsapp" type="tel" required maxLength={20} autoComplete="tel" inputMode="tel" style={field} />
        </div>
        <div>
          <label htmlFor="expo-email" style={label}>Email (optional, for your confirmation and reminder)</label>
          <input id="expo-email" name="email" type="email" maxLength={120} autoComplete="email" style={field} />
        </div>
      </div>
      {state === 'error' && <div role="alert" style={{ color: '#f87171', fontSize: 14 }}>{error}</div>}
      <button type="submit" disabled={state === 'sending'} style={{ padding: '14px 22px', borderRadius: 10, border: 'none', background: s.sky, color: '#03111c', fontSize: 16, fontWeight: 800, cursor: state === 'sending' ? 'wait' : 'pointer', opacity: state === 'sending' ? 0.7 : 1 }}>
        {state === 'sending' ? 'Sending…' : 'Book 15 minutes at the booth'}
      </button>
      <p style={{ margin: 0, fontSize: 12, color: '#8797ab', lineHeight: 1.6 }}>
        We use your details to confirm your slot. If you add an email, you&apos;ll get a confirmation, a reminder before your day, and two short follow-ups after the expo. Every email has an unsubscribe link. We don&apos;t sell or share your details.
      </p>
    </form>
  )
}
