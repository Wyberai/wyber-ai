'use client'
import { useState, useEffect } from 'react'

export function ReferralCard() {
  const [code, setCode] = useState('')
  const [count, setCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [creditsEarned, setCreditsEarned] = useState(0)

  useEffect(() => {
    fetch('/api/referral').then(r => r.json()).then(d => {
      if (d.code) { setCode(d.code); setCount(d.count); setCreditsEarned(d.creditsEarned) }
    }).catch(() => {})
  }, [])

  const copy = () => {
    const link = `https://wyberai.com/signup?ref=${code}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!code) return null

  return (
    <div style={{ padding: '10px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={copy}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 9, background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={copied ? '#22c55e' : '#71717a'} strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16,6 12,2 8,6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: copied ? '#22c55e' : '#fafafa', fontFamily: 'inherit' }}>
            {copied ? '✓ Link copied!' : 'Share Wyber AI'}
          </div>
          <div style={{ fontSize: 10, color: '#52525b' }}>
            {count > 0 ? `${count} referrals · ${creditsEarned} credits earned` : '50 credits per referral signup'}
          </div>
        </div>
      </button>
    </div>
  )
}
