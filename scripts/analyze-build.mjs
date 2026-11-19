// Measures one build's SOURCE against the quiet-craft design system. Input: a JSON file of { "<path>": "<content>" | { content } }
// (for example the files of a project read from the app). Prints one JSON object and a short table.
//
//   node scripts/analyze-build.mjs <files.json> [--label steel-shop]
//
// What it answers: does the build import the Wyber UI kit, which kit components, did it use any EFFECT component the quiet-craft rules
// keep off, how many hard-coded colours it wrote, and what the source slop scanner (unslop.ts) found. Graders are bundled on the fly with
// esbuild, so the numbers come from the same code the product ships.
import { build } from 'esbuild'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const [file, ...rest] = process.argv.slice(2)
if (!file) { console.error('usage: node scripts/analyze-build.mjs <files.json> [--label name]'); process.exit(1) }
const label = (() => { const i = rest.indexOf('--label'); return i >= 0 ? rest[i + 1] : path.basename(file, '.json') })()
const files = JSON.parse(fs.readFileSync(file, 'utf8'))

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'analyze-'))
const out = path.join(tmp, 'g.mjs')
await build({
  stdin: { contents: `export { KIT_EFFECT_COMPONENTS } from './src/lib/wyber-ui-kit'\nexport { scanSlopSource } from './src/lib/unslop'`, resolveDir: process.cwd(), sourcefile: 'e.ts', loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
})
const { KIT_EFFECT_COMPONENTS, scanSlopSource } = await import('file://' + out.replace(/\\/g, '/'))

const body = v => (typeof v === 'string' ? v : v && typeof v.content === 'string' ? v.content : '')
// Platform scaffold every export carries (connect modal, data table, connector store, owner details): not what the build wrote.
const SCAFFOLD = /(^|\/)(ConnectModal|ConnectorCard|DataTable|SourceBadge)\.tsx$|src\/lib\/|wyber-store|owner-details|src\/main\.tsx$/
const entries = Object.entries(files).filter(([p]) => /\.(tsx?|jsx?|css|html)$/.test(p) && !/wyber-ui|wyber-grow|node_modules/.test(p) && !SCAFFOLD.test(p))
const code = entries.map(([, v]) => body(v)).join('\n')

// kit imports: import { A, B as C } from './wyber-ui' or '../wyber-ui'
const kitNames = new Set()
for (const m of code.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"][./]*\/?wyber-ui['"]/g)) {
  for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/)[0].trim(); if (n) kitNames.add(n) }
}
const effects = [...kitNames].filter(n => KIT_EFFECT_COMPONENTS.includes(n))
const hex = (code.match(/#[0-9a-fA-F]{6}\b/g) || []).length
const tokens = /(bg-primary|text-foreground|border-border|bg-background|text-muted-foreground)/.test(code)
const slop = scanSlopSource(Object.fromEntries(entries))
const result = {
  label,
  files: entries.length,
  sourceKB: Math.round(code.length / 1024),
  importsKit: kitNames.size > 0,
  kitComponents: kitNames.size,
  kitNames: [...kitNames].sort(),
  effectComponentsUsed: effects,
  usesTokens: tokens,
  hardcodedHex: hex,
  slopScore: slop.score ?? null,
  slopIssues: (slop.issues || []).slice(0, 8).map(i => i.id || i.label || i.message || String(i)),
}
console.log(JSON.stringify(result, null, 1))
console.log(`\n${label}: kit ${result.importsKit ? 'YES (' + result.kitComponents + ' components)' : 'NO'}, effects used ${effects.length ? effects.join(', ') : 'none'}, tokens ${tokens ? 'yes' : 'NO'}, hard-coded hex ${hex}, slop ${result.slopScore}`)
fs.rmSync(tmp, { recursive: true, force: true })
