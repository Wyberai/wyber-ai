// Generic repair for the systemic prebuilt_apps truncation bug: src/App.tsx was
// cut mid-JSX (or, downstream of that, esbuild reports "Unterminated regular
// expression" due to parser confusion after the truncation) and had a naive
// fixed `</div>` x N tail glued on, producing code that was never valid.
//
// Strategy: find the cut point generically (backward-scan past pure-closer
// lines, then trim any line still left dangling open with nothing following
// it — e.g. a bare `{x && (` or `.map((s) => (` that never got a body), then
// run a small JSX/JS-aware tokenizer over the KNOWN-GOOD prefix to compute
// exactly which tags/parens/braces are still open, and emit the precise
// closing tail from that (real tag names, not blind </div>). This fixes the
// "Unexpected closing div tag doesn't match opening X" errors at the root
// instead of guessing. Falls back to a small brute-force nudge (trim a few
// more lines) if the computed tail doesn't verify, and finally to the old
// blind </div>-count brute force as a last resort. Every candidate is
// verified against real esbuild using the SAME settings as the production
// preview engine (src/lib/wyber-preview/engine.ts): jsx:'automatic', full
// EXTERNAL_DEPS list, same import resolution.
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import * as esbuild from 'esbuild'

const env = {}
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

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

async function bundlesOk(files) {
  const normalized = {}
  for (const [p, content] of Object.entries(files)) {
    const path = p.startsWith('/') ? p : '/' + p
    normalized[path] = content
  }
  const entry = '/src/App.tsx'
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
      entryPoints: [entry], bundle: true, format: 'esm', write: false,
      jsx: 'automatic', jsxImportSource: 'react',
      plugins: [plugin], external: EXTERNAL, logLevel: 'silent',
    })
    return true
  } catch {
    return false
  }
}

const CLOSER_ONLY = /^\s*(<\/[A-Za-z][\w.]*>|\)+;?|\}+|\)\s*\)|\)\)\}|\s*)$/

export function findInitialCut(lines) {
  let i = lines.length - 1
  while (i >= 0 && (lines[i].trim() === '' || CLOSER_ONLY.test(lines[i]))) i--
  return i + 1 // exclusive bound: lines[0:cut] is the candidate prefix
}

export function trimDangling(prefixLines) {
  const p = [...prefixLines]
  while (p.length) {
    while (p.length && p[p.length - 1].trim() === '') p.pop()
    if (!p.length) break
    const last = p[p.length - 1].trimEnd()
    if (/[({]\s*$/.test(last) || /(&&|\|\|)\s*$/.test(last) || /=>\s*$/.test(last) || /\?\s*$/.test(last)) {
      p.pop()
      continue
    }
    break
  }
  return p
}

// --- tokenizer: computes the stack of still-open constructs at end of text ---
function isIdentStart(c) { return /[A-Za-z_$]/.test(c) }
function isIdentPart(c) { return /[A-Za-z0-9_$.\-]/.test(c) }

function skipString(text, i, quote) {
  i++
  while (i < text.length) {
    if (text[i] === '\\') { i += 2; continue }
    if (text[i] === quote) { i++; break }
    i++
  }
  return i
}

const OP_KEYWORDS = new Set(['return', 'typeof', 'in', 'of', 'instanceof', 'new', 'delete', 'void', 'yield', 'throw', 'case', 'do', 'else', 'extends', 'await'])

export function computeOpenStack(text) {
  const stack = []
  let i = 0
  const n = text.length
  let prevSig = 'op'
  const top = () => stack[stack.length - 1]

  while (i < n) {
    const t = top()
    const c = text[i]

    if (t && t.t === 'template') {
      if (c === '\\') { i += 2; continue }
      if (c === '`') { stack.pop(); i++; prevSig = 'val'; continue }
      if (c === '$' && text[i + 1] === '{') { stack.push({ t: 'brace' }); i += 2; prevSig = 'op'; continue }
      i++; continue
    }

    if (t && t.t === 'jsxopen') {
      if (c === '<') {
        if (text[i + 1] === '/') {
          i += 2
          while (i < n && text[i] !== '>') i++
          i++
          stack.pop()
          prevSig = 'val'
          continue
        } else {
          i++
          if (text[i] === '>') { stack.push({ t: 'jsxopen', name: '' }); i++; continue }
          const start = i
          while (i < n && isIdentPart(text[i])) i++
          stack.push({ t: 'jsxtag', name: text.slice(start, i) })
          continue
        }
      }
      if (c === '{') { stack.push({ t: 'brace' }); i++; prevSig = 'op'; continue }
      i++; continue
    }

    if (t && t.t === 'jsxtag') {
      if (c === '/' && text[i + 1] === '>') { stack.pop(); i += 2; prevSig = 'val'; continue }
      if (c === '>') { const tag = stack.pop(); stack.push({ t: 'jsxopen', name: tag.name }); i++; continue }
      if (c === '{') { stack.push({ t: 'brace' }); i++; prevSig = 'op'; continue }
      if (c === '"' || c === "'") { i = skipString(text, i, c); prevSig = 'val'; continue }
      if (c === '`') { stack.push({ t: 'template' }); i++; continue }
      i++; continue
    }

    // normal JS mode
    if (/\s/.test(c)) { i++; continue }
    if (c === '/' && text[i + 1] === '/') { while (i < n && text[i] !== '\n') i++; continue }
    if (c === '/' && text[i + 1] === '*') { i += 2; while (i < n && !(text[i] === '*' && text[i + 1] === '/')) i++; i += 2; continue }
    if (c === '"' || c === "'") { i = skipString(text, i, c); prevSig = 'val'; continue }
    if (c === '`') { stack.push({ t: 'template' }); i++; continue }
    if (c === '/' && prevSig === 'op') {
      let j = i + 1, inClass = false, bailed = false
      while (j < n) {
        if (text[j] === '\\') { j += 2; continue }
        if (text[j] === '[') { inClass = true; j++; continue }
        if (text[j] === ']') { inClass = false; j++; continue }
        if (text[j] === '/' && !inClass) { j++; break }
        if (text[j] === '\n') { bailed = true; break }
        j++
      }
      if (bailed) { i++; prevSig = 'op'; continue } // malformed — shouldn't happen in a clean prefix
      while (j < n && /[a-z]/i.test(text[j])) j++
      i = j; prevSig = 'val'; continue
    }
    if (c === '<' && prevSig === 'op') {
      i++
      if (text[i] === '>') { stack.push({ t: 'jsxopen', name: '' }); i++; continue }
      if (isIdentStart(text[i])) {
        const start = i
        while (i < n && isIdentPart(text[i])) i++
        stack.push({ t: 'jsxtag', name: text.slice(start, i) })
        continue
      }
      prevSig = 'op'; continue
    }
    if (c === '(') { stack.push({ t: 'paren' }); i++; prevSig = 'op'; continue }
    if (c === ')') { stack.pop(); i++; prevSig = 'val'; continue }
    if (c === '{') { stack.push({ t: 'brace' }); i++; prevSig = 'op'; continue }
    if (c === '}') { stack.pop(); i++; prevSig = 'op'; continue }
    if (c === '[') { stack.push({ t: 'bracket' }); i++; prevSig = 'op'; continue }
    if (c === ']') { stack.pop(); i++; prevSig = 'val'; continue }
    // ternary `cond ? a : b` — track the pending `?` so a truncated true-branch
    // (cut before its `:` alternative) gets a synthetic `: null` instead of
    // leaving esbuild expecting a colon that never comes.
    if (c === '?' && text[i + 1] === '.') { i += 2; prevSig = 'op'; continue } // optional chaining
    if (c === '?' && text[i + 1] === '?') { i += 2; prevSig = 'op'; continue } // nullish coalescing
    if (c === '?') { stack.push({ t: 'ternary' }); i++; prevSig = 'op'; continue }
    if (c === ':' && top() && top().t === 'ternary') { stack.pop(); i++; prevSig = 'op'; continue }
    if (isIdentStart(c)) {
      const start = i
      while (i < n && /[A-Za-z0-9_$]/.test(text[i])) i++
      const word = text.slice(start, i)
      prevSig = OP_KEYWORDS.has(word) ? 'op' : 'val'
      continue
    }
    if (/[0-9]/.test(c)) {
      while (i < n && /[0-9.eExXa-fA-F_]/.test(text[i])) i++
      prevSig = 'val'; continue
    }
    i++; prevSig = 'op'
  }
  return stack
}

export function buildClosingTail(stack) {
  const out = []
  for (let k = stack.length - 1; k >= 0; k--) {
    const e = stack[k]
    if (e.t === 'paren') out.push(')')
    else if (e.t === 'brace') out.push('}')
    else if (e.t === 'bracket') out.push(']')
    else if (e.t === 'jsxopen') out.push(e.name ? `</${e.name}>` : '</>')
    else if (e.t === 'template') out.push('`')
    else if (e.t === 'ternary') out.push(': null')
    // jsxtag left open at a clean cut point would mean we cut mid-attributes — shouldn't happen
  }
  return out
}

// last-resort blind brute force (same philosophy as the earlier ecommerce fix scripts)
async function bruteForceFallback(prefix, otherFiles) {
  const TAIL_TEMPLATES = (closeDivs) => [
    [...closeDivs, '  );', '}', ''].join('\n'),
    [...closeDivs, '  )', '}', ''].join('\n'),
    [...closeDivs, '  ))', '}', '}', ''].join('\n'),
    [...closeDivs, '  ))}', '    </div>', '  );', '}', ''].join('\n'),
    [...closeDivs, '  ))', '}', ''].join('\n'),
  ]
  for (let n = 0; n <= 10; n++) {
    const closeDivs = Array.from({ length: n }, () => '    </div>')
    for (const tail of TAIL_TEMPLATES(closeDivs)) {
      const candidate = [...prefix, tail].join('\n')
      const testFiles = { ...otherFiles, 'src/App.tsx': candidate }
      if (await bundlesOk(testFiles)) return candidate
    }
  }
  return null
}

export async function repairRow(id) {
  const { data: row, error: fetchErr } = await admin.from('prebuilt_apps').select('name,files').eq('id', id).single()
  if (fetchErr) { console.log(`[SKIP] ${id}: ${fetchErr.message}`); return { id, ok: false } }

  const otherFiles = {}
  for (const [p, f] of Object.entries(row.files)) if (p !== 'src/App.tsx') otherFiles[p] = typeof f === 'string' ? f : f.content
  const content = row.files['src/App.tsx'].content
  const lines = content.split('\n')

  let cut = findInitialCut(lines)
  let prefix = trimDangling(lines.slice(0, cut))

  let fixed = null
  // try the computed cut, then a few extra backward trims if it doesn't verify
  for (let extraTrim = 0; extraTrim <= 6 && !fixed; extraTrim++) {
    if (extraTrim > 0) {
      prefix = trimDangling(prefix.slice(0, -1))
      if (!prefix.length) break
    }
    const stack = computeOpenStack(prefix.join('\n'))
    const tail = buildClosingTail(stack)
    if (!tail.length) continue // nothing open — suspicious, skip this trim level
    const candidate = [...prefix, ...tail, ''].join('\n')
    const testFiles = { ...otherFiles, 'src/App.tsx': candidate }
    if (await bundlesOk(testFiles)) {
      fixed = candidate
      console.log(`  [${row.name}] fixed via tag-stack scan (extraTrim=${extraTrim}, ${tail.length} closers)`)
    }
  }

  if (!fixed) {
    console.log(`  [${row.name}] tag-stack scan failed, trying blind brute force...`)
    fixed = await bruteForceFallback(prefix, otherFiles)
    if (fixed) console.log(`  [${row.name}] fixed via brute force fallback`)
  }

  if (!fixed) {
    console.log(`[FAIL] ${row.name} (${id}): could not auto-repair`)
    return { id, name: row.name, ok: false }
  }

  if (DRY_RUN) {
    console.log(`[DRY-OK] ${row.name} — would repair and save`)
    if (PRINT) console.log(fixed.split('\n').slice(-30).map((l, idx, arr) => `${fixed.split('\n').length - arr.length + idx + 1}: ${l}`).join('\n'))
    return { id, name: row.name, ok: true }
  }

  const filesForDb = { ...row.files, 'src/App.tsx': { path: 'src/App.tsx', content: fixed, language: 'typescript' } }
  const { error: updateErr } = await admin.from('prebuilt_apps').update({ files: filesForDb }).eq('id', id)
  if (updateErr) { console.log(`[DB ERROR] ${row.name}: ${updateErr.message}`); return { id, name: row.name, ok: false } }
  console.log(`[OK] ${row.name} — repaired and saved`)
  return { id, name: row.name, ok: true }
}

const DRY_RUN = process.argv.includes('--dry-run')
const PRINT = process.argv.includes('--print')

if (process.argv[1] && process.argv[1].endsWith('_fix-truncated-generic.mjs')) {
  const idsFile = process.argv[2]
  const ids = readFileSync(idsFile, 'utf8').trim().split('\n').map((s) => s.trim()).filter(Boolean)

  const results = []
  for (const id of ids) {
    results.push(await repairRow(id))
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} repaired.`)
  if (failed.length) {
    console.log('FAILED:')
    for (const f of failed) console.log(`  ${f.id} ${f.name || ''}`)
  }
}
