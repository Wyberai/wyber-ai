'use client'

import { useState } from 'react'

// Abuse-report control on every published app (App Store 1.2 / Google Play UGC
// policy). Sits bottom-left so it never collides with the bottom-right "Built
// with WyberAi" badge. Self-contained: inline styles only, no shared CSS, since
// this renders on the wyberai.com shell around a sandboxed app iframe.

const REASONS: { value: string; label: string }[] = [
  { value: 'sexual', label: 'Sexual or explicit content' },
  { value: 'violence', label: 'Violence or graphic content' },
  { value: 'hate', label: 'Hate or harassment' },
  { value: 'illegal', label: 'Illegal or dangerous' },
  { value: 'malware', label: 'Scam, phishing or malware' },
  { value: 'copyright', label: 'Copyright or impersonation' },
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'other', label: 'Something else' },
]

export default function ReportButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function submit() {
    if (!reason || state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, reason, details: details.trim() || undefined }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  function close() {
    setOpen(false)
    // Reset after the modal is dismissed so a re-open starts clean.
    setTimeout(() => {
      setReason('')
      setDetails('')
      setState('idle')
    }, 200)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Report this app"
        style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          padding: '5px 10px',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        <span aria-hidden style={{ fontSize: 12, lineHeight: 1 }}>⚑</span>
        Report
      </button>

      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 380,
              background: '#141416',
              border: '1px solid #2e2e38',
              borderRadius: 16,
              padding: 24,
              color: '#f0f0f4',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            {state === 'done' ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 34, marginBottom: 10 }}>✅</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Report received</div>
                <p style={{ fontSize: 14, color: '#a0a0ae', lineHeight: 1.55, margin: '0 0 20px' }}>
                  Thanks — our team reviews reports and takes action within 24 hours.
                </p>
                <button onClick={close} style={primaryBtn}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Report this app</div>
                <p style={{ fontSize: 13, color: '#8a8a98', lineHeight: 1.5, margin: '0 0 18px' }}>
                  Apps on WyberAi are generated with AI and published by users. Tell us what&apos;s wrong
                  and we&apos;ll review it.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {REASONS.map((r) => (
                    <label
                      key={r.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 11px',
                        borderRadius: 9,
                        border: `1px solid ${reason === r.value ? '#0EA5E9' : '#2a2a34'}`,
                        background: reason === r.value ? 'rgba(14,165,233,0.08)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: 13.5,
                      }}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        style={{ accentColor: '#0EA5E9' }}
                      />
                      {r.label}
                    </label>
                  ))}
                </div>

                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Add any details (optional)"
                  rows={3}
                  maxLength={2000}
                  style={{
                    width: '100%',
                    background: '#0d0d0f',
                    border: '1px solid #2a2a34',
                    borderRadius: 9,
                    padding: '10px 12px',
                    color: '#f0f0f4',
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    marginBottom: 16,
                    boxSizing: 'border-box',
                  }}
                />

                {state === 'error' && (
                  <p style={{ fontSize: 13, color: '#ef8888', margin: '0 0 12px' }}>
                    Couldn&apos;t submit. Please try again.
                  </p>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={close} style={secondaryBtn}>Cancel</button>
                  <button
                    onClick={submit}
                    disabled={!reason || state === 'sending'}
                    style={{ ...primaryBtn, flex: 1, opacity: !reason || state === 'sending' ? 0.5 : 1 }}
                  >
                    {state === 'sending' ? 'Sending…' : 'Submit report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const primaryBtn: React.CSSProperties = {
  background: '#0EA5E9',
  color: '#fff',
  border: 'none',
  borderRadius: 9,
  padding: '11px 20px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const secondaryBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#a0a0ae',
  border: '1px solid #2a2a34',
  borderRadius: 9,
  padding: '11px 18px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
