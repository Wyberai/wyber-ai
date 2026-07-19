'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b',
  orange: '#f97316', green: '#10b981', yellow: '#f59e0b', sky: '#0EA5E9', red: '#ef4444',
}

type Draft = {
  id: string
  status: string
  subject: string
  body: string
  signal: string
  campaign_id: string | null
  created_at: string
  gtm_leads: { first_name: string; last_name: string; email: string; company_name: string; title: string } | null
}

const TABS = ['draft', 'approved', 'queued_provider', 'rejected'] as const
const TAB_LABEL: Record<string, string> = { draft: 'Needs approval', approved: 'Approved', queued_provider: 'Queued at provider', rejected: 'Rejected' }

export default function OutreachQueuePage() {
  const [tab, setTab] = useState<typeof TABS[number]>('draft')
  const [items, setItems] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<string | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])
  const [pushCampaign, setPushCampaign] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async (t: string) => {
    setLoading(true); setSelected(new Set()); setEditing(null)
    const res = await fetch(`/api/gtm/outreach?status=${t}`)
    const data = await res.json()
    setItems(data.items || [])
    setLoading(false)
  }, [])

  useEffect(() => { load(tab) }, [tab, load])
  useEffect(() => {
    fetch('/api/gtm/campaigns').then(r => r.json()).then(d => {
      const list = d.campaigns || d.items || []
      setCampaigns(list.map((c: any) => ({ id: c.id, name: c.name })))
      if (list[0]) setPushCampaign(list[0].id)
    }).catch(() => {})
  }, [])

  async function act(action: 'approve' | 'reject' | 'assign', ids: string[], extra?: Record<string, unknown>) {
    if (!ids.length) return
    setBusy(true)
    const res = await fetch('/api/gtm/outreach', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action, ...extra }),
    })
    const data = await res.json()
    setBusy(false)
    if (data.error) { setNotice(`⚠ ${data.error}`); return }
    setNotice(`${action === 'approve' ? '✓ Approved' : action === 'reject' ? 'Rejected' : 'Assigned'} ${ids.length}`)
    load(tab)
  }

  async function saveEdit(id: string) {
    setBusy(true)
    await fetch('/api/gtm/outreach', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'approve', subject: editSubject, body: editBody }),
    })
    setBusy(false); setEditing(null); setNotice('✓ Edited + approved')
    load(tab)
  }

  async function push() {
    if (!pushCampaign) { setNotice('⚠ Pick a campaign to push'); return }
    setBusy(true); setNotice('')
    const res = await fetch('/api/gtm/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'push', campaign_id: pushCampaign }),
    })
    const data = await res.json()
    setBusy(false)
    if (data.error) { setNotice(`⚠ ${data.error}`); return }
    setNotice(`✓ Pushed ${data.pushed} to ${data.provider} (paused campaign)${data.skipped_suppressed ? ` · ${data.skipped_suppressed} suppressed` : ''}${data.push_errors?.length ? ` · ${data.push_errors.length} errors` : ''}`)
    load(tab)
  }

  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/gtm" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/gtm" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>← GTM</Link>
      </nav>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,48px)' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Approval queue</h1>
          <p style={{ fontSize: 13, color: s.muted }}>Every message is a draft until you approve it. Approved drafts push to your send provider as a <b>paused</b> campaign.</p>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#111', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: tab === t ? s.card : 'transparent', color: tab === t ? s.text : s.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>

        {notice && <div style={{ marginBottom: 14, padding: '9px 14px', borderRadius: 8, background: notice.startsWith('⚠') ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.07)', border: `1px solid ${notice.startsWith('⚠') ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, fontSize: 13, color: notice.startsWith('⚠') ? '#f87171' : s.green }}>{notice}</div>}

        {tab === 'draft' && items.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <button onClick={() => setSelected(new Set(items.map(i => i.id)))} style={{ padding: '7px 12px', borderRadius: 7, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Select all</button>
            <button onClick={() => act('approve', [...selected])} disabled={busy || !selected.size} style={{ padding: '7px 14px', borderRadius: 7, background: s.green, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: selected.size ? 1 : 0.5 }}>✓ Approve {selected.size || ''}</button>
            <button onClick={() => act('reject', [...selected])} disabled={busy || !selected.size} style={{ padding: '7px 14px', borderRadius: 7, background: 'transparent', border: `1px solid rgba(239,68,68,0.4)`, color: s.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: selected.size ? 1 : 0.5 }}>Reject</button>
            {campaigns.length > 0 && <>
              <select value={pushCampaign} onChange={e => setPushCampaign(e.target.value)} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 7, padding: '7px 10px', fontSize: 12, color: s.text, outline: 'none' }}>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={() => act('assign', [...selected], { campaign_id: pushCampaign })} disabled={busy || !selected.size} style={{ padding: '7px 12px', borderRadius: 7, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: selected.size ? 1 : 0.5 }}>Assign to campaign</button>
            </>}
          </div>
        )}

        {tab === 'approved' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <select value={pushCampaign} onChange={e => setPushCampaign(e.target.value)} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 12, color: s.text, outline: 'none' }}>
              {campaigns.length ? campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option value="">No campaigns yet</option>}
            </select>
            <button onClick={push} disabled={busy || !pushCampaign} style={{ padding: '8px 16px', borderRadius: 7, background: s.orange, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {busy ? 'Pushing…' : 'Push approved → provider (paused)'}
            </button>
          </div>
        )}

        {loading ? <div style={{ color: s.muted, fontSize: 13 }}>Loading…</div> :
          items.length === 0 ? <div style={{ color: s.dim, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Nothing here. {tab === 'draft' ? 'Generate drafts from the Personalize step on a lead list.' : ''}</div> :
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(d => {
                const lead = d.gtm_leads
                const isEditing = editing === d.id
                return (
                  <div key={d.id} style={{ background: s.card, border: `1px solid ${selected.has(d.id) ? 'rgba(14,165,233,0.5)' : s.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      {tab === 'draft' && <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} style={{ marginTop: 3, accentColor: s.sky }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>
                            {lead ? `${lead.first_name} ${lead.last_name}` : 'Unknown lead'}
                            <span style={{ color: s.muted, fontWeight: 400 }}> · {lead?.title || ''}{lead?.company_name ? ` @ ${lead.company_name}` : ''}</span>
                            <div style={{ fontSize: 11, color: s.dim, fontWeight: 400 }}>{lead?.email}</div>
                          </div>
                          {tab === 'draft' && !isEditing && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => act('approve', [d.id])} style={{ padding: '5px 12px', borderRadius: 6, background: s.green, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓</button>
                              <button onClick={() => { setEditing(d.id); setEditSubject(d.subject); setEditBody(d.body) }} style={{ padding: '5px 12px', borderRadius: 6, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                              <button onClick={() => act('reject', [d.id])} style={{ padding: '5px 12px', borderRadius: 6, background: 'transparent', border: `1px solid rgba(239,68,68,0.35)`, color: s.red, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: s.yellow, marginBottom: 8 }}>◈ Signal: {d.signal || '—'}</div>
                        {isEditing ? (
                          <div>
                            <input value={editSubject} onChange={e => setEditSubject(e.target.value)} style={{ width: '100%', background: '#0c0c0e', border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: s.text, fontFamily: 'inherit', outline: 'none', marginBottom: 8 }} />
                            <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={6} style={{ width: '100%', background: '#0c0c0e', border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: s.text, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <button onClick={() => saveEdit(d.id)} disabled={busy} style={{ padding: '6px 14px', borderRadius: 6, background: s.green, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save + approve</button>
                              <button onClick={() => setEditing(null)} style={{ padding: '6px 14px', borderRadius: 6, background: 'transparent', border: `1px solid ${s.border}`, color: s.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{d.subject || '(no subject)'}</div>
                            <div style={{ fontSize: 13, color: s.muted, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{d.body}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>}
      </div>
    </div>
  )
}
