import { describe, it, expect } from 'vitest'
import { transform } from 'esbuild'
import { WYBER_SECTIONS_FILES, WYBER_SECTIONS_SOURCE, WYBER_SECTIONS_PATH, WYBER_SECTION_NAMES } from './wyber-sections'
import { WYBER_UI_KIT_SOURCE } from './wyber-ui-kit'
import { scanSlopSource } from './unslop'

// Like the UI kit, this file ships as a STRING into user builds: our own tsc never compiles it, so these tests are the only guard.

describe('wyber-sections — source validity', () => {
  it('parses as TSX', async () => {
    for (const [path, content] of Object.entries(WYBER_SECTIONS_FILES)) {
      await expect(transform(content, { loader: 'tsx', jsx: 'automatic' }), path).resolves.toBeTruthy()
    }
    expect(WYBER_SECTIONS_PATH).toBe('src/wyber-sections.tsx')
  })

  it('imports only the UI kit, react, framer-motion and lucide-react', () => {
    const ALLOWED = new Set(['react', 'framer-motion', 'lucide-react', './wyber-ui'])
    for (const m of WYBER_SECTIONS_SOURCE.matchAll(/import\s+[^'"]*?from\s*['"]([^'"]+)['"]/g)) expect(ALLOWED.has(m[1]), m[1]).toBe(true)
  })

  it('imports from the kit only names the kit exports', () => {
    const m = WYBER_SECTIONS_SOURCE.match(/import \{([^}]+)\} from '\.\/wyber-ui'/)!
    for (const n of m[1].split(',').map(x => x.trim())) expect(WYBER_UI_KIT_SOURCE, n).toMatch(new RegExp('export (?:function|const) ' + n + '\\b'))
  })

  it('exports every listed section and nothing the renderer cannot import', () => {
    for (const n of WYBER_SECTION_NAMES) expect(WYBER_SECTIONS_SOURCE, n).toMatch(new RegExp('export function ' + n + '\\b'))
    const exported = [...WYBER_SECTIONS_SOURCE.matchAll(/export function (\w+)/g)].map(m => m[1])
    expect(exported.sort()).toEqual([...WYBER_SECTION_NAMES].sort())
  })

  it('uses tokens only: no palette classes, hex or rgb; white and black appear only as photo text and scrims', () => {
    expect(WYBER_SECTIONS_SOURCE).not.toMatch(/\b(?:bg|text|border|ring|from|to|via)-(?:zinc|slate|gray|neutral|stone|indigo|blue|red|green|amber|violet|purple|pink|rose|emerald|teal|cyan|sky|orange|lime|yellow|fuchsia)-\d/)
    expect(WYBER_SECTIONS_SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(WYBER_SECTIONS_SOURCE).not.toMatch(/\brgb\(/)
    const lines = WYBER_SECTIONS_SOURCE.split('\n').filter(l => /\b(?:bg|text|border|from|via|to)-(?:white|black)\b/.test(l))
    for (const l of lines) expect(l, l).toMatch(/Cta\(|mode ===|HeroFullBleed|photo|dark|bg-gradient-to-t|bg-black|className=\{cn\('relative flex min-h/)
  })

  it('passes the anti-slop scanner with no exemption (the file is scanned like any generated source)', () => {
    const r = scanSlopSource({ 'src/wyber-sections.tsx': WYBER_SECTIONS_SOURCE })
    expect(r.issues.map(i => i.id + ': ' + i.sample)).toEqual([])
  })
})
