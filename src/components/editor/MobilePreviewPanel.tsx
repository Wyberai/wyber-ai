'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editor'

const MSGS = [
  'Bundling your app...',
  'Installing packages...',
  'Starting Expo...',
  'Almost ready...',
]

export function MobilePreviewPanel() {
  const { files, isGenerating } = useEditorStore()
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [snackUrl, setSnackUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msgIdx, setMsgIdx] = useState(0)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('ios')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevGenerating = useRef(false)
  const lastKey = useRef('')

  const hasApp = Object.keys(files ?? {}).some(p => p.includes('App.tsx') || p.includes('App.jsx'))

  const saveToSnack = useCallback(async () => {
    if (!hasApp || saving) return
    const key = Object.keys(files ?? {}).sort().map(p => `${p}:${(files[p] as any)?.content?.length ?? 0}`).join('|')
    if (key === lastKey.current && embedUrl) return
    lastKey.current = key

    setSaving(true)
    setError(null)
    setMsgIdx(0)
    timerRef.current = setInterval(() => setMsgIdx(i => (i + 1) % MSGS.length), 1800)

    try {
      // Convert file map to plain string map
      const plainFiles: Record<string, string> = {}
      for (const [path, file] of Object.entries(files ?? {})) {
        plainFiles[path] = (file as any).content || ''
      }

      const res = await fetch('/api/snack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: plainFiles }),
      })

      const data = await res.json()
      if (timerRef.current) clearInterval(timerRef.current)

      if (data.embedUrl) {
        setEmbedUrl(data.embedUrl.replace('platform=ios', `platform=${platform}`))
        setSnackUrl(data.snackUrl)
        setError(null)
      } else {
        setError(data.error || 'Failed to create Snack preview')
      }
    } catch (e: any) {
      if (timerRef.current) clearInterval(timerRef.current)
      setError('Network error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }, [files, hasApp, saving, embedUrl, platform])

  // Auto-save when generation finishes
  useEffect(() => {
    if (prevGenerating.current && !isGenerating && hasApp) {
      saveToSnack()
    }
    prevGenerating.current = isGenerating
  }, [isGenerating, hasApp, saveToSnack])

  // Re-embed when platform changes
  useEffect(() => {
    if (embedUrl) {
      setEmbedUrl(u => u ? u.replace(/platform=(ios|android|web)/, `platform=${platform}`) : u)
    }
  }, [platform])

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
      {/* Toolbar */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: saving ? '#f59e0b' : error ? '#ef4444' : embedUrl ? '#22c55e' : '#3f3f46', transition: 'all 0.3s' }} />
        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {isGenerating ? 'Writing your app...' : saving ? `${MSGS[msgIdx]}` : error ? 'Preview failed' : embedUrl ? 'Live on Expo Snack' : 'Describe your app to get started'}
        </span>
        {/* Platform switcher */}
        {['ios', 'android', 'web'].map(p => (
          <button key={p} onClick={() => setPlatform(p as any)}
            style={{ background: platform === p ? 'rgba(14,165,233,0.15)' : 'none', border: `1px solid ${platform === p ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 5, color: platform === p ? '#0EA5E9' : '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
            {p}
          </button>
        ))}
        {snackUrl && (
          <a href={snackUrl} target="_blank" rel="noopener noreferrer"
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 5, color: '#0EA5E9', padding: '2px 10px', fontSize: 11, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Open in Expo
          </a>
        )}
        {hasApp && !saving && (
          <button onClick={saveToSnack}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>&#8634;</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {!hasApp && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="12" y="2" width="24" height="44" rx="5" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5" fill="rgba(14,165,233,0.04)"/>
              <rect x="20" y="6" width="8" height="2" rx="1" fill="rgba(14,165,233,0.4)"/>
              <circle cx="24" cy="42" r="2" fill="rgba(14,165,233,0.3)"/>
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>Mobile preview</div>
            <div style={{ fontSize: 12, color: '#a1a1aa', maxWidth: 220, textAlign: 'center', lineHeight: 1.5 }}>Describe your React Native app and it'll appear here via Expo Snack</div>
          </div>
        )}

        {(isGenerating || saving) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>{isGenerating ? 'Writing your app...' : MSGS[msgIdx]}</div>
          </div>
        )}

        {error && !saving && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, zIndex: 5 }}>
            <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>Preview failed</div>
            <div style={{ color: '#71717a', fontSize: 11, textAlign: 'center', maxWidth: 340, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{error}</div>
            <button onClick={saveToSnack}
              style={{ background: '#0EA5E9', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        )}

        {embedUrl && !saving && !isGenerating && (
          <iframe
            src={embedUrl}
            title="Expo Snack Preview"
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: '#09090b' }}
          />
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
