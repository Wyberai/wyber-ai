// Renders the demo web apps from the app spec and overlays them on a base Vite project (a real WyberAi export).
//   node scripts/app-spec-demo.mjs <baseDir> <outRoot>
// The domain model is the authored demo model (the model's step is not called).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'

const [base, outRoot] = process.argv.slice(2)
if (!base || !outRoot) { console.error('usage: node scripts/app-spec-demo.mjs <baseDir> <outRoot>'); process.exit(1) }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'appdemo-'))
async function load(contents, name) {
  const out = path.join(tmp, name + '.mjs')
  await build({ stdin: { contents, resolveDir: process.cwd(), sourcefile: name + '.ts', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent', alias: { '@': path.join(process.cwd(), 'src') } })
  return import(pathToFileURL(out).href)
}
const m = await load("export * from './src/lib/app-spec'", 'm')
const { DEMO_APPS } = await load("export { DEMO_APPS } from './src/lib/app-spec/demo-models'", 'd')
const { WYBER_UI_KIT_SOURCE } = await load("export { WYBER_UI_KIT_SOURCE } from './src/lib/wyber-ui-kit'", 'k')

const summary = []
for (const d of DEMO_APPS) {
  const spec = m.planApp(d.prompt, { seed: process.env.SEED || d.seed })
  const problems = m.validateModel(m.normalizeModel(d.model))
  if (problems.length) { console.error(d.key, problems); process.exitCode = 2; continue }
  const site = m.renderApp(spec, d.model, '₹')
  const dir = path.join(outRoot, 'app-' + d.key)
  fs.mkdirSync(dir, { recursive: true })
  fs.cpSync(base, dir, { recursive: true, filter: s => !/node_modules|[\\/]dist$/.test(s) })
  for (const rm of ['src/App.tsx', 'src/components/AskUs.tsx']) fs.rmSync(path.join(dir, rm), { force: true })
  fs.writeFileSync(path.join(dir, 'src/wyber-ui.tsx'), WYBER_UI_KIT_SOURCE)
  for (const [p, content] of Object.entries(site.files)) {
    const target = path.join(dir, p)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
  summary.push({ key: d.key, direction: spec.direction.name, mode: spec.direction.mode, layout: spec.layout })
}
console.log(JSON.stringify(summary))
fs.rmSync(tmp, { recursive: true, force: true })
