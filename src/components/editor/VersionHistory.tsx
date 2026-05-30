'use client'
import { useState, useEffect } from 'react'
import { useEditorStore } from '@/store/editor'

interface Version {
  id: string
  label: string
  created_at: string
  files: Record<string, { path: string; content: string; language: string }>
}

export function VersionHistory({ projectId }: { projectId: string }) {
  const [versions, setVersions] = useState<Version[]>([])
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const { files, setFiles, setHasGeneratedFiles } = useEditorStore()

  useEffect(() => { loadVersions() }, [projectId])

  const loadVersions = async () => {
    try {
      const res = await fetch(`/api/versions?projectId=${projectId}`)
      const data = await res.json()
      if (data.versions) setVersions(data.versions)
    } catch {}
  }

  const saveVersion = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, files, label: `Snapshot ${new Date().toLocaleString()}` }),
      })
      const data = await res.json()
      if (data.version) setVersions(v => [data.version, ...v])
    } catch {}
    setSaving(false)
  }

  const restore = async (v: Version) => {
    setRestoring(v.id)
    setFiles(v.files)
    setHasGeneratedFiles(true)
    setTimeout(() => setRestoring(null), 1000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ide-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>History</div>
        <button onClick={saveVersion} disabled={saving || Object.keys(files).length < 2}
          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--ide-border)', background: saving ? 'rgba(14,165,233,0.1)' : 'transparent', color: saving ? '#0EA5E9' : 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? '✓ Saved' : '+ Save snapshot'}
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {versions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🕐</div>
            No snapshots yet.<br />Click &ldquo;Save snapshot&rdquo; to preserve your current state.
          </div>
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
