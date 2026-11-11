'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { stageFor, sortByNeed, type Stage } from '@/lib/agency/stage'
import { formatMoney } from '@/lib/agency/quote'
import { api, ago, SKY, ghostBtn, primaryBtn, inputStyle, labelStyle } from './ui'
import type { ClientRow, Pin, ProjectLite, Workspace, Ctx } from './types'
import { WorkTab } from './WorkTab'
import { BriefTab } from './BriefTab'
import { QuotesTab } from './QuotesTab'
import { ShareTab } from './ShareTab'
import { BusinessPanel } from './BusinessPanel'
import { Checklist, checklistSteps } from './Checklist'
import type { AgencyProfile } from '@/lib/agency/profile'

type Tab = 'work' | 'brief' | 'quotes' | 'share'
const TABS: Array<[Tab, string]> = [['work', 'Work'], ['brief', 'Brief'], ['quotes', 'Quotes'], ['share', 'Share']]

const STAGE_COLOR: Record<string, string> = {
  not_started: '#8797ab', brief_waiting: '#8797ab', brief_ready: '#0EA5E9', in_review: '#9aa8bb', changes: '#F59E0B', fixed: '#0EA5E9',
  approved: '#22c55e', delivered: '#22c55e', lead: '#8797ab', paused: '#F59E0B', archived: '#8797ab',
}

export function ClientsPageClient({ initialClients, projects, workspaces: initialWorkspaces, pins: initialPins = [], feedbackModes: initialModes = {}, profiles: initialProfiles = {}, welcome = false }: {
  initialClients: ClientRow[]; projects: ProjectLite[]; workspaces: Workspace[]; pins?: Pin[]; feedbackModes?: Record<string, boolean>
  /** Business profiles by tenant: 'me' for the freelancer's own, or a workspace id. */
  profiles?: Record<string, AgencyProfile | null>; welcome?: boolean
}) {
  const [clients, setClients] = useState<ClientRow[]>(initialClients)
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces)
  const [pins, setPins] = useState<Pin[]>(initialPins)
  const [modes, setModes] = useState<Record<string, boolean>>(initialModes)
  const [filter, setFilter] = useState<'all' | 'needs' | string>('all') // 'all' | 'needs' | a workspace id | 'personal'
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newOrg, setNewOrg] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tab, setTab] = useState<Record<string, Tab>>({})
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [showTeam, setShowTeam] = useState(false)
  const [showBiz, setShowBiz] = useState(false)
  const [profiles, setProfiles] = useState<Record<string, AgencyProfile | null>>(initialProfiles)
  const [wsName, setWsName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [teamSpace, setTeamSpace] = useState('')

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4200) }

  const decorated = useMemo(() => clients.map(c => {
    const projectIds = new Set(c.client_deliverables.map(d => d.project_id))
    const openFeedback = c.client_feedback.filter(f => f.kind === 'changes_requested' && !f.resolved).length + pins.filter(p => projectIds.has(p.project_id)).length
    const stage: Stage = stageFor({ status: c.status, brief_token: c.brief_token, brief_submitted_at: c.brief_submitted_at, deliverables: c.client_deliverables, openFeedback })
    return { ...c, _stage: stage, _open: openFeedback }
  }), [clients, pins])

  const ordered = useMemo(() => sortByNeed(decorated), [decorated])
  const needsCount = decorated.filter(c => c._stage.needsYou).length
  const shown = ordered.filter(c => filter === 'all' ? true : filter === 'needs' ? c._stage.needsYou : filter === 'personal' ? !c.org_id : c.org_id === filter)

  const merge = (id: string, p: Partial<ClientRow>) => setClients(prev => prev.map(c => (c.id === id ? { ...c, ...p } : c)))
  const update = async (id: string, patch: Record<string, unknown>, okMsg = 'Saved') => {
    const r = await api('PATCH', `/api/clients/${id}`, patch)
    if (r.ok) { merge(id, r.data.client); showToast(okMsg); return true }
    showToast(r.data.error ?? 'Failed to save', false)
    return false
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    const orgId = newOrg || undefined
    const r = await api('POST', '/api/clients', { name: newName.trim(), orgId })
    if (r.ok) {
      const role = orgId ? (workspaces.find(w => w.id === orgId)?.role ?? 'member') : 'owner'
      setClients(prev => [{ ...r.data.client, credits_used: 0, client_deliverables: [], client_feedback: [], client_updates: [], client_quotes: [], _role: role, _canEdit: true, _canDelete: true }, ...prev])
      setExpanded(r.data.client.id); setTab(t => ({ ...t, [r.data.client.id]: 'brief' }))
      setNewName(''); setNewOrg(''); setShowCreate(false)
      showToast('Client created. Send them an intake link, or attach a project.')
    } else showToast(r.data.error ?? 'Failed to create', false)
    setCreating(false)
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault()
    const name = wsName.trim()
    if (!name) return
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'studio'
    const r = await api('POST', '/api/orgs', { name, slug: `${slug}-${Math.random().toString(36).slice(2, 6)}` })
    if (r.ok) {
      setWorkspaces(prev => [...prev, { id: r.data.organization.id, name: r.data.organization.name, slug: r.data.organization.slug, role: 'owner' }])
      setTeamSpace(r.data.organization.id); setWsName('')
      showToast('Team workspace created. Add a teammate below.')
    } else showToast(r.data.error ?? 'Could not create the workspace', false)
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    const space = workspaces.find(w => w.id === (teamSpace || workspaces[0]?.id))
    if (!space || !inviteEmail.trim()) return
    const r = await api('POST', `/api/orgs/${space.id}/members`, { email: inviteEmail.trim(), role: 'member' })
    if (r.ok) { setInviteEmail(''); showToast(r.data.pending ? 'They do not have an account yet. We emailed them an invite.' : 'Added to the workspace') }
    else showToast(r.data.error ?? 'Could not invite', false)
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/client/${slug}`
    navigator.clipboard?.writeText(url).then(() => showToast('Link copied')).catch(() => showToast(url))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05080d', fontFamily: 'var(--font-display)', color: '#e8eef7' }}>
      {toast && (
        <div role="status" style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#0f2a1a' : '#2a0f0f', border: `1px solid ${toast.ok ? '#22c55e33' : '#ef444433'}`, color: toast.ok ? '#86efac' : '#fca5a5', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 50, maxWidth: '90vw' }}>{toast.msg}</div>
      )}

      <nav style={{ borderBottom: '1px solid #14202e', background: '#0a1018', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <button onClick={() => setShowCreate(s => !s)} style={{ ...primaryBtn, padding: '7px 16px' }}>+ New client</button>
      </nav>

      <div role="main" style={{ maxWidth: 920, margin: '0 auto', padding: '40px 32px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 6px' }}>Clients</h1>
        <p style={{ color: '#8797ab', fontSize: 14, margin: '0 0 20px', maxWidth: 620, lineHeight: 1.6 }}>Run the whole job from one place: their brief, the build, their feedback, the handover and the quote.</p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '0 0 22px' }} role="tablist" aria-label="Filter clients">
          {([['all', 'All'], ['needs', `Needs you${needsCount ? ` (${needsCount})` : ''}`], ...(workspaces.length ? [['personal', 'Just me'], ...workspaces.map(w => [w.id, w.name])] : [])] as Array<[string, string]>).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)} style={{ ...ghostBtn, padding: '6px 14px', borderRadius: 20, color: filter === id ? '#03111c' : id === 'needs' && needsCount ? '#F59E0B' : '#9aa8bb', background: filter === id ? SKY : 'none', borderColor: filter === id ? SKY : '#1b2a3b', fontWeight: 600 }}>{label}</button>
          ))}
          <span style={{ flex: 1 }} />
          <button onClick={() => setShowBiz(s => !s)} aria-expanded={showBiz} style={{ ...ghostBtn, border: 'none', color: '#9aa8bb' }}>Your business</button>
          <button onClick={() => setShowTeam(s => !s)} aria-expanded={showTeam} style={{ ...ghostBtn, border: 'none', color: '#5d6d82' }}>Team</button>
        </div>

        {showBiz && <BusinessPanel profiles={profiles} workspaces={workspaces} onSaved={(k, p) => setProfiles(prev => ({ ...prev, [k]: p }))} toast={showToast} onClose={() => setShowBiz(false)} />}

        <Checklist force={welcome} steps={checklistSteps(clients, !!profiles.me?.business_name || Object.values(profiles).some(p => !!p?.business_name), { business: () => setShowBiz(true), newClient: () => setShowCreate(true) })} />

        {showTeam && (
          <div style={{ background: '#0d141e', border: '1px solid #1b2a3b', borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Working with someone?</div>
            <p style={{ fontSize: 13, color: '#8797ab', margin: '4px 0 14px', lineHeight: 1.6 }}>Create a workspace and add a teammate. You both see the same clients. If you work alone, ignore this.</p>
            <form onSubmit={createWorkspace} style={{ display: 'flex', gap: 10, marginBottom: workspaces.length ? 14 : 0 }}>
              <input aria-label="Workspace name" value={wsName} onChange={e => setWsName(e.target.value)} placeholder="Studio name" style={{ ...inputStyle, flex: 1 }} />
              <button type="submit" disabled={!wsName.trim()} style={{ ...primaryBtn, opacity: wsName.trim() ? 1 : 0.5 }}>Create workspace</button>
            </form>
            {workspaces.length > 0 && (
              <form onSubmit={invite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {workspaces.length > 1 && (
                  <select aria-label="Workspace" value={teamSpace || workspaces[0].id} onChange={e => setTeamSpace(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '10px 12px' }}>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
                )}
                <input aria-label="Teammate email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="teammate@studio.com" style={{ ...inputStyle, flex: '1 1 220px' }} />
                <button type="submit" disabled={!inviteEmail.trim()} style={{ ...primaryBtn, opacity: inviteEmail.trim() ? 1 : 0.5 }}>Add teammate</button>
              </form>
            )}
          </div>
        )}

        {showCreate && (
          <form onSubmit={handleCreate} style={{ background: '#0d141e', border: `1px solid ${SKY}33`, borderRadius: 14, padding: 24, marginBottom: 24 }}>
            <label style={labelStyle} htmlFor="new-client">Client or company name</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input id="new-client" value={newName} onChange={e => setNewName(e.target.value)} required autoFocus placeholder="Northwind Interiors" style={{ ...inputStyle, flex: '1 1 220px' }} />
              {workspaces.length > 0 && (
                <select aria-label="Where this client lives" value={newOrg} onChange={e => setNewOrg(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '10px 12px' }}>
                  <option value="">Just me</option>
                  {workspaces.filter(w => w.role !== 'viewer').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              )}
              <button type="submit" disabled={creating} style={{ ...primaryBtn, padding: '10px 22px' }}>{creating ? 'Creating…' : 'Create'}</button>
            </div>
          </form>
        )}

        {shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0' }}>
            <p style={{ color: '#e8eef7', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{clients.length === 0 ? 'No clients yet' : filter === 'needs' ? 'Nothing needs you right now' : 'No clients here yet'}</p>
            <p style={{ color: '#9aa8bb', fontSize: 14, margin: '0 auto 20px', maxWidth: 460, lineHeight: 1.6 }}>
              {clients.length === 0 ? 'Add a client, send them an intake link, build from their answers, and share one page where they review, approve and accept your quote.' : 'Clients show up here when they send a brief, ask for changes, or approve your work.'}
            </p>
            {clients.length === 0 && <button onClick={() => setShowCreate(true)} style={{ ...primaryBtn, padding: '10px 22px' }}>Add your first client</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {shown.map(client => {
              const isOpen = expanded === client.id
              const stage = client._stage
              const dels = client.client_deliverables
              const approved = dels.filter(d => d.review_status === 'approved').length
              const space = workspaces.find(w => w.id === client.org_id)?.name
              const activeTab: Tab = tab[client.id] ?? (stage.key === 'brief_ready' || stage.key === 'brief_waiting' || stage.key === 'not_started' ? 'brief' : 'work')
              const live = client.client_quotes.find(q => q.status === 'accepted' || q.status === 'sent') ?? client.client_quotes.find(q => q.status === 'paid')
              const ctx: Ctx = {
                client, profile: client.org_id ? profiles[client.org_id] ?? null : profiles.me ?? null, merge: p => merge(client.id, p), update: (p, m) => update(client.id, p, m), toast: showToast, projects, workspaces,
                pins, setPins, feedbackModes: modes, setFeedbackModes: setModes, removeClient: () => { setClients(prev => prev.filter(c => c.id !== client.id)); showToast('Client deleted') },
              }
              return (
                <div key={client.id} style={{ background: '#0d141e', border: `1px solid ${stage.needsYou ? `${STAGE_COLOR[stage.key]}55` : '#1b2a3b'}`, borderRadius: 14, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{client.name}</span>
                        <span title={stage.hint} style={{ fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 10, background: `${STAGE_COLOR[stage.key]}1f`, color: STAGE_COLOR[stage.key] }}>{stage.label}</span>
                        {space && <span style={{ fontSize: 12, color: '#8797ab' }}>{space}</span>}
                        {client.has_passcode && <span style={{ fontSize: 12, color: '#8797ab' }}>Locked</span>}
                        {!client._canEdit && <span style={{ fontSize: 12, color: '#8797ab' }}>View only</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#8797ab', lineHeight: 1.7 }}>
                        {stage.hint}
                        {dels.length > 0 && <> · {dels.length} project{dels.length !== 1 ? 's' : ''}, {approved} approved</>}
                        {client._open > 0 && <span style={{ color: '#F59E0B' }}> · {client._open} to fix</span>}
                        {live && <> · {live.number} {formatMoney(Number(live.total), live.currency)} {live.status}</>}
                        {client.view_count ? <> · opened {client.view_count}×, last {ago(client.last_viewed_at)}</> : client.status === 'active' && dels.length > 0 ? <> · not opened yet</> : null}
                        {client.credits_used > 0 && <> · {client.credits_used} credits used</>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => copyLink(client.slug)} style={ghostBtn}>Copy link</button>
                      <button onClick={() => setExpanded(isOpen ? null : client.id)} aria-expanded={isOpen} style={ghostBtn}>{isOpen ? 'Close' : 'Open'}</button>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #14202e' }}>
                      <div role="tablist" aria-label={`${client.name} sections`} style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid #14202e' }}>
                        {TABS.map(([id, label]) => (
                          <button key={id} role="tab" aria-selected={activeTab === id} onClick={() => setTab(t => ({ ...t, [client.id]: id }))} style={{ background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === id ? SKY : 'transparent'}`, color: activeTab === id ? '#fff' : '#8797ab', fontSize: 13, fontWeight: 600, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 }}>{label}</button>
                        ))}
                      </div>
                      {activeTab === 'work' && <WorkTab ctx={ctx} />}
                      {activeTab === 'brief' && <BriefTab ctx={ctx} />}
                      {activeTab === 'quotes' && <QuotesTab ctx={ctx} />}
                      {activeTab === 'share' && <ShareTab ctx={ctx} />}
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
