'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SKY = '#0EA5E9'

export type AdminAffiliate = {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  payout_email: string | null
  payout_method: string | null
  applied_at: string
  approved_at: string | null
  email: string
  referral_code: string | null
  pending_usd: number
  paid_usd: number
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b', label: 'Pending review' },
  approved:  { bg: 'rgba(16,185,129,0.12)', fg: '#34d399', label: 'Approved' },
  rejected:  { bg: 'rgba(239,68,68,0.10)',  fg: '#f87171', label: 'Rejected' },
  suspended: { bg: 'rgba(113,113,122,0.15)', fg: '#a1a1aa', label: 'Suspended' },
}

export function AdminAffiliatesClient({ affiliates, tableReady }: { affiliates: AdminAffiliate[]; tableReady: boolean }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const pendingCount = affiliates.filter(a => a.status === 'pending').length

  const review = async (id: string, action: 'approve' | 'reject' | 'suspend') => {
    setBusyId(id); setMsg(null)
    try {
      const res = await fetch('/api/admin/affiliates/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ kind: 'err', text: data.error ?? 'Failed' }); return }
      setMsg({ kind: 'ok', text: `Updated` })
      router.refresh()
    } catch { setMsg({ kind: 'err', text: 'Network error' }) } finally { setBusyId(null) }
  }

  const markPaid = async (userId: string, amount: number) => {
    if (amount <= 0) return
    if (!confirm(`Mark $${amount.toFixed(2)} as paid out to this affiliate? This assumes you've already sent the money outside WyberAi.`)) return
    setBusyId(userId); setMsg(null)
    try {
      const res = await fetch('/api/admin/affiliates/payout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ kind: 'err', text: data.error ?? 'Failed' }); return }
      setMsg({ kind: 'ok', text: 'Marked as paid' })
      router.refresh()
    } catch { setMsg({ kind: 'err', text: 'Network error' }) } finally { setBusyId(null) }
  }

  const btn = (bg: string, disabled: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', background: disabled ? '#1f2937' : bg, color: '#fff', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#08080b', color: '#fff', fontFamily: 'var(--font-display), system-ui' }}>
      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin" style={{ fontSize: 12, color: '#52525b', textDecoration: 'none' }}>← Command Center</Link>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>🤝 Affiliates</span>
        </div>
        <span style={{ fontSize: 12, color: '#52525b' }}>{pendingCount} pending</span>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Affiliate applications & payouts</h1>
        <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 24px' }}>
          Approve an applicant to let their existing referral link start earning cash commission. Payouts are recorded here but still sent manually outside WyberAi (Dodo has no split-payment API) — &quot;Pay out&quot; just marks the balance as settled.
        </p>

        {!tableReady && (
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(161,98,7,0.1)', border: '1px solid rgba(161,98,7,0.3)', color: '#eab308', fontSize: 13, marginBottom: 20 }}>
            The affiliate tables aren&apos;t on this database yet, or the migration hasn&apos;t been applied. Run <code>20260922000000_affiliates.sql</code>.
          </div>
        )}

        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: 9, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.kind === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${msg.kind === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg.kind === 'ok' ? '#34d399' : '#f87171' }}>
            {msg.text}
          </div>
        )}

        {tableReady && affiliates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#52525b', border: '1px dashed #1e1e26', borderRadius: 14 }}>No applications yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {affiliates.map(a => {
              const st = STATUS_STYLE[a.status] ?? STATUS_STYLE.pending
              return (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center', padding: '14px 18px', borderRadius: 12, border: '1px solid #1a1a22', background: '#0d0d11' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{a.email}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em', background: st.bg, color: st.fg }}>{st.label}</span>
                      {a.referral_code && <span style={{ fontSize: 11, color: '#52525b' }}>code: {a.referral_code}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#52525b', display: 'flex', gap: 14, flexWrap: 'wrap', margin: '4px 0 0' }}>
                      {a.payout_email && <span>payout: {a.payout_email}{a.payout_method ? ` (${a.payout_method})` : ''}</span>}
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>${a.pending_usd.toFixed(2)} pending</span>
                      <span>${a.paid_usd.toFixed(2)} paid lifetime</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {a.status === 'pending' ? (
                      <>
                        <button disabled={busyId === a.id} onClick={() => review(a.id, 'approve')} style={btn('#059669', busyId === a.id)}>Approve</button>
                        <button disabled={busyId === a.id} onClick={() => review(a.id, 'reject')} style={btn('#3f3f46', busyId === a.id)}>Reject</button>
                      </>
                    ) : (
                      <>
                        {a.pending_usd > 0 && (
                          <button disabled={busyId === a.user_id} onClick={() => markPaid(a.user_id, a.pending_usd)} style={btn(SKY, busyId === a.user_id)}>Pay out ${a.pending_usd.toFixed(2)}</button>
                        )}
                        {a.status === 'approved' && (
                          <button disabled={busyId === a.id} onClick={() => review(a.id, 'suspend')} style={btn('#3f3f46', busyId === a.id)}>Suspend</button>
                        )}
                        {a.status === 'suspended' && (
                          <button disabled={busyId === a.id} onClick={() => review(a.id, 'approve')} style={btn('#059669', busyId === a.id)}>Reinstate</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
