// Renders the demo sites from the website spec and overlays them on a base Vite project (a real WyberAi export).
//   node scripts/website-spec-demo.mjs <baseDir> <outRoot>
// Copy is the authored demo copy (the model's step is not called). Image directives become flat labelled placeholders.
import fs from 'node:fs'
import path from 'node:path'
import { loadSpecModule } from './website-spec-plan.mjs'
import { build } from 'esbuild'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

const [base, outRoot] = process.argv.slice(2)
if (!base || !outRoot) { console.error('usage: node scripts/website-spec-demo.mjs <baseDir> <outRoot>'); process.exit(1) }

const { m, cleanup } = await loadSpecModule()
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wdemo-'))
const demoOut = path.join(tmp, 'd.mjs')
await build({ stdin: { contents: "export { DEMOS } from './src/lib/website-spec/demo-copy'", resolveDir: process.cwd(), sourcefile: 'e.ts', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: demoOut, logLevel: 'silent' })
const { DEMOS } = await import(pathToFileURL(demoOut).href)
const trOut = path.join(tmp, 't.mjs')
await build({ stdin: { contents: "export { DEMO_HI_RICE } from './src/lib/website-spec/demo-translations'", resolveDir: process.cwd(), sourcefile: 't.ts', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: trOut, logLevel: 'silent' })
const { DEMO_HI_RICE } = await import(pathToFileURL(trOut).href)
const kitOut = path.join(tmp, 'k.mjs')
await build({ stdin: { contents: "export { WYBER_UI_KIT_SOURCE } from './src/lib/wyber-ui-kit'", resolveDir: process.cwd(), sourcefile: 'k.ts', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: kitOut, logLevel: 'silent' })
const KIT = (await import(pathToFileURL(kitOut).href)).WYBER_UI_KIT_SOURCE

const colour = hsl => `hsl(${hsl})`
function placeholder(spec, brief, ratio) {
  const [w, h] = ratio.split('/').map(Number)
  const W = 1200, H = Math.round(1200 * h / w)
  const d = spec._tokens
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${colour(d.muted)}"/><rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${colour(d.border)}" stroke-width="2" stroke-dasharray="10 10"/><text x="70" y="96" font-family="monospace" font-size="26" fill="${colour(d['muted-foreground'])}">IMAGE SLOT ${ratio}</text><foreignObject x="70" y="120" width="${W - 140}" height="${H - 160}"><div xmlns="http://www.w3.org/1999/xhtml" style="font:24px sans-serif;color:${colour(d['muted-foreground'])};line-height:1.4">${brief.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div></foreignObject></svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

const summary = []
for (const demo of DEMOS) {
  const spec = m.planWebsite(demo.prompt, { seed: demo.seed + (process.env.SEED_SUFFIX || ''), facts: demo.facts, directionId: process.env.DIRECTION || undefined })
  if (process.env.DEMO_MOTION) spec.motion = { ...spec.motion, ...JSON.parse(process.env.DEMO_MOTION) }
  if (process.env.DEMO_LAYOUT) spec.layout = { ...spec.layout, ...JSON.parse(process.env.DEMO_LAYOUT) }
  const issues = m.validateCopy(spec, demo.copy)
  if (issues.length) { console.error(demo.key, 'COPY ISSUES', issues); process.exitCode = 2; continue }
  const translations = demo.key === 'rice' ? { hi: m.completeTranslation(spec, demo.copy, DEMO_HI_RICE) } : {}
  const site = m.renderWebsite(spec, demo.copy, translations)
  const dir = path.join(outRoot, demo.key)
  fs.cpSync(base, dir, { recursive: true, filter: s => !/node_modules|[\\/]dist$/.test(s) })
  for (const rm of ['src/App.tsx', 'src/components/AskUs.tsx']) fs.rmSync(path.join(dir, rm), { force: true })
  fs.writeFileSync(path.join(dir, 'src/wyber-ui.tsx'), KIT)
  // tokens for the placeholder colours
  const tokens = {}
  const css = site.files['src/index.css']
  for (const mm of css.matchAll(/--([a-z-]+): ([0-9. ]+%?[0-9. ]*%?);/g)) tokens[mm[1]] = mm[2]
  spec._tokens = tokens
  for (const [p, content] of Object.entries(site.files)) {
    let body = content
    if (p === 'index.html') {
      // the platform injects the direction fonts at build time; the demo does the same so the page shows the real type
      const FS = { Erode: 'erode@400,500,600', Gambetta: 'gambetta@500,600', Boska: 'boska@400', 'Clash Display': 'clash-display@400,500,600,700', 'Clash Grotesk': 'clash-grotesk@400,500,600', Satoshi: 'satoshi@400,500,700', Supreme: 'supreme@400,500,700' }
      const links = Object.entries(FS).filter(([n]) => css.includes("'" + n + "'")).map(([, v]) => '<link href="https://api.fontshare.com/v2/css?f[]=' + v + '&display=swap" rel="stylesheet">').join('\n')
      body = body.replace('</head>', links + '\n</head>')
    }
    if (p === 'src/App.tsx') body = body.replace(/\{\{wyber-image: ([^|}]+)\| ([0-9:]+)\}\}/g, (_, brief, ratio) => placeholder(spec, brief.trim(), ratio.replace(':', '/')))
    const target = path.join(dir, p)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, body)
  }
  // keep the kit current: the export base may predate local kit edits
  summary.push({ key: demo.key, intent: spec.brief.intent, direction: spec.direction.name, hero: spec.hero, header: spec.header, sections: spec.sections.map(s => s.id + (s.variant ? '/' + s.variant : '')).join(' ') })
}
console.log(JSON.stringify(summary, null, 1))
cleanup(); fs.rmSync(tmp, { recursive: true, force: true })
