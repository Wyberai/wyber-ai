'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { computeTotal, formatMoney, type Currency, type QuoteItem, type QuoteStatus } from '@/lib/quotes/quote'
import { whatsappLink } from '@/lib/ops/agents/draft-actions'

const C = { sky: '#0EA5E9', green: '#22c55e', amber: '#f59e0b', red: '#ef4444', muted: '#8b94a7', card: '#0f121c', border: 'rgba(255,255,255,0.10)', text: '#e6edf6', bg: '#07080d' }
const STATUS_COLOR: Record<QuoteStatus, string> = { draft: C.muted, sent: C.sky, viewed: C.amber, accepted: C.green, declined: C.red, expired: C.muted }

interface Quote {
  id: string; token: string; contact_id: string | null; contact_name?: string | null; title: string; currency: Currency; items: QuoteItem[]; total: number
  scope: string | null; terms: string | null; valid_until: string | null; status: QuoteStatus; sent_at: string | null; view_count: number; accepted_at: string | null; accepted_by: string | null; paid_at?: string | null; created_at: string
}
interface ContactLite { id: string; name: string; company: string | null; phone: string | null }

async function api<T = Record<string, unknown>>(method: string, url: string, body?: unknown): Promise<T & { error?: string }> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    return (await res.json()) as T & { error?: string }
  } catch { return { error: 'Network problem' } as T & { error?: string } }
}
const input: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, background: C.bg, color: C.text, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }
const btn = (primary = false, danger = false): React.CSSProperties => ({ padding: '7px 12px', borderRadius: 8, border: `1px solid ${danger ? C.red : primary ? C.sky : C.border}`, background: primary ? C.sky : 'transparent', color: primary ? '#fff' : danger ? C.red : C.text, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' })
const blankItem = (): QuoteItem => ({ description: '', qty: 1, unit_price: 0 })
const ago = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '')

interface Form { id: string | null; contact_id: string; title: string; currency: Currency; valid_until: string; items: QuoteItem[]; scope: string; terms: string }
const emptyForm = (contact_id = ''): Form => ({ id: null, contact_id, title: '', currency: 'USD', valid_until: '', items: [blankItem()], scope: '', terms: '' })

export default function QuotesClient() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [contacts, setContacts] = useState<ContactLite[]>([])
  const [outlines, setOutlines] = useState<Record<string, string>>({})
  const [form, setForm] = useState<Form | null>(null)
  const [status, setStatus] = useState<QuoteStatus>('draft')
  const [share, setShare] = useState<{ url: string; message: string } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [tablesMissing, setTablesMissing] = useState(false)

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 6000) }

  const load = useCallback(async () => {
    const r = await api<{ quotes: Quote[]; tablesMissing?: boolean }>('GET', '/api/admin/quotes')
    if (r.tablesMissing) setTablesMissing(true)
    else if (r.quotes) setQuotes(r.quotes)
  }, [])

  useEffect(() => {
    load()
    api<{ contacts: ContactLite[] }>('GET', '/api/admin/crm/contacts').then(r => { if (r.contacts) setContacts(r.contacts.map(c => ({ id: c.id, name: c.name, company: c.company, phone: c.phone }))) })
    // The proposal agent's outline for each contact, ready to drop into a quote's scope.
    api<{ drafts: { agent: string; contact_id: string | null; body: string; status: string }[] }>('GET', '/api/admin/agents/state').then(r => {
      const m: Record<string, string> = {}
      for (const d of r.drafts ?? []) if (d.agent === 'proposal' && d.contact_id && (d.status === 'pending' || d.status === 'approved')) m[d.contact_id] = d.body
      setOutlines(m)
    })
    const c = new URLSearchParams(window.location.search).get('contact')
    if (c) setForm(emptyForm(c))
  }, [load])

  const byId = useMemo(() => new Map(contacts.map(c => [c.id, c])), [contacts])
  const contact = form?.contact_id ? byId.get(form.contact_id) ?? null : null
  const total = form ? computeTotal(form.items.map(i => ({ ...i, qty: Number(i.qty) || 0, unit_price: Number(i.unit_price) || 0 }))) : 0
  const locked = !!form?.id && status !== 'draft'

  function edit(q: Quote) {
    setShare(null); setStatus(q.status)
    setForm({ id: q.id, contact_id: q.contact_id ?? '', title: q.title, currency: q.currency, valid_until: q.valid_until ?? '', items: q.items.length ? q.items : [blankItem()], scope: q.scope ?? '', terms: q.terms ?? '' })
  }
  const payload = (f: Form) => ({ title: f.title, currency: f.currency, valid_until: f.valid_until || null, scope: f.scope, terms: f.terms, contact_id: f.contact_id || undefined, items: f.items.map(i => ({ description: i.description, qty: Number(i.qty), unit_price: Number(i.unit_price) })) })

  async function save(): Promise<Quote | null> {
    if (!form) return null
    const r = form.id
      ? await api<{ quote: Quote }>('PATCH', `/api/admin/quotes/${form.id}`, { action: 'update', ...payload(form) })
      : await api<{ quote: Quote }>('POST', '/api/admin/quotes', payload(form))
    if (r.error) { flash(r.error); return null }
    setForm(f => (f ? { ...f, id: r.quote.id } : f)); setStatus(r.quote.status)
    flash('Draft saved'); await load()
    return r.quote
  }
  async function send() {
    const q = await save()
    if (!q) return
    const r = await api<{ url: string; message: string }>('PATCH', `/api/admin/quotes/${q.id}`, { action: 'send' })
    if (r.error) return flash(r.error)
    setStatus('sent'); setShare({ url: r.url, message: r.message })
    flash('Marked as sent. The deal is now at Proposal with a follow-up in 3 days.'); await load()
  }
  async function markPaid(id: string) {
    if (!confirm('Mark this quote as paid? Payment reminders to the client will stop.')) return
    const r = await api('PATCH', `/api/admin/quotes/${id}`, { action: 'mark_paid' })
    if (r.error) return flash(r.error)
    flash('Marked as paid'); await load()
  }
  async function withdraw(id: string) {
    if (!confirm('Withdraw this quote? The link will stop accepting.')) return
    const r = await api('PATCH', `/api/admin/quotes/${id}`, { action: 'withdraw' })
    if (r.error) return flash(r.error)
    flash('Withdrawn'); setForm(null); await load()
  }
  const setItem = (idx: number, patch: Partial<QuoteItem>) => setForm(f => (f ? { ...f, items: f.items.map((i, k) => (k === idx ? { ...i, ...patch } : i)) } : f))
  const outline = form?.contact_id ? outlines[form.contact_id] : undefined

  if (tablesMissing) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: 32, fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
        <h1 style={{ fontSize: 22 }}>Quotes</h1>
        <p style={{ color: C.muted, lineHeight: 1.6 }}>The quotes table is not available yet. Run <code>20261109020000_crm_quotes.sql</code> in the Supabase SQL editor, then reload.</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', padding: '24px clamp(16px,3vw,40px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Quotes</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin/crm" style={btn()}>CRM</a>
          <a href="/admin/agents" style={btn()}>Agents</a>
          <button style={btn(true)} onClick={() => { setShare(null); setStatus('draft'); setForm(emptyForm()) }}>New quote</button>
        </div>
      </div>
      {msg && <div role="status" style={{ background: 'rgba(14,165,233,0.12)', border: `1px solid ${C.sky}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: form ? 'minmax(280px, 380px) 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          {quotes.length === 0 && <div style={{ color: C.muted, padding: 16 }}>No quotes yet. Create one from a lead after you have met them.</div>}
          {quotes.map(q => (
            <button key={q.id} onClick={() => edit(q)} style={{ textAlign: 'left', background: C.card, border: `1px solid ${form?.id === q.id ? C.sky : C.border}`, borderRadius: 12, padding: '12px 14px', color: C.text, cursor: 'pointer', fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong style={{ fontSize: 14 }}>{q.title}</strong>
                <span style={{ color: STATUS_COLOR[q.status], fontSize: 12, fontWeight: 700 }}>{q.status}</span>
              </div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>{q.contact_name ?? 'No contact'} · {formatMoney(q.total, q.currency)} · {q.view_count} view{q.view_count === 1 ? '' : 's'} · {ago(q.created_at)}</div>
              {q.status === 'accepted' && <div style={{ fontSize: 12.5, color: C.green, marginTop: 3 }}>Accepted by {q.accepted_by}{q.paid_at ? ' · Paid' : ' · Awaiting payment'}</div>}
            </button>
          ))}
        </div>

        {form && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 16 }}>{form.id ? (locked ? `Quote (${status})` : 'Edit draft') : 'New quote'}</strong>
              <button style={btn()} onClick={() => { setForm(null); setShare(null) }}>Close</button>
            </div>

            {locked && <div style={{ fontSize: 13, color: C.amber }}>A sent quote is not edited in place, because the client may be reading it. Withdraw it and make a new one to change anything.</div>}

            <label style={{ display: 'grid', gap: 4, fontSize: 12, color: C.muted }}>Client (from the CRM)
              <select style={input} disabled={locked} value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })}>
                <option value="">No contact linked</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 12, color: C.muted }}>Title
              <input style={input} disabled={locked} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. GST reconciliation tool for Patel Traders" />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'grid', gap: 4, fontSize: 12, color: C.muted }}>Currency
                <select style={input} disabled={locked} value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value as Currency })}><option>USD</option><option>INR</option></select>
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 12, color: C.muted }}>Valid until
                <input style={input} disabled={locked} type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
              </label>
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 12, color: C.muted }}>Line items (you set every price; nothing is suggested)</div>
              {form.items.map((i, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 28px', gap: 6 }}>
                  <input style={input} disabled={locked} placeholder="Description" value={i.description} onChange={e => setItem(idx, { description: e.target.value })} />
                  <input style={input} disabled={locked} inputMode="decimal" placeholder="Qty" value={i.qty || ''} onChange={e => setItem(idx, { qty: e.target.value as unknown as number })} />
                  <input style={input} disabled={locked} inputMode="decimal" placeholder="Price" value={i.unit_price || ''} onChange={e => setItem(idx, { unit_price: e.target.value as unknown as number })} />
                  {!locked && form.items.length > 1 && <button style={{ ...btn(false, true), padding: '4px 0' }} onClick={() => setForm({ ...form, items: form.items.filter((_, k) => k !== idx) })}>×</button>}
                </div>
              ))}
              {!locked && <button style={{ ...btn(), justifySelf: 'start' }} onClick={() => setForm({ ...form, items: [...form.items, blankItem()] })}>Add line</button>}
              <div style={{ textAlign: 'right', fontSize: 16, fontWeight: 800 }}>Total {formatMoney(total, form.currency)}</div>
            </div>

            <label style={{ display: 'grid', gap: 4, fontSize: 12, color: C.muted }}>
              <span style={{ display: 'flex', justifyContent: 'space-between' }}>What we will build
                {!locked && outline && <button style={{ background: 'none', border: 'none', color: C.sky, cursor: 'pointer', fontSize: 12, padding: 0 }} onClick={() => setForm({ ...form, scope: outline })}>Insert the agent's scope outline</button>}
              </span>
              <textarea style={{ ...input, minHeight: 150 }} disabled={locked} value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} />
            </label>
            {!locked && outline && form.scope === outline && <div style={{ fontSize: 12, color: C.amber }}>The outline ends with "Price and timeline: to be confirmed". Edit that line before you send.</div>}
            <label style={{ display: 'grid', gap: 4, fontSize: 12, color: C.muted }}>Your terms (payment, timeline, what is not included). Leave empty for a neutral default.
              <textarea style={{ ...input, minHeight: 80 }} disabled={locked} value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} />
            </label>

            {!locked && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={btn()} onClick={save}>Save draft</button>
                <button style={btn(true)} onClick={send}>Save and mark sent</button>
              </div>
            )}
            {form.id && locked && status !== 'accepted' && <button style={{ ...btn(false, true), justifySelf: 'start' }} onClick={() => withdraw(form.id!)}>Withdraw this quote</button>}

            {form.id && status === 'accepted' && !quotes.find(x => x.id === form.id)?.paid_at && (
              <button style={{ ...btn(true), justifySelf: 'start' }} onClick={() => markPaid(form.id!)}>Mark as paid</button>
            )}

            {share && (
              <div style={{ display: 'grid', gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Send this to your client</div>
                <textarea readOnly style={{ ...input, minHeight: 70 }} value={share.message} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {whatsappLink(contact?.phone ?? null, share.message) && <a style={btn(true)} target="_blank" rel="noopener noreferrer" href={whatsappLink(contact?.phone ?? null, share.message)!}>Open WhatsApp</a>}
                  <button style={btn()} onClick={() => { navigator.clipboard?.writeText(share.message); flash('Message copied') }}>Copy message</button>
                  <button style={btn()} onClick={() => { navigator.clipboard?.writeText(share.url); flash('Link copied') }}>Copy link</button>
                  <a style={btn()} target="_blank" rel="noopener noreferrer" href={share.url}>Preview as client</a>
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>Opening the link as the client counts as a view. When they accept, the deal moves to Won in the CRM and you get an email.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
