'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Contact } from '@/lib/crm/contact'
import { buildBrief } from '@/lib/crm/brief'
import { todayQueue } from '@/lib/crm/queue'
import { OPEN_STAGES, SEGMENTS, STAGES, STAGE_LABEL, weightedValue, type Stage } from '@/lib/crm/stages'

const C = { sky: '#0EA5E9', green: '#22c55e', amber: '#f59e0b', red: '#ef4444', muted: '#8b94a7', card: '#0f121c', border: 'rgba(255,255,255,0.10)', text: '#e6edf6', bg: '#07080d' }
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

type Tab = 'today' | 'pipeline' | 'all'
type Activity = { id: number; created_at: string; kind: string; summary: string; by: string | null }

async function api<T = Record<string, unknown>>(method: string, url: string, body?: unknown): Promise<T & { error?: string }> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    return (await res.json()) as T & { error?: string }
  } catch {
    return { error: 'Network problem' } as T & { error?: string }
  }
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
/** wa.me link: a bare 10-digit number is assumed Indian; a longer one already carries its country code. */
function waLink(phone: string | null): string | null {
  const d = (phone ?? '').replace(/\D/g, '')
  if (d.length === 10) return `https://wa.me/91${d}`
  if (d.length >= 11 && d.length <= 15) return `https://wa.me/${d}`
  return null
}
const inDays = (n: number) => new Date(Date.now() + n * 86400_000).toISOString()
const ago = (iso: string | null) => {
  if (!iso) return 'never'
  const h = (Date.now() - new Date(iso).getTime()) / 3600_000
  return h < 1 ? 'just now' : h < 48 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`
}

const input: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, background: C.bg, color: C.text, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }
const btn = (primary = false): React.CSSProperties => ({ padding: '7px 12px', borderRadius: 8, border: `1px solid ${primary ? C.sky : C.border}`, background: primary ? C.sky : 'transparent', color: primary ? '#fff' : C.text, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' })

export default function CrmClient({ initialContacts, loadError }: { initialContacts: Contact[]; loadError: string | null }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [tab, setTab] = useState<Tab>('today')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [stageFilter, setStageFilter] = useState<'' | Stage>('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const now = useMemo(() => new Date(), [contacts])
  const brief = useMemo(() => buildBrief(contacts, now), [contacts, now])
  const queue = useMemo(() => todayQueue(contacts, now, 30), [contacts, now])
  const byId = useMemo(() => new Map(contacts.map(c => [c.id, c])), [contacts])
  const selected = selectedId ? byId.get(selectedId) ?? null : null

  const replace = (c: Contact) => setContacts(prev => prev.map(x => (x.id === c.id ? c : x)))
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 5000) }

  async function patch(id: string, body: Record<string, unknown>) {
    const r = await api<{ contact: Contact }>('PATCH', `/api/admin/crm/contacts/${id}`, body)
    if (r.error) { flash(r.error); return null }
    replace(r.contact); return r.contact
  }
  async function reload() {
    const r = await api<{ contacts: Contact[] }>('GET', '/api/admin/crm/contacts')
    if (r.error) flash(r.error); else setContacts(r.contacts)
  }
  async function markContacted(c: Contact) {
    await api('POST', '/api/admin/crm/activities', { contactId: c.id, kind: 'whatsapp', summary: 'Contacted' })
    await patch(c.id, { ...(c.stage === 'new' ? { stage: 'contacted' } : {}), next_action: 'Follow up', next_action_at: inDays(2) })
    await reload()
  }
  async function runSync() {
    setBusy(true)
    const r = await api<{ found: Record<string, number>; inserted: number; updated: number; skippedOwned: number; warnings: string[] }>('POST', '/api/admin/crm/sync')
    setBusy(false)
    if (r.error) return flash(`Sync failed: ${r.error}`)
    flash(`Synced: ${r.inserted} new, ${r.updated} enriched. Found expo ${r.found.expo}, consults ${r.found.consult}, active signups ${r.found.signups}.${r.warnings.length ? ' Notes: ' + r.warnings.join('; ') : ''}`)
    await reload()
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return contacts
      .filter(c => (!stageFilter || c.stage === stageFilter) && (!s || [c.name, c.company, c.email, c.phone, c.notes].some(v => (v ?? '').toLowerCase().includes(s))))
      .sort((a, b) => b.score - a.score)
      .slice(0, 300)
  }, [contacts, q, stageFilter])

  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: 32, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22 }}>CRM</h1>
        <p style={{ color: C.muted, maxWidth: 560, lineHeight: 1.6 }}>The CRM tables are not available yet. Run <code>20261109000000_internal_crm.sql</code> in the Supabase SQL editor, then reload.</p>
        <p style={{ color: C.red, fontSize: 13 }}>{loadError}</p>
      </div>
    )
  }

  const stat = (label: string, value: string, color = C.text) => (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', minWidth: 130 }}>
      <div style={{ fontSize: 11.5, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', padding: '24px clamp(16px,3vw,40px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>CRM</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={btn()} onClick={() => setShowAdd(true)}>Add lead</button>
          <button style={btn()} onClick={() => setShowImport(true)}>Import CSV</button>
          <a style={btn()} href="/api/admin/crm/export" download>Export CSV</a>
          <button style={btn(true)} disabled={busy} onClick={runSync}>{busy ? 'Syncing…' : 'Sync sources'}</button>
        </div>
      </div>

      {msg && <div role="status" style={{ background: 'rgba(14,165,233,0.12)', border: `1px solid ${C.sky}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        {stat('Won this month', usd(brief.wonMonthUsd), C.green)}
        {stat('Weighted pipeline', usd(brief.weightedUsd), C.sky)}
        {stat('Open leads', String(brief.openCount))}
        {stat('Overdue actions', String(brief.overdue), brief.overdue ? C.red : C.text)}
        {stat('New in 7 days', String(brief.newLast7))}
        {stat('Toward $5M', `${((brief.wonMonthUsd / 5_000_000) * 100).toFixed(2)}%`, C.amber)}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['today', 'pipeline', 'all'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...btn(tab === t), textTransform: 'capitalize' }}>
            {t === 'today' ? `Today (${queue.length})` : t === 'all' ? `All (${contacts.length})` : 'Pipeline'}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <div style={{ display: 'grid', gap: 8, maxWidth: 900 }}>
          {queue.length === 0 && <div style={{ color: C.muted, padding: 20 }}>Nothing urgent. Press <strong>Sync sources</strong> to pull in new expo leads, bookings and active signups.</div>}
          {queue.map(item => {
            const c = byId.get(item.contactId)
            if (!c) return null
            const wa = waLink(c.phone)
            return (
              <div key={item.contactId} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 220, flex: 1 }}>
                  <button onClick={() => setSelectedId(c.id)} style={{ background: 'none', border: 'none', color: C.text, fontSize: 15, fontWeight: 700, padding: 0, cursor: 'pointer', textAlign: 'left' }}>{c.name}</button>
                  <span style={{ color: C.muted, fontSize: 12.5 }}> {c.company ? `· ${c.company}` : ''} · {c.source} · score {c.score}</span>
                  <div style={{ fontSize: 13, color: C.amber, marginTop: 3 }}>{item.reason}</div>
                  {c.notes && <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>{c.notes.slice(0, 140)}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {wa && <a style={{ ...btn(), textDecoration: 'none' }} href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
                  {c.email && <a style={{ ...btn(), textDecoration: 'none' }} href={`mailto:${c.email}`}>Email</a>}
                  <button style={btn(true)} onClick={() => markContacted(c)}>Contacted</button>
                  <button style={btn()} onClick={async () => { await patch(c.id, { next_action_at: inDays(1) }) }}>Snooze 1d</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'pipeline' && (
        <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(230px, 1fr)', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          {OPEN_STAGES.map(stage => {
            const col = contacts.filter(c => c.stage === stage).sort((a, b) => b.score - a.score)
            const sum = col.reduce((a, c) => a + weightedValue(stage, c.value_usd), 0)
            return (
              <div key={stage} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                  <span>{STAGE_LABEL[stage]} · {col.length}</span><span style={{ color: C.muted }}>{usd(sum)}</span>
                </div>
                <div style={{ display: 'grid', gap: 6, maxHeight: '60vh', overflowY: 'auto' }}>
                  {col.slice(0, 40).map(c => (
                    <button key={c.id} onClick={() => setSelectedId(c.id)} style={{ textAlign: 'left', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', color: C.text, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: C.muted }}>{c.company || c.segment} · {c.value_usd ? usd(c.value_usd) : 'no value'} · {c.score}</div>
                    </button>
                  ))}
                  {col.length > 40 && <div style={{ fontSize: 11.5, color: C.muted }}>+{col.length - 40} more (see All)</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'all' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <input style={{ ...input, maxWidth: 320 }} placeholder="Search name, company, email, phone, notes" value={q} onChange={e => setQ(e.target.value)} />
            <select style={{ ...input, maxWidth: 190 }} value={stageFilter} onChange={e => setStageFilter(e.target.value as '' | Stage)}>
              <option value="">All stages</option>
              {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
          </div>
          <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ color: C.muted, textAlign: 'left' }}>{['Name', 'Company', 'Segment', 'Stage', 'Value', 'Score', 'Source', 'Last touch'].map(h => <th key={h} style={{ padding: '9px 10px', fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => setSelectedId(c.id)} style={{ cursor: 'pointer', borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '8px 10px', color: C.muted }}>{c.company ?? ''}</td>
                    <td style={{ padding: '8px 10px' }}>{c.segment}</td>
                    <td style={{ padding: '8px 10px' }}>{STAGE_LABEL[c.stage]}</td>
                    <td style={{ padding: '8px 10px' }}>{c.value_usd ? usd(c.value_usd) : ''}</td>
                    <td style={{ padding: '8px 10px' }}>{c.score}</td>
                    <td style={{ padding: '8px 10px', color: C.muted }}>{c.source}</td>
                    <td style={{ padding: '8px 10px', color: C.muted }}>{ago(c.last_touch_at)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 20, color: C.muted }}>No matches.</td></tr>}
              </tbody>
            </table>
          </div>
          {contacts.length > 300 && <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Showing the top 300 by score. Narrow with search or the stage filter.</div>}
        </div>
      )}

      {selected && <Detail key={selected.id} c={selected} onClose={() => setSelectedId(null)} onSave={body => patch(selected.id, body)} flash={flash} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={async m => { flash(m); await reload() }} />}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onDone={async m => { flash(m); await reload() }} />}
    </div>
  )
}

function Detail({ c, onClose, onSave, flash }: { c: Contact; onClose: () => void; onSave: (b: Record<string, unknown>) => Promise<Contact | null>; flash: (m: string) => void }) {
  const [form, setForm] = useState({ stage: c.stage, value_usd: String(c.value_usd || ''), next_action: c.next_action ?? '', next_action_at: toLocalInput(c.next_action_at), notes: c.notes ?? '', company: c.company ?? '', title: c.title ?? '', phone: c.phone ?? '', email: c.email ?? '', segment: c.segment, lost_reason: c.lost_reason ?? '' })
  const [acts, setActs] = useState<Activity[]>([])
  const [kind, setKind] = useState('note')
  const [text, setText] = useState('')

  useEffect(() => { api<{ activities: Activity[] }>('GET', `/api/admin/crm/activities?contactId=${c.id}`).then(r => { if (!r.error) setActs(r.activities) }) }, [c.id])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const save = async () => {
    const body: Record<string, unknown> = {
      stage: form.stage, value_usd: form.value_usd === '' ? 0 : Number(form.value_usd), next_action: form.next_action,
      next_action_at: form.next_action_at ? new Date(form.next_action_at).toISOString() : null,
      notes: form.notes, company: form.company, title: form.title, phone: form.phone, email: form.email, segment: form.segment,
      ...(form.stage === 'lost' ? { lost_reason: form.lost_reason } : {}),
    }
    const saved = await onSave(body)
    if (saved) { flash('Saved'); api<{ activities: Activity[] }>('GET', `/api/admin/crm/activities?contactId=${c.id}`).then(r => { if (!r.error) setActs(r.activities) }) }
  }
  const addActivity = async () => {
    if (kind.startsWith('reply:')) {
      const r = await api<{ activity: Activity; optedOut: boolean; stage: string }>('POST', '/api/admin/crm/activities', { contactId: c.id, reply: true, channel: kind.slice(6), summary: text })
      if (r.error) return flash(r.error)
      setActs(a => [r.activity, ...a]); setText('')
      flash(r.optedOut ? 'Logged. They asked us to stop, so agents will not write to them again.' : 'Logged. Moved to Replied; the follow-up agent will draft an answer.')
      await onSave({ stage: r.stage })
      return
    }
    const r = await api<{ activity: Activity }>('POST', '/api/admin/crm/activities', { contactId: c.id, kind, summary: text })
    if (r.error) return flash(r.error)
    setActs(a => [r.activity, ...a]); setText('')
  }

  const row = (label: string, el: React.ReactNode) => <label style={{ display: 'grid', gap: 4, fontSize: 12, color: C.muted }}>{label}{el}</label>

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(460px, 100%)', background: C.card, borderLeft: `1px solid ${C.border}`, padding: 18, overflowY: 'auto', display: 'grid', gap: 12, alignContent: 'start' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{c.source} · score {c.score} · added {ago(c.created_at)} · touched {ago(c.last_touch_at)}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <a style={{ ...btn(), textDecoration: 'none' }} href={`/admin/quotes?contact=${c.id}`}>Quote</a>
            <button style={btn()} onClick={onClose}>Close</button>
          </div>
        </div>
        {row('Stage', <select style={input} value={form.stage} onChange={e => set('stage', e.target.value)}>{STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select>)}
        {form.stage === 'lost' && row('Why was it lost?', <input style={input} value={form.lost_reason} onChange={e => set('lost_reason', e.target.value)} />)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {row('Deal value (USD)', <input style={input} inputMode="decimal" value={form.value_usd} onChange={e => set('value_usd', e.target.value)} />)}
          {row('Segment', <select style={input} value={form.segment} onChange={e => set('segment', e.target.value)}>{SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}</select>)}
        </div>
        {row('Next action', <input style={input} value={form.next_action} onChange={e => set('next_action', e.target.value)} />)}
        {row('When', <input style={input} type="datetime-local" value={form.next_action_at} onChange={e => set('next_action_at', e.target.value)} />)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {row('Company', <input style={input} value={form.company} onChange={e => set('company', e.target.value)} />)}
          {row('Title', <input style={input} value={form.title} onChange={e => set('title', e.target.value)} />)}
          {row('Phone', <input style={input} value={form.phone} onChange={e => set('phone', e.target.value)} />)}
          {row('Email', <input style={input} value={form.email} onChange={e => set('email', e.target.value)} />)}
        </div>
        {row('Notes', <textarea style={{ ...input, minHeight: 90, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} />)}
        <button style={btn(true)} onClick={save}>Save</button>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Activity</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <select style={{ ...input, width: 150 }} value={kind} onChange={e => setKind(e.target.value)}>{['note', 'call', 'whatsapp', 'email', 'meeting'].map(k => <option key={k}>{k}</option>)}<option value="reply:whatsapp">They replied (WhatsApp)</option><option value="reply:email">They replied (email)</option></select>
            <input style={input} placeholder={kind.startsWith('reply:') ? 'Paste what they wrote' : 'What happened?'} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addActivity() }} />
            <button style={btn()} onClick={addActivity}>Add</button>
          </div>
          {acts.length === 0 && <div style={{ fontSize: 12.5, color: C.muted }}>No activity yet.</div>}
          {acts.map(a => (
            <div key={a.id} style={{ fontSize: 12.5, borderLeft: `2px solid ${a.kind === 'system' ? C.border : C.sky}`, paddingLeft: 8 }}>
              <span style={{ color: C.muted }}>{a.kind} · {ago(a.created_at)}</span><div>{a.summary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(560px, 100%)', background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{title}</strong><button style={btn()} onClick={onClose}>Close</button></div>
        {children}
      </div>
    </div>
  )
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: (m: string) => Promise<void> }) {
  const [csv, setCsv] = useState('')
  const [source, setSource] = useState('apollo')
  const [segment, setSegment] = useState('business')
  const [country, setCountry] = useState('India')
  const [tags, setTags] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const run = async () => {
    setBusy(true); setErr(null)
    const r = await api<{ rows: number; inserted: number; updated: number; skippedOwned: number; skippedInvalid: number; unmapped: string[]; errors: string[] }>('POST', '/api/admin/crm/import', { csv, source, segment, country, tags: tags.split(',').map(t => t.trim()).filter(Boolean) })
    setBusy(false)
    if (r.error) return setErr(r.error)
    await onDone(`Imported ${r.rows} rows: ${r.inserted} new, ${r.updated} enriched, ${r.skippedOwned} of your own skipped, ${r.skippedInvalid} unusable.${r.unmapped?.length ? ` Unused columns: ${r.unmapped.join(', ')}.` : ''}${r.errors?.length ? ` Errors: ${r.errors[0]}` : ''}`)
    onClose()
  }
  return (
    <Modal title="Import a lead list (CSV)" onClose={onClose}>
      <div style={{ fontSize: 12.5, color: C.muted }}>Paste the whole file, header row first. People already in the CRM are matched by email or phone and enriched, never duplicated.</div>
      <textarea style={{ ...input, minHeight: 150, fontFamily: 'monospace', fontSize: 12 }} placeholder="First Name,Last Name,Email,Phone Number,Company Name,job_title" value={csv} onChange={e => setCsv(e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input style={input} placeholder="Source (apollo, whatsapp_list…)" value={source} onChange={e => setSource(e.target.value)} />
        <select style={input} value={segment} onChange={e => setSegment(e.target.value)}>{SEGMENTS.map(s => <option key={s}>{s}</option>)}</select>
        <input style={input} placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />
        <input style={input} placeholder="Tags, comma separated" value={tags} onChange={e => setTags(e.target.value)} />
      </div>
      {err && <div style={{ color: C.red, fontSize: 13 }}>{err}</div>}
      <button style={btn(true)} disabled={busy || !csv.trim()} onClick={run}>{busy ? 'Importing…' : 'Import'}</button>
    </Modal>
  )
}

function AddModal({ onClose, onDone }: { onClose: () => void; onDone: (m: string) => Promise<void> }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', company: '', notes: '', segment: 'business', value_usd: '' })
  const [err, setErr] = useState<string | null>(null)
  const set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }))
  const run = async () => {
    setErr(null)
    const r = await api('POST', '/api/admin/crm/contacts', { ...f, value_usd: f.value_usd ? Number(f.value_usd) : 0 })
    if (r.error) return setErr(r.error)
    await onDone(`Added ${f.name}`); onClose()
  }
  return (
    <Modal title="Add a lead" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input style={input} placeholder="Name *" value={f.name} onChange={e => set('name', e.target.value)} />
        <input style={input} placeholder="Company" value={f.company} onChange={e => set('company', e.target.value)} />
        <input style={input} placeholder="Email" value={f.email} onChange={e => set('email', e.target.value)} />
        <input style={input} placeholder="Phone / WhatsApp" value={f.phone} onChange={e => set('phone', e.target.value)} />
        <select style={input} value={f.segment} onChange={e => set('segment', e.target.value)}>{SEGMENTS.map(s => <option key={s}>{s}</option>)}</select>
        <input style={input} placeholder="Expected value (USD)" inputMode="decimal" value={f.value_usd} onChange={e => set('value_usd', e.target.value)} />
      </div>
      <textarea style={{ ...input, minHeight: 70 }} placeholder="Notes: who they are, what they need" value={f.notes} onChange={e => set('notes', e.target.value)} />
      {err && <div style={{ color: C.red, fontSize: 13 }}>{err}</div>}
      <button style={btn(true)} disabled={!f.name.trim()} onClick={run}>Add</button>
    </Modal>
  )
}
