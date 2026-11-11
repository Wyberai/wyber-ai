'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// The interactive parts of the public client page: the passcode gate, the review controls on each deliverable, and the
// quiet beacon that tells the agency the page was opened. Colours come from the client's brand, passed in by the page.

const NAME_KEY = 'wyber-client-reviewer-name'

function readName(): string { try { return localStorage.getItem(NAME_KEY) ?? '' } catch { return '' } }
function saveName(n: string) { try { localStorage.setItem(NAME_KEY, n) } catch { /* private window */ } }

const field: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0a1018', border: '1px solid #1b2a3b', borderRadius: 9,
  padding: '10px 12px', fontSize: 14, color: '#e8eef7', outline: 'none', fontFamily: 'inherit',
}

export function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => { fetch(`/api/portal/${slug}/view`, { method: 'POST', keepalive: true }).catch(() => {}) }, [slug])
  return null
}

export function PasscodeGate({ slug, brand, ink }: { slug: string; brand: string; ink: string }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!code || busy) return
    setBusy(true); setErr('')
    const res = await fetch(`/api/portal/${slug}/unlock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode: code }) })
    if (res.ok) { router.refresh(); return }
    const d = await res.json().catch(() => ({}))
    setErr(d.error ?? 'Something went wrong. Try again.')
    setBusy(false)
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label htmlFor="portal-code" style={{ fontSize: 13, color: '#9aa8bb' }}>Passcode</label>
      <input id="portal-code" type="password" autoComplete="off" autoFocus value={code} onChange={e => setCode(e.target.value)} style={field} aria-describedby={err ? 'portal-err' : undefined} />
      {err && <div id="portal-err" role="alert" style={{ fontSize: 13, color: '#f87171' }}>{err}</div>}
      <button type="submit" disabled={busy || !code} style={{ padding: '11px 18px', borderRadius: 9, border: 'none', background: brand, color: ink, fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy || !code ? 0.6 : 1 }}>
        {busy ? 'Checking…' : 'Open'}
      </button>
    </form>
  )
}

export interface FeedbackItem { id: string; kind: 'approved' | 'changes_requested' | 'comment'; author_name: string | null; body: string | null; created_at: string }

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  pending: { text: 'Waiting for your review', color: '#9aa8bb' },
  approved: { text: 'Approved', color: '#22c55e' },
  changes_requested: { text: 'Changes requested', color: '#f59e0b' },
}

function when(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function ReviewControls({ slug, deliverableId, status: initial, feedback: initialFeedback, brand, ink }: {
  slug: string; deliverableId: string; status: string; feedback: FeedbackItem[]; brand: string; ink: string
}) {
  const [status, setStatus] = useState(initial)
  const [feedback, setFeedback] = useState(initialFeedback)
  const [mode, setMode] = useState<null | 'changes_requested' | 'comment'>(null)
  const [note, setNote] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { setName(readName()) }, [])

  async function send(kind: 'approved' | 'changes_requested' | 'comment') {
    if (busy) return
    if (kind !== 'approved' && !note.trim()) { setErr('Write a few words first.'); return }
    setBusy(true); setErr('')
    saveName(name.trim())
    const res = await fetch(`/api/portal/${slug}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deliverableId, kind, note, name }) })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setErr(d.error ?? 'Could not send that. Try again.'); return }
    if (d.reviewStatus) setStatus(d.reviewStatus)
    setFeedback(f => [...f, { id: `new-${Date.now()}`, kind, author_name: name.trim() || null, body: note.trim() || null, created_at: new Date().toISOString() }])
    setNote(''); setMode(null)
  }

  const s = STATUS_LABEL[status] ?? STATUS_LABEL.pending
  const btn: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #14202e', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: s.color }}>
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />{s.text}
        </span>
        <span style={{ flex: 1 }} />
        {status !== 'approved' && (
          <button type="button" disabled={busy} onClick={() => send('approved')} style={{ ...btn, background: brand, color: ink, border: 'none' }}>Approve</button>
        )}
        <button type="button" onClick={() => { setMode(mode === 'changes_requested' ? null : 'changes_requested'); setErr('') }} style={{ ...btn, background: 'transparent', color: '#e8eef7', border: '1px solid #1b2a3b' }}>Request changes</button>
        <button type="button" onClick={() => { setMode(mode === 'comment' ? null : 'comment'); setErr('') }} style={{ ...btn, background: 'transparent', color: '#9aa8bb', border: '1px solid #1b2a3b' }}>Comment</button>
      </div>

      {mode && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea aria-label={mode === 'changes_requested' ? 'What should change?' : 'Your comment'} rows={3} value={note} onChange={e => setNote(e.target.value)} maxLength={1500} placeholder={mode === 'changes_requested' ? 'What should change?' : 'Your comment'} style={{ ...field, resize: 'vertical' }} />
          <input aria-label="Your name (optional)" value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder="Your name (optional)" style={field} />
          {err && <div role="alert" style={{ fontSize: 13, color: '#f87171' }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" disabled={busy} onClick={() => send(mode)} style={{ ...btn, background: brand, color: ink, border: 'none' }}>{busy ? 'Sending…' : 'Send'}</button>
            <button type="button" onClick={() => { setMode(null); setErr('') }} style={{ ...btn, background: 'transparent', color: '#9aa8bb', border: 'none' }}>Cancel</button>
          </div>
        </div>
      )}
      {!mode && err && <div role="alert" style={{ marginTop: 8, fontSize: 13, color: '#f87171' }}>{err}</div>}

      {feedback.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {feedback.map(f => (
            <li key={f.id} style={{ fontSize: 13, color: '#9aa8bb', lineHeight: 1.55 }}>
              <strong style={{ color: '#e8eef7', fontWeight: 600 }}>{f.author_name || 'You'}</strong>{' '}
              {f.kind === 'approved' ? 'approved this' : f.kind === 'changes_requested' ? 'asked for changes' : 'commented'}
              <span style={{ color: '#5d6d82' }}> · {when(f.created_at)}</span>
              {f.body && <div style={{ color: '#c7d1de', marginTop: 2 }}>{f.body}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
