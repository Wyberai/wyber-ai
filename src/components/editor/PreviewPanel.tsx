'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'
import { Confetti } from '@/components/shared/Confetti'
import { sanitizeFiles } from '@/lib/sanitize-files'

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

// Cheap, stable content hash (djb2). Used to detect when a file actually changed
// — keying the rebuild on content LENGTH alone misses same-length edits (e.g.
// swapping one word for another of equal length), leaving a stale preview.
function hashStr(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return h
}

export function PreviewPanel() {
  const { files, isGenerating, project, hydrated, connectors, setPreviewError, setPreviewHealFailed, selectionConsumer, setSelectionConsumer } = useEditorStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // While auto self-heal is still attempting, we hide the raw error behind a
  // calm "finishing touches" state. Only flip true once all heal attempts fail.
  const [healFailed, setHealFailed] = useState(false)
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

  // Mirror local error/heal state into the store so UI outside this component
  // (e.g. Wyberman) can know the preview is stuck, without touching any of the
  // local state machine above.
  useEffect(() => { setPreviewError(error) }, [error, setPreviewError])
  useEffect(() => { setPreviewHealFailed(healFailed) }, [healFailed, setPreviewHealFailed])

  const appFile = (files['src/App.tsx'] || files['src/App.jsx']) as any
  const hasApp = Object.keys(files).length >= 2 && (appFile?.content?.length ?? 0) > 200

  // Set when a build request arrives while another build is in flight. Without
  // this, that request was silently DROPPED (build() early-returns on
  // `building`) — the classic "generation finished but the preview never
  // updated" case. The effect below re-runs build once the in-flight one ends;
  // the content-hash check makes the re-run a no-op if nothing changed.
  const pendingBuild = useRef(false)

  // URL of the previous successful build. When a fresh bundle crashes at
  // startup (blank white screen — common mid-Supabase-integration), the iframe
  // reverts to this while self-heal repairs the new one, so the user keeps
  // seeing a working app instead of a white void.
  const lastGoodUrl = useRef<string | null>(null)

  const build = useCallback(async (force = false) => {
    if (!hasApp) return
    if (building) { pendingBuild.current = true; return }
    const key = Object.keys(files).sort().map(p => `${p}:${hashStr((files[p] as any)?.content ?? '')}`).join('|')
    // Auto-builds skip when nothing changed; the manual Rebuild button passes
    // force=true so it always re-fetches (e.g. to pick up a new preview shell).
    if (!force && key === lastBuiltKey.current && html) return
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
        body: JSON.stringify({ files: sanitizeFiles(files as Record<string, { content?: string; language?: string }>), projectId: project?.id }),
      })

      const data = await res.json()
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsed(Math.round((Date.now() - start) / 100) / 10)

      if (data.url) {
        // The build being replaced rendered without a startup crash (a crash
        // would have reverted html to the previous good URL already) — keep it
        // as the fallback for the incoming one.
        if (html) lastGoodUrl.current = html
        setHtml(data.url + (data.url.includes('?') ? '&' : '?') + 't=' + Date.now())
        setError(null)
        if (isFirstBuild.current && Object.keys(files).length > 3) {
          isFirstBuild.current = false
          // Only celebrate if user actually generated this app (not loaded from template)
          const isTemplate = !project?.first_prompt
          if (!isTemplate) setConfettiTrigger(c => c + 1)
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

  // Drain the queued build request once the in-flight build finishes.
  useEffect(() => {
    if (!building && pendingBuild.current) {
      pendingBuild.current = false
      buildRef.current()
    }
  }, [building])

  useEffect(() => {
    if (prevGenerating.current && !isGenerating && hasApp) {
      buildRef.current()
    }
    prevGenerating.current = isGenerating
  }, [isGenerating, hasApp])

  useEffect(() => {
    if (!hydrated || !hasApp || isGenerating) return
    const key = Object.keys(files).sort().map(p => `${p}:${hashStr((files[p] as any)?.content ?? '')}`).join('|')
    if (key === lastBuiltKey.current) return
    if (autoBuildTimer.current) clearTimeout(autoBuildTimer.current)
    autoBuildTimer.current = setTimeout(() => {
      buildRef.current()
    }, 600)
    return () => { if (autoBuildTimer.current) clearTimeout(autoBuildTimer.current) }
  }, [files, hydrated, hasApp, isGenerating])

  // Supabase FREE projects auto-pause after ~1 week of inactivity — the app
  // then looks broken (nothing loads or saves) with no visible cause, and
  // users blame the builder. Poll health when a Supabase connector exists and
  // offer a one-click restore. Fully isolated: any failure here only hides
  // the banner, never touches the preview state machine.
  const [dbHealth, setDbHealth] = useState<'paused' | 'restoring' | null>(null)
  const dbPollGen = useRef(0)
  // Derived render guard (instead of resetting state inside the effect):
  // stale health from a disconnected project simply stops rendering.
  const hasSupabaseConn = connectors.some(c => c.service === 'supabase')
  useEffect(() => {
    if (!project?.id || !hasSupabaseConn) return
    const gen = ++dbPollGen.current
    const check = async () => {
      try {
        const r = await fetch(`/api/connectors/supabase/health?projectId=${project.id}`)
        const d = await r.json() as { status?: string }
        if (dbPollGen.current !== gen) return
        if (d.status === 'paused') setDbHealth('paused')
        else if (d.status === 'restoring') setDbHealth('restoring')
        else setDbHealth(null)
      } catch { /* banner stays as-is; never disturb the preview */ }
    }
    check()
    const t = setInterval(check, 5 * 60_000)
    return () => { dbPollGen.current++; clearInterval(t) }
  }, [project?.id, hasSupabaseConn])

  // Plain function (not useCallback): only used as an onClick handler, and
  // the ref mutation inside trips the react-compiler memoization check.
  const restoreDb = async () => {
    if (!project?.id) return
    setDbHealth('restoring')
    try {
      const r = await fetch('/api/connectors/supabase/health', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, action: 'restore' }),
      })
      const d = await r.json() as { restored?: boolean }
      if (!d.restored) {
        // Can't restore from here (no OAuth) — reopen the connect modal so the
        // user can fix the connection; banner returns to paused.
        setDbHealth('paused')
        window.dispatchEvent(new CustomEvent('wyber-open-supabase'))
        return
      }
      // Poll until the project comes back (usually <1 min, cap ~4 min).
      const gen = ++dbPollGen.current
      for (let i = 0; i < 24; i++) {
        await new Promise(res => setTimeout(res, 10_000))
        if (dbPollGen.current !== gen) return
        try {
          const h = await fetch(`/api/connectors/supabase/health?projectId=${project.id}`)
          const hd = await h.json() as { status?: string }
          if (hd.status === 'ok') { setDbHealth(null); return }
        } catch { /* keep polling */ }
      }
    } catch { setDbHealth('paused') }
  }

  // When the current preview finished loading — runtime errors are only
  // treated as build-breaking within a grace window after this (see handler).
  const loadedAt = useRef(0)

  useEffect(() => {
    if (iframeRef.current && html) {
      iframeRef.current.src = html
      // Inject runtime error capture after iframe loads
      const iframe = iframeRef.current
      const injectErrorCapture = () => {
        loadedAt.current = Date.now()
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
        const picked = {
          selector: e.data.selector || '',
          tag: e.data.tag || '',
          text: e.data.text || '',
          classes: e.data.classes || '',
        }
        // Route the pick to whichever feature currently owns selection mode —
        // Wyberman's "point and ask" reuses this same channel but explains the
        // element instead of opening the visual-edit instruction popup.
        if (selectionConsumer === 'wyberman') {
          window.dispatchEvent(new CustomEvent('wyberman-element-selected', { detail: picked }))
        } else {
          setSelectedEl(picked)
        }
      }
      // Capture runtime errors from inside the iframe. Only errors within a
      // grace window after load count as build-breaking (startup crashes /
      // white screens). Errors thrown later — e.g. the user clicks a button
      // with a bug in its handler — used to blank a perfectly visible preview
      // and kick off the heal loop, which is the "preview keeps fluctuating"
      // behavior. Those are now logged but don't tear down the preview.
      if (e.data.type === 'wyber-runtime-error') {
        const runtimeErr = `Runtime error: ${e.data.message || 'Unknown error'}${e.data.source ? ` in ${e.data.source}` : ''}${e.data.lineno ? `:${e.data.lineno}` : ''}`
        console.warn('[Preview] Runtime error caught:', runtimeErr)
        const withinStartupWindow = Date.now() - loadedAt.current < 15_000
        if (!error && !fixing && !isGenerating && withinStartupWindow) {
          setError(runtimeErr)
          // Show the previous working build while self-heal repairs this one —
          // a startup crash otherwise leaves a blank white iframe on screen.
          if (lastGoodUrl.current && lastGoodUrl.current !== html) {
            setHtml(lastGoodUrl.current)
          }
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [error, fixing, isGenerating, selectionConsumer, html])

  // Tell the iframe when edit mode toggles
  const toggleEditMode = () => {
    const next = !editMode
    setEditMode(next)
    setSelectedEl(null)
    setSelectionConsumer(next ? 'visual-edit' : null)
    iframeRef.current?.contentWindow?.postMessage({ type: 'wyber-edit-mode', on: next }, '*')
  }

  // External features (e.g. Wyberman's "point and ask") can request the same
  // click-to-select mode without reaching into this component's iframe ref.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { on: boolean; consumer: 'wyberman' } | undefined
      if (!detail) return
      setEditMode(detail.on)
      setSelectedEl(null)
      setSelectionConsumer(detail.on ? detail.consumer : null)
      iframeRef.current?.contentWindow?.postMessage({ type: 'wyber-edit-mode', on: detail.on }, '*')
    }
    window.addEventListener('wyber-request-edit-mode', handler)
    return () => window.removeEventListener('wyber-request-edit-mode', handler)
  }, [setSelectionConsumer])

  // Re-send edit mode state whenever the iframe reloads
  useEffect(() => {
    if (html && editMode) {
      const t = setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'wyber-edit-mode', on: true }, '*')
      }, 800)
      return () => clearTimeout(t)
    }
  }, [html, editMode])

  // Total auto-heal attempts spent on the CURRENT user generation. Bounded so the
  // loop always converges — see the auto-heal effect below.
  const healTotal = useRef(0)
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
        // Silent: do NOT announce the fix. The rebuild that follows looks like a
        // normal build, so the user never sees that anything was auto-fixed.
        setError(null)
        setFixing(false)
        return
      }
    } catch { /* fall through to chat-based fix */ }

    // Fallback: send to chat for AI fix
    const prompt = `The app failed to build with this error. Fix the exact file and syntax causing it, and return the corrected file(s):\n\n${error.slice(0, 600)}`
    window.dispatchEvent(new CustomEvent('wyber-autofix', { detail: { prompt } }))
    setTimeout(() => setFixing(false), 3000)
  }, [error, fixing, files, setFiles])

  // Auto-trigger self-heal on errors — BOUNDED so it always converges.
  // The budget is a TOTAL number of attempts per user-initiated generation, and
  // it is NOT reset when auto-fix rewrites files. The previous logic capped
  // "attempts per unique error" but reset that counter on every files change —
  // and tryToFix changes files — so the cap never bit and a build that failed
  // for any reason auto-fix couldn't resolve looped "Build failed → finishing
  // touches →…" forever. Once the budget is spent we stop and surface the error.
  const MAX_HEAL = 3
  // When heal gives up but an earlier build worked, fall back to that build in
  // the iframe (with an error strip on top) instead of a full-screen error —
  // a broken update (e.g. mid-connector integration) must never blank out a
  // previously working app.
  const [revertedToGood, setRevertedToGood] = useState(false)
  useEffect(() => {
    if (error && !building && !isGenerating && !fixing) {
      if (healTotal.current >= MAX_HEAL) {
        setHealFailed(true)
        if (lastGoodUrl.current) {
          setRevertedToGood(true)
          if (lastGoodUrl.current !== html) setHtml(lastGoodUrl.current)
        }
        return
      }
      setHealFailed(false)
      const delay = healTotal.current === 0 ? 1500 : 3000
      healTotal.current += 1
      const t = setTimeout(() => tryToFix(), delay)
      return () => clearTimeout(t)
    }
  }, [error, building, isGenerating, fixing, tryToFix, html])

  useEffect(() => { if (!error) { setHealFailed(false); setRevertedToGood(false) } }, [error])
  // Fresh heal budget only when the USER kicks off a new generation/edit — never
  // on the file changes that auto-fix itself makes (that was the infinite loop).
  useEffect(() => { if (isGenerating) { healTotal.current = 0; setHealFailed(false) } }, [isGenerating])

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
        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: (building || fixing || (error && !healFailed)) ? '#f59e0b' : healFailed ? '#ef4444' : html ? '#22c55e' : '#3f3f46', boxShadow: html && !error ? '0 0 6px rgba(34,197,94,0.4)' : (building || fixing || (error && !healFailed)) ? '0 0 6px rgba(245,158,11,0.4)' : 'none', transition: 'all 0.3s', animation: (fixing || (error && !healFailed)) ? 'pulse 1s ease infinite' : 'none' }} />
        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {/* Auto-fix is presented as a normal build step — never surfaced as "self-healing"
              or a build error unless it genuinely can't recover (healFailed). */}
          {isGenerating ? 'Writing your app...' : building ? `${MESSAGES[msgIdx]} (${seconds}s)` : (fixing || (error && !healFailed)) ? MESSAGES[msgIdx] : healFailed ? 'Build failed' : elapsed ? `Built in ${elapsed}s` : hasApp ? 'Ready' : 'Describe what you want to build'}
        </span>
        {html && !building && !error && (
          <button onClick={toggleEditMode} title="Click an element to edit it"
            style={{ background: editMode ? 'rgba(14,165,233,0.15)' : 'none', border: `1px solid ${editMode ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 5, color: editMode ? '#0EA5E9' : '#52525b', cursor: 'pointer', padding: '2px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/></svg>
            {editMode ? 'Selecting' : 'Select'}
          </button>
        )}
        {html && !building && (
          <button onClick={() => build(true)} title="Rebuild preview"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>&#8634;</button>
        )}
        {/* Real <a>, not window.open: mobile browsers' popup blockers silently
            swallow window.open, which is why "open in new tab" never worked. */}
        {html && !building && !error && (
          <a href={html} target="_blank" rel="noopener noreferrer" title="Open preview in a new tab"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11, textDecoration: 'none', lineHeight: '15px' }}>&#8599;</a>
        )}
        {hasApp && !building && !html && !error && (
          <button onClick={() => build(true)}
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 5, color: '#0EA5E9', cursor: 'pointer', padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
            Build preview
          </button>
        )}
      </div>

      {/* Paused-database banner — Supabase free projects pause after ~1 week
          of inactivity; without this the app just silently stops persisting. */}
      {hasSupabaseConn && dbHealth === 'paused' && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 12px', background: 'rgba(127,29,29,0.92)', borderBottom: '1px solid rgba(248,113,113,0.25)', fontSize: 11, color: '#fecaca' }}>
          <span>⏸ Your Supabase database is <strong>paused</strong> (free projects pause after a week of inactivity) — nothing will load or save until it&apos;s restored.</span>
          <button onClick={restoreDb} style={{ background: '#ef4444', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', padding: '4px 12px' }}>Restore now</button>
        </div>
      )}
      {hasSupabaseConn && dbHealth === 'restoring' && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(120,53,15,0.9)', borderBottom: '1px solid rgba(251,191,36,0.2)', fontSize: 11, color: '#fef3c7' }}>
          <div style={{ width: 11, height: 11, border: '2px solid rgba(251,191,36,0.25)', borderTopColor: '#fbbf24', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span>Restoring your database — usually takes under a minute…</span>
        </div>
      )}

      {/* Platform-level storage banner — not baked into generated code */}
      {html && !building && !connectors.some(c => c.service === 'supabase') && (() => {
        const allContent = Object.values(files).map(f => (f as { content?: string })?.content ?? '').join('\n')
        const hasData = /useState[<(][^)]*\[\]|initialData\s*[=:]\s*\[|useState\(\[/.test(allContent)
        const hasBackend = allContent.includes('supabase') || allContent.includes('createClient') || allContent.includes('firebase')
        if (!hasData || hasBackend) return null
        return (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 12px', background: 'rgba(120,53,15,0.9)', borderBottom: '1px solid rgba(251,191,36,0.2)', fontSize: 11, color: '#fef3c7' }}>
            <span>⚠ Data is stored in browser memory only — resets on page refresh. Connect a database to save permanently.</span>
            <button onClick={() => window.dispatchEvent(new CustomEvent('wyber-open-supabase'))} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', padding: 0 }}>Connect Supabase →</button>
          </div>
        )
      })()}

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
      {editMode && !selectedEl && selectionConsumer !== 'wyberman' && (
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

        {/* Full-screen "writing" state ONLY when there is no previous preview
            to show. Once a build exists it STAYS VISIBLE while the AI works —
            hiding a working app behind a spinner for a whole generation read
            as "the preview disappeared while it worked on Supabase". */}
        {isGenerating && !html && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>Writing your app...</div>
          </div>
        )}
        {isGenerating && html && (
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(17,17,24,0.92)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px', zIndex: 6, animation: 'healIn 0.25s ease' }}>
            <div style={{ width: 12, height: 12, border: '2px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 11, color: '#e4e4e7', fontWeight: 600 }}>Writing your app — preview updates when it&apos;s done…</span>
          </div>
        )}

        {/* One neutral "building" overlay covers the real build AND the silent
            auto-fix retries — the user can't tell a fix happened. The error
            screen below only shows if it genuinely can't recover (healFailed).
            Full-screen ONLY when there's no previous preview to show — once a
            preview exists, rebuilds keep it on screen (no blank-out flicker)
            with just a small pill announcing the update. */}
        {(building || fixing || (error && !healFailed)) && !isGenerating && !html && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(245,158,11,0.15)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 14, color: '#e4e4e7', fontWeight: 600 }}>{MESSAGES[msgIdx]}</div>
            <div style={{ fontSize: 11, color: '#52525b' }}>Building your app…</div>
          </div>
        )}
        {(building || fixing || (error && !healFailed)) && !isGenerating && html && (
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(17,17,24,0.92)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px', zIndex: 6, animation: 'healIn 0.25s ease' }}>
            <div style={{ width: 12, height: 12, border: '2px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 11, color: '#e4e4e7', fontWeight: 600 }}>Updating preview…</span>
          </div>
        )}

        {/* Heal gave up but a previous build works — keep that on screen and
            surface the failure as a strip instead of nuking the preview. */}
        {error && !building && healFailed && revertedToGood && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 12px', background: 'rgba(127,29,29,0.94)', borderBottom: '1px solid rgba(248,113,113,0.3)', fontSize: 11, color: '#fecaca', zIndex: 7 }}>
            <span>⚠ The latest update didn&apos;t build — showing your last working preview.</span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={tryToFix} disabled={fixing} style={{ background: '#ef4444', border: 'none', borderRadius: 6, color: 'white', cursor: fixing ? 'wait' : 'pointer', fontSize: 11, fontWeight: 700, padding: '3px 10px' }}>{fixing ? 'Fixing…' : 'Try to fix'}</button>
              <button onClick={() => build(true)} style={{ background: 'none', border: '1px solid rgba(254,202,202,0.35)', borderRadius: 6, color: '#fecaca', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '3px 10px' }}>Retry</button>
            </div>
          </div>
        )}

        {error && !building && healFailed && !revertedToGood && (
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
              <button onClick={() => build(true)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#a1a1aa', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Retry build</button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          title="Wyber Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: html && !(error && healFailed && !revertedToGood) ? 'block' : 'none', background: '#09090b' }}
        />
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes healIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}</style>
    </div>
  )
}
