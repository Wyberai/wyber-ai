'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TipModalProps {
  open: boolean
  onClose: () => void
  states: string[]
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--brand-border-strong)',
  background: 'var(--brand-bg)', color: 'var(--brand-text)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--brand-text-dim)', marginBottom: 6 }

export function TipModal({ open, onClose, states }: TipModalProps) {
  const [examName, setExamName] = useState('')
  const [state, setState] = useState('')
  const [year, setYear] = useState('')
  const [description, setDescription] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const reset = () => {
    setExamName(''); setState(''); setYear(''); setDescription(''); setSourceUrl(''); setEmail(''); setWebsite('')
    setStatus('idle'); setErrorMsg('')
  }
  const handleClose = () => { onClose(); if (status === 'success') reset() }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examName.trim() || !description.trim()) {
      setStatus('error'); setErrorMsg('Exam name and description are required.')
      return
    }
    setStatus('submitting')
    try {
      const res = await fetch('/api/paper-leaks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examName, state, year, description, sourceUrl, email, website }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not submit — try again.')
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Could not submit — try again.')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(5,6,10,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            className="mk-card"
            style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(20px,3vw,28px)' }}
          >
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Thanks — submitted for review</div>
                <p style={{ fontSize: 13, color: 'var(--brand-text-dim)', lineHeight: 1.6, marginBottom: 20 }}>
                  Every submission is manually verified against real news sources before it&rsquo;s added — nothing here auto-publishes.
                </p>
                <button onClick={handleClose} className="mk-btn" style={{ padding: '10px 24px' }}>Close</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div className="mk-eyebrow">Suggest a paper leak</div>
                  <button type="button" onClick={handleClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--brand-text-faint)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--brand-text-faint)', lineHeight: 1.6, margin: '4px 0 20px' }}>
                  Know a documented exam paper-leak incident that isn&rsquo;t on this dashboard? A source link makes it much faster to verify and add.
                </p>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle} htmlFor="tip-exam">Exam name *</label>
                  <input id="tip-exam" style={inputStyle} value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. XYZ Recruitment Exam 2025" required maxLength={200} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle} htmlFor="tip-state">State</label>
                    <input id="tip-state" style={inputStyle} value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Bihar" list="tip-states" maxLength={100} />
                    <datalist id="tip-states">
                      {states.filter(s => s !== 'All').map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="tip-year">Year</label>
                    <input id="tip-year" style={inputStyle} type="number" min={1990} max={2027} value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2025" />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle} htmlFor="tip-desc">What happened? *</label>
                  <textarea id="tip-desc" style={{ ...inputStyle, resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief summary — what was leaked, when, and what happened after" required maxLength={2000} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle} htmlFor="tip-source">Source link</label>
                  <input id="tip-source" style={inputStyle} type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle} htmlFor="tip-email">Your email (optional, for follow-up)</label>
                  <input id="tip-email" style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>

                {/* Honeypot — hidden from real visitors, bots tend to fill every field */}
                <input
                  type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)}
                  tabIndex={-1} autoComplete="off" aria-hidden="true"
                  style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
                />

                {status === 'error' && (
                  <div style={{ fontSize: 12.5, color: '#ef4444', marginBottom: 14 }}>{errorMsg}</div>
                )}

                <button type="submit" disabled={status === 'submitting'} className="mk-btn" style={{ width: '100%', justifyContent: 'center', padding: '11px 0', opacity: status === 'submitting' ? 0.6 : 1, cursor: status === 'submitting' ? 'default' : 'pointer' }}>
                  {status === 'submitting' ? 'Submitting…' : 'Submit for review'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
