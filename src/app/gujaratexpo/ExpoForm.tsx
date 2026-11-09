'use client'

import { useState } from 'react'
import { AUDIENCES, type AudienceId } from './data'

const s = { card: '#0a0c14', border: 'rgba(255,255,255,0.16)', text: '#e6edf6', muted: '#8b94a7', sky: '#0EA5E9', bg: '#05060a' }

const field: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, background: s.bg, color: s.text,
  border: `1px solid ${s.border}`, fontSize: 15, fontFamily: 'inherit', outline: 'none',
}
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: s.muted, marginBottom: 6 }
const linkBtn: React.CSSProperties = {
  display: 'inline-block', padding: '12px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none',
  background: 'transparent', color: s.text, border: `1px solid ${s.border}`,
}

const PLACEHOLDER: Record<AudienceId, string> = {
  software: 'e.g. We never know which client projects are running late',
  business: 'e.g. I never know which supplier invoices are missing from GSTR-2B',
  student: 'e.g. I cannot keep track of my placement rounds',
}

// Times are 9:30 to 17:30 India time (04:00 to 12:00 UTC) for a chosen day, or all three days when "Any day".
const DAY_DATES: Record<string, string> = {
  '27 Nov': '20261127T040000Z/20261127T120000Z',
  '28 Nov': '20261128T040000Z/20261128T120000Z',
  '29 Nov': '20261129T040000Z/20261129T120000Z',
  'Any day': '20261127/20261130',
}
function calendarUrl(day: string): string {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Tech Expo Gujarat: WyberAi, booth S23',
    dates: DAY_DATES[day] ?? DAY_DATES['Any day'],
    details: 'Bring your pain point and we will build it live. Booking page: https://wyberai.com/gujaratexpo',
    location: 'Gujarat University Convention & Exhibition Centre, Ahmedabad',
  })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}
const SHARE_TEXT = 'Tech Expo Gujarat, 27-29 Nov, Ahmedabad: WyberAi (booth S23) builds your software idea live in 15 minutes. Book a slot: https://wyberai.com/gujaratexpo'

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

export function ExpoForm({ audience, onAudienceChange }: { audience: AudienceId; onAudienceChange: (a: AudienceId) => void }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [chosenDay, setChosenDay] = useState('Any day')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    setError('')
    const fd = new FormData(e.currentTarget)
    const params = new URLSearchParams(window.location.search)
    // utm_content names the exact ad ("A1_reel"), so the booking alert shows which creative worked.
    const source = [params.get('utm_source'), params.get('utm_campaign'), params.get('utm_content')].filter(Boolean).join(' / ') || 'direct'
    setChosenDay(String(fd.get('day') || 'Any day'))
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          <a href={calendarUrl(chosenDay)} target="_blank" rel="noopener noreferrer" style={linkBtn}>Add to calendar</a>
          <a href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`} target="_blank" rel="noopener noreferrer" style={linkBtn}>Send this to a colleague</a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 26, maxWidth: 820, padding: 'clamp(20px,4vw,34px)', borderRadius: 18, background: s.card, border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: 16 }}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0 }} />
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <div>
          <label htmlFor="expo-name" style={label}>Your name *</label>
          <input id="expo-name" name="name" required maxLength={80} autoComplete="name" style={field} />
        </div>
        <div>
          <label htmlFor="expo-wa" style={label}>WhatsApp number *</label>
          <input id="expo-wa" name="whatsapp" type="tel" required maxLength={20} autoComplete="tel" inputMode="tel" style={field} />
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
          <label htmlFor="expo-aud" style={label}>Which describes you?</label>
          <select id="expo-aud" value={audience} onChange={e => onAudienceChange(e.target.value as AudienceId)} style={field}>
            {AUDIENCES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="expo-pain" style={label}>What is the one thing your current software cannot do? (optional, helps us prepare)</label>
        <textarea id="expo-pain" name="painPoint" rows={3} maxLength={800} placeholder={PLACEHOLDER[audience]} style={{ ...field, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <div>
          <label htmlFor="expo-business" style={label}>Business or college (optional)</label>
          <input id="expo-business" name="business" maxLength={120} autoComplete="organization" style={field} />
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
        By booking you agree that we may message you on WhatsApp about your slot. We use your details only to confirm it and to follow up about the expo. If you add an email, you&apos;ll get a confirmation, a reminder before your day, and two short follow-ups after the expo. Every email has an unsubscribe link. We don&apos;t sell or share your details.
      </p>
    </form>
  )
}
