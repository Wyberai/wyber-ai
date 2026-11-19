'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type AudienceKey = 'spark-subscriber' | 'builder' | 'newcomer'
type Summary = { total: number; alreadySent: number; remaining: number; sample: string[] }
type Plan = {
  accounts: number; eligible: number; heldBack: number; alreadySent: number; sendEnabled: boolean
  excluded: Record<string, number>
  audiences: Record<AudienceKey, Summary>
}

const LABEL: Record<AudienceKey, { name: string; who: string }> = {
  'spark-subscriber': { name: 'Paying subscriber (Spark)', who: 'Active paid plan. Told their credits are 3×.' },
  builder: { name: 'Builders', who: 'Spent credits on at least one real build.' },
  newcomer: { name: 'Newcomers', who: 'Signed up, never built anything.' },
}
const C = { bg: '#05060a', card: '#0d141e', line: 'rgba(255,255,255,0.12)', text: '#e8eef7', dim: '#8797ab', sky: '#0ea5e9', bad: '#f87171', ok: '#34d399' }
const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20, marginBottom: 16 }
const btn: React.CSSProperties = { background: C.sky, color: '#03111c', border: 0, borderRadius: 8, padding: '9px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: C.text, border: `1px solid ${C.line}` }

async function call(body: object) {
  const res = await fetch('/api/admin/announce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

export default function AnnounceClient() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [error, setError] = useState('')
  const [testTo, setTestTo] = useState('hello@wyberai.com')
  const [extra, setExtra] = useState(false)
  const [msg, setMsg] = useState<Record<string, string>>({})
  const [typed, setTyped] = useState<Record<string, string>>({})
  const [running, setRunning] = useState<AudienceKey | null>(null)
  const [log, setLog] = useState<string[]>([])
  const stop = useRef(false)

  const load = useCallback(async () => {
    setError('')
    const { status, json } = await call({ action: 'plan' })
    if (status !== 200) { setError(json.error || 'Could not load the plan'); return }
    setPlan(json as Plan)
  }, [])
  useEffect(() => { load() }, [load])

  async function test(a: AudienceKey) {
    setMsg(m => ({ ...m, [a]: 'Sending test…' }))
    const { status, json } = await call({ action: 'test', audience: a, to: testTo, extraCreditsAdded: extra })
    setMsg(m => ({ ...m, [a]: status === 200 ? `Test sent to ${json.sentTo}. Check the inbox and spam.` : `Not sent: ${json.error}` }))
  }

  async function send(a: AudienceKey) {
    if (!plan) return
    stop.current = false
    setRunning(a)
    setLog([`Starting ${LABEL[a].name}…`])
    const total = plan.audiences[a].total
    for (let i = 0; i < 400 && !stop.current; i++) {
      const { status, json } = await call({ action: 'send', audience: a, confirmTotal: total, extraCreditsAdded: extra })
      if (status !== 200) { setLog(l => [...l, `Stopped: ${json.error}`]); break }
      setLog(l => [...l, `Sent ${json.sent}, failed ${json.failed}, ${json.remainingAfter} left${json.stopped ? ` (${json.stopped})` : ''}`])
      if (json.stopped && json.sent === 0) break
      if (json.remainingAfter === 0) { setLog(l => [...l, 'Done.']); break }
    }
    if (stop.current) setLog(l => [...l, 'Stopped by you.'])
    setRunning(null)
    load()
  }

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', padding: '32px 20px', fontFamily: 'var(--font-display, system-ui)' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>WyberCode 1.0 announcement</h1>
        <p style={{ color: C.dim, margin: '0 0 20px' }}>Nothing is sent from this page until sending is switched on (ANNOUNCE_ENABLED=true) and you type the exact number. Tests only go to addresses you own.</p>
        {error && <div style={{ ...card, borderColor: C.bad, color: C.bad }}>{error}</div>}

        {plan && (
          <div style={card}>
            <b>{plan.accounts}</b> accounts · <b>{plan.eligible}</b> can be emailed · <b>{plan.heldBack}</b> held back (started a project, never spent credits) · <b>{plan.alreadySent}</b> already sent
            <div style={{ color: C.dim, fontSize: 13, marginTop: 8 }}>
              Left out: {Object.entries(plan.excluded).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k}`).join(', ') || 'none'}.
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: plan.sendEnabled ? C.ok : C.dim }}>{plan.sendEnabled ? 'Sending is ENABLED.' : 'Sending is OFF. You can plan and test, not send.'}</div>
          </div>
        )}

        <div style={card}>
          <label style={{ fontSize: 13, color: C.dim }}>Send tests to (your own address only)</label>
          <input value={testTo} onChange={e => setTestTo(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, background: C.bg, color: C.text, border: `1px solid ${C.line}`, borderRadius: 8, padding: 10 }} />
          <label style={{ display: 'block', marginTop: 12, fontSize: 14 }}>
            <input type="checkbox" checked={extra} onChange={e => setExtra(e.target.checked)} /> The Spark subscriber already has the extra 100 credits (changes one sentence in their email)
          </label>
        </div>

        {plan && (['spark-subscriber', 'builder', 'newcomer'] as AudienceKey[]).map(a => {
          const s = plan.audiences[a]
          const ready = typed[a] === String(s.total) && s.remaining > 0 && plan.sendEnabled && !running
          return (
            <div key={a} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div><b style={{ fontSize: 17 }}>{LABEL[a].name}</b><div style={{ color: C.dim, fontSize: 13 }}>{LABEL[a].who}</div></div>
                <div style={{ textAlign: 'right' }}><b style={{ fontSize: 22 }}>{s.total}</b> people<div style={{ color: C.dim, fontSize: 13 }}>{s.alreadySent} sent · {s.remaining} left</div></div>
              </div>
              <div style={{ color: C.dim, fontSize: 12, marginTop: 8 }}>Sample: {s.sample.join(', ') || 'none'}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14, alignItems: 'center' }}>
                <button style={ghost} onClick={() => test(a)} disabled={!!running}>Send a test</button>
                <input placeholder={`Type ${s.total} to confirm`} value={typed[a] ?? ''} onChange={e => setTyped(t => ({ ...t, [a]: e.target.value }))} style={{ background: C.bg, color: C.text, border: `1px solid ${C.line}`, borderRadius: 8, padding: 9, width: 170 }} />
                <button style={{ ...btn, opacity: ready ? 1 : 0.4, cursor: ready ? 'pointer' : 'not-allowed' }} disabled={!ready} onClick={() => send(a)}>Send to {s.remaining}</button>
                {running === a && <button style={ghost} onClick={() => { stop.current = true }}>Stop</button>}
              </div>
              {msg[a] && <div style={{ marginTop: 10, fontSize: 13, color: msg[a].startsWith('Not sent') ? C.bad : C.ok }}>{msg[a]}</div>}
            </div>
          )
        })}

        {log.length > 0 && <div style={{ ...card, fontFamily: 'monospace', fontSize: 13 }}>{log.map((l, i) => <div key={i}>{l}</div>)}</div>}
      </div>
    </div>
  )
}
