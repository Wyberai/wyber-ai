'use client'

import { useState } from 'react'

const SKY = '#0EA5E9'
const AMBER = '#f59e0b'
const MUTED = '#71717a'
const PLAN_COLOR: Record<string, string> = { free: MUTED, pro: SKY, enterprise: AMBER }
const PLANS = ['free', 'pro', 'enterprise']

export type AdminOrg = {
  id: string; name: string; slug: string; plan: string; owner_id: string
  custom_domain: string | null; created_at: string; owner_email: string
}

export default function OrganizationsClient({ initialOrgs, query }: { initialOrgs: AdminOrg[]; query: string }) {
  const [orgs, setOrgs] = useState(initialOrgs)
  const [savingId, setSavingId] = useState<string | null>(null)

  const changePlan = async (id: string, plan: string) => {
    setSavingId(id)
    const res = await fetch(`/api/admin/organizations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }),
    })
    if (res.ok) {
      const d = await res.json()
      setOrgs(prev => prev.map(o => o.id === id ? { ...o, plan: d.organization.plan } : o))
    }
    setSavingId(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#e4e4e7', fontFamily: 'system-ui, sans-serif', padding: '48px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🏢 Organizations</h1>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>Search by name or slug. Changing plan here is the only supported way to move an org to Enterprise after a deal closes — it&apos;s written to that org&apos;s own audit log.</p>
        <form method="GET" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input
            name="q" defaultValue={query} placeholder="Organization name or slug…" autoFocus
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: '#18181b', color: '#fafafa', fontSize: 14, outline: 'none' }}
          />
          <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: SKY, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Search</button>
        </form>

        {orgs.length === 0 ? (
          <p style={{ fontSize: 13, color: '#a1a1aa' }}>No organizations match.</p>
        ) : orgs.map(org => (
          <div key={org.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#111113', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa' }}>{org.name}</div>
              <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>{org.owner_email} &middot; {org.slug}{org.custom_domain ? ` · ${org.custom_domain}` : ''}</div>
            </div>
            <select
              value={org.plan}
              disabled={savingId === org.id}
              onChange={e => changePlan(org.id, e.target.value)}
              style={{ fontSize: 12, fontWeight: 700, color: PLAN_COLOR[org.plan] ?? MUTED, background: '#18181b', border: `1px solid ${PLAN_COLOR[org.plan] ?? MUTED}44`, borderRadius: 8, padding: '6px 10px', textTransform: 'uppercase' }}
            >
              {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
