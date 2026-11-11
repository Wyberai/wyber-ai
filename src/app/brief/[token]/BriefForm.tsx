'use client'
import { useState } from 'react'

interface Q { id: string; label: string; type: 'select' | 'text' | 'long'; required?: boolean; options?: string[]; max: number; hint?: string }

const field: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0a1018', border: '1px solid #1b2a3b', borderRadius: 9,
  padding: '11px 13px', fontSize: 15, color: '#e8eef7', outline: 'none', fontFamily: 'inherit',
}

export function BriefForm({ token, questions, initial, brand, ink }: { token: string; questions: Q[]; initial: Record<string, string>; brand: string; ink: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [fail, setFail] = useState('')
  const set = (id: string, v: string) => setAnswers(a => ({ ...a, [id]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setFail(''); setErrors({})
    const res = await fetch(`/api/brief/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) { setDone(true); window.scrollTo({ top: 0 }); return }
    if (d.errors) setErrors(d.errors)
    setFail(d.error ?? 'Something went wrong. Try again.')
  }

  if (done) {
    return (
      <div role="status" style={{ background: '#0d141e', border: '1px solid #1b2a3b', borderRadius: 14, padding: 28 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Thank you, that is everything we need</div>
        <p style={{ color: '#9aa8bb', fontSize: 15, lineHeight: 1.65, margin: 0 }}>We have your answers and will be in touch. You can come back to this link and change anything until we start.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {questions.map(q => (
        <div key={q.id}>
          <label htmlFor={`q-${q.id}`} style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {q.label}{q.required && <span aria-hidden style={{ color: brand }}> *</span>}
          </label>
          {q.hint && <div id={`h-${q.id}`} style={{ fontSize: 13, color: '#8797ab', marginBottom: 8 }}>{q.hint}</div>}
          {q.type === 'select' ? (
            <select id={`q-${q.id}`} value={answers[q.id] ?? ''} onChange={e => set(q.id, e.target.value)} aria-invalid={!!errors[q.id]} style={field}>
              <option value="">Choose…</option>
              {q.options!.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : q.type === 'long' ? (
            <textarea id={`q-${q.id}`} rows={4} maxLength={q.max} value={answers[q.id] ?? ''} onChange={e => set(q.id, e.target.value)} aria-invalid={!!errors[q.id]} aria-describedby={q.hint ? `h-${q.id}` : undefined} style={{ ...field, resize: 'vertical' }} />
          ) : (
            <input id={`q-${q.id}`} maxLength={q.max} value={answers[q.id] ?? ''} onChange={e => set(q.id, e.target.value)} aria-invalid={!!errors[q.id]} style={field} />
          )}
          {errors[q.id] && <div role="alert" style={{ fontSize: 13, color: '#f87171', marginTop: 6 }}>{errors[q.id]}</div>}
        </div>
      ))}
      {fail && <div role="alert" style={{ fontSize: 14, color: '#f87171' }}>{fail}</div>}
      <button type="submit" disabled={busy} style={{ alignSelf: 'flex-start', padding: '12px 26px', borderRadius: 10, border: 'none', background: brand, color: ink, fontSize: 15, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, fontFamily: 'inherit' }}>
        {busy ? 'Sending…' : 'Send my answers'}
      </button>
    </form>
  )
}
