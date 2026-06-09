'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'

const BUILDER_URL = process.env.NEXT_PUBLIC_PREVIEW_BUILDER_URL || 'https://preview-builder.wyberai.com'

// Playful rotating status lines (Claude-style) instead of a black screen
const MESSAGES = [
  'Cooking up your components...',
  'Wiring the buttons...',
  'Teaching pixels where to sit...',
  'Mixing the color palette...',
  'Bundling it all together...',
  'Polishing the corners...',
  'Almost plated and ready...',
]

export function PreviewPanel() {
  const { files, isGenerating, project, hydrated } = useEditorStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState<number | null>(null)
  const [msgIdx, setMsgIdx] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevGenerating = useRef(false)
  const lastBuiltKey = useRef('')
  const buildRef = useRef<() => void>(() => {})
  const autoBuildTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const appFile = (files['src/App.tsx'] || files['src/App.jsx']) as any
  const hasApp = Object.keys(files).length >= 2 && (appFile?.content?.length ?? 0) > 200

  const build = useCallback(async () => {
    if (!hasApp || building) return
    const key = Object.keys(files).sort().map(p => `${p}:${(files[p] as any)?.content?.length ?? 0}`).join('|')
    if (key === lastBuiltKey.current && html) return  // skip if identical files already built
    lastBuiltKey.current = key

    setBuilding(true)
    setError(null)
    setSeconds(0)
    setMsgIdx(0)
    const start = Date.now()

    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1)
      setMsgIdx(i => (i + 1) % MESSAGES.length)
    }, 1800)

    try {
      const res = await fetch(`${BUILDER_URL}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, projectId: project?.id }),
      })

      const data = await res.json()
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsed(Math.round((Date.now() - start) / 100) / 10)

      if (data.url) {
        // cache-bust so the iframe always reloads even if URL is same
        setHtml(data.url + (data.url.includes('?') ? '&' : '?') + 't=' + Date.now())
        setError(null)
      } else {
        setError(data.error || 'Build failed')
      }
    } catch (e: any) {
      if (timerRef.current) clearInterval(timerRef.current)
      setError('Could not reach preview builder: ' + e.message)
    } finally {
      setBuilding(false)
    }
  }, [files, hasApp, building, project, html])

  // Keep a ref to the latest build fn so timers/effects always call the current one
  useEffect(() => { buildRef.current = build }, [build])

  // Auto-build when generation finishes
  useEffect(() => {
    if (prevGenerating.current && !isGenerating && hasApp) {
      buildRef.current()
    }
    prevGenerating.current = isGenerating
  }, [isGenerating, hasApp])

  // Auto-build when files change (debounced) — covers edits, restores, and project open
  useEffect(() => {
    if (!hydrated || !hasApp || isGenerating) return
    const key = Object.keys(files).sort().map(p => `${p}:${(files[p] as any)?.content?.length ?? 0}`).join('|')
    if (key === lastBuiltKey.current) return // already built this exact state
    if (autoBuildTimer.current) clearTimeout(autoBuildTimer.current)
    autoBuildTimer.current = setTimeout(() => {
      buildRef.current()
    }, 600)
    return () => { if (autoBuildTimer.current) clearTimeout(autoBuildTimer.current) }
  }, [files, hydrated, hasApp, isGenerating])

  // Update iframe src when URL returned
  useEffect(() => {
    if (iframeRef.current && html) {
      iframeRef.current.src = html
    }
  }, [html])

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: building ? '#f59e0b' : html ? '#22c55e' : '#3f3f46', boxShadow: html ? '0 0 6px rgba(34,197,94,0.4)' : 'none', transition: 'all 0.3s' }} />
        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {isGenerating ? 'Writing your app...' : building ? `${MESSAGES[msgIdx]} (${seconds}s)` : elapsed ? `Built in ${elapsed}s` : hasApp ? 'Ready' : 'Describe what you want to build'}
        </span>
        {html && !building && (
          <button onClick={build} title="Rebuild preview"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>&#8634;</button>
        )}
        {hasApp && !building && !html && (
          <button onClick={build}
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 5, color: '#0EA5E9', cursor: 'pointer', padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
            Build preview
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Empty state */}
        {!hasApp && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.12)" strokeWidth="1"/><path d="M20 7L11 16L20 25" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#52525b' }}>Describe what you want to build</div>
            <div style={{ fontSize: 11, color: '#3f3f46' }}>Your app will appear here automatically after generation</div>
          </div>
        )}

        {/* Generating */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>Writing your app...</div>
          </div>
        )}

        {/* Building — playful rotating lines */}
        {building && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(245,158,11,0.15)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 14, color: '#e4e4e7', fontWeight: 600, transition: 'opacity 0.3s' }}>{MESSAGES[msgIdx]}</div>
            <div style={{ fontSize: 11, color: '#52525b' }}>{seconds}s · first build ~15s, then instant</div>
          </div>
        )}

        {/* Error */}
        {error && !building && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, background: '#09090b', zIndex: 5 }}>
            <div style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', maxWidth: 400, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error.slice(0, 500)}</div>
            <button onClick={build} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {/* Preview iframe */}
        <iframe
          ref={iframeRef}
          title="Wyber Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: html && !building && !isGenerating ? 'block' : 'none', background: '#09090b' }}
        />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
