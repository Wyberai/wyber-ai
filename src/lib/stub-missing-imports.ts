// Deterministic completeness pass for generated apps.
//
// Big-app generations that run long get truncated: the parser only keeps fully
// closed <file>…</file> blocks (see file-parser.ts), so a truncated trailing
// file is dropped — and a planned-but-never-emitted component never arrives at
// all. Either way App.tsx still imports it, the remote build fails with
// "File not found: …", and that error is what triggers the self-heal loop —
// the exact "app breaks then self-heals" UX we want to avoid.
//
// This scans every imported LOCAL module and, for any that doesn't resolve to a
// file in the map, produces a minimal valid stub. The build then always compiles
// and renders a clear "coming soon" placeholder instead of erroring. No LLM, no
// credits, instant. Runs in sanitizeFiles, so it protects every preview build
// and publish — and never persists to the saved project.

type FileVal = { content?: string; language?: string } | string

const CODE_EXTS = ['.tsx', '.ts', '.jsx', '.js']
const contentOf = (v: FileVal | undefined): string =>
  v == null ? '' : typeof v === 'string' ? v : (v.content ?? '')

// `import Foo, { Bar } from './x'` → clause + specifier
const IMPORT_FROM_RE = /import\s+([^'";]+?)\s+from\s*['"]([^'"]+)['"]/g
// `import './x.css'` (side-effect only — no `from`)
const SIDE_EFFECT_RE = /import\s*['"]([^'"]+)['"]/g
// `export { x } from './x'` / `export * from './x'`
const EXPORT_FROM_RE = /export\s+(?:\*|\{[^}]*\})\s+from\s*['"]([^'"]+)['"]/g

const hasExt = (p: string) => /\.[a-z0-9]+$/i.test(p)
const isCss = (p: string) => /\.(css|scss|sass|less)$/i.test(p)
const isJson = (p: string) => /\.json$/i.test(p)
const isCode = (p: string) => /\.(t|j)sx?$/i.test(p)

// Resolve an import specifier to a normalized project path base (no extension),
// or null for a bare/external package specifier.
function resolveBase(fromPath: string, spec: string): string | null {
  if (spec.startsWith('@/')) return 'src/' + spec.slice(2)
  if (spec.startsWith('/')) return spec.replace(/^\/+/, '')
  if (spec.startsWith('.')) {
    const dir = fromPath.includes('/') ? fromPath.slice(0, fromPath.lastIndexOf('/')) : ''
    const stack: string[] = []
    for (const part of (dir + '/' + spec).split('/')) {
      if (part === '' || part === '.') continue
      if (part === '..') stack.pop()
      else stack.push(part)
    }
    return stack.join('/')
  }
  return null // bare module specifier → external package, never stub
}

function resolvesInMap(base: string, keys: Set<string>): boolean {
  if (keys.has(base)) return true
  if (hasExt(base)) return false // explicit extension and not found
  for (const e of CODE_EXTS) if (keys.has(base + e)) return true
  for (const e of CODE_EXTS) if (keys.has(base + '/index' + e)) return true
  return false
}

function parseNamed(clause: string): string[] {
  const m = clause.match(/\{([^}]*)\}/)
  if (!m) return []
  return m[1]
    .split(',')
    .map(p => p.trim().split(/\s+as\s+/).pop()?.trim() || '')
    .filter(n => /^[A-Za-z_$][\w$]*$/.test(n))
}

function componentLabel(base: string): string {
  const last = (base.split('/').pop() || 'Section').replace(/\.[a-z0-9]+$/i, '')
  const cleaned = last.replace(/[^A-Za-z0-9]/g, '')
  const name = /^[A-Za-z]/.test(cleaned) ? cleaned[0].toUpperCase() + cleaned.slice(1) : 'Section'
  return name || 'Section'
}

interface StubInfo { named: Set<string>; css: boolean; json: boolean }

/**
 * Returns a map of stub files to add for every unresolved local import.
 * Pure — does not mutate the input.
 */
export function collectMissingStubs(files: Record<string, FileVal>): Record<string, { content: string; language: string }> {
  const keys = new Set(Object.keys(files))
  const missing = new Map<string, StubInfo>()

  const note = (fromPath: string, spec: string, clause?: string) => {
    const base = resolveBase(fromPath, spec)
    if (base == null) return
    if (resolvesInMap(base, keys)) return

    const css = isCss(spec)
    const json = isJson(spec)
    // Skip non-code assets we can't meaningfully stub (images, fonts, etc.)
    if (hasExt(base) && !css && !json && !isCode(base)) return

    const path = hasExt(base) ? base : base + '.tsx'
    if (keys.has(path)) return

    let info = missing.get(path)
    if (!info) { info = { named: new Set(), css, json }; missing.set(path, info) }
    if (clause) for (const n of parseNamed(clause)) info.named.add(n)
  }

  for (const [path, val] of Object.entries(files)) {
    if (!isCode(path)) continue
    const code = contentOf(val)
    if (!code) continue
    let m: RegExpExecArray | null
    IMPORT_FROM_RE.lastIndex = 0
    while ((m = IMPORT_FROM_RE.exec(code)) !== null) note(path, m[2], m[1])
    SIDE_EFFECT_RE.lastIndex = 0
    while ((m = SIDE_EFFECT_RE.exec(code)) !== null) note(path, m[1]) // `import X from …` won't match (X before quote)
    EXPORT_FROM_RE.lastIndex = 0
    while ((m = EXPORT_FROM_RE.exec(code)) !== null) note(path, m[1])
  }

  const stubs: Record<string, { content: string; language: string }> = {}
  for (const [path, info] of missing) {
    if (info.css) { stubs[path] = { content: '/* auto-stub: imported but not generated */\n', language: 'css' }; continue }
    if (info.json) { stubs[path] = { content: '{}\n', language: 'json' }; continue }

    const label = componentLabel(path)
    const lines = [
      '// Auto-stub: this file was imported but never generated (a long build that ran',
      '// out of room). It renders a placeholder so the app still builds — ask the AI to',
      '// fill it in, or rebuild this section.',
      `export default function ${label}Stub() {`,
      `  return <div style={{ padding: 24, color: '#a1a1aa', fontSize: 14 }}>${label} — coming soon</div>;`,
      '}',
    ]
    for (const n of info.named) {
      // Named exports are usually components; render nothing rather than crash the build.
      lines.push(`export const ${n} = () => null;`)
    }
    stubs[path] = { content: lines.join('\n') + '\n', language: 'typescript' }
  }
  return stubs
}
