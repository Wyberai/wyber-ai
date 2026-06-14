'use client'
import { useState, useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editor'

export function MobilePreviewPanel() {
  const { files, isGenerating, hasGeneratedFiles } = useEditorStore()

  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [snackUrl, setSnackUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastKeyRef = useRef('')

  const hasApp = Object.keys(files ?? {}).some(p =>
    p.includes('App.tsx') || p.includes('App.jsx') || p.includes('App.js')
  )

  const buildPreview = () => {
    if (!hasApp) return
    const plainFiles: Record<string, string> = {}
    for (const [path, file] of Object.entries(files ?? {})) {
      const content = (file as { content?: string }).content || (file as unknown as string)
      if (typeof content === 'string') plainFiles[path] = content
    }
    const key = Object.keys(plainFiles).sort().map(p => `${p}:${plainFiles[p].length}`).join('|')
    if (key === lastKeyRef.current && embedUrl) return
    lastKeyRef.current = key
    setError(null)
    setLoading(true)
    fetch('/api/snack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: plainFiles }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        if (d.embedUrl) setEmbedUrl(d.embedUrl)
        if (d.snackUrl) setSnackUrl(d.snackUrl)
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isGenerating && hasApp && hasGeneratedFiles) buildPreview()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isGenerating, hasGeneratedFiles])

  const refresh = () => {
    lastKeyRef.current = ''
    setEmbedUrl(null)
    setSnackUrl(null)
    buildPreview()
  }

  const phoneHeight = typeof window !== 'undefined'
    ? Math.min(812, window.innerHeight - 80)
    : 700

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
      {/* Toolbar */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: embedUrl ? '#22c55e' : loading ? '#f59e0b' : isGenerating ? '#f59e0b' : '#3f3f46',
          transition: 'all 0.3s',
        }} />
        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {isGenerating ? 'Writing your app...' : loading ? 'Preparing web preview...' : embedUrl ? 'Web preview' : 'Describe your app to get started'}
        </span>
        {snackUrl && (
          <a
            href={snackUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Expo Snack — scan QR to test on iOS or Android"
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 5, color: '#0EA5E9', padding: '2px 10px', fontSize: 11, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Test on real phone ↗
          </a>
        )}
        {hasApp && !isGenerating && !loading && (
          <button
            onClick={refresh}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}
          >⟳</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>

        {/* Empty state — no app files yet */}
        {!hasApp && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="12" y="2" width="24" height="44" rx="5" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5" fill="rgba(14,165,233,0.04)"/>
              <rect x="20" y="6" width="8" height="2" rx="1" fill="rgba(14,165,233,0.4)"/>
              <circle cx="24" cy="42" r="2" fill="rgba(14,165,233,0.3)"/>
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>Mobile preview</div>
            <div style={{ fontSize: 12, color: '#a1a1aa', maxWidth: 220, textAlign: 'center', lineHeight: 1.5 }}>
              Describe your React Native app and it'll render here instantly
            </div>
          </div>
        )}

        {/* Generating overlay */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>Writing your app...</div>
          </div>
        )}

        {/* Phone frame — shown when we have an embed URL, or while loading after generation */}
        {!isGenerating && hasGeneratedFiles && hasApp && (loading || embedUrl || error) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', padding: 16 }}>
            <div style={{
              width: 375,
              maxWidth: '100%',
              height: phoneHeight,
              borderRadius: 40,
              overflow: 'hidden',
              boxShadow: '0 0 0 8px #1a1a1a, 0 0 0 9px #333, 0 30px 80px rgba(0,0,0,0.6)',
              border: '1px solid #222',
              background: '#000',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Notch */}
              <div style={{ height: 28, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 90, height: 20, background: '#0a0a0a', borderRadius: 10 }} />
              </div>

              {/* Inner content */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {loading && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#0f0f14' }}>
                    <div style={{ width: 22, height: 22, border: '2px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <div style={{ fontSize: 11, color: '#52525b' }}>Preparing web preview…</div>
                  </div>
                )}
                {error && (
                  <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: '#1a0505', padding: 14 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#ff6b6b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      <strong style={{ display: 'block', marginBottom: 8, fontSize: 11 }}>Preview error</strong>
                      {error}
                    </div>
                  </div>
                )}
                {embedUrl && !loading && !error && (
                  <iframe
                    key={embedUrl}
                    src={embedUrl}
                    title="Web preview"
                    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone"
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
