'use client'
import { useState, useEffect } from 'react'
import { useEditorStore } from '@/store/editor'
import { SkeletonList, EmptyState } from './ui'

interface Version {
  id: string
  label: string
  created_at: string
  files: Record<string, { path: string; content: string; language: string }>
}

export function VersionHistory({ projectId }: { projectId: string }) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [naming, setNaming] = useState(false)
  const [labelInput, setLabelInput] = useState('')
  const { files, setFiles, setHasGeneratedFiles, project } = useEditorStore()

  useEffect(() => { loadVersions() }, [projectId])

  const loadVersions = async () => {
    try {
      const res = await fetch(`/api/versions?projectId=${projectId}`)
      const data = await res.json()
      if (data.versions) setVersions(data.versions)
    } catch {}
    setLoading(false)
  }

  const saveVersion = async () => {
    const label = labelInput.trim() || `Snapshot ${new Date().toLocaleString()}`
    setSaving(true)
    setNaming(false)
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, files, label }),
      })
      const data = await res.json()
      if (data.version) setVersions(v => [data.version, ...v])
    } catch {}
    setLabelInput('')
    setSaving(false)
  }

  const restore = async (v: Version) => {
    setRestoring(v.id)
    // Update the store (triggers preview auto-rebuild)
    setFiles(v.files)
    setHasGeneratedFiles(true)
    // Persist the restore to Supabase so it survives refresh
    try {
      await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, files: v.files, userId: project?.userId || 'auto' }),
      })
    } catch {}
    setTimeout(() => setRestoring(null), 1200)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ide-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>History</div>
        {!naming && (
          <button onClick={() => setNaming(true)} disabled={saving || Object.keys(files).length < 2}
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--ide-border)', background: saving ? 'rgba(14,165,233,0.1)' : 'transparent', color: saving ? '#0EA5E9' : 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? '✓ Saved' : '+ Save snapshot'}
          </button>
        )}
      </div>

      {/* Name input row */}
      {naming && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ide-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            autoFocus
            value={labelInput}
            onChange={e => setLabelInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveVersion(); if (e.key === 'Escape') { setNaming(false); setLabelInput('') } }}
            placeholder="Name this snapshot (e.g. Before adding auth)"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', borderRadius: 7, color: 'var(--ide-text)', fontSize: 12, padding: '8px 11px', outline: 'none', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={saveVersion} style={{ flex: 1, padding: '6px', borderRadius: 6, border: 'none', background: '#0EA5E9', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Save</button>
            <button onClick={() => { setNaming(false); setLabelInput('') }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {loading ? (
          <SkeletonList rows={4} rowHeight={72} />
        ) : versions.length === 0 ? (
          <EmptyState
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 106 5.3L3 8"/><path d="M12 7v5l3 2"/></svg>}
            title="No snapshots yet"
            hint="Save a snapshot before big changes so you can always roll back."
          />
        ) : versions.map(v => (
          <div key={v.id} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{v.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
              {new Date(v.created_at).toLocaleString()} · {Object.keys(v.files || {}).length} files
            </div>
            <button onClick={() => restore(v)} disabled={restoring === v.id}
              style={{ width: '100%', padding: '5px', borderRadius: 6, border: '1px solid var(--ide-border)', background: restoring === v.id ? 'rgba(14,165,233,0.1)' : 'transparent', color: restoring === v.id ? '#0EA5E9' : 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {restoring === v.id ? '✓ Restored' : '↩ Restore this version'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
