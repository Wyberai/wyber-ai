// Generalized version of _fix-truncated-ecommerce.mjs for the remaining 3
// rows whose truncation point isn't a trailing modal conditional but a
// broken element mid-tree (e.g. a table header row cut off mid-attribute).
// Same auto-discovery philosophy: find the truncated line generically (scan
// backward from EOF past pure-closer lines to the last real content line),
// drop it, then brute-force a handful of plausible closing-tail shapes +
// closing-div counts until real esbuild (same settings as the production
// preview engine) accepts the result.
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
  '6fbcee11-349c-48ae-a2d6-8e62534d5bc1', // Loyalty Points Dashboard — broken inside `{tab === 2 && (`
]

const CLOSER_ONLY = /^\s*(<\/[A-Za-z][\w.]*>|\)+;?|\}+|\)\s*\)|\)\)\}|\s*)$/

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

function findTruncationPoint(lines) {
  // Prefer cutting at the start of the outermost broken `{expr && (` block
  // (drops the whole unrecoverable feature, not just its final malformed
  // line) — falls back to a generic backward scan past pure-closer lines.
  const condMatches = []
  lines.forEach((l, i) => { if (/\{[^{}]*&&\s*\(\s*$/.test(l)) condMatches.push(i) })
  if (condMatches.length) return condMatches[condMatches.length - 1]
  let i = lines.length - 1
  while (i >= 0 && (lines[i].trim() === '' || CLOSER_ONLY.test(lines[i]))) i--
  return i // index of last real-content (broken) line — exclude this and everything after
}

const TAIL_TEMPLATES = (closeDivs) => [
  [...closeDivs, '  );', '}', ''].join('\n'),
  [...closeDivs, '  )', '}', ''].join('\n'),
  [...closeDivs, '  ))', '}', '}', ''].join('\n'),
  [...closeDivs, '  ))}', '    </div>', '  );', '}', ''].join('\n'),
]

for (const id of TARGET_IDS) {
  const { data: row, error: fetchErr } = await admin.from('prebuilt_apps').select('name,files').eq('id', id).single()
  if (fetchErr) { console.log(`[SKIP] ${id}: ${fetchErr.message}`); continue }

  const otherFiles = {}
  for (const [p, f] of Object.entries(row.files)) if (p !== 'src/App.tsx') otherFiles[p] = typeof f === 'string' ? f : f.content
  const content = row.files['src/App.tsx'].content
  const lines = content.split('\n')

  const cut = findTruncationPoint(lines)
  const prefix = lines.slice(0, cut)
  while (prefix.length && prefix[prefix.length - 1].trim() === '') prefix.pop()

  let fixed = null
  outer:
  for (let n = 0; n <= 8; n++) {
    const closeDivs = Array.from({ length: n }, () => '    </div>')
    for (const tail of TAIL_TEMPLATES(closeDivs)) {
      const candidate = [...prefix, tail].join('\n')
      const testFiles = { ...otherFiles, 'src/App.tsx': candidate }
      if (await bundlesOk(testFiles)) { fixed = candidate; console.log(`  [${row.name}] fixed: dropped line ${cut + 1}, ${n} closing </div>`); break outer }
    }
  }

  if (!fixed) { console.log(`[FAIL] ${row.name}: could not auto-repair`); continue }

  const filesForDb = { ...row.files, 'src/App.tsx': { path: 'src/App.tsx', content: fixed, language: 'typescript' } }
  const { error: updateErr } = await admin.from('prebuilt_apps').update({ files: filesForDb }).eq('id', id)
  if (updateErr) { console.log(`[DB ERROR] ${row.name}: ${updateErr.message}`); continue }
  console.log(`[OK] ${row.name} — repaired and saved`)
}
