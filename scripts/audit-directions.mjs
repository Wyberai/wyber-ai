// Lists, for every design direction, which facts its own text assumes (a business name, portraits, figures, testimonials, real
// photography). A one-line brief supplies none of these, so each hit is a place a direction can go wrong the way
// "Giant wordmark" did on 18 Nov 2026 (it enlarged the category word LEGAL because it had no firm name to enlarge).
// Run: node scripts/audit-directions.mjs
import { build } from 'esbuild'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dirs-'))
const out = path.join(tmp, 'd.mjs')
await build({
  stdin: { contents: `export { DIRECTIONS } from './src/lib/design-directions'`, resolveDir: process.cwd(), sourcefile: 'e.ts', loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
})
const mod = await import('file://' + out.replace(/\\/g, '/'))
const list = mod.DIRECTIONS ?? Object.values(mod)[0]

const NEEDS = [
  ['business name', /wordmark|firm'?s name|brand name|the name\b|logotype|monogram/i],
  ['portraits / people', /portrait|headshot|founder|partner|team photo|faces?\b|human photograph|doctor|practitioner|chef portrait/i],
  ['figures / data', /counter|statistic|stat\b|numbers?\b|metric|price list|rating|years|case result|before.?after/i],
  ['testimonials', /testimonial|review|quote wall|press/i],
  ['real photography', /full-bleed (photo|video)|video hero|photograph(y|s)\b|cut-outs?|lookbook/i],
]
const rows = []
for (const d of list) {
  const text = [d.composition, ...(d.moves || []), d.imageBrief, d.vibe].join(' ')
  const hits = NEEDS.filter(([, re]) => re.test(text)).map(([n]) => n)
  rows.push({ id: d.id, name: d.name, hero: d.rules?.heroMedia, hits })
}
console.log(`${rows.length} directions\n`)
for (const r of rows.filter(r => r.hits.length)) console.log(`${r.id.padEnd(20)} hero=${String(r.hero).padEnd(8)} assumes: ${r.hits.join(', ')}`)
console.log('\nno assumptions found:', rows.filter(r => !r.hits.length).map(r => r.id).join(', ') || '(none)')
fs.rmSync(tmp, { recursive: true, force: true })
