'use client'

import { useState } from 'react'

const SKY = '#0EA5E9'
const GREEN = '#22c55e'
const AMBER = '#f59e0b'
const PURPLE = '#a855f7'
const MUTED = '#71717a'

const STATUS_COLOR: Record<string, string> = {
  new: SKY,
  contacted: AMBER,
  demo_scheduled: PURPLE,
  design_partner: '#3dd68c',
  won: GREEN,
  lost: MUTED,
}
const STATUSES = ['new', 'contacted', 'demo_scheduled', 'design_partner', 'won', 'lost']

export type EnterpriseLead = {
  id: string; name: string; email: string; company: string; team_size: string | null
  message: string | null; source: string; status: string; notes: string | null
  org_id: string | null; created_at: string; updated_at: string
}

export default function EnterpriseLeadsClient({ initialLeads }: { initialLeads: EnterpriseLead[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})

  const update = async (id: string, patch: { status?: string; notes?: string }) => {
    setSavingId(id)
    const res = await fetch(`/api/admin/enterprise-leads/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
    if (res.ok) {
      const d = await res.json()
      setLeads(prev => prev.map(l => l.id === id ? d.lead : l))
    }
    setSavingId(null)
  }

  const openCount = leads.filter(l => !['won', 'lost'].includes(l.status)).length

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#e4e4e7', fontFamily: 'system-ui, sans-serif', padding: '48px 24px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🏢 Enterprise leads</h1>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>{openCount} open · {leads.length} total. Submitted from /enterprise.</p>

        {leads.length === 0 ? (
          <p style={{ fontSize: 13, color: '#a1a1aa' }}>No enterprise enquiries yet.</p>
        ) : leads.map(lead => (
          <div key={lead.id} style={{ padding: '16px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#111113', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa' }}>{lead.company}</div>
                <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>{lead.name} &middot; {lead.email}{lead.team_size ? ` · ${lead.team_size}` : ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#52525b' }}>{new Date(lead.created_at).toLocaleDateString()}</span>
                <select
                  value={lead.status}
                  disabled={savingId === lead.id}
                  onChange={e => update(lead.id, { status: e.target.value })}
                  style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[lead.status] ?? MUTED, background: '#18181b', border: `1px solid ${STATUS_COLOR[lead.status] ?? MUTED}44`, borderRadius: 8, padding: '5px 8px' }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            {lead.message && <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{lead.message}</p>}
            <textarea
              placeholder="Internal notes…"
              defaultValue={lead.notes ?? ''}
              onChange={e => setNotesDraft(d => ({ ...d, [lead.id]: e.target.value }))}
              onBlur={() => { if (notesDraft[lead.id] !== undefined && notesDraft[lead.id] !== (lead.notes ?? '')) update(lead.id, { notes: notesDraft[lead.id] }) }}
              rows={2}
              style={{ width: '100%', boxSizing: 'border-box', background: '#0d0d11', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#e4e4e7', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
