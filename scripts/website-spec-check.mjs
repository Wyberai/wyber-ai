// Runs the shipped checks over rendered demo sites: node scripts/website-spec-check.mjs <outRoot> <key> [<key>...]
import { build } from 'esbuild'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const [root, ...keys] = process.argv.slice(2)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wcheck-'))
const out = path.join(tmp, 'c.mjs')
await build({
  stdin: {
    contents: `export { checkWebsiteReady, websiteReadyIssues, kitImportCount } from './src/lib/website-ready'
export { scanSlopSource } from './src/lib/unslop'
export { analyzeHtml } from './src/lib/seo-audit'`,
    resolveDir: process.cwd(), sourcefile: 'c.ts', loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent', alias: { '@': path.join(process.cwd(), 'src') },
})
const m = await import(pathToFileURL(out).href)

const read = dir => {
  const files = {}
  const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/node_modules|dist/.test(e.name)) walk(p) } else if (/\.(tsx?|css|html|txt|xml|json)$/.test(e.name)) files[path.relative(dir, p).replace(/\\/g, '/')] = fs.readFileSync(p, 'utf8') } }
  walk(dir)
  return files
}

for (const key of keys) {
  const files = read(path.join(root, key))
  const ready = m.checkWebsiteReady(files)
  const failing = ready.items.filter(i => !i.ok).map(i => i.id)
  const code = Object.fromEntries(Object.entries(files).filter(([p]) => /src\/App\.tsx|index\.css/.test(p)))
  const slop = m.scanSlopSource(code)
  const seo = m.analyzeHtml('https://example.com/', files['index.html'], true, true)
  const seoBad = seo.checks.filter(c => c.severity !== 'good').map(c => `${c.id}:${c.severity}`)
  console.log(JSON.stringify({
    site: key,
    launchReady: `${ready.passed}/${ready.total}`, failing,
    kitImports: m.kitImportCount(files['src/App.tsx']),
    slop: slop.score, slopIssues: (slop.issues || []).map(i => i.id),
    seoScore: seo.score, seoNotGood: seoBad,
  }))
}
fs.rmSync(tmp, { recursive: true, force: true })
