'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { compileAndPreview, clearModuleCache, triggerHMR } from '@/lib/wyber-preview/engine'
import { useT } from '@/lib/i18n/useT'
import { EDITOR_PLAN_STRINGS } from '@/lib/i18n/dict/editor-plan'

interface WyberPreviewProps {
  files: Record<string, { content: string; path?: string }>
  projectId: string
  isGenerating?: boolean
  onError?: (error: string) => void
  onFilesFixed?: (fixes: Record<string, string>) => void
}

type PreviewStatus = 'idle' | 'compiling' | 'ready' | 'error'

export default function WyberPreview({
  files,
  projectId,
  isGenerating = false,
  onError,
  onFilesFixed,
}: WyberPreviewProps) {
  const t = useT(EDITOR_PLAN_STRINGS)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const prevBlobURL = useRef<string | null>(null)
  const compileTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [status, setStatus] = useState<PreviewStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [compileDuration, setCompileDuration] = useState<number | null>(null)
  const [phase, setPhase] = useState<1 | 2>(1)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [esbuildReady, setEsbuildReady] = useState(false)
  const [healing, setHealing] = useState(false)
  const [healToast, setHealToast] = useState<string | null>(null)
  const healAttempted = useRef<string | null>(null)

  // Pre-initialize esbuild-wasm on mount (Phase 3: eager init)
  useEffect(() => {
    let mounted = true
    import('@/lib/wyber-preview/engine').then(async ({ bundleFiles }) => {
      // Warm up esbuild by running a trivial bundle
      try {
        await bundleFiles({ '/src/App.tsx': 'export default function App() { return null }' })
        if (mounted) setEsbuildReady(true)
      } catch {
        if (mounted) setEsbuildReady(true) // still proceed even if warmup fails
      }
    })
    return () => { mounted = false }
  }, [])

  const compile = useCallback(async (fileMap: Record<string, string>) => {
    if (Object.keys(fileMap).length === 0) return

    setStatus('compiling')
    setError(null)

    // Safety timeout — never show spinner >20s
    const timeout = setTimeout(() => {
      setStatus('error')
      setError(t('compilationTimeout'))
    }, 20000)

    try {
      const result = await compileAndPreview(fileMap, projectId)

      setCompileDuration(result.duration)
      setPhase(result.phase)

      if (result.error && !result.url) {
        setStatus('error')
        setError(result.error)
        onError?.(result.error)
        return
      }

      // Revoke old blob URL to prevent memory leaks
      if (prevBlobURL.current && prevBlobURL.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevBlobURL.current)
      }

      prevBlobURL.current = result.url
      setPreviewURL(result.url)
      clearTimeout(timeout)
      setStatus('ready')

      if (result.error) {
        // Partial error (compiled with warnings)
        setError(result.error)
      }

      // Phase 3: HMR for SW phase
      if (result.phase === 2) {
        triggerHMR(projectId)
      }
    } catch (err) {
      clearTimeout(timeout)
      const msg = String(err)
      setStatus('error')
      setError(msg)
      onError?.(msg)
    }
  }, [projectId, onError, t])

  // Self-healing: auto-fix errors using AI (0 credits, always free)
  const attemptAutoHeal = useCallback(async (errorMsg: string) => {
    if (healing || !onFilesFixed) return
    if (healAttempted.current === errorMsg) return
    healAttempted.current = errorMsg
    setHealing(true)

    const fileMap: Record<string, string> = {}
    for (const [path, file] of Object.entries(files)) {
      if (file?.content) fileMap[path] = file.content
    }

    try {
      const res = await fetch('/api/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: errorMsg, files: fileMap }),
      })
      const data = await res.json() as { fixed: boolean; files?: Record<string, string>; filesChanged?: string[] }

      if (data.fixed && data.files) {
        onFilesFixed(data.files)
        const changedNames = (data.filesChanged ?? Object.keys(data.files)).map(p => p.split('/').pop()).join(', ')
        setHealToast(`${t('autoFixedPrefix')} ${changedNames}`)
        setError(null)
        setStatus('compiling')
        setTimeout(() => setHealToast(null), 4000)
      }
    } catch { /* silent fail — user can still manually fix */ }
    setHealing(false)
  }, [files, healing, onFilesFixed, t])

  // Trigger auto-heal when an error occurs (not during generation)
  useEffect(() => {
    if (status === 'error' && error && !isGenerating && onFilesFixed) {
      const timer = setTimeout(() => attemptAutoHeal(error), 1500)
      return () => clearTimeout(timer)
    }
  }, [status, error, isGenerating, attemptAutoHeal, onFilesFixed])

  // Reset heal tracker when files change
  useEffect(() => { healAttempted.current = null }, [files])

  // Compile when files change (debounced 400ms — Phase 3 optimization)
  useEffect(() => {
    const fileMap: Record<string, string> = {}
    for (const [path, file] of Object.entries(files)) {
      if (file?.content) fileMap[path] = file.content
    }

    if (Object.keys(fileMap).length === 0) return
    if (isGenerating) return // Don't compile while still generating

    if (compileTimer.current) clearTimeout(compileTimer.current)
    compileTimer.current = setTimeout(() => compile(fileMap), 400)

    return () => { if (compileTimer.current) clearTimeout(compileTimer.current) }
  }, [files, isGenerating, compile])

  // Phase 3: Clear module cache when projectId changes
  useEffect(() => {
    clearModuleCache()
    setPreviewURL(null)
    setStatus('idle')
  }, [projectId])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (prevBlobURL.current && prevBlobURL.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevBlobURL.current)
      }
    }
  }, [])

  const hasFiles = Object.keys(files).length > 0

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      background: 'var(--bg-base, #09090b)',
      position: 'relative',
    }}>
      {/* Toolbar */}
      <div style={{
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        borderBottom: '1px solid var(--ide-border, rgba(255,255,255,0.08))',
        flexShrink: 0,
        gap: 8,
      }}>
        {/* Left: Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {status === 'compiling' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0EA5E9', fontSize: 11 }}>
              <div style={{
                width: 8, height: 8,
                border: '1.5px solid rgba(14,165,233,0.3)',
                borderTopColor: '#0EA5E9',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              {t('compilingLabel')}
            </div>
          )}
          {status === 'ready' && compileDuration !== null && (
            <div style={{ fontSize: 11, color: 'var(--ide-text3, #52525b)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#22c55e', fontSize: 9 }}>●</span>
              {t('liveLabel')} · {compileDuration}ms · {t('phaseLabel')} {phase}
            </div>
          )}
          {status === 'error' && !healing && (
            <div style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9 }}>●</span>
              {t('buildErrorLabel')}
            </div>
          )}
          {healing && (
            <div style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 8, height: 8,
                border: '1.5px solid rgba(245,158,11,0.3)',
                borderTopColor: '#f59e0b',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              {t('selfHealingLabel')}
            </div>
          )}
          {status === 'idle' && !hasFiles && (
            <div style={{ fontSize: 11, color: 'var(--ide-text3, #52525b)' }}>
              {esbuildReady ? t('engineReady') : t('loadingEngine')}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {error && (
            <div style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(239,68,68,0.1)',
              color: '#ef4444',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }} title={error}>
              {error.split('\n')[0]}
            </div>
          )}

          <button
            onClick={() => {
              clearModuleCache()
              const fileMap: Record<string, string> = {}
              for (const [p, f] of Object.entries(files)) {
                if (f?.content) fileMap[p] = f.content
              }
              compile(fileMap)
            }}
            disabled={status === 'compiling'}
            title={t('recompileTitle')}
            style={{
              background: 'none',
              border: '1px solid var(--ide-border, rgba(255,255,255,0.08))',
              color: 'var(--ide-text3, #52525b)',
              cursor: 'pointer',
              padding: '3px 6px',
              borderRadius: 5,
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ↺
          </button>

          {previewURL && phase === 1 && (
            <a
              href={previewURL}
              target="_blank"
              rel="noopener noreferrer"
              title={t('openInNewTabTitle')}
              style={{
                background: 'none',
                border: '1px solid var(--ide-border, rgba(255,255,255,0.08))',
                color: 'var(--ide-text3, #52525b)',
                cursor: 'pointer',
                padding: '3px 6px',
                borderRadius: 5,
                fontSize: 11,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ↗
            </a>
          )}
        </div>
      </div>

      {/* Preview Area — full remaining height */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {/* Empty state */}
        {!hasFiles && status === 'idle' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: 'var(--ide-text3, #52525b)',
          }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="rgba(14,165,233,0.08)" stroke="rgba(14,165,233,0.2)" strokeWidth="1"/>
              <path d="M20 7L11 16L20 25" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 11L28 16L23 21" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </svg>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {esbuildReady ? t('askMeWhatToBuild') : t('warmingUpEngine')}
            </div>
            <div style={{ fontSize: 11 }}>
              {esbuildReady ? t('appWillPreviewHere') : t('firstCompileHint')}
            </div>
          </div>
        )}

        {/* Compiling overlay (show on top of old preview) */}
        {status === 'compiling' && previewURL && (
          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            background: 'rgba(9,9,11,0.8)',
            border: '1px solid rgba(14,165,233,0.3)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: '#0EA5E9',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              width: 7, height: 7,
              border: '1.5px solid rgba(14,165,233,0.3)',
              borderTopColor: '#0EA5E9',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
            {t('updatingLabel')}
          </div>
        )}

        {/* The actual iframe — full height, always rendered */}
        <iframe
          ref={iframeRef}
          src={previewURL || 'about:blank'}
          title={t('previewIframeTitle')}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: previewURL ? 'block' : 'none',
            background: '#09090b',
          }}
          allow="clipboard-write"
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
          <span style={{ fontSize: 14 }}>&#10003;</span>
          {healToast}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>{t('zeroCreditsLabel')}</span>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes healIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  )
}
