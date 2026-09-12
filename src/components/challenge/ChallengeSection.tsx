'use client'

import { useState } from 'react'

const BRAND = '#0EA5E9'

type Entry = {
  id: string
  title: string
  description: string
  handle: string | null
  live_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  vote_count: number
  created_at: string
}

// Deliberately NOT a public gallery — entries aren't listed anywhere a stranger
// could browse them (see product decision: builders don't want their idea
// shown to competitors browsing the contest). Submitting gives the builder
// their OWN private vote link (src/app/premier-league/vote/[id]) to share on
// their own terms; nobody else can discover it any other way.
export function EntrySubmit({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState<Entry | null>(null)
  const [copied, setCopied] = useState(false)

  const voteUrl = submitted ? `${window.location.origin}/premier-league/vote/${submitted.id}` : ''

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(voteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  return (
    <section style={{ padding: '20px clamp(20px,4vw,48px) 60px', maxWidth: 640, margin: '0 auto' }}>
      {!enabled && (
        <p style={{ fontSize: 12, color: '#a16207', background: 'rgba(161,98,7,0.1)', border: '1px solid rgba(161,98,7,0.25)', borderRadius: 8, padding: '8px 12px', margin: '0 0 16px', display: 'inline-block' }}>
          Owner preview — entries are dark for the public until the flag is flipped.
        </p>
      )}

      {submitted ? (
        <div style={{ textAlign: 'center', padding: '32px 28px', borderRadius: 16, border: '1px solid rgba(14,165,233,0.25)', background: 'rgba(14,165,233,0.06)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
          <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>&quot;{submitted.title}&quot; is entered</p>
          <p style={{ fontSize: 13, color: '#a1a1aa', margin: '0 0 20px', lineHeight: 1.5 }}>This link is yours alone — share it wherever you want to collect Fan Favorite votes. It&apos;s never listed anywhere else.</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px' }}>
            <span style={{ flex: 1, fontSize: 13, color: '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{voteUrl}</span>
            <button onClick={copyLink} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: BRAND, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {copied ? 'Copied ✓' : 'Copy link'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => setOpen(true)} style={{ padding: '14px 32px', borderRadius: 10, background: BRAND, color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 24px rgba(14,165,233,0.25)' }}>
            Submit your build →
          </button>
          <p style={{ fontSize: 12, color: '#52525b', margin: '12px 0 0' }}>Private by default — only you get the link to share.</p>
        </div>
      )}

      {open && <SubmitModal onClose={() => setOpen(false)} onSubmitted={(entry) => { setSubmitted(entry); setOpen(false) }} />}
    </section>
  )
}

function SubmitModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: (e: Entry) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [handle, setHandle] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/challenge/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, handle, liveUrl, videoUrl }),
      })
      if (res.status === 401) { window.location.href = '/login?next=/premier-league'; return }
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      onSubmitted(data.entry)
    } catch { setError('Network error — try again.') } finally { setBusy(false) }
  }

  const field: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.03)', color: '#fafafa', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }
  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: '#a1a1aa', margin: '0 0 6px', display: 'block' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: '#111113', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Submit your build</h3>
        <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 20px', lineHeight: 1.5 }}>Web apps and websites only, no mobile apps this round. Private by default — never listed publicly. Enter as many builds as you want.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label}>App name <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} placeholder="e.g. StreakHabit" style={field} />
          </div>
          <div>
            <label style={label}>One-line pitch <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={description} onChange={e => setDescription(e.target.value)} maxLength={200} placeholder="What does it do?" style={field} />
          </div>
          <div>
            <label style={label}>Your handle (optional)</label>
            <input value={handle} onChange={e => setHandle(e.target.value)} maxLength={60} placeholder="@you" style={field} />
          </div>
          <div>
            <label style={label}>Project URL <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://…" style={field} />
          </div>
          <div>
            <label style={label}>Demo video link (optional)</label>
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube, Loom, Drive…" style={field} />
          </div>
          {error && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.14)', background: 'transparent', color: '#a1a1aa', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={submit} disabled={busy || !title.trim() || !description.trim() || !liveUrl.trim()} style={{ flex: 2, padding: '11px', borderRadius: 9, border: 'none', background: busy || !title.trim() || !description.trim() || !liveUrl.trim() ? '#1f2937' : BRAND, color: '#fff', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Submitting…' : 'Submit entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
