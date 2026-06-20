'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'
import { Confetti } from '@/components/shared/Confetti'

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

interface SelectedEl {
  selector: string
  tag: string
  text: string
  classes: string
}

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
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const isFirstBuild = useRef(true)
  const [editMode, setEditMode] = useState(false)
  const [selectedEl, setSelectedEl] = useState<SelectedEl | null>(null)
  const [editInstruction, setEditInstruction] = useState('')
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
        if (isFirstBuild.current) {
          isFirstBuild.current = false
          setConfettiTrigger(c => c + 1)
        }
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
      // Inject runtime error capture after iframe loads
      const iframe = iframeRef.current
      const injectErrorCapture = () => {
        try {
          const iframeWindow = iframe.contentWindow
          if (!iframeWindow) return
          iframeWindow.onerror = (msg, source, lineno) => {
            window.postMessage({ type: 'wyber-runtime-error', message: String(msg), source: source?.split('/').pop(), lineno }, '*')
            return true
          }
          iframeWindow.onunhandledrejection = (e: PromiseRejectionEvent) => {
            window.postMessage({ type: 'wyber-runtime-error', message: String(e.reason) }, '*')
          }
        } catch { /* cross-origin iframe — can't inject, which is fine */ }
      }
      iframe.addEventListener('load', injectErrorCapture, { once: true })
      return () => iframe.removeEventListener('load', injectErrorCapture)
    }
  }, [html])

  // Listen for messages from the preview iframe (element selection + runtime errors)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === 'wyber-element-selected') {
        setSelectedEl({
          selector: e.data.selector || '',
          tag: e.data.tag || '',
          text: e.data.text || '',
          classes: e.data.classes || '',
        })
      }
      // Capture runtime errors from inside the iframe
      if (e.data.type === 'wyber-runtime-error') {
        const runtimeErr = `Runtime error: ${e.data.message || 'Unknown error'}${e.data.source ? ` in ${e.data.source}` : ''}${e.data.lineno ? `:${e.data.lineno}` : ''}`
        console.warn('[Preview] Runtime error caught:', runtimeErr)
        if (!error && !fixing && !isGenerating) {
          setError(runtimeErr)
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [error, fixing, isGenerating])

  // Tell the iframe when edit mode toggles
  const toggleEditMode = () => {
    const next = !editMode
    setEditMode(next)
    setSelectedEl(null)
    iframeRef.current?.contentWindow?.postMessage({ type: 'wyber-edit-mode', on: next }, '*')
  }

  // Re-send edit mode state whenever the iframe reloads
  useEffect(() => {
    if (html && editMode) {
      const t = setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'wyber-edit-mode', on: true }, '*')
      }, 800)
      return () => clearTimeout(t)
    }
  }, [html, editMode])

  const [healToast, setHealToast] = useState<string | null>(null)
  const healAttempted = useRef<Record<string, number>>({})
  const { setFiles } = useEditorStore()

  const tryToFix = useCallback(async () => {
    if (!error || fixing) return
    setFixing(true)
    lastBuiltKey.current = ''

    // Try auto-fix API first (instant, 0 credits)
    try {
      const fileMap: Record<string, string> = {}
      for (const [path, file] of Object.entries(files)) {
        if ((file as { content?: string })?.content) fileMap[path] = (file as { content: string }).content
      }

      const res = await fetch('/api/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.slice(0, 1000),
          files: fileMap,
          fileName: error.match(/in (src\/\S+)/)?.[1] || error.match(/(\S+\.tsx?)/)?.[1],
        }),
      })
      const data = await res.json() as { fixed: boolean; files?: Record<string, string>; filesChanged?: string[] }

      if (data.fixed && data.files) {
        const updatedFiles = { ...files }
        for (const [path, content] of Object.entries(data.files)) {
          const existing = updatedFiles[path] as { content: string; path: string; language: string } | undefined
          updatedFiles[path] = {
            path,
            content,
            language: existing?.language ?? 'typescript',
          }
        }
        setFiles(updatedFiles as typeof files)
        const names = (data.filesChanged ?? Object.keys(data.files)).map(p => p.split('/').pop()).join(', ')
        setHealToast(`Auto-fixed ${names}`)
        setError(null)
        setTimeout(() => setHealToast(null), 4000)
        setFixing(false)
        return
      }
    } catch { /* fall through to chat-based fix */ }

    // Fallback: send to chat for AI fix
    const prompt = `The app failed to build with this error. Fix the exact file and syntax causing it, and return the corrected file(s):\n\n${error.slice(0, 600)}`
    window.dispatchEvent(new CustomEvent('wyber-autofix', { detail: { prompt } }))
    setTimeout(() => setFixing(false), 3000)
  }, [error, fixing, files, setFiles])

  // Auto-trigger self-heal on errors (up to 3 attempts per unique error)
  useEffect(() => {
    if (error && !building && !isGenerating && !fixing) {
      const attempts = healAttempted.current[error] ?? 0
      if (attempts >= 3) return
      healAttempted.current[error] = attempts + 1
      const delay = attempts === 0 ? 1500 : 3000
      const t = setTimeout(() => tryToFix(), delay)
      return () => clearTimeout(t)
    }
  }, [error, building, isGenerating, fixing, tryToFix])

  useEffect(() => { healAttempted.current = {} }, [files])

  const sendVisualEdit = () => {
    if (!selectedEl || !editInstruction.trim()) return
    const desc = `Visual edit request. The user clicked on this element in the preview:
- Element: <${selectedEl.tag}>${selectedEl.classes ? ' with classes "' + selectedEl.classes + '"' : ''}
- Text content: "${selectedEl.text}"
- CSS path: ${selectedEl.selector}

Change requested: ${editInstruction.trim()}

Find this element in the code and apply the change.`
    window.dispatchEvent(new CustomEvent('wyber-autofix', { detail: { prompt: desc } }))
    setEditInstruction('')
    setSelectedEl(null)
    setEditMode(false)
    iframeRef.current?.contentWindow?.postMessage({ type: 'wyber-edit-mode', on: false }, '*')
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b', position: 'relative' }}>
      <Confetti trigger={confettiTrigger} />
      {/* Toolbar */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: fixing ? '#f59e0b' : building ? '#f59e0b' : error ? '#ef4444' : html ? '#22c55e' : '#3f3f46', boxShadow: html && !error ? '0 0 6px rgba(34,197,94,0.4)' : fixing ? '0 0 6px rgba(245,158,11,0.4)' : 'none', transition: 'all 0.3s', animation: fixing ? 'pulse 1s ease infinite' : 'none' }} />
        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {fixing ? 'Self-healing...' : isGenerating ? 'Writing your app...' : building ? `${MESSAGES[msgIdx]} (${seconds}s)` : error ? 'Build failed' : elapsed ? `Built in ${elapsed}s` : hasApp ? 'Ready' : 'Describe what you want to build'}
        </span>
        {html && !building && !error && (
          <button onClick={toggleEditMode} title="Click an element to edit it"
            style={{ background: editMode ? 'rgba(14,165,233,0.15)' : 'none', border: `1px solid ${editMode ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 5, color: editMode ? '#0EA5E9' : '#52525b', cursor: 'pointer', padding: '2px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/></svg>
            {editMode ? 'Selecting' : 'Select'}
          </button>
        )}
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

      {/* Visual edit instruction bar */}
      {editMode && selectedEl && (
        <div style={{ padding: '10px 12px', background: 'rgba(14,165,233,0.06)', borderBottom: '1px solid rgba(14,165,233,0.2)', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#0EA5E9', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Selected:</span>
            <code style={{ background: 'rgba(14,165,233,0.12)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>&lt;{selectedEl.tag}&gt;</code>
            {selectedEl.text && <span style={{ color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>"{selectedEl.text}"</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus
              value={editInstruction}
              onChange={e => setEditInstruction(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendVisualEdit() }}
              placeholder="Describe the change (e.g. make this bigger and blue)"
              style={{ flex: 1, background: 'var(--bg-elevated, #18181b)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#fafafa', fontSize: 12, padding: '7px 11px', outline: 'none' }}
            />
            <button onClick={sendVisualEdit} disabled={!editInstruction.trim()}
              style={{ background: editInstruction.trim() ? '#0EA5E9' : '#27272a', color: 'white', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: editInstruction.trim() ? 'pointer' : 'not-allowed' }}>
              Apply
            </button>
          </div>
        </div>
      )}
      {editMode && !selectedEl && (
        <div style={{ padding: '7px 12px', background: 'rgba(14,165,233,0.06)', borderBottom: '1px solid rgba(14,165,233,0.2)', fontSize: 11, color: '#0EA5E9', flexShrink: 0, textAlign: 'center' }}>
          Click any element in the preview to edit it
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {!hasApp && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.12)" strokeWidth="1"/><path d="M20 7L11 16L20 25" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>Your preview will appear here</div>
            <div style={{ fontSize: 12, color: '#a1a1aa', maxWidth: 240, textAlign: 'center', lineHeight: 1.5 }}>Describe what you want to build in the chat, and your app appears here automatically</div>
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
      {/* Self-heal success toast */}
      {healToast && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(13,148,136,0.95)', color: '#fff', padding: '8px 16px',
          borderRadius: 8, fontSize: 12, fontWeight: 600, zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'healIn 0.3s ease',
        }}>
          <span>&#10003;</span>
          {healToast}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>0 credits</span>
        </div>
      )}
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes healIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}</style>
    </div>
  )
}
