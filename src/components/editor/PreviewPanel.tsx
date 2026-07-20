'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'
import { Confetti } from '@/components/shared/Confetti'
import { sanitizeFiles } from '@/lib/sanitize-files'
import { isPlaceholderApp } from '@/lib/starter-templates'
import { extractImageDirectives, replaceTokenInFiles } from '@/lib/image-directives'
import { injectWyberLoc, injectPreviewBridge } from '@/lib/wyber-preview/bridge'
import { applyTextEdit, applyClassEdit, stepClass, setColorClass, type StepFamily } from '@/lib/visual-edit-apply'
import { creditCost } from '@/lib/credits'
import { persistProjectFiles } from '@/lib/persist-project'
import { MicroLabel } from './ui'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_PREVIEW_STRINGS } from '@/lib/i18n/dict/editor-preview'
import { COMMON_STRINGS } from '@/lib/i18n/dict/common'

const BUILDER_URL = process.env.NEXT_PUBLIC_PREVIEW_BUILDER_URL || 'https://preview-builder.wyberai.com'

// Keys only — hooks (useT) can't run at module scope, so the actual translated
// text is resolved inside the component (see `messages` below), the same
// pattern ProjectTypeChooser uses for its CARDS titleKey/descKey.
const MESSAGE_KEYS = [
  'buildMsg1', 'buildMsg2', 'buildMsg3', 'buildMsg4', 'buildMsg5', 'buildMsg6', 'buildMsg7',
] as const

interface SelectedEl {
  selector: string
  tag: string
  text: string
  classes: string
  /** data-wyber-loc of the element (or nearest tagged ancestor): "path:line" */
  loc: string | null
  /** the tagged ancestor's own text — used when the clicked node itself is untagged */
  locText: string | null
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
  const { files, isGenerating, generationTurnSeq, project, hydrated, connectors, setPreviewError, setPreviewHealFailed, selectionConsumer, setSelectionConsumer } = useEditorStore()
  const t = useT(EDITOR_PREVIEW_STRINGS)
  const tc = useT(COMMON_STRINGS)
  const messages = MESSAGE_KEYS.map(k => t(k))
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
  // Hang watchdog (D5): a genuine infinite render loop / runaway synchronous
  // work freezes the iframe's single JS thread solid — no error ever fires,
  // it just silently stops responding forever. The bridge script's own
  // heartbeat (every 2s) can't fire either while that thread is busy-looping,
  // so a missed heartbeat IS the detection signal, not a separate crash check.
  const lastHeartbeat = useRef(0)
  const [hung, setHung] = useState(false)
  // D6: surfaces a specific, actionable message for a CORS-blocked external
  // API call instead of the app just silently failing and users blaming the
  // builder. Non-fatal (unlike a startup crash) — doesn't touch `error`/the
  // preview at all, just an informational strip the user can dismiss.
  const [corsNotice, setCorsNotice] = useState<{ message: string; url?: string } | null>(null)

  // Mirror local error/heal state into the store so UI outside this component
  // (e.g. Wyberman) can know the preview is stuck, without touching any of the
  // local state machine above.
  useEffect(() => { setPreviewError(error) }, [error, setPreviewError])
  useEffect(() => { setPreviewHealFailed(healFailed) }, [healFailed, setPreviewHealFailed])

  const appFile = (files['src/App.tsx'] || files['src/App.jsx']) as any
  // "A real App exists" — not the starter placeholder. The old `length > 200`
  // check passed for the ~460-char starter placeholder, so a build that never
  // wrote App.tsx still "previewed": it built the placeholder page with every
  // generated component unmounted, which users read as a blank/broken preview.
  const hasApp = Object.keys(files).length >= 2 && !isPlaceholderApp(appFile?.content)

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
      setMsgIdx(i => (i + 1) % MESSAGE_KEYS.length)
    }, 1800)

    try {
      // Real images in the PREVIEW: resolve {{wyber-image}} directives into
      // permanent generated-image URLs before building. Server-side generation
      // is idempotent (one ~$0.06 generation per unique image, cached in
      // storage; publish reuses the same cache), so rebuilds resolve in <1s.
      // Substitution happens on the BUILD REQUEST only — the saved source
      // keeps its tokens. Any failure falls back to sanitize's gradient
      // placeholders; the build itself is never blocked by imagery.
      let buildFiles = files as Record<string, { content?: string; language?: string }>
      const directives = extractImageDirectives(buildFiles)
      if (directives.length > 0 && project?.id) {
        try {
          const imgRes = await fetch('/api/images/resolve-directives', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: project.id, directives }),
          })
          const { urls } = await imgRes.json()
          if (urls && typeof urls === 'object') {
            for (const [token, url] of Object.entries(urls)) {
              if (typeof url === 'string' && url) buildFiles = replaceTokenInFiles(buildFiles, token, url)
            }
          }
        } catch { /* gradients remain — never block the build on imagery */ }
      }

      // Selection bridge (transient, build-request only — saved source stays
      // clean, publish is untouched): tag JSX with data-wyber-loc BEFORE
      // sanitize (only the user's real files get tagged), append the bridge
      // <script> AFTER sanitize (index.html is guaranteed to exist by then).
      // Both transforms fall back to the untouched map on any error.
      // A thrown fetch (DNS/connection failure, transient builder-infra hiccup)
      // used to go straight to the catch block below with zero retry — and
      // since setError() there also feeds the self-heal effect, a network
      // blip burned one of the 3 self-heal attempts trying to "fix" a
      // nonexistent code bug instead of just retrying the request. Retry
      // network-level failures specifically (not HTTP responses that came
      // back with a real build error — those still go through self-heal as
      // before) with a short backoff before giving up.
      const buildBody = JSON.stringify({ files: injectPreviewBridge(sanitizeFiles(injectWyberLoc(buildFiles), { appId: project?.id })), projectId: project?.id })
      let res: Response | null = null
      let networkErr: unknown = null
      for (const delay of [0, 1500, 4000]) {
        if (delay) await new Promise(r => setTimeout(r, delay))
        try {
          res = await fetch(`${BUILDER_URL}/build`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: buildBody,
          })
          networkErr = null
          break
        } catch (e) { networkErr = e }
      }
      if (networkErr) throw networkErr
      const data = await res!.json()
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
        setError(data.error || t('buildFailedFallback'))
      }
    } catch (e: any) {
      if (timerRef.current) clearInterval(timerRef.current)
      setError(t('couldNotReachBuilderPrefix') + e.message)
    } finally {
      setBuilding(false)
    }
  }, [files, hasApp, building, project, html, t])

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
          loc: e.data.loc || null,
          locText: e.data.locText || null,
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
      // In-preview inline text edit committed (bridge's contentEditable path).
      // Fresh state via getState() — this handler's closure would otherwise
      // hold stale files.
      if (e.data.type === 'wyber-text-committed' && typeof e.data.newText === 'string' && e.data.oldText) {
        const st = useEditorStore.getState()
        const r = applyTextEdit(st.files, e.data.loc, e.data.oldText, e.data.newText)
        if (r.ok) {
          st.setFiles(r.files as typeof st.files)
          if (st.project?.id) {
            void persistProjectFiles(st.project.id, r.files, (st.project as { userId?: string }).userId)
          }
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
      if (e.data.type === 'wyber-heartbeat') {
        lastHeartbeat.current = Date.now()
        if (hung) setHung(false)
      }
      if (e.data.type === 'wyber-cors-error') {
        setCorsNotice({ message: String(e.data.message || ''), url: e.data.url })
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [error, fixing, isGenerating, selectionConsumer, html, hung])

  // Reset the baseline whenever a new build/iframe load happens — otherwise
  // the OLD iframe's last heartbeat lingers and the watchdog below could fire
  // on the brand-new iframe before it's even had a chance to send its first
  // beat (postMessage + iframe navigation both take a moment).
  useEffect(() => { lastHeartbeat.current = Date.now(); setHung(false); setCorsNotice(null) }, [html])

  // Chrome (and other browsers) throttle setInterval in a backgrounded tab —
  // confirmed live with two builds open in two tabs: switching away from one
  // for more than ~10s stretched its heartbeat interval out and the watchdog
  // below fired "frozen" on a preview that was never actually stuck, just
  // sitting in a tab that wasn't focused. Reset the baseline the moment the
  // tab becomes visible again so a long background stint never counts against
  // it, and skip the check entirely while backgrounded.
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) lastHeartbeat.current = Date.now() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Poll for a missed heartbeat. A generous 10s threshold (5x the 2s beat
  // interval) avoids false positives from normal GC pauses or heavy renders;
  // skipped entirely while building/erroring (those already have their own
  // handling) or while the tab is backgrounded (see above).
  useEffect(() => {
    if (!html || building || error) return
    const t = setInterval(() => {
      if (document.hidden) return
      if (Date.now() - lastHeartbeat.current > 10_000) setHung(true)
    }, 3000)
    return () => clearInterval(t)
  }, [html, building, error])

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

  // ThemePanel's instant retheme: forward the override CSS into the iframe
  // (the bridge upserts <style id="wyber-theme-override"> — no rebuild).
  // Purely additive; touches nothing in the build/heal state machine.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { css?: string } | undefined
      if (typeof detail?.css !== 'string') return
      iframeRef.current?.contentWindow?.postMessage({ type: 'wyber-apply-theme', css: detail.css }, '*')
    }
    window.addEventListener('wyber-apply-theme', handler)
    return () => window.removeEventListener('wyber-apply-theme', handler)
  }, [])

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
        // Persist the fix — this used to only call setFiles (client state),
        // never saving to the DB. Confirmed live: the preview rendered fine
        // (client state was correct) but the project row's `files`/`updated_at`
        // never changed, so a page reload (or anyone else opening the project)
        // reverted straight back to the broken file, silently undoing an
        // otherwise-successful fix. Same PATCH call PreviewPanel already uses
        // for the in-preview text-edit path a few lines up.
        // enforceConflict:false — self-heal runs as part of the same build
        // turn as ChatPanel's own save (see persist-project.ts) and can race
        // it the same way; confirmed live it produced a false "changed in
        // another tab" conflict against this tab's own, more recent save.
        if (project?.id) {
          void persistProjectFiles(project.id, updatedFiles, (project as { userId?: string }).userId, { enforceConflict: false })
        }
        return
      }
    } catch { /* fall through to chat-based fix */ }

    // Fallback: send to chat for AI fix
    const prompt = `The app failed to build with this error. Fix the exact file and syntax causing it, and return the corrected file(s):\n\n${error.slice(0, 600)}`
    window.dispatchEvent(new CustomEvent('wyber-autofix', { detail: { prompt } }))
    setTimeout(() => setFixing(false), 3000)
  }, [error, fixing, files, setFiles, project])

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
  // Fresh heal budget only on a genuinely fresh user turn — never on the file
  // changes auto-fix itself makes (that was the original infinite loop), and
  // NOT on every isGenerating toggle: a staged agent-team build flips
  // isGenerating true/false once per stage (scaffold + up to 7 fill batches),
  // so keying off isGenerating let a single turn reset the 3-attempt heal
  // budget up to 8x — effectively ~24 free self-heal attempts per turn.
  // generationTurnSeq only bumps once per real turn (see ChatPanel), so this
  // now fires exactly once per turn regardless of how many stages it has.
  useEffect(() => { healTotal.current = 0; setHealFailed(false) }, [generationTurnSeq])

  // ── Visual Edits: LLM-free primary path ─────────────────────────────────
  // Text/color/size/spacing/radius edits write the SOURCE directly via
  // lib/visual-edit-apply (loc-based, unique-string fallback) — 0 credits.
  // The bridge live-patches the DOM for instant feedback while the normal
  // debounced rebuild catches up. Structural asks fall back to the normal
  // paid chat lane (real billing — never the free self-heal channel).
  const [textDraft, setTextDraft] = useState('')
  const [workingClasses, setWorkingClasses] = useState('')
  const [editStatus, setEditStatus] = useState<'idle' | 'applied' | 'notfound'>('idle')
  useEffect(() => {
    setTextDraft(selectedEl?.text ?? '')
    setWorkingClasses(selectedEl?.classes ?? '')
    setEditStatus('idle')
    setEditInstruction('')
  }, [selectedEl])

  const persistFiles = (updated: typeof files) => {
    setFiles(updated)
    if (project?.id) {
      void persistProjectFiles(project.id, updated, (project as { userId?: string }).userId)
    }
  }

  const applyText = () => {
    if (!selectedEl) return
    const next = textDraft
    const r = applyTextEdit(files, selectedEl.loc, selectedEl.text || selectedEl.locText || '', next)
    if (!r.ok) { setEditStatus('notfound'); return }
    persistFiles(r.files as typeof files)
    iframeRef.current?.contentWindow?.postMessage({ type: 'wyber-set-text', selector: selectedEl.selector, text: next }, '*')
    setSelectedEl({ ...selectedEl, text: next })
    setEditStatus('applied')
  }

  const applyClasses = (nextClasses: string) => {
    if (!selectedEl || nextClasses === workingClasses) return
    const r = applyClassEdit(files, selectedEl.loc, workingClasses, nextClasses)
    if (!r.ok) { setEditStatus('notfound'); return }
    persistFiles(r.files as typeof files)
    iframeRef.current?.contentWindow?.postMessage({ type: 'wyber-set-class', selector: selectedEl.selector, className: nextClasses }, '*')
    setWorkingClasses(nextClasses)
    setEditStatus('applied')
  }

  const applyStep = (family: StepFamily, dir: 1 | -1) => applyClasses(stepClass(workingClasses, family, dir))
  const applyColor = (prop: 'text' | 'bg', token: string) => applyClasses(setColorClass(workingClasses, prop, token))

  // Structural fallback — routes through the NORMAL chat dispatch (classify →
  // edit lane, standard credit charge), never the free self-heal channel.
  const sendAiEdit = () => {
    if (!selectedEl || !editInstruction.trim()) return
    const desc = `Edit this exact element (the user clicked it in the preview):
- Element: <${selectedEl.tag}>${selectedEl.classes ? ' with classes "' + selectedEl.classes + '"' : ''}${selectedEl.loc ? `\n- Source location: ${selectedEl.loc}` : ''}
- Text content: "${selectedEl.text}"
- CSS path: ${selectedEl.selector}

Change requested: ${editInstruction.trim()}`
    window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: desc }))
    setEditInstruction('')
    setSelectedEl(null)
    setEditMode(false)
    setSelectionConsumer(null)
    iframeRef.current?.contentWindow?.postMessage({ type: 'wyber-edit-mode', on: false }, '*')
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-base, #09090b)', position: 'relative' }}>
      <Confetti trigger={confettiTrigger} />
      {/* Toolbar */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid var(--ide-border, rgba(255,255,255,0.06))', background: 'var(--bg-surface, #111118)', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: (building || fixing || (error && !healFailed)) ? '#f59e0b' : healFailed ? '#ef4444' : html ? '#22c55e' : '#3f3f46', boxShadow: html && !error ? '0 0 6px rgba(34,197,94,0.4)' : (building || fixing || (error && !healFailed)) ? '0 0 6px rgba(245,158,11,0.4)' : 'none', transition: 'all 0.3s', animation: (fixing || (error && !healFailed)) ? 'pulse 1s ease infinite' : 'none' }} />
        <span style={{ flex: 1, fontSize: 11, color: 'var(--ide-text3, #52525b)', fontFamily: 'var(--brand-mono, monospace)' }}>
          {/* Auto-fix is presented as a normal build step — never surfaced as "self-healing"
              or a build error unless it genuinely can't recover (healFailed). */}
          {isGenerating ? t('writingLabel') : building ? `${messages[msgIdx]} (${seconds}s)` : (fixing || (error && !healFailed)) ? messages[msgIdx] : healFailed ? t('buildFailedFallback') : elapsed ? `${t('builtInPrefix')}${elapsed}s` : hasApp ? t('readyLabel') : t('describeToBuildLabel')}
        </span>
        {html && !building && !error && (
          <button onClick={toggleEditMode} title={t('selectElementTitle')}
            style={{ background: editMode ? 'rgba(14,165,233,0.15)' : 'none', border: `1px solid ${editMode ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 5, color: editMode ? '#0EA5E9' : '#52525b', cursor: 'pointer', padding: '2px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/></svg>
            {editMode ? t('selectingLabel') : t('selectLabel')}
          </button>
        )}
        {html && !building && (
          <button onClick={() => build(true)} title={t('rebuildTitle')}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>&#8634;</button>
        )}
        {/* Real <a>, not window.open: mobile browsers' popup blockers silently
            swallow window.open, which is why "open in new tab" never worked. */}
        {html && !building && !error && (
          <a href={html} target="_blank" rel="noopener noreferrer" title={t('openNewTabTitle')}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11, textDecoration: 'none', lineHeight: '15px' }}>&#8599;</a>
        )}
        {hasApp && !building && !html && !error && (
          <button onClick={() => build(true)}
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 5, color: '#0EA5E9', cursor: 'pointer', padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
            {t('buildPreviewBtn')}
          </button>
        )}
      </div>

      {/* Paused-database banner — Supabase free projects pause after ~1 week
          of inactivity; without this the app just silently stops persisting. */}
      {hasSupabaseConn && dbHealth === 'paused' && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 12px', background: 'rgba(127,29,29,0.92)', borderBottom: '1px solid rgba(248,113,113,0.25)', fontSize: 11, color: '#fecaca' }}>
          <span>{t('dbPausedPre')}<strong>{t('dbPausedWord')}</strong>{t('dbPausedPost')}</span>
          <button onClick={restoreDb} style={{ background: '#ef4444', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', padding: '4px 12px' }}>{t('restoreNowBtn')}</button>
        </div>
      )}
      {hasSupabaseConn && dbHealth === 'restoring' && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(120,53,15,0.9)', borderBottom: '1px solid rgba(251,191,36,0.2)', fontSize: 11, color: '#fef3c7' }}>
          <div style={{ width: 11, height: 11, border: '2px solid rgba(251,191,36,0.25)', borderTopColor: '#fbbf24', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span>{t('restoringDbMsg')}</span>
        </div>
      )}

      {/* Hang watchdog banner (D5) — an infinite render loop or runaway
          synchronous code freezes the preview solid with no error ever
          firing; the missed-heartbeat check above is the only way to notice.
          Reload just re-navigates the iframe to the same build (cheap); if
          the loop is in the code itself, Rebuild/self-heal is the next step. */}
      {hung && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 12px', background: 'rgba(127,29,29,0.92)', borderBottom: '1px solid rgba(248,113,113,0.25)', fontSize: 11, color: '#fecaca' }}>
          <span>{t('hungPre')}<strong>{t('hungWord')}</strong>{t('hungPost')}</span>
          <button
            onClick={() => { setHung(false); lastHeartbeat.current = Date.now(); if (iframeRef.current && html) iframeRef.current.src = html }}
            style={{ background: '#ef4444', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', padding: '4px 12px' }}
          >{t('reloadPreviewBtn')}</button>
        </div>
      )}

      {/* CORS-blocked external API notice (D6) — informational only, never
          touches `error`/the preview; the app itself keeps running exactly as
          it would have without this banner. */}
      {corsNotice && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 12px', background: 'rgba(120,53,15,0.9)', borderBottom: '1px solid rgba(251,191,36,0.2)', fontSize: 11, color: '#fef3c7' }}>
          <span>{t('corsPre')}{corsNotice.url ? <code style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: 4 }}>{corsNotice.url}</code> : t('corsExternalApiFallback')}{t('corsPost')}</span>
          <button onClick={() => setCorsNotice(null)} style={{ background: 'none', border: 'none', color: '#fef3c7', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 4px', opacity: 0.7 }}>&times;</button>
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
            <span>{t('storageWarning')}</span>
            <button onClick={() => window.dispatchEvent(new CustomEvent('wyber-open-supabase'))} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', padding: 0 }}>{t('connectSupabaseBtn')}</button>
          </div>
        )
      })()}

      {/* Visual-edit inspector card — direct source edits, 0 credits */}
      {editMode && selectedEl && (
        <div style={{ padding: '10px 12px', background: 'rgba(14,165,233,0.05)', borderBottom: '1px solid var(--brand-border-accent, rgba(14,165,233,0.2))', display: 'flex', flexDirection: 'column', gap: 9, flexShrink: 0, maxHeight: 260, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, color: 'var(--brand-accent, #0EA5E9)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <code style={{ background: 'rgba(14,165,233,0.12)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>&lt;{selectedEl.tag}&gt;</code>
            <MicroLabel style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'none' }}>
              {selectedEl.loc ?? selectedEl.selector}
            </MicroLabel>
            {editStatus === 'applied' && <MicroLabel color="var(--ide-green, #22c55e)">{t('savedFreeLabel')}</MicroLabel>}
            {editStatus === 'notfound' && <MicroLabel color="var(--ide-amber, #f59e0b)">{t('cantMatchSourceLabel')}</MicroLabel>}
            <button onClick={() => setSelectedEl(null)} title={t('deselectTitle')} style={{ background: 'none', border: 'none', color: 'var(--ide-text3, #71717a)', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: '0 2px' }}>×</button>
          </div>

          {/* Text */}
          {(selectedEl.text || selectedEl.locText) && (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={textDraft}
                onChange={e => setTextDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') applyText() }}
                placeholder={t('editTextPlaceholder')}
                style={{ flex: 1, background: 'var(--bg-elevated, #18181b)', border: '1px solid var(--ide-border, rgba(255,255,255,0.1))', borderRadius: 7, color: 'var(--ide-text, #fafafa)', fontSize: 12, padding: '6px 10px', outline: 'none' }}
              />
              <button onClick={applyText} disabled={textDraft === selectedEl.text}
                style={{ background: textDraft !== selectedEl.text ? 'var(--brand-accent, #0EA5E9)' : 'var(--bg-overlay, #27272a)', color: 'white', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: textDraft !== selectedEl.text ? 'pointer' : 'not-allowed' }}>
                {t('setTextBtn')}
              </button>
            </div>
          )}

          {/* Color chips + steppers */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, rowGap: 7 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MicroLabel>{t('textColorLabel')}</MicroLabel>
              {(['foreground', 'muted-foreground', 'primary', 'accent-foreground', 'destructive'] as const).map(token => (
                <button key={token} onClick={() => applyColor('text', token)} title={`text-${token}`}
                  style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', background: `hsl(var(--${token}, 0 0% 50%))`, cursor: 'pointer', padding: 0 }} />
              ))}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MicroLabel>{t('bgColorLabel')}</MicroLabel>
              {(['background', 'card', 'muted', 'primary', 'secondary', 'accent'] as const).map(token => (
                <button key={token} onClick={() => applyColor('bg', token)} title={`bg-${token}`}
                  style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid rgba(255,255,255,0.25)', background: `hsl(var(--${token}, 0 0% 50%))`, cursor: 'pointer', padding: 0 }} />
              ))}
            </span>
            {([['text-size', 'sizeLabel'], ['p', 'padLabel'], ['rounded', 'radiusLabel']] as const).map(([family, labelKey]) => (
              <span key={family} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MicroLabel>{t(labelKey)}</MicroLabel>
                <button onClick={() => applyStep(family, -1)} style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid var(--ide-border, rgba(255,255,255,0.1))', background: 'transparent', color: 'var(--ide-text2, #a1a1aa)', cursor: 'pointer', fontSize: 11, lineHeight: 1, padding: 0 }}>−</button>
                <button onClick={() => applyStep(family, 1)} style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid var(--ide-border, rgba(255,255,255,0.1))', background: 'transparent', color: 'var(--ide-text2, #a1a1aa)', cursor: 'pointer', fontSize: 11, lineHeight: 1, padding: 0 }}>+</button>
              </span>
            ))}
          </div>

          {/* Structural fallback → normal paid edit lane, honestly labeled */}
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={editInstruction}
              onChange={e => setEditInstruction(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendAiEdit() }}
              placeholder={t('biggerChangePlaceholder')}
              style={{ flex: 1, background: 'var(--bg-elevated, #18181b)', border: '1px solid var(--ide-border, rgba(255,255,255,0.1))', borderRadius: 7, color: 'var(--ide-text, #fafafa)', fontSize: 12, padding: '6px 10px', outline: 'none' }}
            />
            <button onClick={sendAiEdit} disabled={!editInstruction.trim()}
              title={t('aiEditRateTitle')}
              style={{ background: editInstruction.trim() ? 'var(--brand-accent, #0EA5E9)' : 'var(--bg-overlay, #27272a)', color: 'white', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: editInstruction.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
              {t('aiEditPrefix')}{creditCost('small-edit', 'fast')}cr
            </button>
          </div>
        </div>
      )}
      {editMode && !selectedEl && selectionConsumer !== 'wyberman' && (
        <div style={{ padding: '7px 12px', background: 'rgba(14,165,233,0.06)', borderBottom: '1px solid rgba(14,165,233,0.2)', fontSize: 11, color: '#0EA5E9', flexShrink: 0, textAlign: 'center' }}>
          {t('clickToEditHint')}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {!hasApp && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.12)" strokeWidth="1"/><path d="M20 7L11 16L20 25" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>{t('emptyPreviewTitle')}</div>
            <div style={{ fontSize: 12, color: '#a1a1aa', maxWidth: 240, textAlign: 'center', lineHeight: 1.5 }}>{t('emptyPreviewDesc')}</div>
          </div>
        )}

        {/* Full-screen "writing" state ONLY when there is no previous preview
            to show. Once a build exists it STAYS VISIBLE while the AI works —
            hiding a working app behind a spinner for a whole generation read
            as "the preview disappeared while it worked on Supabase". No
            floating pill over an existing preview: build state already shows
            in the chat bubble and the status strip above — a real user saw
            FOUR simultaneous "building" indicators and rightly called it out. */}
        {isGenerating && !html && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>Writing your app...</div>
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
            <div style={{ fontSize: 14, color: '#e4e4e7', fontWeight: 600 }}>{messages[msgIdx]}</div>
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
