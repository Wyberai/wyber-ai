// Renders a prebuilt_apps row (by id) into a standalone HTML file using the
// SAME esbuild settings + HTML shell as the real production preview engine
// (src/lib/wyber-preview/engine.ts), so a repaired row can be eyeballed in an
// actual browser instead of just esbuild-valid. Usage:
//   node _render-db-row.mjs <row-id> [out.html]
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import * as esbuild from 'esbuild'
import { GOOGLE_FONTS_LINKS, PREVIEW_TAILWIND_CONFIG, TOKEN_VARS_CSS } from '../../src/lib/design-system.ts'

const env = {}
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const EXTERNAL_DEPS = {
  'react': 'https://esm.sh/react@18.3.1',
  'react-dom': 'https://esm.sh/react-dom@18.3.1',
  'react-dom/client': 'https://esm.sh/react-dom@18.3.1/client',
  'react/jsx-runtime': 'https://esm.sh/react@18.3.1/jsx-runtime',
  'lucide-react': 'https://esm.sh/lucide-react@0.383.0?deps=react@18.3.1',
  'recharts': 'https://esm.sh/recharts@2.12.0?deps=react@18.3.1,react-dom@18.3.1',
  'clsx': 'https://esm.sh/clsx@2.1.1',
  'react-router-dom': 'https://esm.sh/react-router-dom@6.28.0?deps=react@18.3.1,react-dom@18.3.1',
  'framer-motion': 'https://esm.sh/framer-motion@11.0.0?deps=react@18.3.1,react-dom@18.3.1',
  'date-fns': 'https://esm.sh/date-fns@3.6.0',
  'zustand': 'https://esm.sh/zustand@4.5.2?deps=react@18.3.1',
  'axios': 'https://esm.sh/axios@1.7.2',
  'gsap': 'https://esm.sh/gsap@3.12.5',
  'gsap/ScrollTrigger': 'https://esm.sh/gsap@3.12.5/ScrollTrigger',
  'lenis': 'https://esm.sh/lenis@1.1.14',
}
const EXTERNAL = Object.keys(EXTERNAL_DEPS)

function resolveImport(importer, spec) {
  if (spec.startsWith('/')) return spec
  const base = importer.split('/').slice(0, -1).join('/')
  const parts = (base + '/' + spec).split('/')
  const out = []
  for (const part of parts) {
    if (part === '.' || part === '') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return '/' + out.join('/')
}

// Matches the REAL default preview path (src/app/api/web-bundle/route.ts
// generateHtml), NOT engine.ts's client-WASM template — that one wraps the
// ESM output in try/catch, which is a SyntaxError for static import
// declarations (confirmed by hand: any bundle importing react throws
// "Unexpected token '{'" and nothing ever renders). engine.ts is reachable
// only via the opt-in "WASM" toggle, not the default path, but it's a real
// separate bug worth flagging independently of this repair work.
function generateHTML(js, css, projectId) {
  const importmap = JSON.stringify({ imports: EXTERNAL_DEPS })
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wyber Preview</title>
  ${GOOGLE_FONTS_LINKS}
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = ${PREVIEW_TAILWIND_CONFIG};</script>
  <script type="importmap">${importmap}</script>
  <style>
    ${TOKEN_VARS_CSS}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; width: 100%; }
    body { background: hsl(var(--background)); color: hsl(var(--foreground)); font-family: var(--font-sans, 'Inter', ui-sans-serif, system-ui, sans-serif); -webkit-font-smoothing: antialiased; }
  </style>
  <style id="app-styles">${css}</style>
</head>
<body>
  <div id="root"></div>
  <div id="wyber-error" style="display:none;position:fixed;inset:0;background:#09090b;color:#ef4444;font-family:monospace;padding:24px;font-size:13px;overflow:auto;z-index:9999;white-space:pre-wrap;"></div>
  <script>
    window.__WYBER_PROJECT_ID__ = '${projectId}';
    function showError(msg) {
      var el = document.getElementById('wyber-error');
      if (el) { el.style.display = 'block'; el.textContent = '⚠ Preview Error\\n\\n' + String(msg); }
      console.error('[WyberPreview]', msg);
    }
    window.addEventListener('error', function(e) { showError(e.message + (e.filename ? '\\n' + e.filename + ':' + e.lineno : '')); });
    window.addEventListener('unhandledrejection', function(e) { showError(String(e.reason)); });
  </script>
  <script type="module">
${js}
  </script>
</body>
</html>`
}

const id = process.argv[2]
const outPath = process.argv[3] || `_pilot-output/render-${id}.html`

const { data: row, error } = await admin.from('prebuilt_apps').select('id,name,category,files').eq('id', id).single()
if (error) throw error

const normalized = {}
for (const [p, f] of Object.entries(row.files)) {
  const path = p.startsWith('/') ? p : '/' + p
  normalized[path] = typeof f === 'string' ? f : f.content
}
const appEntry = normalized['/src/App.tsx'] ? '/src/App.tsx' : Object.keys(normalized).find((k) => k.endsWith('.tsx'))

// Boot module: mounts <App/> to #root. Matches the real /api/web-bundle
// route's approach — its own comment explains why: the output bundle needs
// external imports (react, react-dom) at the TOP LEVEL of the ESM output,
// which only works if nothing wraps the module body in a block.
const entry = '/__boot.tsx'
normalized[entry] = `
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import App from '${appEntry}'
const el = document.getElementById('root')
if (el) createRoot(el).render(createElement(App))
`

const plugin = {
  name: 'vfs',
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.path === entry && !args.importer) return { path: entry, namespace: 'wyber' }
      if (EXTERNAL.includes(args.path)) return { path: args.path, external: true }
      for (const ext of EXTERNAL) if (args.path.startsWith(ext + '/')) return { path: args.path, external: true }
      let resolved
      if (args.path.startsWith('@/')) resolved = '/src/' + args.path.slice(2)
      else if (args.path.startsWith('.') || args.path.startsWith('/')) resolved = resolveImport(args.importer || '/', args.path)
      else resolved = '/' + args.path
      const tryPaths = [resolved, resolved + '.tsx', resolved + '.ts', resolved + '.js', resolved + '/index.tsx', resolved + '/index.ts']
      for (const p of tryPaths) if (normalized[p]) return { path: p, namespace: 'wyber' }
      return { path: 'https://esm.sh/' + args.path, external: true }
    })
    build.onLoad({ filter: /.*/, namespace: 'wyber' }, (args) => {
      const loader = args.path.endsWith('.tsx') ? 'tsx' : args.path.endsWith('.ts') ? 'ts' : args.path.endsWith('.css') ? 'css' : 'jsx'
      return { contents: normalized[args.path], loader }
    })
  },
}

const result = await esbuild.build({
  entryPoints: [entry],
  bundle: true, format: 'esm', write: false,
  jsx: 'automatic', jsxImportSource: 'react',
  define: {
    'import.meta.env': JSON.stringify({ MODE: 'development', DEV: true, PROD: false, SSR: false, VITE_CONNECTOR_MODE: 'demo', VITE_CONNECTOR_PROXY_URL: '' }),
  },
  plugins: [plugin],
  external: EXTERNAL,
})

let css = ''
for (const [p, content] of Object.entries(normalized)) if (p.endsWith('.css')) css += content + '\n'

const js = result.outputFiles[0].text
const html = generateHTML(js, css, row.id)
writeFileSync(outPath, html, 'utf8')
console.log(`Rendered [${row.name}] (${row.category}) -> ${outPath}`)
