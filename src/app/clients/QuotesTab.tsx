'use client'
import { useState } from 'react'
import { CURRENCIES, RECURRENCES, formatMoney, recurrenceSuffix, ownerCan, validateItems } from '@/lib/agency/quote'
import { api, ago, ghostBtn, primaryBtn, inputStyle, labelStyle, sectionTitle, dangerText } from './ui'
import type { Ctx, QuoteRow } from './types'

interface Line { description: string; qty: string; unit: string }
const blank = (): Line => ({ description: '', qty: '1', unit: '' })

// The things freelancers actually charge for beyond the build itself.
const QUICK_LINES = ['Design and build', 'Domain registration (1 year)', 'Hosting (per month)', 'Maintenance and updates (per month)', 'Extra revision round', 'Content writing']

const STATUS_TEXT: Record<string, { text: string; color: string }> = {
  draft: { text: 'Draft, not shown to the client', color: '#8797ab' },
  sent: { text: 'Sent, waiting for their answer', color: '#F59E0B' },
  accepted: { text: 'Accepted', color: '#22c55e' },
  declined: { text: 'Declined', color: '#f87171' },
  paid: { text: 'Paid', color: '#22c55e' },
}

export function QuotesTab({ ctx }: { ctx: Ctx }) {
  const { client, merge, toast, profile } = ctx
  const can = client._canEdit
  const quotes = [...client.client_quotes].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [title, setTitle] = useState('Website build')
  const [currency, setCurrency] = useState<string>(profile?.default_currency ?? 'USD')
  const [recurrence, setRecurrence] = useState<string>('one_time')
  const [terms, setTerms] = useState(profile?.default_terms ?? '')
  const [lines, setLines] = useState<Line[]>([blank()])
  const [note, setNote] = useState('')
  const [payInfo, setPayInfo] = useState('')
  const [payUrl, setPayUrl] = useState('')
  const [emailOnSend, setEmailOnSend] = useState(true)
  const [busy, setBusy] = useState(false)

  const parsed = validateItems(lines.map(l => ({ description: l.description, qty: Number(l.qty), unit: Number(l.unit) })))
  const total = parsed.ok ? parsed.total : null

  function startNew() {
    setEditing(null); setTitle('Website build'); setLines([blank()]); setNote(''); setPayInfo(profile?.default_payment_instructions ?? ''); setPayUrl(''); setCurrency(profile?.default_currency ?? 'USD'); setRecurrence('one_time'); setTerms(profile?.default_terms ?? ''); setOpen(true)
  }
  function startEdit(q: QuoteRow) {
    setEditing(q.id); setTitle(q.title); setCurrency(q.currency); setRecurrence(q.recurrence ?? 'one_time'); setTerms(q.terms ?? ''); setNote(q.note ?? ''); setPayInfo(q.payment_instructions ?? ''); setPayUrl(q.payment_url ?? '')
    setLines(q.items.map(i => ({ description: i.description, qty: String(i.qty), unit: String(i.unit) }))); setOpen(true)
  }

  async function save() {
    if (!parsed.ok) { toast(parsed.error, false); return }
    setBusy(true)
    const body = { title, currency, recurrence, terms, items: lines.map(l => ({ description: l.description, qty: Number(l.qty), unit: Number(l.unit) })), note, paymentInstructions: payInfo, paymentUrl: payUrl }
    const r = editing ? await api('PATCH', `/api/clients/${client.id}/quotes/${editing}`, body) : await api('POST', `/api/clients/${client.id}/quotes`, body)
    setBusy(false)
    if (!r.ok) { toast(r.data.error ?? 'Could not save the quote', false); return }
    merge({ client_quotes: editing ? client.client_quotes.map(q => (q.id === editing ? r.data.quote : q)) : [r.data.quote, ...client.client_quotes] })
    setOpen(false); setEditing(null)
    toast('Draft saved. Send it when you are ready.')
  }

  async function act(q: QuoteRow, action: 'send' | 'withdraw' | 'markPaid') {
    const r = await api('PATCH', `/api/clients/${client.id}/quotes/${q.id}`, { action, emailClient: action === 'send' && emailOnSend })
    if (!r.ok) { toast(r.data.error ?? 'Could not do that', false); return }
    merge({ client_quotes: client.client_quotes.map(x => (x.id === q.id ? r.data.quote : x)) })
    if (action === 'send') {
      const e = r.data.email
      toast(e?.sent ? 'Sent, and emailed to your client' : e ? `Sent on their page. Not emailed: ${e.reason === 'no_email' ? 'no email saved for this client' : e.reason === 'inactive' ? 'their link is off' : 'try again later'}` : 'Sent on their page. Share their link so they can see it.')
    }
  }

  async function remove(q: QuoteRow) {
    if (!confirm(`Delete ${q.number}?`)) return
    const r = await api('DELETE', `/api/clients/${client.id}/quotes/${q.id}`)
    if (r.ok) merge({ client_quotes: client.client_quotes.filter(x => x.id !== q.id) })
    else toast(r.data.error ?? 'Could not delete', false)
  }

  const setLine = (i: number, p: Partial<Line>) => setLines(ls => ls.map((l, k) => (k === i ? { ...l, ...p } : l)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={sectionTitle}>Quotes</div>
        <p style={{ fontSize: 13, color: '#9aa8bb', lineHeight: 1.6, margin: '0 0 12px', maxWidth: 600 }}>
          Send a quote on their page. They accept it with their name, and that is your record. WyberAi does not take the payment: after they accept, they see your payment instructions or link, and you mark it paid yourself.
        </p>
        {can && !open && <button type="button" onClick={startNew} style={primaryBtn}>New quote</button>}
      </div>

      {open && (
        <div style={{ background: '#0a1018', border: '1px solid #14202e', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle} htmlFor="q-title">Title</label><input id="q-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} style={inputStyle} /></div>
            <div><label style={labelStyle} htmlFor="q-cur">Currency</label>
              <select id="q-cur" value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle, padding: '10px 12px' }}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={labelStyle} htmlFor="q-per">Billed</label>
              <select id="q-per" value={recurrence} onChange={e => setRecurrence(e.target.value)} style={{ ...inputStyle, padding: '10px 12px' }}>{RECURRENCES.map(r => <option key={r} value={r}>{r === 'one_time' ? 'Once' : r === 'monthly' ? 'Every month' : 'Every year'}</option>)}</select></div>
          </div>
          <div>
            <div style={labelStyle}>Lines</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lines.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <input aria-label={`Line ${i + 1} description`} value={l.description} onChange={e => setLine(i, { description: e.target.value })} placeholder="What you are charging for" maxLength={200} style={{ ...inputStyle, flex: 1 }} />
                  <input aria-label={`Line ${i + 1} quantity`} inputMode="decimal" value={l.qty} onChange={e => setLine(i, { qty: e.target.value })} style={{ ...inputStyle, width: 70 }} />
                  <input aria-label={`Line ${i + 1} price each`} inputMode="decimal" value={l.unit} onChange={e => setLine(i, { unit: e.target.value })} placeholder="Price" style={{ ...inputStyle, width: 110 }} />
                  {lines.length > 1 && <button type="button" aria-label={`Remove line ${i + 1}`} onClick={() => setLines(ls => ls.filter((_, k) => k !== i))} style={dangerText}>×</button>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }} aria-label="Quick lines">
              {QUICK_LINES.map(l => <button key={l} type="button" onClick={() => setLines(ls => (ls.length === 1 && !ls[0].description && !ls[0].unit ? [{ description: l, qty: '1', unit: '' }] : [...ls, { description: l, qty: '1', unit: '' }]))} style={{ ...ghostBtn, borderRadius: 20, fontSize: 11 }}>+ {l}</button>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <button type="button" onClick={() => setLines(ls => [...ls, blank()])} style={ghostBtn}>+ Add a line</button>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Total {total !== null ? formatMoney(total, currency) + recurrenceSuffix(recurrence) : '…'}</div>
            </div>
          </div>
          <div><label style={labelStyle} htmlFor="q-note">Note to the client (optional)</label><textarea id="q-note" rows={2} value={note} onChange={e => setNote(e.target.value)} maxLength={1500} placeholder="What is included, timeline, what happens next." style={{ ...inputStyle, resize: 'vertical' }} /></div>
          <div><label style={labelStyle} htmlFor="q-terms">Terms (optional)</label><textarea id="q-terms" rows={3} value={terms} onChange={e => setTerms(e.target.value)} maxLength={2000} placeholder="Payment schedule, revisions included, who owns the code, how to cancel." style={{ ...inputStyle, resize: 'vertical' }} /></div>
          <div><label style={labelStyle} htmlFor="q-pay">How to pay (shown after they accept)</label><textarea id="q-pay" rows={2} value={payInfo} onChange={e => setPayInfo(e.target.value)} maxLength={1000} placeholder="Bank details, UPI id, PayPal address… your own." style={{ ...inputStyle, resize: 'vertical' }} /></div>
          <div><label style={labelStyle} htmlFor="q-url">Payment link (optional, https only)</label><input id="q-url" value={payUrl} onChange={e => setPayUrl(e.target.value)} placeholder="https://rzp.io/l/…" style={inputStyle} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={save} disabled={busy || !parsed.ok} style={{ ...primaryBtn, opacity: busy || !parsed.ok ? 0.5 : 1 }}>{editing ? 'Save changes' : 'Save draft'}</button>
            <button type="button" onClick={() => { setOpen(false); setEditing(null) }} style={ghostBtn}>Cancel</button>
          </div>
        </div>
      )}

      {quotes.length === 0 && !open && <div style={{ fontSize: 13, color: '#8797ab' }}>No quotes yet.</div>}
      {quotes.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {quotes.map(q => {
            const st = STATUS_TEXT[q.status]
            const owner = ownerCan(q.status)
            return (
              <li key={q.id} style={{ background: '#0a1018', border: '1px solid #14202e', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{q.number} · {q.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: st.color, marginTop: 2 }}>{st.text}{q.responded_by ? ` · ${q.responded_by}` : ''}{q.responded_at ? ` · ${ago(q.responded_at)}` : ''}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{formatMoney(Number(q.total), q.currency)}{recurrenceSuffix(q.recurrence)}</div>
                </div>
                {q.decline_reason && <div style={{ fontSize: 12, color: '#9aa8bb', marginTop: 6 }}>Reason: {q.decline_reason}</div>}
                {can && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
                    {owner.edit && <button type="button" onClick={() => startEdit(q)} style={ghostBtn}>Edit</button>}
                    {owner.send && <button type="button" onClick={() => act(q, 'send')} style={primaryBtn}>Send to client</button>}
                    {owner.send && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: client.contact_email ? '#8797ab' : '#5d6d82' }}>
                        <input type="checkbox" disabled={!client.contact_email} checked={emailOnSend && !!client.contact_email} onChange={e => setEmailOnSend(e.target.checked)} /> Email them{client.contact_email ? '' : ' (add their email in Share)'}
                      </label>
                    )}
                    {owner.withdraw && <button type="button" onClick={() => act(q, 'withdraw')} style={ghostBtn}>Withdraw</button>}
                    {owner.markPaid && <button type="button" onClick={() => act(q, 'markPaid')} style={primaryBtn}>Mark as paid</button>}
                    {owner.remove && <button type="button" onClick={() => remove(q)} style={dangerText}>Delete</button>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
