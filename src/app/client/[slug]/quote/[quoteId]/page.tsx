import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { isUnlocked, unlockCookieName } from '@/lib/agency/passcode'
import { loadAgencyProfile, publicProfile } from '@/lib/agency/profile'
import { formatMoney, recurrenceSuffix } from '@/lib/agency/quote'
import { PrintButton } from './PrintButton'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Quote', robots: { index: false, follow: false } }

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

// A plain, printable copy of a quote the client can keep (print, or save as PDF). Same rules as the client's page: the
// client must be active, the page unlocked if it has a passcode, and a draft is never shown.
export default async function PrintableQuote({ params }: { params: Promise<{ slug: string; quoteId: string }> }) {
  const { slug, quoteId } = await params
  const db = createServiceClient()
  const { data: client } = await db.from('clients').select('id, owner_id, org_id, name, company_name, contact_name, status, portal_passcode_hash').eq('slug', slug).maybeSingle()
  if (!client || client.status !== 'active') notFound()
  if (!isUnlocked(slug, client.portal_passcode_hash, (await cookies()).get(unlockCookieName(slug))?.value)) notFound()

  const { data: q } = await db.from('client_quotes').select('*').eq('id', quoteId).eq('client_id', client.id).in('status', ['sent', 'accepted', 'declined', 'paid']).maybeSingle()
  if (!q) notFound()

  const biz = publicProfile(await loadAgencyProfile(db, { owner_id: client.owner_id, org_id: client.org_id }))
  const items = (q.items ?? []) as Array<{ description: string; qty: number; unit: number }>
  const money = (n: number) => formatMoney(n, q.currency)
  const showPay = q.status === 'accepted' || q.status === 'paid'

  return (
    <div style={{ background: '#f4f5f7', minHeight: '100vh', padding: '24px 12px', fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif', color: '#111' }}>
      <style>{`@media print { body { background: #fff !important } .no-print { display: none !important } .sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important } }`}</style>
      <div className="no-print" style={{ maxWidth: 780, margin: '0 auto 12px', display: 'flex', justifyContent: 'flex-end' }}><PrintButton /></div>
      <main className="sheet" style={{ maxWidth: 780, margin: '0 auto', background: '#fff', padding: '48px 52px', boxShadow: '0 1px 6px rgba(0,0,0,0.12)', lineHeight: 1.5 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 36 }}>
          <div>
            {biz?.logo_url && <img src={biz.logo_url} alt="" style={{ height: 36, width: 'auto', marginBottom: 8 }} />}
            <div style={{ fontSize: 18, fontWeight: 700 }}>{biz?.business_name ?? 'Quote'}</div>
            <div style={{ fontSize: 12, color: '#555', whiteSpace: 'pre-line' }}>{[biz?.address, biz?.phone, biz?.support_email, biz?.website?.replace(/^https?:\/\//, '')].filter(Boolean).join('\n')}</div>
            {biz?.tax_id && <div style={{ fontSize: 12, color: '#555' }}>{biz.tax_label || 'Tax ID'}: {biz.tax_id}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{q.status === 'paid' ? 'Invoice' : 'Quote'} {q.number}</div>
            <div style={{ fontSize: 12, color: '#555' }}>{q.sent_at ? `Sent ${day(q.sent_at)}` : ''}</div>
            {q.status === 'paid' && <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 12px', border: '2px solid #15803d', color: '#15803d', fontWeight: 800, letterSpacing: '0.08em', transform: 'rotate(-4deg)' }}>PAID {day(q.paid_at)}</div>}
          </div>
        </header>

        <section style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#777', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prepared for</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{client.company_name || client.name}</div>
          {client.contact_name && <div style={{ fontSize: 13, color: '#555' }}>{client.contact_name}</div>}
          <div style={{ fontSize: 14, marginTop: 10 }}><strong>{q.title}</strong></div>
        </section>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr style={{ borderBottom: '2px solid #111', textAlign: 'left' }}><th style={{ padding: '8px 0' }}>Description</th><th style={{ padding: '8px 0', textAlign: 'right' }}>Qty</th><th style={{ padding: '8px 0', textAlign: 'right' }}>Price</th><th style={{ padding: '8px 0', textAlign: 'right' }}>Amount</th></tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e5e5' }}>
                <td style={{ padding: '9px 0' }}>{it.description}</td><td style={{ padding: '9px 0', textAlign: 'right' }}>{it.qty}</td>
                <td style={{ padding: '9px 0', textAlign: 'right' }}>{money(it.unit)}</td><td style={{ padding: '9px 0', textAlign: 'right' }}>{money(it.qty * it.unit)}</td>
              </tr>
            ))}
            <tr><td colSpan={3} style={{ padding: '12px 0', textAlign: 'right', fontWeight: 700 }}>Total</td><td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, fontSize: 16 }}>{money(Number(q.total))}{recurrenceSuffix(q.recurrence)}</td></tr>
          </tbody>
        </table>

        {q.note && <p style={{ fontSize: 13, color: '#333', whiteSpace: 'pre-wrap', marginTop: 20 }}>{q.note}</p>}
        {q.status === 'accepted' || q.status === 'paid' ? <p style={{ fontSize: 13, color: '#15803d', marginTop: 16 }}>Accepted by {q.responded_by} on {day(q.responded_at)}.</p> : null}
        {q.status === 'declined' && <p style={{ fontSize: 13, color: '#b91c1c', marginTop: 16 }}>Declined on {day(q.responded_at)}.</p>}
        {showPay && q.status === 'accepted' && (q.payment_instructions || q.payment_url) && (
          <section style={{ marginTop: 24, padding: 16, background: '#f7f7f8', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#777', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>How to pay</div>
            {q.payment_instructions && <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{q.payment_instructions}</div>}
            {q.payment_url && <div style={{ fontSize: 13, marginTop: 6 }}>{q.payment_url}</div>}
          </section>
        )}
        {q.terms && (
          <section style={{ marginTop: 24, borderTop: '1px solid #e5e5e5', paddingTop: 14 }}>
            <div style={{ fontSize: 11, color: '#777', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Terms</div>
            <div style={{ fontSize: 12, color: '#444', whiteSpace: 'pre-wrap' }}>{q.terms}</div>
          </section>
        )}
      </main>
    </div>
  )
}
