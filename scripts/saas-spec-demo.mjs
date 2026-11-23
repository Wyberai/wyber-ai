// Renders the demo SaaS products (and one Replace-your-SaaS tool) from the saas spec and overlays them on a base Vite project (a real WyberAi export).
//   node scripts/saas-spec-demo.mjs <baseDir> <outRoot>
// The models and copy are the authored demo ones (the model steps are not called). Set SEED to see another layout.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'

const [base, outRoot] = process.argv.slice(2)
if (!base || !outRoot) { console.error('usage: node scripts/saas-spec-demo.mjs <baseDir> <outRoot>'); process.exit(1) }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'saasdemo-'))
async function load(contents, name) {
  const out = path.join(tmp, name + '.mjs')
  await build({ stdin: { contents, resolveDir: process.cwd(), sourcefile: name + '.ts', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent', alias: { '@': path.join(process.cwd(), 'src') } })
  return import(pathToFileURL(out).href)
}
const m = await load("export * from './src/lib/saas-spec'", 'm')
const { DEMO_SAAS, DEMO_REPLACE, demoSiteCopy } = await load("export { DEMO_SAAS, demoSiteCopy } from './src/lib/saas-spec/demo-models'\nexport { DEMO_REPLACE } from './src/lib/saas-spec/demo-replace'", 'd')
const { WYBER_UI_KIT_SOURCE } = await load("export { WYBER_UI_KIT_SOURCE } from './src/lib/wyber-ui-kit'", 'k')
const { WYBER_SECTIONS_SOURCE } = await load("export { WYBER_SECTIONS_SOURCE } from './src/lib/wyber-sections'", 's')
const { checkSaasReady } = await load("export { checkSaasReady } from './src/lib/saas-ready'", 'r')
const { composeBuildPrompt } = await load("export { composeBuildPrompt } from './src/lib/byos/quote'", 'q')

function overlay(dir, files) {
  fs.mkdirSync(dir, { recursive: true })
  fs.cpSync(base, dir, { recursive: true, filter: s => !/node_modules|[\\/]dist$/.test(s) })
  for (const rm of ['src/App.tsx', 'src/components/AskUs.tsx']) fs.rmSync(path.join(dir, rm), { force: true })
  fs.writeFileSync(path.join(dir, 'src/wyber-ui.tsx'), WYBER_UI_KIT_SOURCE)
  fs.writeFileSync(path.join(dir, 'src/wyber-sections.tsx'), WYBER_SECTIONS_SOURCE)
  for (const [p, content] of Object.entries(files)) {
    const target = path.join(dir, p)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
}

const summary = []
for (const d of DEMO_SAAS) {
  const spec = m.planSaas(d.prompt, { seed: process.env.SEED || d.seed, currency: d.currency, directionId: process.env.DIRECTION || null })
  const copy = demoSiteCopy(spec.site, d.copy)
  const problems = m.validateSaasModel(m.normalizeSaasModel({ ...d.model.app, plans: d.model.plans }), d.prompt)
  if (problems.length) { console.error(d.key, problems); process.exitCode = 2; continue }
  const { files } = m.renderSaas(spec, d.model, copy)
  const failed = checkSaasReady(files).items.filter(i => !i.ok).map(i => i.id)
  if (failed.length) { console.error(d.key, 'saas-ready:', failed); process.exitCode = 3 }
  overlay(path.join(outRoot, 'saas-' + d.key), files)
  summary.push({ key: d.key, direction: spec.direction.name, mode: spec.direction.mode, layout: spec.layout, features: spec.site.sections[0].variant, hero: spec.site.hero })
}

process.env.NEXT_PUBLIC_REPLACE_READY = 'true'
const brief = composeBuildPrompt({ product: DEMO_REPLACE.product, category: DEMO_REPLACE.category, features: DEMO_REPLACE.features, connectLive: [], connectPlaceholder: [], importCsv: true })
const r = await m.generateReplacement({ prompt: brief, seed: process.env.SEED || 'replace-1' }, { write: async () => ({ text: JSON.stringify(DEMO_REPLACE.model), inputTokens: 0, outputTokens: 0 }) })
if (!r.ok) { console.error('replace', r.reason); process.exitCode = 4 } else {
  const files = Object.fromEntries([...r.text.matchAll(/<file path="([^"]+)">\n([\s\S]*?)\n<\/file>/g)].map(x => [x[1], x[2]]))
  overlay(path.join(outRoot, 'replace-board'), files)
  summary.push({ key: 'replace-board', direction: r.spec.direction.name, mode: r.spec.direction.mode })
}
console.log(JSON.stringify(summary))
fs.rmSync(tmp, { recursive: true, force: true })
