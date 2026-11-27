// Turns a spec renderer's file map into ONE self-contained HTML page, the same way the platform assembles a generated project:
// sanitizeFiles (kit, sections, Tailwind config, entry, fonts) -> bundle -> Tailwind v3 (what generated projects ship).
// The only differences from a published build: React comes from this repo's node_modules, and pictures are flat placeholders.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import postcss from 'postcss'
import { sanitizeFiles } from '../sanitize-files'
import { WYBER_UI_KIT_FILES } from '../wyber-ui-kit'
import { WYBER_SECTIONS_PATH, WYBER_SECTIONS_SOURCE } from '../wyber-sections'

const REPO = process.cwd()
const req = createRequire(path.join(REPO, 'package.json'))

/** A flat labelled picture with the requested shape, so layout is measured with real image boxes and no network. */
export function placeholder(ratio: string): string {
  const [w, h] = ratio.split(/[:/]/).map(Number)
  const W = 1200, H = Math.round((1200 * (h || 3)) / (w || 4))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#8a8f98"/><path d="M0 ${H} L${W * 0.35} ${H * 0.45} L${W * 0.6} ${H * 0.75} L${W * 0.8} ${H * 0.55} L${W} ${H * 0.8} V${H} Z" fill="#6b7078"/></svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

export type FileMap = Record<string, string>

const loaderFor = (p: string) => (p.endsWith('.tsx') ? 'tsx' : p.endsWith('.ts') ? 'ts' : p.endsWith('.jsx') ? 'jsx' : p.endsWith('.json') ? 'json' : 'js') as 'tsx' | 'ts' | 'jsx' | 'json' | 'js'

/** The finished project, exactly as it would be sent to the builder. `overrides` replaces platform files (used to re-create a known bug). */
export function assembleProject(files: FileMap, overrides: FileMap = {}): FileMap {
  const input: Record<string, { content: string; language: string }> = {}
  for (const [p, content] of Object.entries(files)) {
    input[p] = { content: content.replace(/\{\{wyber-image: [^|}]+\| ([0-9]+:[0-9]+)\}\}/g, (_, r: string) => placeholder(r)), language: 'typescript' }
  }
  // the platform's own files, as the preview injects them
  for (const [p, content] of Object.entries(WYBER_UI_KIT_FILES)) if (!input[p]) input[p] = { content: content as string, language: 'typescript' }
  input[WYBER_SECTIONS_PATH] = { content: WYBER_SECTIONS_SOURCE, language: 'typescript' }
  for (const [p, content] of Object.entries(overrides)) input[p] = { content, language: 'typescript' }
  const out = sanitizeFiles(input) as Record<string, { content?: string } | string>
  return Object.fromEntries(Object.entries(out).map(([p, v]) => [p, typeof v === 'string' ? v : v.content ?? '']))
}

async function bundle(project: FileMap): Promise<string> {
  const entry = ['src/main.tsx', 'src/main.jsx'].find(p => project[p] !== undefined)
  if (!entry) throw new Error('no entry file in project')
  const find = (base: string) => [base, base + '.tsx', base + '.ts', base + '.jsx', base + '.js', base + '/index.tsx', base + '/index.ts'].find(p => project[p] !== undefined)
  const result = await build({
    entryPoints: [entry],
    bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic', logLevel: 'silent', minify: false,
    define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
    plugins: [{
      name: 'project',
      setup(b) {
        b.onResolve({ filter: /.*/ }, args => {
          if (args.namespace !== 'project' && args.kind !== 'entry-point') return undefined
          if (args.kind === 'entry-point') return { path: args.path, namespace: 'project' }
          if (args.path.startsWith('.') || args.path.startsWith('@/')) {
            const base = args.path.startsWith('@/') ? 'src/' + args.path.slice(2) : path.posix.join(path.posix.dirname(args.importer), args.path)
            const hit = find(base)
            if (!hit) return { errors: [{ text: `missing local import ${args.path} from ${args.importer}` }] }
            return { path: hit, namespace: 'project' }
          }
          return { path: req.resolve(args.path) }
        })
        b.onLoad({ filter: /.*/, namespace: 'project' }, args => (args.path.endsWith('.css') ? { contents: '', loader: 'js' } : { contents: project[args.path], loader: loaderFor(args.path), resolveDir: REPO }))
      },
    }],
  })
  return result.outputFiles[0].text
}

let configCounter = 0

async function tailwindCss(project: FileMap): Promise<string> {
  const tailwind = req('tailwindcss-v3')
  // the project's own config file, evaluated: one source of truth for the theme
  const source = project['tailwind.config.js']
  if (!source) throw new Error('project has no tailwind.config.js')
  const config = new Function('return (' + source.replace(/^[\s\S]*?export default /, '').trim().replace(/;$/, '') + ')')()
  const content = Object.entries(project).filter(([p]) => /\.(tsx?|jsx?|html)$/.test(p) && !p.startsWith('api/')).map(([p, raw]) => ({ raw, extension: p.split('.').pop()! }))
  configCounter++
  const out = await postcss([tailwind({ ...config, content })]).process(project['src/index.css'] ?? '@tailwind base;\n@tailwind components;\n@tailwind utilities;', { from: path.join(os.tmpdir(), `wqa-${configCounter}.css`) })
  return out.css
}

export async function filesToHtml(files: FileMap, overrides: FileMap = {}): Promise<string> {
  const project = assembleProject(files, overrides)
  const [js, css] = await Promise.all([bundle(project), tailwindCss(project)])
  const index = project['index.html'] ?? ''
  const head = (index.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '').replace(/<script[\s\S]*?<\/script>/gi, '')
  // function replacers: bundled code is full of dollar signs
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${head}\n<style>\n${css}\n</style>\n</head>\n<body>\n<div id="root"></div>\n<script>\n${js.replace(/<\/script/gi, () => '<\\/script')}\n</script>\n</body>\n</html>\n`
}

export const fileExists = (p: string) => fs.existsSync(p)
