'use client'
import Link from 'next/link'
import { useState } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

const SKY = '#0EA5E9'

const FEATURES = [
  'Single sign-on (SAML / OIDC via your identity provider)',
  'Org-level roles & permissions for your team',
  'Audit logs for every settings, membership, and access change',
  'Volume-based custom pricing',
  'Dedicated onboarding',
]

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#111115', border: '1px solid #2a2a35',
  borderRadius: 9, padding: '10px 14px', fontSize: 14, color: '#e4e4e7', outline: 'none', fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#71717a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }

export default function EnterprisePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [state, setState] = useState<'idle' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/enterprise/leads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company, teamSize, message }),
    })
    setState(res.ok ? 'sent' : 'error')
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: 'var(--font-display)', color: '#e4e4e7' }}>
      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/pricing" style={{ fontSize: 12, color: '#52525b', textDecoration: 'none' }}>&larr; Pricing</Link>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 32px 100px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enterprise</span>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '14px 0 12px', lineHeight: 1.15 }}>Same product, built for your organization</h1>
          <p style={{ color: '#71717a', fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>
            WyberAi powers thousands of self-serve builds today. The Enterprise plan adds the identity, access, and visibility controls your security team will ask for — SSO, org roles, and audit logs — on top of the same builder.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: '#f59e0b', fontSize: 14, lineHeight: 1.5 }}>&#10003;</span>
                <span style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
          <Link href="/security" style={{ fontSize: 13, color: SKY, textDecoration: 'none' }}>Read our security overview &rarr;</Link>
        </div>

        <div style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 16, padding: 28, alignSelf: 'start' }}>
          {state === 'sent' ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>&#9993;</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Thanks — we got it</div>
              <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6 }}>We reply to every enterprise enquiry personally, usually within one business day.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 18 }}>Talk to us</div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Work email *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Company *</label>
                <input required value={company} onChange={e => setCompany(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Team size</label>
                <select value={teamSize} onChange={e => setTeamSize(e.target.value)} style={{ ...inputStyle, padding: '10px 12px' }}>
                  <option value="">Select…</option>
                  {['1-10', '11-50', '51-200', '201-500', '500+'].map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>What are you looking to build?</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              {state === 'error' && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 14 }}>Something went wrong — email hello@wyberai.com directly and we&apos;ll follow up.</div>}
              <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: submitting ? '#1a1a22' : SKY, border: 'none', color: submitting ? '#52525b' : '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {submitting ? 'Sending…' : 'Contact sales'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
