'use client'

import { useEffect, useState, useCallback } from 'react'

const BRAND = '#0EA5E9'
const BG = '#05060a'
const BG_RAISED = '#0a0c14'
const BORDER = 'rgba(255,255,255,0.08)'

const AWARDS = [
  { value: '', label: 'No award' },
  { value: 'most_liked', label: 'Most Liked' },
  { value: 'most_creative', label: 'Most Creative' },
  { value: 'best_design', label: 'Best Design' },
  { value: 'most_useful', label: 'Most Useful' },
]

type Entry = {
  id: string
  name: string
  email: string
  app_name: string | null
  description: string | null
  demo_url: string | null
  project_url: string
  vote_count: number
  is_approved: boolean
  award: string | null
  created_at: string
}

export function VibeCupAdmin() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/vibe-cup/entries')
    if (res.ok) setEntries(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function update(id: string, patch: Partial<Entry>) {
    setSaving(id)
    await fetch('/api/admin/vibe-cup/entries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
    setSaving(null)
  }

  const pending = entries.filter(e => !e.is_approved)
  const approved = entries.filter(e => e.is_approved)

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#e6edf6', fontFamily: 'Inter, system-ui, sans-serif', padding: 32 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.03em' }}>Wybe Cup Admin</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 40, fontSize: 14 }}>
          Approve entries for the marketplace · Assign award categories · {entries.length} total submissions
        </p>

        {loading && <div style={{ color: 'rgba(255,255,255,0.35)' }}>Loading…</div>}

        {!loading && (
          <>
            <Section title={`Pending Review (${pending.length})`} color="#f59e0b">
              {pending.length === 0
                ? <EmptyState text="All caught up." />
                : pending.map(e => <EntryRow key={e.id} entry={e} saving={saving === e.id} onUpdate={patch => update(e.id, patch)} />)
              }
            </Section>

            <Section title={`Approved (${approved.length})`} color="#34d399">
              {approved.length === 0
                ? <EmptyState text="None approved yet." />
                : approved.map(e => <EntryRow key={e.id} entry={e} saving={saving === e.id} onUpdate={patch => update(e.id, patch)} />)
              }
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ padding: '20px 24px', background: BG_RAISED, borderRadius: 12, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>{text}</div>
}

function EntryRow({ entry, saving, onUpdate }: { entry: Entry; saving: boolean; onUpdate: (patch: Partial<Entry>) => void }) {
  return (
    <div style={{ background: BG_RAISED, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{entry.app_name ?? '—'}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{entry.name} · {entry.email}</div>
        {entry.description && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 8, lineHeight: 1.5 }}>{entry.description}</div>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          {entry.demo_url && (
            <a href={entry.demo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: BRAND, textDecoration: 'none' }}>
              Demo →
            </a>
          )}
          <a href={entry.project_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            WyberAi project →
          </a>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>♥ {entry.vote_count}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
        <select
          value={entry.award ?? ''}
          onChange={e => onUpdate({ award: e.target.value || null })}
          disabled={saving}
          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '6px 10px', color: '#e6edf6', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {AWARDS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>

        {entry.is_approved ? (
          <button
            disabled={saving}
            onClick={() => onUpdate({ is_approved: false })}
            style={{ padding: '8px 14px', borderRadius: 6, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {saving ? '…' : 'Reject'}
          </button>
        ) : (
          <button
            disabled={saving}
            onClick={() => onUpdate({ is_approved: true })}
            style={{ padding: '8px 14px', borderRadius: 6, background: `${BRAND}20`, border: `1px solid ${BRAND}50`, color: BRAND, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {saving ? '…' : 'Approve'}
          </button>
        )}
      </div>
    </div>
  )
}
