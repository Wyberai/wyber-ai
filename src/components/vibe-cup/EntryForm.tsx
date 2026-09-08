'use client'

import { useState } from 'react'
import Link from 'next/link'

const SAFFRON = '#FF6B00'
const GOLD = '#F59E0B'
const BRAND = '#0EA5E9'
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Other']

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '12px 14px',
  fontSize: 14,
  color: '#fafafa',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.5)',
  marginBottom: 8,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

export function EntryForm() {
  const [form, setForm] = useState({ name: '', email: '', city: '', project_url: '', description: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/vibe-cup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error || 'Something went wrong.'); setStatus('error'); return }
      setStatus('success')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fafafa', marginBottom: 10 }}>You&apos;re in!</div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>
          Entry received. We&apos;ll review all submissions after October 31 and announce the winner on November 7. Good luck!
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 'clamp(24px,4vw,40px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Full name *</label>
          <input required style={inputStyle} placeholder="Rahul Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>City *</label>
          <select required style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer' }} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
            <option value="">Select city</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Email address *</label>
        <input required type="email" style={inputStyle} placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      </div>

      <div>
        <label style={labelStyle}>WyberAi project URL *</label>
        <input required style={inputStyle} placeholder="https://wyberai.com/app/your-project" value={form.project_url} onChange={e => setForm(f => ({ ...f, project_url: e.target.value }))} />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Share the link to your live WyberAi project.</div>
      </div>

      <div>
        <label style={labelStyle}>What does your app do? <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(optional)</span></label>
        <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} placeholder="Describe the problem your app solves in 2-3 sentences..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>

      {status === 'error' && (
        <div style={{ fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px' }}>
          {errorMsg}
        </div>
      )}

      <button type="submit" disabled={status === 'loading'} style={{ padding: '16px', borderRadius: 10, background: status === 'loading' ? 'rgba(255,107,0,0.5)' : `linear-gradient(135deg, ${SAFFRON}, ${GOLD})`, color: '#000', fontSize: 15, fontWeight: 800, border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em', transition: 'opacity 0.15s' }}>
        {status === 'loading' ? 'Submitting…' : 'Submit My Entry →'}
      </button>

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.6 }}>
        By entering you agree to WyberAi&apos;s <Link href="/terms" style={{ color: BRAND, textDecoration: 'none' }}>Terms</Link>. One entry per person. Deadline: October 31, 2026.
      </div>
    </form>
  )
}
