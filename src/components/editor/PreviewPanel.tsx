'use client'
import React from 'react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'

/**
 * PreviewPanel — Server-side esbuild bundle → srcdoc iframe
 * Sub-5 second preview. No Vercel deployment needed for preview.
 * Publish button still deploys to Vercel for sharing.
 */
const BUNDLING_MESSAGES = [
  "Compiling your masterpiece...",
  "Teaching React to dance...",
  "Wrangling pixels into place...",
  "Convincing TypeScript to behave...",
  "Brewing something beautiful...",
  "Turning coffee into code...",
  "Making the internet a better place...",
  "Polishing the pixels...",
  "Summoning the UI spirits...",
  "Almost there, just ironing out the wrinkles...",
  "Herding components into formation...",
  "Applying the finishing touches...",
  "Your app is taking shape...",
  "Making it pixel perfect...",
  "Just a moment, doing wizard things...",
]

const GENERATING_MESSAGES = [
  "Thinking really hard...",
  "Reading your mind...",
  "Consulting the design gods...",
  "Architecting something special...",
  "Writing clean code (no shortcuts)...",
  "Making it beautiful and fast...",
  "Planning your perfect app...",
  "Crafting every component with care...",
  "This one's going to be good...",
  "Choosing the right shade of indigo...",
]

function useCyclingMessage(messages: string[], active: boolean, interval = 2500) {
  const [idx, setIdx] = React.useState(0)
  React.useEffect(() => {
    if (!active) { setIdx(0); return }
    const t = setInterval(() => setIdx(i => (i + 1) % messages.length), interval)
    return () => clearInterval(t)
  }, [active, messages.length, interval])
  return messages[idx]
}

export function PreviewPanel() {
  const { files, isGenerating, project } = useEditorStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [bundling, setBundling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState<number | null>(null)
  const bundlingMsg = useCyclingMessage(BUNDLING_MESSAGES, bundling)
  const generatingMsg = useCyclingMessage(GENERATING_MESSAGES, isGenerating)
  const prevIsGenerating = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [seconds, setSeconds] = useState(0)

  const hasRealFiles = useCallback(() => {
    const appFile = (files['src/App.tsx'] || files['src/App.jsx']) as any
    return Object.keys(files).length >= 2 && (appFile?.content?.length ?? 0) > 200
  }, [files])

  const bundle = useCallback(async () => {
    if (!hasRealFiles() || bundling) return
    setBundling(true)
    setError(null)
    setSeconds(0)
    const start = Date.now()
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

    try {
      const res = await fetch('/api/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      })
      const data = await res.json()
      clearInterval(timerRef.current!)
      setElapsed(Math.round((Date.now() - start) / 100) / 10)

      if (data.html) {
        setHtml(data.html)
        setError(null)
      } else {
        setError(data.error || 'Build failed')
      }
    } catch (err) {
      clearInterval(timerRef.current!)
      setError(String(err))
    } finally {
      setBundling(false)
    }
  }, [files, hasRealFiles, bundling])

  // Auto-bundle when generation finishes
  useEffect(() => {
    if (prevIsGenerating.current && !isGenerating && hasRealFiles()) {
      bundle()
    }
    prevIsGenerating.current = isGenerating
  }, [isGenerating, hasRealFiles, bundle])

  // Update srcdoc when html changes
  useEffect(() => {
    if (iframeRef.current && html) {
      iframeRef.current.srcdoc = html
    }
  }, [html])

  const hasFiles = hasRealFiles()

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#0a0a0f', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: bundling ? '#f59e0b' : html ? '#22c55e' : '#3f3f46', boxShadow: html ? '0 0 6px rgba(34,197,94,0.4)' : 'none', transition: 'all 0.3s' }} />
          <span style={{ fontSize: 11, color: '#52525b', fontFamily: 'var(--font-mono)' }}>
            {isGenerating ? generatingMsg : bundling ? bundlingMsg : elapsed ? `✓ Preview ready in ${elapsed}s` : hasFiles ? 'Ready to preview' : 'Describe what you want to build'}
          </span>
        </div>
        {html && (
          <button onClick={bundle} disabled={bundling} title="Refresh preview"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>
            ↺
          </button>
        )}
        {error && (
          <button onClick={bundle} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 5, color: '#ef4444', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>
            Retry
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Empty state */}
        {!hasFiles && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.12)" strokeWidth="1"/><path d="M20 7L11 16L20 25" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#52525b' }}>Describe what you want to build</div>
            <div style={{ fontSize: 11, color: '#3f3f46' }}>Your app will appear here instantly</div>
          </div>
        )}

        {/* Generating */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#0a0a0f', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>{generatingMsg}</div>
          </div>
        )}

        {/* Bundling overlay over existing preview */}
        {bundling && html && (
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(17,17,24,0.9)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}>
            <div style={{ width: 10, height: 10, border: '1.5px solid rgba(245,158,11,0.3)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Updating preview... {seconds}s</span>
          </div>
        )}

        {/* Bundling no preview yet */}
        {bundling && !html && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#0a0a0f', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(245,158,11,0.15)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>{bundlingMsg}</div>
            <div style={{ fontSize: 11, color: '#52525b', marginTop: 4, fontStyle: 'italic' }}>{seconds}s elapsed</div>
          </div>
        )}

        {/* Error */}
        {error && !bundling && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, background: '#0a0a0f', zIndex: 5 }}>
            <div style={{ fontSize: 18 }}>⚠️</div>
            <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', maxWidth: 360, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{error.slice(0, 400)}</div>
            <button onClick={bundle} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {/* The preview iframe */}
        <iframe
          ref={iframeRef}
          title="Wyber Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: html ? 'block' : 'none', background: '#0a0a0f' }}
        />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
