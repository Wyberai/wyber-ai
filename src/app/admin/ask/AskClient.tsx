'use client'

import { useEffect, useRef, useState } from 'react'

const C = { sky: '#0EA5E9', green: '#22c55e', red: '#ef4444', muted: '#8b94a7', card: '#0f121c', border: 'rgba(255,255,255,0.10)', text: '#e6edf6', bg: '#07080d' }

interface Proposal { action: Record<string, unknown>; label: string; state?: 'idle' | 'running' | 'done' | 'failed'; result?: string }
interface Turn { role: 'user' | 'assistant'; content: string; tools?: string[]; error?: boolean; proposals?: Proposal[] }

const SUGGESTIONS = [
  'Give me a one-minute report on where the company stands today',
  'How many signups did we get each day this week, and how far is that from 100 a day?',
  'Who should I contact first today, and why?',
  'Which accepted quotes are still unpaid?',
  'How are the agents doing, and how much time have they saved?',
  'How many booth slot requests do we have for each expo day?',
  'Where do signups drop off between signing up and paying?',
  'What is going to happen over the next 3 days?',
  'Is everything that should be running actually running?',
]

const TOOL_LABEL: Record<string, string> = {
  pipeline_summary: 'pipeline', find_contacts: 'contacts', contact_detail: 'a contact', signups: 'signups', quotes: 'quotes',
  agent_drafts: 'agent drafts', agent_results: 'agent results', expo: 'expo', today: 'today', schedule: 'schedule', growth: 'growth plan', funnel: 'funnel', propose_action: 'a suggested action',
}

export default function AskClient() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [turns, busy])

  async function send(q: string) {
    const question = q.trim()
    if (!question || busy) return
    const next: Turn[] = [...turns, { role: 'user', content: question }]
    setTurns(next); setText(''); setBusy(true)
    try {
      const res = await fetch('/api/admin/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next.filter(t => !t.error).map(t => ({ role: t.role, content: t.content })) }) })
      const j = await res.json().catch(() => ({})) as { reply?: string; error?: string; toolsUsed?: string[]; proposals?: Proposal[] }
      setTurns(t => [...t, j.reply ? { role: 'assistant', content: j.reply, tools: j.toolsUsed, proposals: j.proposals } : { role: 'assistant', content: j.error ?? 'Something went wrong. Try again.', error: true }])
    } catch {
      setTurns(t => [...t, { role: 'assistant', content: 'No connection. Try again.', error: true }])
    } finally { setBusy(false) }
  }

  async function confirm(turnIdx: number, pIdx: number) {
    const patch = (state: Proposal['state'], result?: string) => setTurns(ts => ts.map((t, i) => i !== turnIdx ? t : { ...t, proposals: t.proposals?.map((p, k) => k === pIdx ? { ...p, state, result } : p) }))
    const p = turns[turnIdx]?.proposals?.[pIdx]
    if (!p || p.state === 'running' || p.state === 'done') return
    patch('running')
    try {
      const res = await fetch('/api/admin/ask/act', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: p.action }) })
      const j = await res.json().catch(() => ({})) as { message?: string; error?: string }
      patch(res.ok ? 'done' : 'failed', j.message ?? j.error ?? 'Something went wrong')
    } catch { patch('failed', 'No connection. Nothing was changed.') }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 53px)', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', maxWidth: 820, margin: '0 auto', padding: '20px 16px' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Ask anything</h1>
      <p style={{ margin: '0 0 14px', color: C.muted, fontSize: 14 }}>Ask about the pipeline, signups, quotes, agents or the expo. It reads your data; it cannot send or change anything.</p>

      <div style={{ flex: 1, display: 'grid', gap: 10, alignContent: 'start' }}>
        {turns.length === 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} style={{ justifySelf: t.role === 'user' ? 'end' : 'start', maxWidth: '92%', padding: '10px 14px', borderRadius: 14, whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: 14.5, background: t.role === 'user' ? C.sky : C.card, color: t.error ? C.red : t.role === 'user' ? '#fff' : C.text, border: t.role === 'user' ? 'none' : `1px solid ${C.border}` }}>
            {t.content}
            {t.proposals && t.proposals.length > 0 && (
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                {t.proposals.map((p, k) => (
                  <div key={k} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', background: C.bg }}>
                    <div style={{ fontSize: 13.5 }}>{p.label}</div>
                    {p.state === 'done' || p.state === 'failed'
                      ? <div style={{ marginTop: 6, fontSize: 13, color: p.state === 'done' ? C.green : C.red }}>{p.result}</div>
                      : <button onClick={() => confirm(i, k)} disabled={p.state === 'running'} style={{ marginTop: 8, padding: '7px 14px', borderRadius: 8, border: 'none', background: C.sky, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: p.state === 'running' ? 0.6 : 1 }}>{p.state === 'running' ? 'Working…' : 'Confirm'}</button>}
                  </div>
                ))}
              </div>
            )}
            {t.tools && t.tools.length > 0 && <div style={{ marginTop: 8, fontSize: 11.5, color: C.muted }}>Looked at: {t.tools.map(x => TOOL_LABEL[x] ?? x).join(', ')}</div>}
          </div>
        ))}
        {busy && <div style={{ color: C.muted, fontSize: 14 }}>Looking at the data…</div>}
        <div ref={endRef} />
      </div>

      <form onSubmit={e => { e.preventDefault(); send(text) }} style={{ display: 'flex', gap: 8, marginTop: 14, position: 'sticky', bottom: 0, background: C.bg, paddingTop: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Ask for any number or report…" maxLength={2000}
          style={{ flex: 1, padding: '13px 14px', fontSize: 15, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontFamily: 'inherit' }} />
        <button type="submit" disabled={busy || !text.trim()} style={{ padding: '0 20px', borderRadius: 12, border: 'none', background: C.sky, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: busy || !text.trim() ? 0.5 : 1 }}>Ask</button>
      </form>
    </div>
  )
}
