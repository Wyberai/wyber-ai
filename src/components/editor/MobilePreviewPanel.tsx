'use client'
import { useState, useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editor'

export function MobilePreviewPanel() {
  const { files, isGenerating, hasGeneratedFiles } = useEditorStore()

  const [snackUrl, setSnackUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastKeyRef = useRef('')

  const hasApp = Object.keys(files ?? {}).some(p =>
    p.includes('App.tsx') || p.includes('App.jsx') || p.includes('App.js')
  )
  const fileCount = Object.keys(files ?? {}).length
  // Trigger for AI-generated apps OR gallery/template apps (>1 file = real app, not the 1-file starter placeholder)
  const shouldBuildPreview = hasApp && (hasGeneratedFiles || fileCount > 1)

  const buildPreview = () => {
    if (!shouldBuildPreview) return
    const plainFiles: Record<string, string> = {}
    for (const [path, file] of Object.entries(files ?? {})) {
      const content = (file as { content?: string }).content || (file as unknown as string)
      if (typeof content === 'string') plainFiles[path] = content
    }
    const key = Object.keys(plainFiles).sort().map(p => `${p}:${plainFiles[p].length}`).join('|')
    if (key === lastKeyRef.current && snackUrl) return
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
        if (d.snackUrl) setSnackUrl(d.snackUrl)
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isGenerating && shouldBuildPreview) buildPreview()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isGenerating, hasGeneratedFiles])

  const refresh = () => {
    lastKeyRef.current = ''
    setSnackUrl(null)
    setError(null)
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
          background: snackUrl ? '#22c55e' : loading ? '#f59e0b' : isGenerating ? '#f59e0b' : '#3f3f46',
          transition: 'all 0.3s',
        }} />
        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {isGenerating ? 'Writing your app...' : loading ? 'Uploading to Expo Snack...' : snackUrl ? 'Preview ready' : 'Describe your app to get started'}
        </span>
        {shouldBuildPreview && !isGenerating && !loading && (
          <button
            onClick={refresh}
            title="Rebuild preview"
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
              Describe your React Native app and it&apos;ll render here instantly
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

        {/* Phone frame — shown when preview is building or ready */}
        {!isGenerating && shouldBuildPreview && (loading || snackUrl || error) && (
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

                {/* Loading */}
                {loading && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#0f0f14' }}>
                    <div style={{ width: 22, height: 22, border: '2px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <div style={{ fontSize: 11, color: '#52525b' }}>Uploading to Expo Snack…</div>
                  </div>
                )}

                {/* Error */}
                {error && !loading && (
                  <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: '#1a0505', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#ff6b6b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      <strong style={{ display: 'block', marginBottom: 8, fontSize: 11 }}>Preview error</strong>
                      {error}
                    </div>
                    <button onClick={refresh}
                      style={{ alignSelf: 'flex-start', background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 10, fontFamily: 'monospace' }}>
                      Retry ⟳
                    </button>
                  </div>
                )}

                {/* Preview ready — open in Expo Snack */}
                {snackUrl && !loading && !error && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: '#0c0c12', padding: 24 }}>

                    {/* Phone icon */}
                    <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
                        <rect x="12" y="2" width="24" height="44" rx="5" stroke="#0EA5E9" strokeWidth="2" fill="rgba(14,165,233,0.08)"/>
                        <rect x="20" y="6" width="8" height="2" rx="1" fill="#0EA5E9" opacity="0.7"/>
                        <circle cx="24" cy="42" r="2" fill="#0EA5E9" opacity="0.7"/>
                        <rect x="17" y="16" width="14" height="2" rx="1" fill="#0EA5E9" opacity="0.5"/>
                        <rect x="17" y="21" width="10" height="2" rx="1" fill="#0EA5E9" opacity="0.35"/>
                        <rect x="17" y="26" width="12" height="2" rx="1" fill="#0EA5E9" opacity="0.35"/>
                      </svg>
                    </div>

                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>Your app is ready</div>
                      <div style={{ fontSize: 11, color: '#52525b', lineHeight: 1.6, maxWidth: 240 }}>
                        For the best experience, install <strong style={{ color: '#a1a1aa' }}>Expo Go</strong> on your phone (<a href="https://apps.apple.com/app/expo-go/id982107779" target="_blank" rel="noopener" style={{ color: '#0EA5E9' }}>iOS</a> / <a href="https://play.google.com/store/apps/details?id=host.exp.exponent" target="_blank" rel="noopener" style={{ color: '#0EA5E9' }}>Android</a>) and scan the QR code to preview your app live on your device.
                      </div>
                    </div>

                    <a
                      href={snackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '11px 22px',
                        borderRadius: 12,
                        background: '#0EA5E9',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: 'none',
                        boxShadow: '0 4px 24px rgba(14,165,233,0.35)',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Open in Expo Snack ↗
                    </a>

                  </div>
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
