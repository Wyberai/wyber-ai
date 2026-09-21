'use client'
import { useEffect, useRef, useState } from 'react'
import { sanitizeFiles } from '@/lib/sanitize-files'

interface VersionFiles {
  [path: string]: { content?: string; language?: string }
}

interface Props {
  label: string
  createdAt: string
  files: VersionFiles
  projectId: string
  onClose: () => void
  onRestore: () => void
  restoring: boolean
}

// Renders a saved snapshot's files through the server-side bundler
// (/api/web-bundle) — the SAME one the live preview uses by default
// (PreviewPanel.tsx's betaBundler defaults to true). Deliberately NOT the
// client-side esbuild-wasm path (wyber-preview/engine.ts's bundleFiles):
// confirmed live, that path silently produced a blank preview for a project
// this exact server bundler renders correctly — it's the app's own
// unadvertised fallback (flagged with a ⚠ warning icon in PreviewPanel's own
// UI when a user switches to it manually), not the reliable default.
// Entirely off to the side from useEditorStore either way, so looking at an
// old version can't clobber whatever's currently in the working copy.
// Restoring is still a separate, explicit action from here.
export function VersionPreviewModal({ label, createdAt, files, projectId, onClose, onRestore, restoring }: Props) {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const sanitized = sanitizeFiles(files, { appId: projectId })
        const res = await fetch('/api/web-bundle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: sanitized, projectId }),
        })
        const data = await res.json() as { html?: string; error?: string }
        if (cancelled) return
        if (!data.html) { setError(data.error || 'Could not build this snapshot'); return }
        const blobUrl = URL.createObjectURL(new Blob([data.html], { type: 'text/html' }))
        blobUrlRef.current = blobUrl
        setHtml(blobUrl)
      } catch (e) {
        if (!cancelled) setError(String(e))
      }
    })()
    return () => {
      cancelled = true
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [files, projectId])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Previewing: {label}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
            {new Date(createdAt).toLocaleString()} — your current draft is untouched
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onRestore} disabled={restoring}
            style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 12, fontWeight: 600, cursor: restoring ? 'wait' : 'pointer' }}>
            {restoring ? 'Restoring…' : 'Restore this version'}
          </button>
          <button onClick={onClose}
            style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
      <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        {error ? (
          <div style={{ padding: 20, fontSize: 13, color: '#dc2626' }}>{error}</div>
        ) : html ? (
          <iframe src={html} title="Version preview" style={{ width: '100%', height: '100%', border: 'none' }} />
        ) : (
          <div style={{ padding: 20, fontSize: 13, color: '#6b7280' }}>Building preview…</div>
        )}
      </div>
    </div>
  )
}
