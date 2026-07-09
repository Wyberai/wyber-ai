import { describe, it, expect } from 'vitest'
import { transform } from 'esbuild'
import { WYBER_UI_KIT_FILES, WYBER_UI_KIT_SOURCE, WYBER_UI_KIT_PROMPT, WYBER_UI_KIT_PATH } from './wyber-ui-kit'
import { sanitizeFiles } from './sanitize-files'

// The kit ships as a STRING into user builds — our own tsc/next build never
// compiles it, so a syntax error here breaks EVERY user build while our CI
// stays green. These tests are the only guard. Keep them strict.

describe('wyber-ui-kit — source validity', () => {
  it('every kit file parses as TSX (esbuild, same loader family as both pipelines)', async () => {
    for (const [path, content] of Object.entries(WYBER_UI_KIT_FILES)) {
      // Throws on any syntax error, with file context in the failure.
      await expect(transform(content, { loader: 'tsx', jsx: 'automatic' }), path).resolves.toBeTruthy()
    }
  })

  it('imports ONLY deps guaranteed by both pipelines', () => {
    const ALLOWED = new Set(['react', 'framer-motion', 'clsx', 'lucide-react'])
    const importRe = /import\s+[^'"]*?from\s*['"]([^'"]+)['"]/g
    for (const m of WYBER_UI_KIT_SOURCE.matchAll(importRe)) {
      const spec = m[1]
      if (spec.startsWith('.') || spec.startsWith('/')) continue
      expect(ALLOWED.has(spec), `disallowed dependency: ${spec}`).toBe(true)
    }
  })

  it('never hardcodes literal colors — tokens only (the per-app palette contract)', () => {
    // Palette classes (zinc/slate/gray/indigo/…), hex colors, and rgb() in the
    // kit would break the "every app bespoke" guarantee.
    const banned = [
      /\b(?:bg|text|border|ring|from|to|via)-(?:zinc|slate|gray|neutral|stone|indigo|blue|red|green|amber|violet|purple|pink|rose|emerald|teal|cyan|sky|orange|lime|yellow|fuchsia)-\d/,
      /#[0-9a-fA-F]{3,8}\b/,
      /\brgb\(/,
      /\b(?:bg|text)-(?:white|black)\b/,
    ]
    for (const re of banned) {
      expect(WYBER_UI_KIT_SOURCE.match(re), `banned color pattern ${re} found: ${WYBER_UI_KIT_SOURCE.match(re)?.[0]}`).toBeNull()
    }
  })

  it('prompt reference and source exports stay in sync', () => {
    const sourceExports = new Set(
      [...WYBER_UI_KIT_SOURCE.matchAll(/export function (\w+)/g)].map(m => m[1]),
    )
    // Every component named in the prompt's import line must exist in the source.
    const importLine = WYBER_UI_KIT_PROMPT.match(/import \{ ([^}]+) \} from '\.\/wyber-ui'/)
    expect(importLine).toBeTruthy()
    for (const name of importLine![1].split(',').map(s => s.trim())) {
      expect(sourceExports.has(name), `prompt references missing export: ${name}`).toBe(true)
    }
  })

  it('kit animations exist in the shared tailwind theme', async () => {
    const { TAILWIND_CONFIG_FILE, PREVIEW_TAILWIND_CONFIG } = await import('./design-system')
    for (const anim of ['marquee', 'aurora', 'gradient-spin']) {
      expect(TAILWIND_CONFIG_FILE).toContain(`'${anim}':`)
      expect(PREVIEW_TAILWIND_CONFIG).toContain(`'${anim}':`)
    }
  })
})

describe('wyber-ui-kit — pipeline injection', () => {
  const APP = `import { Button } from './wyber-ui'
export default function App() { return <Button>hi</Button> }`

  it('sanitizeFiles injects the kit for app builds and does not stub its import', () => {
    const out = sanitizeFiles({ 'src/App.tsx': { content: APP } })
    const kit = out[WYBER_UI_KIT_PATH] as { content?: string } | undefined
    expect(kit?.content).toContain('export function Button')
    // The stub pass must never have replaced it with a placeholder.
    expect(kit?.content).not.toContain('Auto-stub')
  })

  it('user-authored wyber-ui.tsx wins over the injected kit', () => {
    const out = sanitizeFiles({
      'src/App.tsx': { content: APP },
      [WYBER_UI_KIT_PATH]: { content: 'export const Button = () => null' },
    })
    expect((out[WYBER_UI_KIT_PATH] as { content?: string }).content).toBe('export const Button = () => null')
  })

  it('does not inject the kit for non-app file maps', () => {
    const out = sanitizeFiles({ 'README.md': { content: 'hi' } })
    expect(WYBER_UI_KIT_PATH in out).toBe(false)
  })
})
