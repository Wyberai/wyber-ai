'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

const SKY = '#0EA5E9'

type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'
type Tab = 'members' | 'sso' | 'audit'

interface Org { id: string; name: string; slug: string; plan: string }
interface Member { id: string; user_id: string; role: OrgRole; invited_via: string; created_at: string; profiles: { email: string } | null }
interface SsoConnection { workos_org_id: string; domain: string | null; status: string; created_at: string }
interface AuditLog { id: string; user_id: string | null; action: string; resource_type: string; resource_id: string | null; created_at: string; profiles: { email: string } | null }

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#111115', border: '1px solid #2a2a35',
  borderRadius: 9, padding: '10px 14px', fontSize: 14, color: '#e4e4e7', outline: 'none', fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#71717a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }
const cardStyle: React.CSSProperties = { background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: 22 }
const roleColors: Record<OrgRole, string> = { owner: '#0EA5E9', admin: '#a855f7', member: '#71717a', viewer: '#52525b' }

export default function OrgDetailPage() {
  const params = useParams<{ id: string }>()
  const orgId = params.id

  const [org, setOrg] = useState<Org | null>(null)
  const [role, setRole] = useState<OrgRole | null>(null)
  const [tab, setTab] = useState<Tab>('members')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgRole>('member')
  const [inviting, setInviting] = useState(false)

  const [sso, setSso] = useState<SsoConnection | null | undefined>(undefined)
  const [workosOrgId, setWorkosOrgId] = useState('')
  const [ssoDomain, setSsoDomain] = useState('')
  const [savingSso, setSavingSso] = useState(false)

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [logsError, setLogsError] = useState<string | null>(null)

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }
  const canManage = role === 'owner' || role === 'admin'

  const loadOrg = useCallback(async () => {
    const res = await fetch(`/api/orgs/${orgId}`)
    if (res.ok) { const d = await res.json(); setOrg(d.organization); setRole(d.role) }
    setLoading(false)
  }, [orgId])

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/orgs/${orgId}/members`)
    if (res.ok) { const d = await res.json(); setMembers(d.members ?? []) }
  }, [orgId])

  const loadSso = useCallback(async () => {
    const res = await fetch(`/api/orgs/${orgId}/sso`)
    if (res.ok) { const d = await res.json(); setSso(d.connection) }
    else setSso(null)
  }, [orgId])

  const loadLogs = useCallback(async () => {
    const res = await fetch(`/api/orgs/${orgId}/audit-logs`)
    const d = await res.json()
    if (res.ok) { setLogs(d.logs ?? []); setLogsError(null) }
    else setLogsError(d.error ?? 'Failed to load audit logs')
  }, [orgId])

  useEffect(() => { loadOrg(); loadMembers() }, [loadOrg, loadMembers])
  useEffect(() => {
    if (tab === 'sso' && sso === undefined) loadSso()
    if (tab === 'audit' && logs.length === 0) loadLogs()
  }, [tab, sso, logs.length, loadSso, loadLogs])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    const res = await fetch(`/api/orgs/${orgId}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    })
    const d = await res.json()
    if (res.ok) {
      showToast(d.pending ? 'Invite sent — they will join once they sign up' : 'Member added')
      setInviteEmail(''); setInviteRole('member'); loadMembers()
    } else showToast(d.error ?? 'Failed to invite', false)
    setInviting(false)
  }

  const handleRoleChange = async (memberId: string, newRole: OrgRole) => {
    const res = await fetch(`/api/orgs/${orgId}/members/${memberId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }),
    })
    const d = await res.json()
    if (res.ok) { showToast('Role updated'); loadMembers() } else showToast(d.error ?? 'Failed to update role', false)
  }

  const handleRemove = async (memberId: string) => {
    const res = await fetch(`/api/orgs/${orgId}/members/${memberId}`, { method: 'DELETE' })
    const d = await res.json()
    if (res.ok) { showToast('Member removed'); loadMembers() } else showToast(d.error ?? 'Failed to remove', false)
  }

  const handleSaveSso = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSso(true)
    const res = await fetch(`/api/orgs/${orgId}/sso`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workosOrgId: workosOrgId.trim(), domain: ssoDomain.trim() || undefined }),
    })
    const d = await res.json()
    if (res.ok) { showToast('SSO connection saved'); setSso(d.connection) } else showToast(d.error ?? 'Failed to save', false)
    setSavingSso(false)
  }

  if (loading) return <div style={{ minHeight: '100vh', background: '#0b0d12' }} />
  if (!org) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0d12', color: '#e4e4e7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-display)' }}>
        <div style={{ fontSize: 14, color: '#3f3f46' }}>You don&apos;t have access to this organization.</div>
        <Link href="/org" style={{ color: SKY, fontSize: 13, textDecoration: 'none' }}>&larr; Back to organizations</Link>
      </div>
    )
  }

  const isEnterprise = org.plan === 'enterprise'

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: 'var(--font-display)', color: '#e4e4e7' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#0f2a1a' : '#2a0f0f', border: `1px solid ${toast.ok ? '#22c55e33' : '#ef444433'}`, color: toast.ok ? '#22c55e' : '#ef4444', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap' }}>{toast.msg}</div>
      )}

      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/org" style={{ fontSize: 12, color: '#52525b', textDecoration: 'none' }}>&larr; Organizations</Link>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: 0 }}>{org.name}</h1>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(14,165,233,0.08)', color: SKY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{org.plan}</span>
        </div>
        <p style={{ color: '#3f3f46', fontSize: 14, margin: '0 0 28px' }}>Team, single sign-on, and audit history for this organization. Your role: <span style={{ color: roleColors[role ?? 'viewer'] }}>{role}</span></p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: '1px solid #1a1a22' }}>
          {(['members', 'sso', 'audit'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 600, color: tab === t ? '#fff' : '#52525b',
              borderBottom: tab === t ? `2px solid ${SKY}` : '2px solid transparent', marginBottom: -1,
            }}>{t === 'members' ? 'Members' : t === 'sso' ? 'SSO & Security' : 'Audit Log'}</button>
          ))}
        </div>

        {tab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {canManage && (
              <form onSubmit={handleInvite} style={{ ...cardStyle, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Invite by email</label>
                  <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="teammate@company.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as OrgRole)} style={{ ...inputStyle, padding: '10px 12px' }}>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <button type="submit" disabled={inviting} style={{ padding: '10px 20px', borderRadius: 9, background: inviting ? '#1a1a22' : SKY, border: 'none', color: inviting ? '#52525b' : '#fff', fontSize: 13, fontWeight: 700, cursor: inviting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{inviting ? 'Inviting…' : 'Invite'}</button>
              </form>
            )}

            <div style={cardStyle}>
              {members.length === 0 ? (
                <div style={{ color: '#3f3f46', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No members yet.</div>
              ) : members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a1a22' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>{m.profiles?.email ?? m.user_id}</div>
                    <div style={{ fontSize: 11, color: '#3f3f46' }}>joined via {m.invited_via} &middot; {new Date(m.created_at).toLocaleDateString()}</div>
                  </div>
                  {canManage ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value as OrgRole)} style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 12 }}>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button onClick={() => handleRemove(m.id)} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: roleColors[m.role], textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.role}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'sso' && (
          <div style={cardStyle}>
            {!isEnterprise ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 13, color: '#71717a', marginBottom: 4 }}>Single sign-on requires the Enterprise plan.</div>
                <div style={{ fontSize: 12, color: '#3f3f46' }}>Contact hello@wyberai.com to upgrade this organization.</div>
              </div>
            ) : !canManage ? (
              <div style={{ fontSize: 13, color: '#71717a', textAlign: 'center', padding: '20px 0' }}>Only owners and admins can manage SSO.</div>
            ) : sso ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{sso.workos_org_id}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: sso.status === 'active' ? 'rgba(34,197,94,0.08)' : 'rgba(234,179,8,0.08)', color: sso.status === 'active' ? '#22c55e' : '#eab308', textTransform: 'uppercase' }}>{sso.status}</span>
                </div>
                {sso.domain && <div style={{ fontSize: 12, color: '#52525b', marginBottom: 12 }}>Domain: {sso.domain}</div>}
                <div style={{ fontSize: 12, color: '#3f3f46', lineHeight: 1.6 }}>
                  Members sign in at <code style={{ color: SKY }}>/api/auth/sso/login?org={org.slug}</code>. Configure the identity provider connection in the WorkOS dashboard.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveSso}>
                <div style={{ fontSize: 13, color: '#71717a', marginBottom: 16 }}>Connect a SAML/OIDC identity provider via WorkOS. Set up the connection in the WorkOS dashboard first, then paste its organization ID here.</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>WorkOS organization ID</label>
                  <input required value={workosOrgId} onChange={e => setWorkosOrgId(e.target.value)} placeholder="org_01AB..." style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Email domain (optional)</label>
                  <input value={ssoDomain} onChange={e => setSsoDomain(e.target.value)} placeholder="company.com" style={inputStyle} />
                </div>
                <button type="submit" disabled={savingSso} style={{ padding: '10px 20px', borderRadius: 9, background: savingSso ? '#1a1a22' : SKY, border: 'none', color: savingSso ? '#52525b' : '#fff', fontSize: 13, fontWeight: 700, cursor: savingSso ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{savingSso ? 'Saving…' : 'Connect SSO'}</button>
              </form>
            )}
          </div>
        )}

        {tab === 'audit' && (
          <div style={cardStyle}>
            {logsError ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 13, color: '#71717a' }}>{logsError}</div>
              </div>
            ) : logs.length === 0 ? (
              <div style={{ color: '#3f3f46', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No activity recorded yet.</div>
            ) : logs.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a22' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#e4e4e7' }}><span style={{ color: SKY }}>{l.profiles?.email ?? 'system'}</span> {l.action.replace(/_/g, ' ').replace('org.', '')}</div>
                  <div style={{ fontSize: 11, color: '#3f3f46' }}>{l.resource_type}{l.resource_id ? ` · ${l.resource_id}` : ''}</div>
                </div>
                <div style={{ fontSize: 11, color: '#3f3f46', whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
