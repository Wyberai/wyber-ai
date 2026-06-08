'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'

const MESSAGES = [
  'Compiling components...', 'Bundling your app...', 'Almost ready...',
]

function buildSrcdoc(files: Record<string, any>): string {
  const appFile = (files['src/App.tsx'] || files['src/App.jsx']) as any
  const appCode: string = appFile?.content || ''
  const cssCode: string = (files['src/index.css'] as any)?.content || ''

  // Collect all component files
  const componentFiles: Record<string, string> = {}
  for (const [path, file] of Object.entries(files)) {
    if (
      path.startsWith('src/components/') ||
      path.startsWith('src/lib/') ||
      path.startsWith('src/hooks/')
    ) {
      componentFiles[path] = (file as any)?.content || ''
    }
  }

  // Transform App.tsx — strip imports, transform exports
  function transformApp(code: string): string {
    let c = code
    // Remove all import statements
    c = c.replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\n?/gm, '')
    c = c.replace(/^import\s+['"][^'"]+['"]\s*;?\n?/gm, '')
    // Transform export default function Name → function App
    c = c.replace(/export\s+default\s+function\s+\w+/, 'function __WyberApp')
    c = c.replace(/export\s+default\s+function\s*\(/, 'function __WyberApp(')
    // Transform export default ComponentName → (already defined above)
    c = c.replace(/^export\s+default\s+(\w+)\s*;?\s*$/m, '// default: $1')
    // Transform named exports
    c = c.replace(/^export\s+(const|function|class|interface|type)\s+/gm, '$1 ')
    // Transform export { x } → // export x
    c = c.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '')
    return c
  }

  // Build component module stubs
  const componentScripts = Object.entries(componentFiles).map(([path, code]) => {
    const modName = path.replace('src/', '').replace(/\.(tsx?|jsx?)$/, '')
    let c = code
    c = c.replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\n?/gm, '')
    c = c.replace(/^import\s+['"][^'"]+['"]\s*;?\n?/gm, '')
    c = c.replace(/export\s+default\s+function\s+(\w+)/, 'function $1')
    c = c.replace(/^export\s+(const|function|class)\s+/gm, '$1 ')
    c = c.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '')
    return `/* ${modName} */\n${c}`
  }).join('\n\n')

  const transformedApp = transformApp(appCode)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/recharts/umd/Recharts.js"></script>
<script>
// Shim lucide-react icons as simple SVG spans
window.LucideReact = new Proxy({}, {
  get: function(_, name) {
    return function(props) {
      return React.createElement('span', {
        style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: props.size || 16, height: props.size || 16, opacity: 0.7 },
        title: String(name)
      }, '◆');
    };
  }
});
window.Recharts = window.Recharts || {};
</script>
<style>
${cssCode}
</style>
</head>
<body style="margin:0;padding:0">
<div id="root"></div>
<script type="text/babel" data-presets="react,typescript" data-type="module">
const { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext, memo, forwardRef, Fragment, lazy, Suspense, useReducer } = React;

// Recharts
const { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, ScatterChart, Scatter } = window.Recharts || {};

// Lucide icons proxy
const { ${[
  'Home','Users','Settings','BarChart2','TrendingUp','TrendingDown','Plus','Search',
  'Filter','X','Edit2','Trash2','ChevronRight','ChevronDown','ChevronUp','ChevronLeft',
  'Bell','CreditCard','Package','ArrowUp','ArrowDown','MoreVertical','CheckCircle',
  'AlertCircle','Clock','Star','Shield','Lock','Unlock','Eye','EyeOff','Mail',
  'Phone','MapPin','Calendar','Download','Upload','Share2','Copy','Check',
  'Info','AlertTriangle','Zap','Globe','Database','Server','Code','Terminal',
  'FileText','Folder','Image','Link','ExternalLink','RefreshCw','Save','LogOut',
  'User','UserPlus','UserMinus','UserCheck','Activity','Cpu','Wifi','Battery',
  'Moon','Sun','Layout','Grid','List','Menu','Sidebar','Monitor','Smartphone',
  'DollarSign','Percent','Hash','Tag','Bookmark','Heart','ThumbsUp','MessageCircle',
  'Send','Inbox','Archive','Paperclip','Mic','Volume2','Play','Pause','SkipForward',
].join(',')} } = window.LucideReact;

// Component files
${componentScripts}

// App
${transformedApp}

// Render
try {
  const AppComponent = typeof __WyberApp !== 'undefined' ? __WyberApp : (() => React.createElement('div', {style:{padding:24,fontFamily:'sans-serif',color:'#fff',background:'#09090b',minHeight:'100vh'}}, 'App loaded'));
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(AppComponent));
} catch(err) {
  document.getElementById('root').innerHTML = '<div style="padding:24px;color:#ef4444;font-family:monospace;font-size:13px;background:#fff1f1;white-space:pre-wrap">Preview error: ' + err.message + '\\n\\nThis app may need a live server to run. Try editing it in the chat.</div>';
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
  const prevFileCount = useRef(0)
  const lastBuiltKey = useRef('')

  const appFile = (files['src/App.tsx'] || files['src/App.jsx']) as any
  const hasApp = Object.keys(files).length >= 2 && (appFile?.content?.length ?? 0) > 100

  const build = useCallback(async () => {
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
      const res = await fetch('/api/preview-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, projectId: project?.id }),
      })
      const data = await res.json()
      clearInterval(timerRef.current!)
      setElapsed(Math.round((Date.now() - start) / 100) / 10)
      if (data.url) {
        setHtml(data.url)
        setError(null)
      } else {
        setError(data.error || 'Build failed')
      }
    } catch (e: any) {
      clearInterval(timerRef.current!)
      setError('Build failed: ' + e.message)
    } finally {
      setBuilding(false)
    }
  }, [files, hasApp, building, html, project])

  // Auto-build when generation completes
  useEffect(() => {
    if (prevGenerating.current && !isGenerating && hasApp) {
      setTimeout(() => { lastBuiltKey.current = ''; build() }, 500)
    }
    prevGenerating.current = isGenerating
  }, [isGenerating, build, hasApp])

  // Auto-build when prebuilt files load (gallery templates)
  useEffect(() => {
    const fileCount = Object.keys(files).length
    if (fileCount >= 2 && prevFileCount.current === 0 && !isGenerating) {
      setTimeout(() => { lastBuiltKey.current = ''; build() }, 800)
    }
    prevFileCount.current = fileCount
  }, [files, isGenerating, build])

  // Update iframe src when Railway URL returned
  useEffect(() => {
    if (iframeRef.current && html) {
      if (html.startsWith('http')) {
        iframeRef.current.src = html
      } else {
        iframeRef.current.srcdoc = html
      }
    }
  }, [html])

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b', position: 'relative' }}>
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: building ? '#f59e0b' : html ? '#22c55e' : '#3f3f46', boxShadow: html ? '0 0 6px rgba(34,197,94,0.4)' : 'none', transition: 'all 0.3s' }} />
        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {isGenerating ? 'Generating your app...' : building ? `${MESSAGES[msgIdx]} (${seconds}s)` : elapsed !== null ? `✓ Preview ready in ${elapsed}s` : hasApp ? 'Ready — click Build preview' : 'Describe what you want to build'}
        </span>
        {html && !building && (
          <button onClick={() => { if (iframeRef.current) { iframeRef.current.srcdoc = ''; setTimeout(() => { if (iframeRef.current) iframeRef.current.srcdoc = html! }, 50) } }}
            title="Refresh" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>&#8634;</button>
        )}
        {hasApp && !building && (
          <button onClick={build} style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 5, color: '#0EA5E9', cursor: 'pointer', padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
            {html ? 'Rebuild' : 'Build preview'}
          </button>
        )}
      </div>

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
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>Generating your app...</div>
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
