'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

const SKY = '#0EA5E9'

interface ProjectLite { id: string; name: string; thumbnail_url: string | null; org_id?: string | null }
type Review = 'pending' | 'approved' | 'changes_requested'
interface Deliverable {
  id: string; headline: string | null; description: string | null
  sort_order: number; is_visible: boolean; project_id: string
  review_status: Review | null; reviewed_at: string | null
  projects: ProjectLite | null
}
interface Feedback { id: string; deliverable_id: string | null; kind: 'approved' | 'changes_requested' | 'comment'; author_name: string | null; body: string | null; created_at: string }
interface Update { id: string; body: string; created_at: string }
type Role = 'owner' | 'admin' | 'member' | 'viewer'
interface Workspace { id: string; name: string; slug: string; role: Role }
interface ClientRow {
  id: string; name: string; slug: string; company_name: string | null
  contact_email: string | null; contact_name: string | null; logo_url: string | null
  brand_color: string; intro_text: string | null; status: 'lead' | 'active' | 'paused' | 'archived'
  notes: string | null; org_id: string | null; owner_id: string
  has_passcode: boolean; view_count: number | null; last_viewed_at: string | null
  client_deliverables: Deliverable[]; client_feedback: Feedback[]; client_updates: Update[]
  _role: Role; _canEdit: boolean; _canDelete: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0d141e', border: '1px solid #2a2a35',
  borderRadius: 9, padding: '10px 14px', fontSize: 14, color: '#e8eef7', outline: 'none', fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#9aa8bb', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }
const sectionTitle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#8797ab', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }
const ghostBtn: React.CSSProperties = { fontSize: 12, color: '#8797ab', background: 'none', border: '1px solid #1b2a3b', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }
const primaryBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: 9, background: SKY, border: 'none', color: '#03111c', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }

const STATUS_COLORS: Record<string, string> = { lead: '#9aa8bb', active: '#22c55e', paused: '#F59E0B', archived: '#8797ab' }
const REVIEW: Record<Review, { text: string; color: string }> = {
  pending: { text: 'Not reviewed', color: '#8797ab' },
  approved: { text: 'Approved', color: '#22c55e' },
  changes_requested: { text: 'Changes requested', color: '#F59E0B' },
}

function ago(iso: string | null): string {
  if (!iso) return ''
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 90) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return `${Math.round(s / 86400)} d ago`
}

export function ClientsPageClient({ initialClients, projects, workspaces: initialWorkspaces }: { initialClients: ClientRow[]; projects: ProjectLite[]; workspaces: Workspace[] }) {
  const [clients, setClients] = useState<ClientRow[]>(initialClients)
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces)
  const [scope, setScope] = useState<'all' | 'personal' | string>('all') // a workspace id when picking one
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newOrg, setNewOrg] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [pickProject, setPickProject] = useState<Record<string, string>>({})
  const [updateText, setUpdateText] = useState<Record<string, string>>({})
  const [passcodeText, setPasscodeText] = useState<Record<string, string>>({})
  const [wsName, setWsName] = useState('')
  const [showWs, setShowWs] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200) }
  const patchLocal = (id: string, p: Partial<ClientRow>) => setClients(prev => prev.map(c => (c.id === id ? { ...c, ...p } : c)))

  const shown = useMemo(() => clients.filter(c => (scope === 'all' ? true : scope === 'personal' ? !c.org_id : c.org_id === scope)), [clients, scope])
  const activeSpace = workspaces.find(w => w.id === scope)
  const wsName_ = (id: string | null) => workspaces.find(w => w.id === id)?.name

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    const orgId = newOrg || (activeSpace ? activeSpace.id : '')
    const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), orgId: orgId || undefined }) })
    const d = await res.json()
    if (res.ok) {
      const role: Role = orgId ? (workspaces.find(w => w.id === orgId)?.role ?? 'member') : 'owner'
      setClients(prev => [{ ...d.client, client_deliverables: [], client_feedback: [], client_updates: [], _role: role, _canEdit: true, _canDelete: true }, ...prev])
      setNewName(''); setNewOrg(''); setShowCreate(false)
      showToast('Client created')
    } else showToast(d.error ?? 'Failed to create', false)
    setCreating(false)
  }

  const updateClient = async (id: string, patch: Record<string, unknown>, okMsg = 'Saved') => {
    const res = await fetch(`/api/clients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    const d = await res.json()
    if (res.ok) { patchLocal(id, d.client); showToast(okMsg); return true }
    showToast(d.error ?? 'Failed to save', false)
    return false
  }

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this client? This does not delete their projects.')) return
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    if (res.ok) { setClients(prev => prev.filter(c => c.id !== id)); showToast('Client deleted') }
    else showToast((await res.json().catch(() => ({}))).error ?? 'Failed to delete', false)
  }

  const addDeliverable = async (clientId: string) => {
    const projectId = pickProject[clientId]
    if (!projectId) return
    const res = await fetch(`/api/clients/${clientId}/deliverables`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) })
    const d = await res.json()
    if (res.ok) {
      const project = projects.find(p => p.id === projectId) ?? null
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, client_deliverables: [...c.client_deliverables, { review_status: 'pending', reviewed_at: null, ...d.deliverable, projects: project }] } : c))
      setPickProject(prev => ({ ...prev, [clientId]: '' }))
    } else showToast(d.error ?? 'Failed to add', false)
  }

  const updateDeliverable = async (clientId: string, deliverableId: string, patch: Record<string, unknown>, local?: Partial<Deliverable>) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, client_deliverables: c.client_deliverables.map(dl => dl.id === deliverableId ? { ...dl, ...(local ?? {}), ...patch } as Deliverable : dl) } : c))
    await fetch(`/api/clients/${clientId}/deliverables/${deliverableId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {})
  }

  const removeDeliverable = async (clientId: string, deliverableId: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, client_deliverables: c.client_deliverables.filter(dl => dl.id !== deliverableId) } : c))
    await fetch(`/api/clients/${clientId}/deliverables/${deliverableId}`, { method: 'DELETE' }).catch(() => {})
  }

  const postUpdate = async (clientId: string) => {
    const body = (updateText[clientId] ?? '').trim()
    if (!body) return
    const res = await fetch(`/api/clients/${clientId}/updates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) })
    const d = await res.json()
    if (res.ok) {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, client_updates: [d.update, ...c.client_updates] } : c))
      setUpdateText(prev => ({ ...prev, [clientId]: '' }))
      showToast('Update posted to their page')
    } else showToast(d.error ?? 'Could not post', false)
  }

  const deleteUpdate = async (clientId: string, updateId: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, client_updates: c.client_updates.filter(u => u.id !== updateId) } : c))
    await fetch(`/api/clients/${clientId}/updates/${updateId}`, { method: 'DELETE' }).catch(() => {})
  }

  const linkFor = (slug: string) => `${window.location.origin}/client/${slug}`
  const copyLink = (slug: string) => {
    const url = linkFor(slug)
    navigator.clipboard?.writeText(url).then(() => showToast('Link copied')).catch(() => showToast(url, true))
  }

  const rotateLink = async (c: ClientRow) => {
    if (!confirm('Make a new link? The current link stops working straight away, so send the new one to your client.')) return
    await updateClient(c.id, { rotateLink: true }, 'New link ready. The old one no longer works.')
  }

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = wsName.trim()
    if (!name) return
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'agency'
    const res = await fetch('/api/orgs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug: `${slug}-${Math.random().toString(36).slice(2, 6)}` }) })
    const d = await res.json()
    if (res.ok) {
      setWorkspaces(prev => [...prev, { id: d.organization.id, name: d.organization.name, slug: d.organization.slug, role: 'owner' }])
      setScope(d.organization.id); setWsName(''); setShowWs(false)
      showToast('Workspace created. Invite your team below.')
    } else showToast(d.error ?? 'Could not create the workspace', false)
  }

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSpace || !inviteEmail.trim()) return
    const res = await fetch(`/api/orgs/${activeSpace.id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail.trim(), role: 'member' }) })
    const d = await res.json()
    if (res.ok) { setInviteEmail(''); showToast(d.pending ? 'They do not have an account yet. We emailed them an invite.' : 'Added to the workspace') }
    else showToast(d.error ?? 'Could not invite', false)
  }

  const needsYou = clients.filter(c => c.client_deliverables.some(d => d.review_status === 'changes_requested')).length

  return (
    <div style={{ minHeight: '100vh', background: '#05080d', fontFamily: 'var(--font-display)', color: '#e8eef7' }}>
      {toast && (
        <div role="status" style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#0f2a1a' : '#2a0f0f', border: `1px solid ${toast.ok ? '#22c55e33' : '#ef444433'}`, color: toast.ok ? '#86efac' : '#fca5a5', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 50 }}>{toast.msg}</div>
      )}

      <nav style={{ borderBottom: '1px solid #14202e', background: '#0a1018', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <button onClick={() => setShowCreate(s => !s)} style={{ ...primaryBtn, padding: '7px 16px' }}>+ New client</button>
      </nav>

      <div role="main" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 6px' }}>Clients</h1>
        <p style={{ color: '#8797ab', fontSize: 14, margin: '0 0 8px' }}>One link per client. They see what you built, approve it or ask for changes, and you see when they open it.</p>
        {needsYou > 0 && <p style={{ color: '#F59E0B', fontSize: 13, margin: '0 0 16px' }}>{needsYou} client{needsYou !== 1 ? 's' : ''} asked for changes.</p>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '20px 0 24px' }} role="tablist" aria-label="Workspace">
          {([['all', 'All'], ['personal', 'Just me'], ...workspaces.map(w => [w.id, w.name] as [string, string])] as Array<[string, string]>).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={scope === id} onClick={() => setScope(id)} style={{ ...ghostBtn, padding: '6px 14px', borderRadius: 20, color: scope === id ? '#03111c' : '#9aa8bb', background: scope === id ? SKY : 'none', borderColor: scope === id ? SKY : '#1b2a3b', fontWeight: 600 }}>{label}</button>
          ))}
          <button onClick={() => setShowWs(s => !s)} style={{ ...ghostBtn, padding: '6px 14px', borderRadius: 20, borderStyle: 'dashed' }}>+ Agency workspace</button>
        </div>

        {showWs && (
          <form onSubmit={createWorkspace} style={{ background: '#0d141e', border: `1px solid ${SKY}33`, borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <label style={labelStyle} htmlFor="ws-name">Agency name</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input id="ws-name" value={wsName} onChange={e => setWsName(e.target.value)} required placeholder="Northwind Studio" style={{ ...inputStyle, flex: 1 }} />
              <button type="submit" style={primaryBtn}>Create</button>
            </div>
            <p style={{ color: '#8797ab', fontSize: 12, margin: '10px 0 0' }}>A workspace lets your team share clients. You can add teammates once it exists.</p>
          </form>
        )}

        {activeSpace && (
          <div style={{ background: '#0d141e', border: '1px solid #1b2a3b', borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{activeSpace.name}</div>
            <div style={{ fontSize: 12, color: '#8797ab', margin: '2px 0 0' }}>You are {activeSpace.role === 'admin' ? 'an admin' : `a${activeSpace.role === 'owner' ? 'n owner' : ` ${activeSpace.role}`}`}. Everyone here sees these clients{activeSpace.role === 'viewer' ? ' (view only)' : ''}.</div>
            {(activeSpace.role === 'owner' || activeSpace.role === 'admin') && (
              <form onSubmit={invite} style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <input aria-label="Teammate email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="teammate@agency.com" style={{ ...inputStyle, flex: 1 }} />
                <button type="submit" style={primaryBtn}>Add teammate</button>
              </form>
            )}
          </div>
        )}

        {showCreate && (
          <form onSubmit={handleCreate} style={{ background: '#0d141e', border: `1px solid ${SKY}33`, borderRadius: 14, padding: 24, marginBottom: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input aria-label="Client or company name" value={newName} onChange={e => setNewName(e.target.value)} required autoFocus placeholder="Client or company name" style={{ ...inputStyle, flex: '1 1 220px' }} />
            {workspaces.length > 0 && (
              <select aria-label="Where this client lives" value={newOrg || (activeSpace?.id ?? '')} onChange={e => setNewOrg(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '10px 12px' }}>
                <option value="">Just me</option>
                {workspaces.filter(w => w.role !== 'viewer').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            )}
            <button type="submit" disabled={creating} style={{ ...primaryBtn, padding: '10px 22px', background: creating ? '#14202e' : SKY }}>{creating ? 'Creating…' : 'Create'}</button>
          </form>
        )}

        {shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#e8eef7', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{clients.length === 0 ? 'No clients yet' : 'No clients here yet'}</p>
            <p style={{ color: '#9aa8bb', fontSize: 14, margin: '0 auto 20px', maxWidth: 440, lineHeight: 1.6 }}>Add a client, attach the projects you built for them, and share one link. Only clients marked active can open it.</p>
            <button onClick={() => setShowCreate(true)} style={{ ...primaryBtn, padding: '10px 22px' }}>Add a client</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {shown.map(client => {
              const isOpen = expanded === client.id
              const dels = [...client.client_deliverables].sort((a, b) => a.sort_order - b.sort_order)
              const attachedIds = new Set(dels.map(d => d.project_id))
              const pickable = projects.filter(p => !attachedIds.has(p.id) && (!client.org_id || p.org_id === client.org_id || !p.org_id))
              const approved = dels.filter(d => d.review_status === 'approved').length
              const changes = dels.filter(d => d.review_status === 'changes_requested').length
              const can = client._canEdit
              const space = wsName_(client.org_id)
              return (
                <div key={client.id} style={{ background: '#0d141e', border: `1px solid ${changes ? '#F59E0B55' : '#1b2a3b'}`, borderRadius: 14, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{client.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${STATUS_COLORS[client.status]}18`, color: STATUS_COLORS[client.status], textTransform: 'capitalize' }}>{client.status}</span>
                        {space && <span style={{ fontSize: 12, color: '#8797ab' }}>{space}</span>}
                        {client.has_passcode && <span style={{ fontSize: 12, color: '#8797ab' }}>Locked</span>}
                        {!can && <span style={{ fontSize: 12, color: '#8797ab' }}>View only</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#8797ab', lineHeight: 1.6 }}>
                        {dels.length} project{dels.length !== 1 ? 's' : ''}
                        {dels.length > 0 && <> · {approved} approved</>}
                        {changes > 0 && <span style={{ color: '#F59E0B' }}> · {changes} need{changes === 1 ? 's' : ''} changes</span>}
                        {' · '}{client.view_count ? `opened ${client.view_count} time${client.view_count !== 1 ? 's' : ''}, last ${ago(client.last_viewed_at)}` : client.status === 'active' ? 'not opened yet' : 'link is off'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => copyLink(client.slug)} style={ghostBtn}>Copy link</button>
                      <button onClick={() => setExpanded(isOpen ? null : client.id)} aria-expanded={isOpen} style={ghostBtn}>{isOpen ? 'Close' : 'Manage'}</button>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #14202e', display: 'flex', flexDirection: 'column', gap: 22 }}>
                      <fieldset disabled={!can} style={{ border: 'none', margin: 0, padding: 0, display: 'contents' }}>
                        <div>
                          <div style={sectionTitle}>Their page</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                            <div>
                              <label style={labelStyle} htmlFor={`st-${client.id}`}>Status</label>
                              <select id={`st-${client.id}`} value={client.status} onChange={e => updateClient(client.id, { status: e.target.value })} style={{ ...inputStyle, padding: '10px 12px' }}>
                                {['lead', 'active', 'paused', 'archived'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <div style={{ fontSize: 11, color: '#5d6d82', marginTop: 4 }}>Only active clients can open their link.</div>
                            </div>
                            <div>
                              <label style={labelStyle} htmlFor={`bc-${client.id}`}>Brand colour</label>
                              <input id={`bc-${client.id}`} aria-label={`Brand colour for ${client.name}`} type="color" value={client.brand_color} onChange={e => patchLocal(client.id, { brand_color: e.target.value })} onBlur={e => updateClient(client.id, { brandColor: e.target.value })} style={{ width: 56, height: 40, border: '1px solid #2a2a35', borderRadius: 8, background: '#0d141e', cursor: 'pointer' }} />
                            </div>
                            <div>
                              <label style={labelStyle} htmlFor={`lg-${client.id}`}>Logo link</label>
                              <input id={`lg-${client.id}`} defaultValue={client.logo_url ?? ''} onBlur={e => e.target.value !== (client.logo_url ?? '') && updateClient(client.id, { logoUrl: e.target.value || null })} placeholder="https://…/logo.png" style={inputStyle} />
                            </div>
                            <div>
                              <label style={labelStyle} htmlFor={`em-${client.id}`}>Their email</label>
                              <input id={`em-${client.id}`} type="email" defaultValue={client.contact_email ?? ''} onBlur={e => e.target.value !== (client.contact_email ?? '') && updateClient(client.id, { contactEmail: e.target.value || null })} placeholder="client@company.com" style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <label style={labelStyle} htmlFor={`in-${client.id}`}>Intro text (shown on their page)</label>
                              <textarea id={`in-${client.id}`} defaultValue={client.intro_text ?? ''} onBlur={e => e.target.value !== (client.intro_text ?? '') && updateClient(client.id, { introText: e.target.value })} rows={2} placeholder="Here's what we've built for you so far." style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                          </div>
                        </div>

                        <div>
                          <div style={sectionTitle}>Share</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <code style={{ fontSize: 12, color: '#9aa8bb', background: '#0a1018', border: '1px solid #14202e', borderRadius: 7, padding: '7px 10px', overflowWrap: 'anywhere' }}>wyberai.com/client/{client.slug}</code>
                            <button type="button" onClick={() => copyLink(client.slug)} style={ghostBtn}>Copy</button>
                            <a href={`/client/${client.slug}`} target="_blank" rel="noreferrer" style={{ ...ghostBtn, textDecoration: 'none' }}>Open as client</a>
                            <button type="button" onClick={() => rotateLink(client)} style={ghostBtn}>Make a new link</button>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input aria-label="Passcode" type="text" value={passcodeText[client.id] ?? ''} onChange={e => setPasscodeText(p => ({ ...p, [client.id]: e.target.value }))} placeholder={client.has_passcode ? 'Passcode is on. Type a new one to change it' : 'Optional passcode (4+ characters)'} style={{ ...inputStyle, flex: '1 1 260px' }} autoComplete="off" />
                            <button type="button" disabled={(passcodeText[client.id] ?? '').length < 4} onClick={async () => { if (await updateClient(client.id, { passcode: passcodeText[client.id] }, 'Passcode set. Share it with your client.')) setPasscodeText(p => ({ ...p, [client.id]: '' })) }} style={{ ...primaryBtn, opacity: (passcodeText[client.id] ?? '').length < 4 ? 0.5 : 1 }}>{client.has_passcode ? 'Change' : 'Set passcode'}</button>
                            {client.has_passcode && <button type="button" onClick={() => updateClient(client.id, { passcode: null }, 'Passcode removed')} style={ghostBtn}>Remove</button>}
                          </div>
                        </div>

                        <div>
                          <div style={sectionTitle}>Projects they can review</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {dels.map(d => {
                              const st = REVIEW[d.review_status ?? 'pending']
                              const thread = client.client_feedback.filter(f => f.deliverable_id === d.id).sort((a, b) => a.created_at.localeCompare(b.created_at))
                              return (
                                <div key={d.id} style={{ background: '#0a1018', border: '1px solid #14202e', borderRadius: 9, padding: 12 }}>
                                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 180 }}>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eef7' }}>{d.projects?.name ?? 'Unknown project'} <span style={{ fontSize: 12, fontWeight: 700, color: st.color, marginLeft: 6 }}>{st.text}</span></div>
                                      <input aria-label={`Custom headline for ${d.projects?.name ?? 'this project'}`} defaultValue={d.headline ?? ''} onBlur={e => e.target.value !== (d.headline ?? '') && updateDeliverable(client.id, d.id, { headline: e.target.value })} placeholder="Custom headline (optional)" style={{ ...inputStyle, marginTop: 6, padding: '6px 10px', fontSize: 13 }} />
                                    </div>
                                    {d.review_status && d.review_status !== 'pending' && (
                                      <button type="button" onClick={() => updateDeliverable(client.id, d.id, { reviewStatus: 'pending' }, { review_status: 'pending' })} style={ghostBtn}>Ask for review again</button>
                                    )}
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8797ab', whiteSpace: 'nowrap' }}>
                                      <input type="checkbox" checked={d.is_visible} onChange={e => updateDeliverable(client.id, d.id, { isVisible: e.target.checked })} /> Visible
                                    </label>
                                    <button type="button" aria-label={`Remove ${d.projects?.name ?? 'project'}`} onClick={() => removeDeliverable(client.id, d.id)} style={{ ...ghostBtn, color: '#ef4444', border: 'none' }}>Remove</button>
                                  </div>
                                  {thread.length > 0 && (
                                    <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: '10px 0 0', borderTop: '1px solid #14202e', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {thread.map(f => (
                                        <li key={f.id} style={{ fontSize: 12, color: '#9aa8bb', lineHeight: 1.5 }}>
                                          <strong style={{ color: '#e8eef7' }}>{f.author_name || 'Client'}</strong> {f.kind === 'approved' ? 'approved' : f.kind === 'changes_requested' ? 'asked for changes' : 'commented'} · {ago(f.created_at)}
                                          {f.body && <div style={{ color: '#c7d1de' }}>{f.body}</div>}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          {pickable.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              <select aria-label="Attach a project" value={pickProject[client.id] ?? ''} onChange={e => setPickProject(prev => ({ ...prev, [client.id]: e.target.value }))} style={{ ...inputStyle, flex: 1, padding: '8px 12px' }}>
                                <option value="">Attach a project…</option>
                                {pickable.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <button onClick={() => addDeliverable(client.id)} disabled={!pickProject[client.id]} style={{ ...primaryBtn, opacity: pickProject[client.id] ? 1 : 0.5 }}>Attach</button>
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={sectionTitle}>Updates on their page</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <textarea aria-label="Write an update for the client" rows={2} maxLength={1000} value={updateText[client.id] ?? ''} onChange={e => setUpdateText(p => ({ ...p, [client.id]: e.target.value }))} placeholder="Booking flow is live on staging. Have a look and tell us what you think." style={{ ...inputStyle, flex: 1, resize: 'vertical' }} />
                            <button onClick={() => postUpdate(client.id)} disabled={!(updateText[client.id] ?? '').trim()} style={{ ...primaryBtn, alignSelf: 'flex-start', opacity: (updateText[client.id] ?? '').trim() ? 1 : 0.5 }}>Post</button>
                          </div>
                          {client.client_updates.length > 0 && (
                            <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {[...client.client_updates].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(u => (
                                <li key={u.id} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#c7d1de', lineHeight: 1.55 }}>
                                  <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{u.body} <span style={{ color: '#5d6d82', fontSize: 12 }}>· {ago(u.created_at)}</span></span>
                                  <button type="button" aria-label="Delete this update" onClick={() => deleteUpdate(client.id, u.id)} style={{ ...ghostBtn, border: 'none', color: '#ef4444', padding: '2px 6px' }}>Delete</button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {client._role === 'owner' && workspaces.some(w => w.role !== 'viewer') && (
                          <div>
                            <div style={sectionTitle}>Who can see this client</div>
                            <select aria-label="Move this client" value={client.org_id ?? ''} onChange={e => updateClient(client.id, { orgId: e.target.value || null }, 'Moved')} style={{ ...inputStyle, maxWidth: 320, padding: '8px 12px' }}>
                              <option value="">Just me</option>
                              {workspaces.filter(w => w.role !== 'viewer').map(w => <option key={w.id} value={w.id}>{w.name} (whole team)</option>)}
                            </select>
                          </div>
                        )}
                      </fieldset>

                      {client._canDelete && (
                        <button type="button" onClick={() => deleteClient(client.id)} style={{ alignSelf: 'flex-start', fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Delete client</button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
