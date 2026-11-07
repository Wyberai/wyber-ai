'use client'

import { useRef, useState } from 'react'

const C = { sky: '#0EA5E9', green: '#22c55e', red: '#ef4444', muted: '#8b94a7', card: '#0f121c', border: 'rgba(255,255,255,0.14)', text: '#e6edf6', bg: '#07080d' }
const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '14px 14px', fontSize: 17, borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontFamily: 'inherit' }

// Built for a phone, one hand, standing up: a name, a way to reach them, and what their business struggles with.
export default function BoothClient() {
  const [f, setF] = useState({ name: '', phone: '', company: '', pain: '' })
  const [hot, setHot] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [count, setCount] = useState(0)
  const nameRef = useRef<HTMLInputElement>(null)
  const set = (k: string, v: string) => setF(s => ({ ...s, [k]: v }))

  async function save() {
    if (busy) return
    setBusy(true); setMsg(null)
    try {
      // An "@" in the contact box means they gave an email.
      const contact = f.phone.trim()
      const body = { name: f.name, company: f.company, pain: f.pain, hot, ...(contact.includes('@') ? { email: contact } : { phone: contact }) }
      const res = await fetch('/api/admin/crm/booth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await res.json().catch(() => ({})) as { error?: string; added?: boolean }
      if (!res.ok || j.error) { setMsg({ ok: false, text: j.error ?? 'Could not save. Try again.' }); return }
      setCount(n => n + 1)
      setMsg({ ok: true, text: j.added ? `Saved ${f.name}.` : `${f.name} was already in the CRM; updated.` })
      setF({ name: '', phone: '', company: '', pain: '' }); setHot(false)
      nameRef.current?.focus()
    } catch {
      setMsg({ ok: false, text: 'No connection. Your entry is still on screen; try again.' })
    } finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', padding: '20px 16px 40px', maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Booth capture</h1>
      <p style={{ margin: '0 0 16px', color: C.muted, fontSize: 14 }}>{count} saved this session. Each goes into the CRM as met, with a follow-up due.</p>
      <div style={{ display: 'grid', gap: 12 }}>
        <input ref={nameRef} style={field} placeholder="Name" autoComplete="off" value={f.name} onChange={e => set('name', e.target.value)} />
        <input style={field} placeholder="WhatsApp number or email" autoComplete="off" value={f.phone} onChange={e => set('phone', e.target.value)} />
        <input style={field} placeholder="Company (optional)" autoComplete="off" value={f.company} onChange={e => set('company', e.target.value)} />
        <textarea style={{ ...field, minHeight: 110, resize: 'vertical' }} placeholder="What can their tools not do today? (their words)" value={f.pain} onChange={e => set('pain', e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
          <input type="checkbox" checked={hot} onChange={e => setHot(e.target.checked)} style={{ width: 22, height: 22 }} /> Hot lead: follow up within hours
        </label>
        <button onClick={save} disabled={busy} style={{ padding: 16, fontSize: 18, fontWeight: 800, borderRadius: 12, border: 'none', background: C.sky, color: '#fff', cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : 'Save'}</button>
        {msg && <div role="status" style={{ padding: '12px 14px', borderRadius: 12, fontSize: 15, border: `1px solid ${msg.ok ? C.green : C.red}`, color: msg.ok ? C.green : C.red }}>{msg.text}</div>}
      </div>
    </div>
  )
}
