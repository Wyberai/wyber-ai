'use client'
import Link from 'next/link'
import { useState } from 'react'
import { WyberLogo } from '@/components/shared/WyberLogo'

const SKY = '#0EA5E9'

interface ProjectLite { id: string; name: string; thumbnail_url: string | null }
interface Deliverable {
  id: string; headline: string | null; description: string | null
  sort_order: number; is_visible: boolean; project_id: string
  projects: ProjectLite | null
}
interface ClientRow {
  id: string; name: string; slug: string; company_name: string | null
  contact_email: string | null; contact_name: string | null; logo_url: string | null
  brand_color: string; intro_text: string | null; status: 'lead' | 'active' | 'paused' | 'archived'
  notes: string | null; client_deliverables: Deliverable[]
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#111115', border: '1px solid #2a2a35',
  borderRadius: 9, padding: '10px 14px', fontSize: 14, color: '#e4e4e7', outline: 'none', fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#71717a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }

const STATUS_COLORS: Record<string, string> = { lead: '#a1a1aa', active: '#22c55e', paused: '#F59E0B', archived: '#52525b' }

export function ClientsPageClient({ initialClients, projects }: { initialClients: ClientRow[]; projects: ProjectLite[] }) {
  const [clients, setClients] = useState<ClientRow[]>(initialClients)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [pickProject, setPickProject] = useState<Record<string, string>>({})

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }) })
    const d = await res.json()
    if (res.ok) {
      setClients(prev => [{ ...d.client, client_deliverables: [] }, ...prev])
      setNewName(''); setShowCreate(false)
      showToast('Client created')
    } else showToast(d.error ?? 'Failed to create', false)
    setCreating(false)
  }

  const updateClient = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/clients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    const d = await res.json()
    if (res.ok) { setClients(prev => prev.map(c => c.id === id ? { ...c, ...d.client } : c)); showToast('Saved') }
    else showToast(d.error ?? 'Failed to save', false)
  }

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this client? This does not delete their projects.')) return
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    if (res.ok) { setClients(prev => prev.filter(c => c.id !== id)); showToast('Client deleted') }
    else showToast('Failed to delete', false)
  }

  const addDeliverable = async (clientId: string) => {
    const projectId = pickProject[clientId]
    if (!projectId) return
    const res = await fetch(`/api/clients/${clientId}/deliverables`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) })
    const d = await res.json()
    if (res.ok) {
      const project = projects.find(p => p.id === projectId) ?? null
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, client_deliverables: [...c.client_deliverables, { ...d.deliverable, projects: project }] } : c))
      setPickProject(prev => ({ ...prev, [clientId]: '' }))
    } else showToast(d.error ?? 'Failed to add', false)
  }

  const updateDeliverable = async (clientId: string, deliverableId: string, patch: Record<string, unknown>) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, client_deliverables: c.client_deliverables.map(dl => dl.id === deliverableId ? { ...dl, ...patch } : dl) } : c))
    await fetch(`/api/clients/${clientId}/deliverables/${deliverableId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {})
  }

  const removeDeliverable = async (clientId: string, deliverableId: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, client_deliverables: c.client_deliverables.filter(dl => dl.id !== deliverableId) } : c))
    await fetch(`/api/clients/${clientId}/deliverables/${deliverableId}`, { method: 'DELETE' }).catch(() => {})
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/client/${slug}`
    navigator.clipboard?.writeText(url).then(() => showToast('Link copied')).catch(() => showToast(url, true))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d12', fontFamily: 'var(--font-display)', color: '#e4e4e7' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#0f2a1a' : '#2a0f0f', border: `1px solid ${toast.ok ? '#22c55e33' : '#ef444433'}`, color: toast.ok ? '#22c55e' : '#ef4444', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, maxWidth: 400, wordBreak: 'break-all' }}>{toast.msg}</div>
      )}

      <nav style={{ borderBottom: '1px solid #1a1a22', background: '#0d0d11', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <button onClick={() => setShowCreate(s => !s)} style={{ fontSize: 13, fontWeight: 600, color: '#fff', padding: '7px 16px', borderRadius: 8, background: SKY, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>+ New client</button>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 6px' }}>Clients</h1>
        <p style={{ color: '#3f3f46', fontSize: 14, margin: '0 0 32px' }}>A shareable delivery page per client — no more one-off HTML per engagement.</p>

        {showCreate && (
          <form onSubmit={handleCreate} style={{ background: '#111115', border: `1px solid ${SKY}33`, borderRadius: 14, padding: 24, marginBottom: 24, display: 'flex', gap: 10 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} required autoFocus placeholder="Client or company name" style={{ ...inputStyle, flex: 1 }} />
            <button type="submit" disabled={creating} style={{ padding: '10px 22px', borderRadius: 9, background: creating ? '#1a1a22' : SKY, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{creating ? 'Creating…' : 'Create'}</button>
          </form>
        )}

        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🤝</div>
            <p style={{ color: '#3f3f46', fontSize: 14, marginBottom: 20 }}>No clients yet.</p>
            <button onClick={() => setShowCreate(true)} style={{ padding: '10px 22px', borderRadius: 9, background: SKY, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Add your first client</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {clients.map(client => {
              const isOpen = expanded === client.id
              const attachedIds = new Set(client.client_deliverables.map(d => d.project_id))
              const pickable = projects.filter(p => !attachedIds.has(p.id))
              return (
                <div key={client.id} style={{ background: '#111115', border: '1px solid #1e1e26', borderRadius: 14, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{client.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${STATUS_COLORS[client.status]}18`, color: STATUS_COLORS[client.status], textTransform: 'uppercase', letterSpacing: '0.05em' }}>{client.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#3f3f46' }}>wyberai.com/client/{client.slug} · {client.client_deliverables.length} project{client.client_deliverables.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => copyLink(client.slug)} style={{ fontSize: 11, color: '#52525b', background: 'none', border: '1px solid #1e1e26', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>Copy link</button>
                      <button onClick={() => setExpanded(isOpen ? null : client.id)} style={{ fontSize: 11, color: '#52525b', background: 'none', border: '1px solid #1e1e26', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>{isOpen ? 'Close' : 'Manage'}</button>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #1a1a22', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={labelStyle}>Status</label>
                          <select value={client.status} onChange={e => updateClient(client.id, { status: e.target.value })} style={{ ...inputStyle, padding: '10px 12px' }}>
                            {['lead', 'active', 'paused', 'archived'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Brand color</label>
                          <input type="color" value={client.brand_color} onChange={e => updateClient(client.id, { brandColor: e.target.value })} style={{ ...inputStyle, padding: 4, height: 40 }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={labelStyle}>Intro text (shown on their page)</label>
                          <textarea defaultValue={client.intro_text ?? ''} onBlur={e => updateClient(client.id, { introText: e.target.value })} rows={2} placeholder="Here's what we've built for you so far…" style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Deliverables</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {client.client_deliverables.sort((a, b) => a.sort_order - b.sort_order).map(d => (
                            <div key={d.id} style={{ background: '#0d0d11', border: '1px solid #1a1a22', borderRadius: 9, padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>{d.projects?.name ?? 'Unknown project'}</div>
                                <input defaultValue={d.headline ?? ''} onBlur={e => updateDeliverable(client.id, d.id, { headline: e.target.value })} placeholder="Custom headline (optional)" style={{ ...inputStyle, marginTop: 6, padding: '6px 10px', fontSize: 12 }} />
                              </div>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#52525b', whiteSpace: 'nowrap' }}>
                                <input type="checkbox" checked={d.is_visible} onChange={e => updateDeliverable(client.id, d.id, { isVisible: e.target.checked })} /> Visible
                              </label>
                              <button onClick={() => removeDeliverable(client.id, d.id)} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                            </div>
                          ))}
                        </div>
                        {pickable.length > 0 && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <select value={pickProject[client.id] ?? ''} onChange={e => setPickProject(prev => ({ ...prev, [client.id]: e.target.value }))} style={{ ...inputStyle, flex: 1, padding: '8px 12px' }}>
                              <option value="">Attach a project…</option>
                              {pickable.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <button onClick={() => addDeliverable(client.id)} disabled={!pickProject[client.id]} style={{ padding: '8px 16px', borderRadius: 9, background: SKY, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Add</button>
                          </div>
                        )}
                      </div>

                      <button onClick={() => deleteClient(client.id)} style={{ alignSelf: 'flex-start', fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Delete client</button>
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
