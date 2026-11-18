'use client'
import { useState, useEffect } from 'react'
import { useEditorStore } from '@/store/editor'
import { persistProjectFiles } from '@/lib/persist-project'
import { SkeletonList, EmptyState } from './ui'
import { VersionPreviewModal } from './VersionPreviewModal'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_SHELL_STRINGS } from '@/lib/i18n/dict/editor-shell'
import { COMMON_STRINGS } from '@/lib/i18n/dict/common'

type VFiles = Record<string, { path: string; content: string; language: string }>

// Two stores hold saved versions: project_snapshots (what the top bar saves) and project_versions (older saves from this
// panel). This panel shows both together so nothing disappears, and saves new ones to snapshots so the top bar and this
// tab agree. A snapshot's files are fetched only when needed (preview, restore), so `files` can be empty until then.
interface Version {
  id: string
  label: string
  created_at: string
  source: 'snapshot' | 'version'
  files?: VFiles
}

const langOf = (path: string) => (/\.(tsx?|jsx?)$/.test(path) ? 'typescript' : path.endsWith('.css') ? 'css' : path.endsWith('.html') ? 'html' : path.endsWith('.json') ? 'json' : 'plaintext')

// Cheap file-level diff (added / removed / modified paths) against the
// current working copy — no line-by-line diff, just enough to answer
// "would restoring this actually change anything, and how much?"
function countChanged(a: Record<string, { content?: string }>, b: Record<string, { content?: string }>): number {
  const paths = new Set([...Object.keys(a || {}), ...Object.keys(b || {})])
  let changed = 0
  for (const p of paths) {
    if ((a?.[p]?.content ?? null) !== (b?.[p]?.content ?? null)) changed++
  }
  return changed
}

export function VersionHistory({ projectId }: { projectId: string }) {
  const t = useT(EDITOR_SHELL_STRINGS)
  const tc = useT(COMMON_STRINGS)
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [naming, setNaming] = useState(false)
  const [labelInput, setLabelInput] = useState('')
  const [previewing, setPreviewing] = useState<Version | null>(null)
  const { files, setFiles, setHasGeneratedFiles, project } = useEditorStore()

  useEffect(() => { loadVersions() }, [projectId])

  const loadVersions = async () => {
    try {
      const [vRes, sRes] = await Promise.all([
        fetch(`/api/versions?projectId=${projectId}`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/snapshots?project_id=${projectId}`).then(r => r.json()).catch(() => ({})),
      ])
      const old: Version[] = (vRes.versions ?? []).map((v: Omit<Version, 'source'>) => ({ ...v, source: 'version' as const }))
      const snaps: Version[] = (sRes.snapshots ?? []).map((v: Omit<Version, 'source' | 'files'>) => ({ ...v, source: 'snapshot' as const }))
      setVersions([...snaps, ...old].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)))
    } catch {}
    setLoading(false)
  }

  const saveVersion = async () => {
    const label = labelInput.trim() || `${t('vhSnapshotDefaultLabelPrefix')} ${new Date().toLocaleString()}`
    setSaving(true)
    setNaming(false)
    try {
      // Same endpoint and payload the top bar uses (file contents as plain strings), so both places list the same saves.
      const payload = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, (v as { content?: string }).content ?? '']))
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, files: payload, label }),
      })
      const raw = await res.json()
      const data = { version: raw.snapshot ? { ...raw.snapshot, source: 'snapshot' as const } : null }
      // The POST response deliberately omits `files` (no reason to round-trip
      // potentially large file content back over the wire when the client
      // already has it) — but the list item's "N files" count reads
      // `v.files`, so the just-saved snapshot showed "0 files" until the
      // panel was reloaded. The content was always correctly persisted
      // (confirmed directly in the DB); this was a display-only bug that
      // still looked exactly like "did this actually save anything?"
      if (data.version) setVersions(v => [{ ...data.version, files }, ...v])
    } catch {}
    setLabelInput('')
    setSaving(false)
  }

  // Snapshots are listed without their files; fetch them the first time they are needed and keep them.
  const withFiles = async (v: Version): Promise<Version | null> => {
    if (v.files) return v
    try {
      const res = await fetch(`/api/snapshots/${v.id}?project_id=${projectId}`)
      if (!res.ok) return null
      const { snapshot } = await res.json()
      const files: VFiles = Object.fromEntries(
        Object.entries(snapshot.files as Record<string, string | { content?: string }>).map(([k, c]) => [k, { path: k, content: typeof c === 'string' ? c : (c?.content ?? ''), language: langOf(k) }]),
      )
      const full = { ...v, files }
      setVersions(list => list.map(x => (x.id === v.id ? full : x)))
      return full
    } catch { return null }
  }

  const openPreview = async (v: Version) => {
    const full = await withFiles(v)
    if (full) setPreviewing(full)
  }

  const restore = async (v: Version) => {
    setRestoring(v.id)
    const full = await withFiles(v)
    if (!full?.files) { setRestoring(null); return }
    // Update the store (triggers preview auto-rebuild)
    setFiles(full.files)
    setHasGeneratedFiles(true)
    // Persist the restore to Supabase so it survives refresh
    await persistProjectFiles(projectId, full.files, project?.userId)
    setTimeout(() => setRestoring(null), 1200)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ide-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('rpTabHistoryLabel')}</div>
        {!naming && (
          <button onClick={() => setNaming(true)} disabled={saving || Object.keys(files).length < 2}
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--ide-border)', background: saving ? 'rgba(14,165,233,0.1)' : 'transparent', color: saving ? '#0EA5E9' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? `✓ ${tc('saved')}` : t('vhSaveSnapshotBtn')}
          </button>
        )}
      </div>

      {/* Name input row */}
      {naming && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ide-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input aria-label={t('vhSnapshotPlaceholder')}
            autoFocus
            value={labelInput}
            onChange={e => setLabelInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveVersion(); if (e.key === 'Escape') { setNaming(false); setLabelInput('') } }}
            placeholder={t('vhSnapshotPlaceholder')}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--ide-border)', borderRadius: 7, color: 'var(--ide-text)', fontSize: 12, padding: '8px 11px', outline: 'none', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={saveVersion} style={{ flex: 1, padding: '6px', borderRadius: 6, border: 'none', background: '#0EA5E9', color: '#03111c', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{tc('save')}</button>
            <button onClick={() => { setNaming(false); setLabelInput('') }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{tc('cancel')}</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {loading ? (
          <SkeletonList rows={4} rowHeight={72} />
        ) : versions.length === 0 ? (
          <EmptyState
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 106 5.3L3 8"/><path d="M12 7v5l3 2"/></svg>}
            title={t('vhEmptyTitle')}
            hint={t('vhEmptyHint')}
          />
        ) : versions.map(v => {
          const changed = v.files ? countChanged(v.files, files) : 0
          return (
          <div key={v.id} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{v.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              {new Date(v.created_at).toLocaleString()}{v.files ? <> · {Object.keys(v.files).length} {t('vhFilesWord')}</> : null}
              {changed > 0 && <> · {changed} different from current</>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openPreview(v)}
                style={{ flex: 1, padding: '5px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Preview
              </button>
              <button onClick={() => restore(v)} disabled={restoring === v.id}
                style={{ flex: 1, padding: '5px', borderRadius: 6, border: '1px solid var(--ide-border)', background: restoring === v.id ? 'rgba(14,165,233,0.1)' : 'transparent', color: restoring === v.id ? '#0EA5E9' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {restoring === v.id ? t('vhRestoredLabel') : t('vhRestoreBtn')}
              </button>
            </div>
          </div>
          )
        })}
      </div>

      {previewing && (
        <VersionPreviewModal
          key={previewing.id}
          label={previewing.label}
          createdAt={previewing.created_at}
          files={previewing.files ?? {}}
          projectId={project?.id || ''}
          restoring={restoring === previewing.id}
          onClose={() => setPreviewing(null)}
          onRestore={async () => { await restore(previewing); setPreviewing(null) }}
        />
      )}
    </div>
  )
}
