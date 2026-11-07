import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { canAccept, computeTotal, formatMoney, isToken, lineTotal, statusAfterView, type QuoteRow } from '@/lib/quotes/quote'
import AcceptForm from './AcceptForm'

// Private, unindexed page for ONE quote, reached only through its unguessable
// link. Drafts are never shown. Opening it records the first view.
export const metadata: Metadata = { title: 'Your quote — WyberAi', robots: { index: false, follow: false, nocache: true } }
export const dynamic = 'force-dynamic'

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '')

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!isToken(token)) notFound()

  const admin = await createAdminClient()
  const { data, error } = await admin.from('crm_quotes').select('*').eq('token', token).maybeSingle()
  if (error || !data) notFound()
  const q = data as QuoteRow
  if (q.status === 'draft') notFound()

  // Record the view (best-effort; never blocks the page).
  try {
    await admin.from('crm_quotes').update({ view_count: (q.view_count ?? 0) + 1, viewed_at: new Date().toISOString(), status: statusAfterView(q.status) }).eq('id', q.id)
  } catch { /* ignore */ }

  let preparedFor: string | null = null
  if (q.contact_id) {
    const { data: c } = await admin.from('crm_contacts').select('name, company').eq('id', q.contact_id).maybeSingle()
    if (c) preparedFor = [(c as { name: string }).name, (c as { company: string | null }).company].filter(Boolean).join(', ')
  }

  const accept = canAccept(q)
  const total = computeTotal(q.items)
  const defaultTerms = 'By accepting, you confirm you want to go ahead on the scope and price above. Payment and delivery details will be confirmed with you in writing.'

  return (
    <main style={{ minHeight: '100vh', background: '#f6f7f9', color: '#14171f', fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif', padding: '32px 16px' }}>
      <article style={{ maxWidth: 760, margin: '0 auto', background: '#fff', border: '1px solid #e4e7ee', borderRadius: 14, padding: 'clamp(20px, 4vw, 40px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Wyber<span style={{ color: '#0EA5E9' }}>Ai</span></div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Quote{q.sent_at ? ` · ${fmtDate(q.sent_at)}` : ''}</div>
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: 26, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{q.title}</h1>
        {preparedFor && <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>Prepared for {preparedFor}</div>}

        {q.scope && (
          <section style={{ margin: '22px 0' }}>
            <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', margin: '0 0 8px' }}>What we will build</h2>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.65 }}>{q.scope}</div>
          </section>
        )}

        <section style={{ margin: '22px 0' }}>
          <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', margin: '0 0 8px' }}>Price</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12.5 }}>
                <th style={{ padding: '6px 0', fontWeight: 600 }}>Item</th>
                <th style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right' }}>Price</th>
                <th style={{ padding: '6px 0', fontWeight: 600, textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {q.items.map((i, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid #eceff4' }}>
                  <td style={{ padding: '10px 0', paddingRight: 12 }}>{i.description}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{i.qty}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatMoney(i.unit_price, q.currency)}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatMoney(lineTotal(i), q.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #14171f' }}>
                <td colSpan={3} style={{ padding: '12px 0', fontWeight: 800, fontSize: 16 }}>Total</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, fontSize: 18 }}>{formatMoney(total, q.currency)}</td>
              </tr>
            </tfoot>
          </table>
          {q.valid_until && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>Valid until {fmtDate(`${q.valid_until}T12:00:00+05:30`)}.</div>}
        </section>

        <section style={{ margin: '22px 0' }}>
          <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', margin: '0 0 8px' }}>Terms</h2>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14.5, lineHeight: 1.6 }}>{q.terms || defaultTerms}</div>
        </section>

        <section style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #eceff4' }}>
          {q.status === 'accepted' ? (
            <div style={{ background: '#ecfdf3', border: '1px solid #b7ebcb', borderRadius: 10, padding: '14px 16px', fontSize: 15 }}>
              <strong>Accepted</strong> by {q.accepted_by} on {fmtDate(q.accepted_at)}. Thank you. We will confirm payment and delivery details with you in writing.
            </div>
          ) : accept.ok ? (
            <AcceptForm token={token} totalLabel={formatMoney(total, q.currency)} />
          ) : (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '14px 16px', fontSize: 15 }}>{accept.reason}</div>
          )}
          <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 12 }}>Questions? Reply to the message this link came in, or write to hello@wyberai.com.</div>
        </section>
      </article>
    </main>
  )
}
