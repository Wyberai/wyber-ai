// Broader bug scan (separate from the truncation-repair pass): a clean
// esbuild pass doesn't mean an app is actually complete — the same
// virtual-fs plugin logic used everywhere in this project (check scripts and
// the real preview engines alike) silently falls back to `external: true` /
// esm.sh for ANY unresolved import, whether that's a legitimate npm package
// or a local file that's flat-out missing (e.g. `import Foo from
// './components/Foo'` where Foo.tsx was never generated). The build "passes"
// either way, but a missing local component renders as a runtime crash or a
// blank section, not a build error — so it's invisible to a syntax check.
// This scans every valid row's real import graph and reports any relative/
// absolute/@-aliased import that doesn't resolve to a real file in that row.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { WYBER_UI_KIT_FILES } from '../../src/lib/wyber-ui-kit.ts'
import { WYBER_STORE_FILES } from '../../src/lib/wyber-store.ts'
import { CONNECTOR_INFRA_FILES } from '../../src/lib/connector-infra.ts'

// These get injected into the virtual FS by both real preview engines
// (engine.ts / web-bundle route.ts) BEFORE bundling, whenever a row doesn't
// already provide its own file at that path — so an app importing
// `./wyber-ui`, `./wyber-store`, or the connector-infra modules without
// shipping them itself is fetching the injected shared version, not a
// missing file. Must be excluded here the same way, or every row that uses
// the shared UI kit shows up as a false positive.
const INJECTED_PATHS = new Set([
  ...Object.keys(WYBER_UI_KIT_FILES).map((p) => '/' + p.replace(/^\/+/, '')),
  ...Object.keys(WYBER_STORE_FILES).map((p) => '/' + p.replace(/^\/+/, '')),
  ...CONNECTOR_INFRA_FILES.map((f) => '/' + f.path.replace(/^\/+/, '')),
])

const env = {}
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const EXTERNAL = ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'lucide-react', 'recharts', 'clsx', 'react-router-dom', 'framer-motion', 'date-fns', 'zustand', 'axios', 'gsap', 'gsap/ScrollTrigger', 'lenis']

// Matches import/export ... from '...' and bare `import('...')`, require('...')
const IMPORT_RE = /(?:import\s+(?:[\s\S]*?\s+from\s+)?|export\s+[\s\S]*?\s+from\s+|require\()\s*['"]([^'"]+)['"]/g

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

function findMissingImports(normalized, entry) {
  const missingLocal = []
  const unknownPackages = new Set()
  const visited = new Set()
  const queue = [entry]
  while (queue.length) {
    const path = queue.shift()
    if (visited.has(path)) continue
    visited.add(path)
    const content = normalized[path]
    if (!content) continue
    let match
    IMPORT_RE.lastIndex = 0
    while ((match = IMPORT_RE.exec(content))) {
      const spec = match[1]
      if (EXTERNAL.includes(spec) || EXTERNAL.some((e) => spec.startsWith(e + '/'))) continue
      let resolved
      let isLocal = false
      if (spec.startsWith('@/')) { resolved = '/src/' + spec.slice(2); isLocal = true }
      else if (spec.startsWith('.') || spec.startsWith('/')) { resolved = resolveImport(path, spec); isLocal = true }
      if (!isLocal) { unknownPackages.add(spec); continue }
      const tryPaths = [resolved, resolved + '.tsx', resolved + '.ts', resolved + '.js', resolved + '/index.tsx', resolved + '/index.ts']
      const foundPath = tryPaths.find((p) => normalized[p])
      if (!foundPath) {
        if (!tryPaths.some((p) => INJECTED_PATHS.has(p))) missingLocal.push({ from: path, spec })
      } else queue.push(foundPath)
    }
  }
  return { missingLocal, unknownPackages: [...unknownPackages] }
}

const catFilter = process.argv[2] ? process.argv[2].split(',') : null
let query = admin.from('prebuilt_apps').select('id,name,category,files').eq('valid', true)
if (catFilter) query = query.in('category', catFilter)
const { data, error } = await query
if (error) throw error

let flaggedCount = 0
for (const row of data) {
  const files = row.files
  if (!files) continue
  const normalized = {}
  for (const [p, f] of Object.entries(files)) {
    const path = p.startsWith('/') ? p : '/' + p
    normalized[path] = typeof f === 'string' ? f : f.content
  }
  // Skip RN-shaped rows here (App.tsx at root + screens/ + app.json) — checked separately.
  if (Object.keys(normalized).some((k) => k.startsWith('/screens/') || k === '/app.json')) continue
  const entry = normalized['/src/App.tsx'] ? '/src/App.tsx' : Object.keys(normalized).find((k) => k.endsWith('.tsx'))
  if (!entry) continue

  const { missingLocal, unknownPackages } = findMissingImports(normalized, entry)
  if (missingLocal.length) {
    flaggedCount++
    console.log(`[MISSING-LOCAL] ${row.name} (${row.category}) id=${row.id}`)
    for (const m of missingLocal) console.log(`    ${m.from} imports "${m.spec}" — no matching file`)
  }
  if (unknownPackages.length) {
    console.log(`[UNKNOWN-PKG] ${row.name} (${row.category}) id=${row.id}: ${unknownPackages.join(', ')}`)
  }
}
console.log(`\nChecked ${data.length} rows, ${flaggedCount} with missing local imports.`)
