'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'

const MESSAGES = [
  'Deploying your app...', 'Compiling and bundling...', 'Almost ready...',
  'Setting up the server...', 'Wiring everything together...',
  'Making it pixel perfect...', 'Just a few more seconds...',
]

export function PreviewPanel() {
  const { files, isGenerating, project } = useEditorStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msgIdx, setMsgIdx] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const prevGenerating = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const deployedKey = useRef('')

  const appFile = (files['src/App.tsx'] || files['src/App.jsx']) as any
  const hasApp = Object.keys(files).length >= 2 && (appFile?.content?.length ?? 0) > 200

  const deploy = useCallback(async () => {
    if (!hasApp || deploying) return
    const key = Object.keys(files).sort().join(',')
    if (key === deployedKey.current) return
    deployedKey.current = key

    setDeploying(true)
    setError(null)
    setSeconds(0)
    setMsgIdx(0)

    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1)
      setMsgIdx(i => (i + 1) % MESSAGES.length)
    }, 2000)

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, projectName: project?.name ?? 'wyber-app', projectId: project?.id }),
      })
      const data = await res.json()
      if (data.url) {
        const live = data.url.startsWith('http') ? data.url : `https://${data.url}`
        setUrl(live)
      } else {
        setError(data.error || 'Deploy failed')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      clearInterval(timerRef.current!)
      setDeploying(false)
    }
  }, [files, hasApp, deploying, project])

  // Trigger on generation complete
  useEffect(() => {
    if (prevGenerating.current && !isGenerating && hasApp) deploy()
    prevGenerating.current = isGenerating
  }, [isGenerating, hasApp, deploy])

  const msg = MESSAGES[msgIdx]

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#0a0a0f', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: deploying ? '#f59e0b' : url ? '#22c55e' : '#3f3f46', boxShadow: url ? '0 0 6px rgba(34,197,94,0.4)' : 'none', transition: 'all 0.3s' }} />
        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isGenerating ? 'Building your app...' : deploying ? `${msg} (${seconds}s)` : url ? url.replace('https://', '') : 'Describe what you want to build'}
        </span>
        {url && !deploying && (
          <>
            <button onClick={() => { if (iframeRef.current) iframeRef.current.src = url }} title="Refresh"
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>↺</button>
            <a href={url} target="_blank" rel="noopener noreferrer"
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11, textDecoration: 'none' }}>↗</a>
          </>
        )}
        {hasApp && !deploying && (
          <button onClick={deploy}
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 5, color: '#0EA5E9', cursor: 'pointer', padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
            {url ? 'Redeploy' : 'Deploy preview'}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Empty */}
        {!hasApp && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.12)" strokeWidth="1"/><path d="M20 7L11 16L20 25" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#52525b' }}>Describe what you want to build</div>
          </div>
        )}

        {/* Generating */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#0a0a0f', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a' }}>Building your app...</div>
          </div>
        )}

        {/* Deploying */}
        {deploying && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#0a0a0f', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(245,158,11,0.15)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>{msg}</div>
            <div style={{ fontSize: 11, color: '#3f3f46' }}>{seconds}s — usually 20–40 seconds</div>
          </div>
        )}

        {/* Error */}
        {error && !deploying && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, background: '#0a0a0f', zIndex: 5 }}>
            <div style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', maxWidth: 320 }}>{error}</div>
            <button onClick={deploy} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {/* Live iframe */}
        {url && !deploying && !isGenerating && (
          <iframe ref={iframeRef} src={url} title="Preview"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="clipboard-write" />
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
