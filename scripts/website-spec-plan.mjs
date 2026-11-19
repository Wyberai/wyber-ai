// Prints the plan (no model, no network) for a prompt: node scripts/website-spec-plan.mjs "<prompt>" [seed] [city]
import { build } from 'esbuild'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export async function loadSpecModule() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wspec-'))
  const out = path.join(tmp, 'p.mjs')
  await build({
    stdin: { contents: "export * from './src/lib/website-spec'", resolveDir: process.cwd(), sourcefile: 'e.ts', loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
    alias: { '@': path.join(process.cwd(), 'src') },
  })
  const m = await import(pathToFileURL(out).href)
  return { m, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) }
}

if (process.argv[1] && process.argv[1].endsWith('website-spec-plan.mjs')) {
  const [prompt, seed = 'demo-1', city = ''] = process.argv.slice(2)
  const { m, cleanup } = await loadSpecModule()
  const spec = m.planWebsite(prompt, { seed, facts: city ? { city } : {} })
  console.log(JSON.stringify({
    intent: spec.brief.intent, conf: spec.brief.confidence, industry: spec.brief.industry, modules: spec.brief.modules,
    unsupported: spec.brief.unsupported, note: spec.brief.note, dir: spec.direction, header: spec.header, hero: spec.hero,
    motion: spec.motion, images: spec.images.map(i => i.id + ' ' + i.ratio), schema: spec.seo.schemaType,
    sections: spec.sections.map(s => `${s.id}:${s.kind}${s.variant ? '/' + s.variant : ''}[${s.count.min}-${s.count.max}]`),
  }))
  cleanup()
}
