'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SKY = '#0EA5E9'

export type AdminListing = {
  id: string
  seller_id: string | null
  source: string
  title: string
  category: string
  price_usd: number
  status: string
  sales_count: number
  created_at: string
  email: string
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  pending:  { bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b', label: 'Pending' },
  approved: { bg: 'rgba(16,185,129,0.12)', fg: '#34d399', label: 'Approved' },
  rejected: { bg: 'rgba(239,68,68,0.10)',  fg: '#f87171', label: 'Rejected' },
}

export function AdminMarketplaceClient({ listings, tableReady }: { listings: AdminListing[]; tableReady: boolean }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const pendingCount = listings.filter(l => l.status === 'pending').length

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id); setMsg(null)
    try {
      const res = await fetch('/api/admin/marketplace/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ kind: 'err', text: data.error ?? 'Failed' }); return }
      setMsg({ kind: 'ok', text: action === 'approve' ? 'Approved — now live on /marketplace' : 'Rejected' })
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
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>🛍 Marketplace Listings</span>
        </div>
        <span style={{ fontSize: 12, color: '#52525b' }}>{pendingCount} pending</span>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Review queue</h1>
        <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 24px' }}>
          User-submitted listings only — studio listings from the seed script are auto-approved. Approve to make a listing live on <Link href="/marketplace" style={{ color: SKY, textDecoration: 'none' }}>/marketplace</Link> immediately.
        </p>

        {!tableReady && (
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(161,98,7,0.1)', border: '1px solid rgba(161,98,7,0.3)', color: '#eab308', fontSize: 13, marginBottom: 20 }}>
            The marketplace tables aren&apos;t on this database yet, or the migration hasn&apos;t been applied. Run <code>20260724000000_marketplace.sql</code>.
          </div>
        )}

        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: 9, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.kind === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${msg.kind === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg.kind === 'ok' ? '#34d399' : '#f87171' }}>
            {msg.text}
          </div>
        )}

        {tableReady && listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#52525b', border: '1px dashed #1e1e26', borderRadius: 14 }}>No user submissions yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {listings.map(l => {
              const st = STATUS_STYLE[l.status] ?? STATUS_STYLE.pending
              return (
                <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center', padding: '14px 18px', borderRadius: 12, border: '1px solid #1a1a22', background: '#0d0d11' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{l.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em', background: st.bg, color: st.fg }}>{st.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: SKY }}>${l.price_usd}</span>
                      {l.sales_count > 0 && <span style={{ fontSize: 11, color: '#52525b' }}>· {l.sales_count} sold</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#52525b', display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 0' }}>
                      <span>{l.email}</span>
                      <span>{l.category}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {l.status === 'pending' ? (
                      <>
                        <button disabled={busyId === l.id} onClick={() => act(l.id, 'approve')} style={btn('#059669', busyId === l.id)}>Approve</button>
                        <button disabled={busyId === l.id} onClick={() => act(l.id, 'reject')} style={btn('#3f3f46', busyId === l.id)}>Reject</button>
                      </>
                    ) : l.status === 'approved' ? (
                      <button disabled={busyId === l.id} onClick={() => act(l.id, 'reject')} style={btn('#3f3f46', busyId === l.id)}>Unpublish</button>
                    ) : (
                      <button disabled={busyId === l.id} onClick={() => act(l.id, 'approve')} style={btn('#059669', busyId === l.id)}>Approve</button>
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
