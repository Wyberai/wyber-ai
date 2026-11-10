// Repairs wrong relative import paths in generated apps. A real mobile build (tide forecast, 10 Nov 2026) put
// components.tsx at the project root yet imported '../theme', so the preview bundler saw a bare "theme" module and
// the whole app showed "Preview unavailable". When a relative import resolves to no file but exactly ONE file in the
// project has the same basename, the specifier is rewritten to point at it. Anything ambiguous or without a match is
// left alone. Pure: file map in, file map out.

type FileVal = { content?: string } | string
const CODE_EXTS = ['.tsx', '.ts', '.jsx', '.js', '.json']
const SPEC_RE = /(\bfrom\s*|\bimport\s*|\brequire\(\s*)(['"])(\.{1,2}\/[^'"]*|\.\.)\2/g

const contentOf = (v: FileVal): string => (typeof v === 'string' ? v : v?.content ?? '')
const withContent = (v: FileVal, c: string): FileVal => (typeof v === 'string' ? c : { ...v, content: c })

function normalize(parts: string[]): string[] {
  const out: string[] = []
  for (const p of parts) {
    if (!p || p === '.') continue
    if (p === '..') { if (!out.length) return ['\0']; out.pop() } else out.push(p)
  }
  return out
}

export function fixRelativeImports<T extends Record<string, FileVal>>(files: T): T {
  const paths = Object.keys(files)
  const set = new Set(paths)
  const exists = (base: string) => set.has(base) || CODE_EXTS.some(e => set.has(base + e)) || CODE_EXTS.some(e => set.has(base + '/index' + e))
  const byBase = new Map<string, string[]>()
  for (const p of paths) {
    const name = p.split('/').pop()!.replace(/\.(tsx|ts|jsx|js|json)$/, '')
    byBase.set(name, [...(byBase.get(name) ?? []), p])
  }

  let changed = false
  const out: Record<string, FileVal> = {}
  for (const [path, val] of Object.entries(files)) {
    if (!/\.(tsx|ts|jsx|js)$/.test(path)) { out[path] = val; continue }
    const dirParts = path.split('/').slice(0, -1)
    const src = contentOf(val)
    const next = src.replace(SPEC_RE, (whole, pre: string, q: string, spec: string) => {
      if (/\.(css|png|jpe?g|svg|gif|webp|ttf|otf|mp3|mp4)$/i.test(spec)) return whole
      const resolved = normalize([...dirParts, ...spec.split('/')])
      if (resolved[0] === '\0' || exists(resolved.join('/'))) {
        if (resolved[0] !== '\0') return whole
      }
      const name = spec.split('/').pop()!.replace(/\.(tsx|ts|jsx|js|json)$/, '')
      const candidates = (byBase.get(name) ?? []).filter(c => c !== path)
      if (candidates.length !== 1) return whole
      const target = candidates[0].replace(/\.(tsx|ts|jsx|js)$/, '').replace(/\/index$/, '')
      // relative path from this file's directory to the target
      const from = dirParts
      const to = target.split('/')
      let i = 0
      while (i < from.length && i < to.length - 1 && from[i] === to[i]) i++
      const rel = [...Array(from.length - i).fill('..'), ...to.slice(i)].join('/')
      changed = true
      return `${pre}${q}${rel.startsWith('.') ? rel : './' + rel}${q}`
    })
    out[path] = next === src ? val : withContent(val, next)
  }
  return (changed ? out : files) as T
}
