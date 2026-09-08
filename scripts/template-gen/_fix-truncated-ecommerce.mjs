// Repairs the 8 legacy Ecommerce templates whose src/App.tsx was truncated
// mid-JSX (an unfinished "detail/modal" conditional block at the very end of
// the file, apparently cut off during original generation, with a fixed
// `</div>` x N + '))' + '}' + '}' tail crudely appended after the fact —
// never actually valid JSX, and never verified before being marked valid).
// Strategy: cut the file at the start of that broken conditional block
// (dropping the unrecoverable modal feature entirely) and auto-discover how
// many closing tags are needed to re-balance, by asking real esbuild
// (jsx:'automatic', same settings as the production preview engine) which
// count actually parses — rather than manually counting JSX nesting depth.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import * as esbuild from 'esbuild'

const env = {}
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const TARGET_IDS = [
  '40a3ed2f-0700-491c-8b32-bdbb18f5789d', // Order Management Dashboard
  '7c6e9753-0c59-40b7-8a9d-526fc1963f16', // Inventory Tracker App
  '48aa8fd5-bcdf-4189-9c6c-b47968ccc76b', // Product Catalog App
  'b464faf4-a51c-4789-8b6d-02f9474c2d49', // Shipping Calculator
  '526f7779-5dd8-428c-bb75-2608de9c9c00', // Returns Portal
  '1c8e698e-c612-47e7-8fc8-fef5ca389df0', // Digital Downloads Store
  '6fbcee11-349c-48ae-a2d6-8e62534d5bc1', // Loyalty Points Dashboard
  '629255ed-46c5-4bdd-8dc3-5455193df252', // Supplier Management App
]

async function bundlesOk(files) {
  const normalized = {}
  for (const [p, content] of Object.entries(files)) normalized['/' + p.replace(/^\/+/, '')] = content
  const entry = '/src/App.tsx'
  const plugin = {
    name: 'vfs',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.path === entry && !args.importer) return { path: entry, namespace: 'wyber' }
        if (['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'].includes(args.path)) return { path: args.path, external: true }
        return { path: args.path, external: true }
      })
      build.onLoad({ filter: /.*/, namespace: 'wyber' }, (args) => ({ contents: normalized[args.path], loader: 'tsx' }))
    },
  }
  try {
    await esbuild.build({
      entryPoints: [entry], bundle: true, format: 'esm', write: false,
      jsx: 'automatic', jsxImportSource: 'react',
      plugins: [plugin], external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
      logLevel: 'silent',
    })
    return true
  } catch {
    return false
  }
}

for (const id of TARGET_IDS) {
  const { data: row, error: fetchErr } = await admin.from('prebuilt_apps').select('name,files').eq('id', id).single()
  if (fetchErr) { console.log(`[SKIP] ${id}: ${fetchErr.message}`); continue }

  const otherFiles = {}
  for (const [p, f] of Object.entries(row.files)) if (p !== 'src/App.tsx') otherFiles[p] = typeof f === 'string' ? f : f.content
  const content = row.files['src/App.tsx'].content
  const lines = content.split('\n')

  const breakIdx = lines.findIndex((l) => /\{\s*(modal|selected\w+)\s*&&\s*\(\s*$/.test(l))
  if (breakIdx === -1) { console.log(`[SKIP] ${row.name}: no broken-conditional marker found`); continue }

  const prefix = lines.slice(0, breakIdx)
  // drop trailing blank lines from prefix for a clean cut
  while (prefix.length && prefix[prefix.length - 1].trim() === '') prefix.pop()

  let fixed = null
  for (let n = 0; n <= 6; n++) {
    const closeDivs = Array.from({ length: n }, (_, i) => '    '.repeat(Math.max(1, 2 - Math.floor(i / 2))) + '</div>')
    const candidate = [...prefix, ...closeDivs, '  );', '}', ''].join('\n')
    const testFiles = { ...otherFiles, 'src/App.tsx': candidate }
    if (await bundlesOk(testFiles)) { fixed = candidate; console.log(`  [${row.name}] fixed with ${n} closing </div>`); break }
  }

  if (!fixed) { console.log(`[FAIL] ${row.name}: could not auto-repair (tried 0-6 closing divs)`); continue }

  const filesForDb = { ...row.files, 'src/App.tsx': { path: 'src/App.tsx', content: fixed, language: 'typescript' } }
  const { error: updateErr } = await admin.from('prebuilt_apps').update({ files: filesForDb }).eq('id', id)
  if (updateErr) { console.log(`[DB ERROR] ${row.name}: ${updateErr.message}`); continue }
  console.log(`[OK] ${row.name} — repaired and saved`)
}
