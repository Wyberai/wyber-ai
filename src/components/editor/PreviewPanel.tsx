'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'

const BUILDER_URL = process.env.NEXT_PUBLIC_PREVIEW_BUILDER_URL || 'https://preview-builder.wyberai.com'

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
  const [fixing, setFixing] = useState(false)
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
    if (key === lastBuiltKey.current && html) return
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

  useEffect(() => { buildRef.current = build }, [build])

  useEffect(() => {
    if (prevGenerating.current && !isGenerating && hasApp) {
      buildRef.current()
    }
    prevGenerating.current = isGenerating
  }, [isGenerating, hasApp])

  useEffect(() => {
    if (!hydrated || !hasApp || isGenerating) return
    const key = Object.keys(files).sort().map(p => `${p}:${(files[p] as any)?.content?.length ?? 0}`).join('|')
    if (key === lastBuiltKey.current) return
    if (autoBuildTimer.current) clearTimeout(autoBuildTimer.current)
    autoBuildTimer.current = setTimeout(() => {
      buildRef.current()
    }, 600)
    return () => { if (autoBuildTimer.current) clearTimeout(autoBuildTimer.current) }
  }, [files, hydrated, hasApp, isGenerating])

  useEffect(() => {
    if (iframeRef.current && html) {
      iframeRef.current.src = html
    }
  }, [html])

  // Send the build error to the AI to auto-repair
  const tryToFix = useCallback(() => {
    if (!error || fixing) return
    setFixing(true)
    // Reset the build key so the next generation re-triggers a build
    lastBuiltKey.current = ''
    const prompt = `The app failed to build with this error. Fix the exact file and syntax causing it, and return the corrected file(s):\n\n${error.slice(0, 600)}`
    window.dispatchEvent(new CustomEvent('wyber-autofix', { detail: { prompt } }))
    setTimeout(() => setFixing(false), 3000)
  }, [error, fixing])

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: building ? '#f59e0b' : error ? '#ef4444' : html ? '#22c55e' : '#3f3f46', boxShadow: html && !error ? '0 0 6px rgba(34,197,94,0.4)' : 'none', transition: 'all 0.3s' }} />
        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {isGenerating ? 'Writing your app...' : building ? `${MESSAGES[msgIdx]} (${seconds}s)` : error ? 'Build failed' : elapsed ? `Built in ${elapsed}s` : hasApp ? 'Ready' : 'Describe what you want to build'}
        </span>
        {html && !building && (
          <button onClick={build} title="Rebuild preview"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>&#8634;</button>
        )}
        {hasApp && !building && !html && !error && (
          <button onClick={build}
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 5, color: '#0EA5E9', cursor: 'pointer', padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
            Build preview
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {!hasApp && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.12)" strokeWidth="1"/><path d="M20 7L11 16L20 25" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#52525b' }}>Describe what you want to build</div>
            <div style={{ fontSize: 11, color: '#3f3f46' }}>Your app will appear here automatically after generation</div>
          </div>
        )}

        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>Writing your app...</div>
          </div>
        )}

        {building && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(245,158,11,0.15)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 14, color: '#e4e4e7', fontWeight: 600 }}>{MESSAGES[msgIdx]}</div>
            <div style={{ fontSize: 11, color: '#52525b' }}>{seconds}s · first build ~15s, then instant</div>
          </div>
        )}

        {/* Error — now with Try to fix */}
        {error && !building && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            </div>
            <div style={{ fontSize: 13, color: '#a1a1aa', textAlign: 'center', fontWeight: 600 }}>This build hit an error</div>
            <div style={{ fontSize: 11, color: '#71717a', textAlign: 'center', maxWidth: 420, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 120, overflow: 'auto', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 6 }}>{error.slice(0, 400)}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={tryToFix} disabled={fixing}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: fixing ? 'var(--bg-elevated)' : '#0EA5E9', color: 'white', fontSize: 12, fontWeight: 700, cursor: fixing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {fixing ? 'Sending to AI...' : '✦ Try to fix'}
              </button>
              <button onClick={build} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Retry build</button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          title="Wyber Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: html && !building && !isGenerating && !error ? 'block' : 'none', background: '#09090b' }}
        />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
