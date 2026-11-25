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

export interface FeedbackItem { id: string; kind: 'approved' | 'changes_requested' | 'comment'; author_name: string | null; body: string | null; created_at: string; resolved?: boolean }

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
              {f.kind === 'changes_requested' && f.resolved && <span style={{ color: '#22c55e', fontWeight: 600 }}> · Done</span>}
              {f.body && <div style={{ color: '#c7d1de', marginTop: 2 }}>{f.body}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export interface QuoteView {
  id: string; number: string; title: string; currency: string; items: Array<{ description: string; qty: number; unit: number }>
  total: number; note: string | null; terms?: string | null; recurrence?: string | null; status: 'sent' | 'accepted' | 'declined' | 'paid'
  responded_by: string | null; payment_instructions: string | null; payment_url: string | null
}

function money(n: number, currency: string): string {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency }).format(n) } catch { return currency + ' ' + n.toFixed(2) }
}

export function QuoteCard({ slug, quote, brand, ink, business }: { slug: string; quote: QuoteView; brand: string; ink: string; business?: { business_name: string | null } | null; clientName?: string }) {
  const [status, setStatus] = useState(quote.status)
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [declining, setDeclining] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [by, setBy] = useState(quote.responded_by)
  useEffect(() => { setName(readName()) }, [])

  async function respond(action: 'accept' | 'decline') {
    if (busy) return
    if (action === 'accept' && name.trim().length < 2) { setErr('Type your name to accept.'); return }
    setBusy(true); setErr('')
    saveName(name.trim())
    const res = await fetch('/api/portal/' + slug + '/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quoteId: quote.id, action, name, reason }) })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setErr(d.error ?? 'Could not send that. Try again.'); return }
    setStatus(d.status); setBy(name.trim() || null); setDeclining(false)
  }

  const cell: React.CSSProperties = { padding: '8px 0', fontSize: 13, borderTop: '1px solid #14202e' }
  const head: React.CSSProperties = { ...cell, borderTop: 'none', color: '#8797ab', fontWeight: 600 }
  return (
    <div style={{ background: '#0d141e', border: '1px solid #1b2a3b', borderRadius: 14, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div><div style={{ fontSize: 12, color: '#8797ab' }}>{quote.number}</div><div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{quote.title}</div></div>
        <div style={{ fontSize: 12, fontWeight: 700, color: status === 'declined' ? '#f87171' : status === 'sent' ? '#F59E0B' : '#22c55e' }}>
          {status === 'sent' ? 'Waiting for your answer' : status === 'accepted' ? 'Accepted' : status === 'paid' ? 'Paid' : 'Declined'}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th scope="col" style={{ ...head, textAlign: 'left' }}>Item</th><th scope="col" style={{ ...head, textAlign: 'right' }}>Qty</th><th scope="col" style={{ ...head, textAlign: 'right' }}>Amount</th></tr></thead>
        <tbody>
          {quote.items.map((it, i) => (
            <tr key={i}><td style={{ ...cell, color: '#c7d1de' }}>{it.description}</td><td style={{ ...cell, textAlign: 'right', color: '#9aa8bb' }}>{it.qty}</td><td style={{ ...cell, textAlign: 'right', color: '#c7d1de' }}>{money(it.qty * it.unit, quote.currency)}</td></tr>
          ))}
          <tr><td style={{ ...cell, fontWeight: 700, color: '#fff' }} colSpan={2}>Total</td><td style={{ ...cell, textAlign: 'right', fontWeight: 800, color: '#fff', fontSize: 15 }}>{money(quote.total, quote.currency)}{quote.recurrence === 'monthly' ? ' / month' : quote.recurrence === 'yearly' ? ' / year' : ''}</td></tr>
        </tbody>
      </table>
      {quote.note && <p style={{ fontSize: 13, color: '#9aa8bb', lineHeight: 1.6, margin: '12px 0 0', whiteSpace: 'pre-wrap' }}>{quote.note}</p>}
      {quote.terms && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ fontSize: 12, color: '#8797ab', cursor: 'pointer' }}>Terms{business?.business_name ? ' from ' + business.business_name : ''}</summary>
          <p style={{ fontSize: 12, color: '#9aa8bb', lineHeight: 1.6, margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{quote.terms}</p>
        </details>
      )}
      <div style={{ marginTop: 12 }}><a href={'/client/' + slug + '/quote/' + quote.id} target="_blank" rel="noopener" style={{ fontSize: 12, color: '#8797ab' }}>Open a printable copy</a></div>

      {status === 'sent' && !declining && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input aria-label="Type your full name to accept" value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder="Type your name to accept" style={{ ...field, flex: '1 1 200px', width: 'auto' }} />
          <button type="button" disabled={busy} onClick={() => respond('accept')} style={{ padding: '10px 18px', borderRadius: 9, border: 'none', background: brand, color: ink, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Accept quote</button>
          <button type="button" onClick={() => { setDeclining(true); setErr('') }} style={{ padding: '10px 14px', borderRadius: 9, border: '1px solid #1b2a3b', background: 'transparent', color: '#9aa8bb', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Decline</button>
        </div>
      )}
      {status === 'sent' && declining && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea aria-label="Why are you declining? (optional)" rows={2} value={reason} onChange={e => setReason(e.target.value)} maxLength={500} placeholder="Anything we should know? (optional)" style={{ ...field, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" disabled={busy} onClick={() => respond('decline')} style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: '#7f1d1d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Decline quote</button>
            <button type="button" onClick={() => setDeclining(false)} style={{ padding: '9px 14px', borderRadius: 9, border: 'none', background: 'transparent', color: '#9aa8bb', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
          </div>
        </div>
      )}
      {err && <div role="alert" style={{ marginTop: 10, fontSize: 13, color: '#f87171' }}>{err}</div>}

      {(status === 'accepted' || status === 'paid') && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #14202e' }}>
          {by && <div style={{ fontSize: 12, color: '#8797ab', marginBottom: 8 }}>Accepted by {by}</div>}
          {status === 'accepted' && (quote.payment_instructions || quote.payment_url) && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8797ab', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>How to pay</div>
              {quote.payment_instructions && <p style={{ fontSize: 14, color: '#c7d1de', lineHeight: 1.6, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{quote.payment_instructions}</p>}
              {quote.payment_url && <a href={quote.payment_url} target="_blank" rel="noreferrer noopener" style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 9, background: brand, color: ink, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Pay now →</a>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
