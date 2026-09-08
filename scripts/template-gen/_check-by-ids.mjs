import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import * as esbuild from 'esbuild'

const env = {}
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const ids = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((s) => s.trim()).filter(Boolean)
const { data, error } = await admin.from('prebuilt_apps').select('id,name,category,files').in('id', ids)
if (error) throw error

const EXTERNAL = ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'lucide-react', 'recharts', 'clsx', 'react-router-dom', 'framer-motion', 'date-fns', 'zustand', 'axios', 'gsap', 'gsap/ScrollTrigger', 'lenis']

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

let failCount = 0
for (const row of data) {
  const files = row.files
  if (!files) continue
  const normalized = {}
  for (const [p, f] of Object.entries(files)) {
    const path = p.startsWith('/') ? p : '/' + p
    normalized[path] = typeof f === 'string' ? f : f.content
  }
  const entry = normalized['/src/App.tsx'] ? '/src/App.tsx' : Object.keys(normalized).find((k) => k.endsWith('.tsx'))
  if (!entry) { console.log('[SKIP no entry]', row.name); continue }

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

  try {
    await esbuild.build({
      entryPoints: [entry],
      bundle: true, format: 'esm', write: false,
      jsx: 'automatic', jsxImportSource: 'react',
      plugins: [plugin],
      external: EXTERNAL,
      logLevel: 'silent',
    })
  } catch (err) {
    failCount++
    console.log(`[FAIL] ${row.name} (${row.category}) id=${row.id}`)
    console.log('  ' + err.message.split('\n').slice(0, 6).join('\n  '))
  }
}
console.log(`\nChecked ${data.length} rows, ${failCount} failed.`)
