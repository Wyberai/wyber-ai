// Verifies RN-shaped prebuilt_apps rows (App.tsx + screens/ + app.json) using
// the SAME esbuild settings as the real production RN bundler
// (src/app/api/rn-web-bundle/route.ts bundleRnApp): jsx:'automatic',
// treeShaking:false, ignoreAnnotations:true, same entry-point resolution
// (/App.tsx, /App.jsx, /App.js, /src/App.tsx, else first App.* match), same
// virtual-fs relative-import resolution. Every non-local import (singletons,
// native stubs, nav shims, esm.sh deps) is treated as external here — that
// distinction affects RUNTIME behavior, not whether the source itself parses,
// and parsing is all this check cares about (same truncation-bug class as the
// web-shaped templates).
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import * as esbuild from 'esbuild'

const env = {}
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

function normalise(p) {
  let np = p.startsWith('/') ? p : '/' + p
  return np
}
function resolveImport(from, to) {
  const dir = from.substring(0, from.lastIndexOf('/'))
  const parts = (dir + '/' + to).split('/')
  const out = []
  for (const p of parts) {
    if (p === '..') out.pop()
    else if (p !== '.') out.push(p)
  }
  return out.join('/')
}

async function bundlesOk(fileMap) {
  const appEntry =
    ['/App.tsx', '/App.jsx', '/App.js', '/src/App.tsx'].find((e) => fileMap[e]) ||
    Object.keys(fileMap).find((k) => /App\.(tsx|jsx|js)$/.test(k)) ||
    ''
  if (!appEntry) return { ok: false, error: 'no entry' }

  const plugin = {
    name: 'virtual',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.path.startsWith('.') || args.path.startsWith('/')) {
          const resolved = args.path.startsWith('/')
            ? normalise(args.path)
            : args.importer
              ? resolveImport(args.importer, args.path)
              : normalise(args.path)
          for (const s of ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']) {
            if (fileMap[resolved + s]) return { path: resolved + s, namespace: 'virtual' }
          }
          return { path: resolved, external: true }
        }
        return { path: args.path, external: true }
      })
      build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
        const content = fileMap[args.path]
        if (!content) return { errors: [{ text: `Not found: ${args.path}` }] }
        const ext = args.path.split('.').pop()
        const loader = ext === 'ts' ? 'ts' : ext === 'js' || ext === 'jsx' ? 'jsx' : 'tsx'
        return { contents: content, loader }
      })
    },
  }

  try {
    await esbuild.build({
      entryPoints: [appEntry],
      bundle: true, format: 'esm', write: false, minify: false,
      treeShaking: false, ignoreAnnotations: true,
      jsx: 'automatic', jsxImportSource: 'react',
      loader: { '.tsx': 'tsx', '.ts': 'ts', '.jsx': 'jsx', '.js': 'js', '.json': 'json' },
      plugins: [plugin],
      logLevel: 'silent',
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

const ids = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((s) => s.trim()).filter(Boolean)
const { data, error } = await admin.from('prebuilt_apps').select('id,name,category,files').in('id', ids)
if (error) throw error

let failCount = 0
for (const row of data) {
  const fileMap = {}
  for (const [p, f] of Object.entries(row.files)) fileMap[normalise(p)] = typeof f === 'string' ? f : f.content
  const result = await bundlesOk(fileMap)
  if (!result.ok) {
    failCount++
    console.log(`[FAIL] ${row.name} (${row.category}) id=${row.id}`)
    console.log('  ' + result.error.split('\n').slice(0, 6).join('\n  '))
  }
}
console.log(`\nChecked ${data.length} rows, ${failCount} failed.`)
