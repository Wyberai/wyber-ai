// Same missing-local-import scan as _scan-missing-imports.mjs, scoped to the
// RN-shaped Mobile-* rows (App.tsx + screens/ + app.json). Bare-specifier
// imports are NOT flagged here — the real RN bundler (bundleRnApp) resolves
// singletons/native-stubs/nav-shims/esm.sh for those by design, so an
// unresolved bare specifier is expected, not a bug. A RELATIVE import that
// doesn't resolve to a real file in the row, though, means a referenced
// screen/component/hook was never actually generated — that's a genuine gap.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = {}
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const IMPORT_RE = /(?:import\s+(?:[\s\S]*?\s+from\s+)?|export\s+[\s\S]*?\s+from\s+|require\()\s*['"]([^'"]+)['"]/g

function resolveImport(importer, spec) {
  const dir = importer.substring(0, importer.lastIndexOf('/'))
  const parts = (dir + '/' + spec).split('/')
  const out = []
  for (const p of parts) {
    if (p === '.' || p === '') continue
    if (p === '..') out.pop()
    else out.push(p)
  }
  return '/' + out.join('/')
}

const ids = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((s) => s.trim()).filter(Boolean)
const { data, error } = await admin.from('prebuilt_apps').select('id,name,category,files').in('id', ids)
if (error) throw error

let flaggedCount = 0
for (const row of data) {
  const normalized = {}
  for (const [p, f] of Object.entries(row.files)) {
    const path = p.startsWith('/') ? p : '/' + p
    normalized[path] = typeof f === 'string' ? f : f.content
  }
  const appEntry = ['/App.tsx', '/App.jsx', '/App.js', '/src/App.tsx'].find((e) => normalized[e]) || Object.keys(normalized).find((k) => /App\.(tsx|jsx|js)$/.test(k))
  if (!appEntry) continue

  const missing = []
  const visited = new Set()
  const queue = [appEntry]
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
      if (!(spec.startsWith('.') || spec.startsWith('/'))) continue // bare specifiers intentionally not checked
      const resolved = spec.startsWith('/') ? spec : resolveImport(path, spec)
      const tryPaths = [resolved, resolved + '.tsx', resolved + '.ts', resolved + '.js', resolved + '/index.tsx', resolved + '/index.ts']
      const foundPath = tryPaths.find((p) => normalized[p])
      if (!foundPath) missing.push({ from: path, spec })
      else queue.push(foundPath)
    }
  }
  if (missing.length) {
    flaggedCount++
    console.log(`[MISSING-LOCAL] ${row.name} (${row.category}) id=${row.id}`)
    for (const m of missing) console.log(`    ${m.from} imports "${m.spec}" — no matching file`)
  }
}
console.log(`\nChecked ${data.length} RN rows, ${flaggedCount} with missing local imports.`)
