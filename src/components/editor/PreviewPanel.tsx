'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'
import { VisualEditorOverlay } from './VisualEditorOverlay'

const MESSAGES = [
  'Compiling components...', 'Bundling your app...', 'Almost ready...',
]

const LUCIDE_ICONS = [
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
  'Award','Target','Flag','Briefcase','Building','Truck','ShoppingCart','ShoppingBag',
  'Coffee','Pizza','Utensils','Car','Plane','Train','Bike','Anchor','Compass',
  'Map','Navigation','Wind','Droplets','Thermometer','Umbrella','CloudRain',
  'PieChart','LineChart','BarChart','TrendingUp','Layers','GitBranch','GitCommit',
  'Clipboard','ClipboardCheck','ClipboardList','CheckSquare','Square','Circle',
  'Minus','Divide','Equal','CornerDownRight','RotateCcw','RotateCw','Maximize',
  'Minimize','Move','Crop','Sliders','ToggleLeft','ToggleRight','Volume','VolumeX',
  'Headphones','Camera','Video','Film','Music','Radio','Rss','Wifi','WifiOff',
  'Bluetooth','Cast','Printer','Scanner','HardDrive','Cpu','Terminal','Code2',
  'Bug','Wrench','Tool','Settings2','Key','Fingerprint','Scan','QrCode',
  'Receipt','Wallet','PiggyBank','Coins','BadgeDollarSign','Banknote',
  'Trophy','Medal','Ribbon','Gift','Package2','Box','Archive','Inbox',
  'MessageSquare','MessageCircle','ChatBubble','AtSign','Hash','Phone','PhoneCall',
]

function buildSrcdoc(files: Record<string, any>): string {
  const appFile = (files['src/App.tsx'] || files['src/App.jsx'] || files['src/app.tsx'] || files['src/app.jsx']) as any
  const appCode: string = typeof appFile === 'string' ? appFile : (appFile?.content || '')
  const cssCode: string = typeof (files['src/index.css']) === 'string'
    ? files['src/index.css']
    : ((files['src/index.css'] as any)?.content || '')

  // Collect all component/data/hook files
  const componentFiles: Record<string, string> = {}
  for (const [path, file] of Object.entries(files)) {
    if (path === 'src/App.tsx' || path === 'src/App.jsx' || path === 'src/index.css' || path === 'src/main.tsx') continue
    const code = typeof file === 'string' ? file : (file as any)?.content || ''
    if (code.trim()) componentFiles[path] = code
  }

  function transform(code: string, isApp = false): string {
    let c = code
    // Remove import statements
    c = c.replace(/^import\s+type\s+.*?;\s*\n?/gm, '')
    c = c.replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*\n?/gm, '')
    c = c.replace(/^import\s+['"][^'"]+['"]\s*;?\s*\n?/gm, '')
    // Strip re-declarations that conflict with globals
    c = c.replace(/^const\s+\{[^}]*\}\s*=\s*(window\.)?Recharts[^;\n]*;?\s*$/gm, '')
    c = c.replace(/^const\s+\{[^}]*\}\s*=\s*(window\.)?LucideReact[^;\n]*;?\s*$/gm, '')
    c = c.replace(/^const\s+\{[^}]+\}\s*=\s*React\b[^;\n]*;?\s*$/gm, '')
    // Remove export keywords
    c = c.replace(/^export\s+default\s+function\s+(\w+)/m, isApp ? 'function __WyberApp' : 'function $1')
    c = c.replace(/^export\s+default\s+function\s*\(/m, isApp ? 'function __WyberApp(' : 'function __Component(')
    c = c.replace(/^export\s+default\s+(\w+)\s*;?\s*$/m, '')
    c = c.replace(/^export\s+(const|function|class|interface|type|enum)\s+/gm, '$1 ')
    c = c.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '')
    c = c.replace(/^export\s*\{[^}]*\}\s*from\s*['"][^'"]+['"]\s*;?\s*$/gm, '')
    // Remove TypeScript type annotations that break Babel
    c = c.replace(/:\s*React\.FC[^=]*/g, '')
    c = c.replace(/:\s*React\.ReactNode/g, '')
    return c
  }

  const componentScripts = Object.entries(componentFiles).map(([path, code]) => {
    return `/* === ${path} === */\n${transform(code)}`
  }).join('\n\n')

  const transformedApp = transform(appCode, true)
  const iconList = LUCIDE_ICONS.join(',')

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
window.LucideReact = new Proxy({}, {
  get: function(_, name) {
    return function(props) {
      var p = props || {};
      return React.createElement('span', {
        style: { display:'inline-flex', alignItems:'center', justifyContent:'center',
          width: p.size||16, height: p.size||16, opacity:0.75, color: p.color||'currentColor' },
        title: String(name), className: p.className||''
      }, '◆');
    };
  }
});
window.Recharts = window.Recharts || {};
</script>
<style>
${cssCode}
* { box-sizing: border-box; }
body { margin: 0; }
</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel" data-presets="react,typescript" data-type="module">
const { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext,
  memo, forwardRef, Fragment, useReducer, useLayoutEffect } = React;
// Recharts available via window.Recharts — components use it directly
const __RC = window.Recharts || {};
const LineChart = __RC.LineChart, BarChart = __RC.BarChart, AreaChart = __RC.AreaChart,
  PieChart = __RC.PieChart, Pie = __RC.Pie, Cell = __RC.Cell, Bar = __RC.Bar,
  Line = __RC.Line, Area = __RC.Area, XAxis = __RC.XAxis, YAxis = __RC.YAxis,
  CartesianGrid = __RC.CartesianGrid, Tooltip = __RC.Tooltip, Legend = __RC.Legend,
  ResponsiveContainer = __RC.ResponsiveContainer, RadialBarChart = __RC.RadialBarChart,
  RadialBar = __RC.RadialBar, ScatterChart = __RC.ScatterChart, Scatter = __RC.Scatter,
  ComposedChart = __RC.ComposedChart;
const { ${iconList} } = window.LucideReact;

${componentScripts}

${transformedApp}

const AppToRender = typeof __WyberApp !== 'undefined' ? __WyberApp : () => React.createElement('div', {style:{padding:24,color:'#fff',background:'#09090b',minHeight:'100vh',fontFamily:'sans-serif'}}, 'App loaded');
try {
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(AppToRender));
} catch(err) {
  document.getElementById('root').innerHTML = '<div style="padding:24px;color:#ef4444;font-family:monospace;font-size:12px;background:#111;white-space:pre-wrap;min-height:100vh">Preview error: ' + err.message + '</div>';
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
  const hasApp = Object.keys(files).length >= 2 && (typeof appFile === 'string' ? appFile : appFile?.content || '').length > 100

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
      // Build in browser — no Railway, no build step, instant preview
      const srcdoc = buildSrcdoc(files)
      clearInterval(timerRef.current!)
      setElapsed(Math.round((Date.now() - start) / 100) / 10)
      if (srcdoc) {
        setHtml(srcdoc)
        setError(null)
      } else {
        setError('Preview failed to render')
      }
    } catch (e: any) {
      clearInterval(timerRef.current!)
      setError('Preview error: ' + e.message)
    } finally {
      setBuilding(false)
    }
  }, [files, hasApp, building, html])

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
    const appF = files['src/App.tsx'] || files['src/App.jsx']
    const appContent = typeof appF === 'string' ? appF : (appF as any)?.content || ''
    if (fileCount >= 2 && prevFileCount.current === 0 && !isGenerating && appContent.length > 100) {
      setTimeout(() => { lastBuiltKey.current = ''; build() }, 600)
    }
    prevFileCount.current = fileCount
  }, [files, isGenerating, build])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#09090b', overflow: 'hidden' }}>
      {/* Building state */}
      {building && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#09090b', zIndex: 10, gap: 12 }}>
          <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: 13, color: '#71717a' }}>{MESSAGES[msgIdx]}</div>
          <div style={{ fontSize: 11, color: '#52526a' }}>{seconds}s</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {/* Error state */}
      {error && !building && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#09090b', zIndex: 10, gap: 16, padding: 24 }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', maxWidth: 400, lineHeight: 1.5 }}>{error}</div>
          <button onClick={() => { lastBuiltKey.current = ''; build() }}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      )}
      {/* Empty state */}
      {!building && !error && !html && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#52526a' }}>
          <div style={{ fontSize: 32 }}>{'<'}</div>
          <div style={{ fontSize: 13 }}>Describe what you want to build</div>
          <div style={{ fontSize: 11 }}>Your app will appear here after generation</div>
        </div>
      )}
      {/* Status bar */}
      {elapsed !== null && !building && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 32, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: 'rgba(9,9,11,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 5, fontSize: 11 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: error ? '#ef4444' : '#22c55e' }} />
          <span style={{ color: '#71717a' }}>{error ? 'Build failed' : `Preview ready in ${elapsed}s`}</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => { lastBuiltKey.current = ''; build() }}
            style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717a', fontSize: 11, cursor: 'pointer' }}>
            Rebuild
          </button>
        </div>
      )}
      {/* Preview iframe */}
      <iframe
        ref={iframeRef}
        title="Wyber Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        srcDoc={html || undefined}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          border: 'none',
          display: html && !building ? 'block' : 'none',
          background: '#09090b',
          marginTop: elapsed ? 32 : 0,
          height: elapsed ? 'calc(100% - 32px)' : '100%',
        }}
      />
      <VisualEditorOverlay iframeRef={iframeRef} />
    </div>
  )
}
