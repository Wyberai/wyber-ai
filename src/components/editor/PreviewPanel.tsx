'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'

const MESSAGES = [
  'Preparing preview...', 'Transforming components...', 'Rendering app...',
  'Almost there...', 'Loading assets...', 'Nearly ready...',
]

function buildSrcdoc(files: Record<string, any>): string {
  const appFile = files['src/App.tsx'] || files['src/App.jsx']
  const appCode: string = (appFile as any)?.content || ''
  const cssCode: string = (files['src/index.css'] as any)?.content || ''

  // Collect component files
  const components: Record<string, string> = {}
  for (const [path, file] of Object.entries(files)) {
    if (
      path.startsWith('src/') &&
      path !== 'src/main.tsx' &&
      path !== 'src/main.jsx' &&
      path !== 'src/index.css' &&
      path !== 'src/App.tsx' &&
      path !== 'src/App.jsx'
    ) {
      components[path] = (file as any)?.content || ''
    }
  }

  // Strip import statements and transform export default
  function stripImports(code: string): string {
    return code
      .replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\n?/gm, '')
      .replace(/^import\s+['"][^'"]+['"]\s*;?\n?/gm, '')
  }

  function transformApp(code: string): string {
    let c = stripImports(code)
    c = c.replace(/^export\s+default\s+function\s+(\w+)/, 'function __App')
    c = c.replace(/^export\s+default\s+(\w+)/, 'const __AppExport = $1')
    return c
  }

  const componentRegistrations = Object.entries(components).map(([path, code]) => {
    const safe = code
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$')
    const modName = path.replace('src/', '').replace(/\.tsx?$/, '').replace(/\.jsx?$/, '')
    return `
try {
  window.__mods = window.__mods || {};
  window.__mods['${modName}'] = (function(){
    const exports = {};
    const stripped = ${JSON.stringify(code)}
      .replace(/^import[\\s\\S]*?from[\\s\\S]*?;/gm, '')
      .replace(/^export default /, 'exports.default = ')
      .replace(/^export const /, 'const ')
      .replace(/^export function /, 'function ');
    try { eval(Babel.transform(stripped, {presets:['react','typescript'],filename:'${path}'}).code); } catch(e2){}
    return exports;
  })();
} catch(e){ console.warn('Component ${path}:', e.message); }`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
<script>
try { window.recharts = {}; } catch(e){}
</script>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff}
${cssCode}
</style>
</head>
<body>
<div id="root"></div>
<script>
${componentRegistrations}
</script>
<script type="text/babel" data-presets="react,typescript">
const {useState,useEffect,useRef,useCallback,useMemo,useContext,createContext,memo,forwardRef,Fragment,lazy,Suspense} = React;
const __lucide = {};

${transformApp(appCode)}

try {
  const AppComp = typeof __App !== 'undefined' ? __App : (typeof __AppExport !== 'undefined' ? __AppExport : () => React.createElement('div', null, 'App loaded'));
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(AppComp));
} catch(err) {
  document.getElementById('root').innerHTML = '<div style="padding:24px;color:#ef4444;font-family:monospace;font-size:13px;white-space:pre-wrap;background:#fff1f1;border-radius:8px;margin:16px">Preview error: ' + err.message + '</div>';
}
</script>
</body>
</html>`
}

export function PreviewPanel() {
  const { files, isGenerating, project } = useEditorStore()
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

  const appFile = (files['src/App.tsx'] || files['src/App.jsx']) as any
  const hasApp = Object.keys(files).length >= 2 && (appFile?.content?.length ?? 0) > 100

  const build = useCallback(() => {
    if (!hasApp || building) return
    const key = Object.keys(files).sort().join('|')
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
    }, 1200)

    try {
      const srcdoc = buildSrcdoc(files)
      clearInterval(timerRef.current!)
      setElapsed(Math.round((Date.now() - start) / 100) / 10)
      setHtml(srcdoc)
      setError(null)
    } catch (e: any) {
      clearInterval(timerRef.current!)
      setError('Preview failed: ' + e.message)
    } finally {
      setBuilding(false)
    }
  }, [files, hasApp, building, html])

  // Auto-build when AI generation completes
  useEffect(() => {
    if (prevGenerating.current && !isGenerating && hasApp) {
      setTimeout(() => {
        lastBuiltKey.current = ''
        build()
      }, 500)
    }
    prevGenerating.current = isGenerating
  }, [isGenerating, build, hasApp])

  // Update iframe srcdoc when html changes
  useEffect(() => {
    if (iframeRef.current && html) {
      iframeRef.current.srcdoc = html
    }
  }, [html])

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: building ? '#f59e0b' : html ? '#22c55e' : '#3f3f46', boxShadow: html ? '0 0 6px rgba(34,197,94,0.4)' : 'none', transition: 'all 0.3s' }} />
        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {isGenerating ? 'Generating your app...' : building ? `${MESSAGES[msgIdx]} (${seconds}s)` : elapsed !== null ? `✓ Preview ready in ${elapsed}s` : hasApp ? 'Ready — click Build preview' : 'Describe what you want to build'}
        </span>
        {html && !building && (
          <button
            onClick={() => { if (iframeRef.current) { iframeRef.current.srcdoc = ''; setTimeout(() => { if (iframeRef.current) iframeRef.current.srcdoc = html }, 50) } }}
            title="Refresh"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>
            &#8634;
          </button>
        )}
        {hasApp && !building && (
          <button
            onClick={build}
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 5, color: '#0EA5E9', cursor: 'pointer', padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
            {html ? 'Rebuild' : 'Build preview'}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {!hasApp && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.12)" strokeWidth="1"/><path d="M20 7L11 16L20 25" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#52525b' }}>Describe what you want to build</div>
            <div style={{ fontSize: 11, color: '#3f3f46' }}>Your app will appear here after generation</div>
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
            <div style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 500 }}>{MESSAGES[msgIdx]}</div>
            <div style={{ fontSize: 11, color: '#52525b' }}>{seconds}s</div>
          </div>
        )}

        {error && !building && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, background: '#09090b', zIndex: 5 }}>
            <div style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', maxWidth: 400, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error.slice(0, 500)}</div>
            <button onClick={build} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        <iframe
          ref={iframeRef}
          title="Wyber Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: html && !building && !isGenerating ? 'block' : 'none', background: '#fff' }}
        />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
