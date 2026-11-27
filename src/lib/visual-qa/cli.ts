// The full matrix. Run with: npm run qa:visual -- [--only <text>] [--widths 390,768,1440] [--out <dir>] [--html <dir>] [--no-states]
import fs from 'node:fs'
import path from 'node:path'
import { allCases, coverageReport } from './cases'
import { filesToHtml } from './render'
import { WIDTHS, defaultConcurrency, fontFailures, launch } from './run'
import { groupFindings, runSuite } from './suite'

const arg = (name: string) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined }
const flag = (name: string) => process.argv.includes('--' + name)

async function main() {
  const only = arg('only')
  const cases = allCases().filter(c => !only || only.split(',').some(o => c.id.includes(o)))
  const widths = arg('widths')?.split(',').map(Number) ?? [...WIDTHS]
  const out = path.resolve(arg('out') ?? 'verify-out-visual')
  fs.mkdirSync(out, { recursive: true })
  const htmlDir = arg('html')
  if (htmlDir) {
    fs.mkdirSync(htmlDir, { recursive: true })
    for (const c of cases) fs.writeFileSync(path.join(htmlDir, c.id + '.html'), await filesToHtml(await c.build()))
  }
  const coverage = coverageReport(cases)
  console.log(`${cases.length} cases at ${widths.join(', ')}px. Compositions: ${coverage.sections.length}. Directions missing: ${coverage.missingDirections.join(', ') || 'none'}`)
  const browser = await launch()
  const started = Date.now()
  let done = 0
  const result = await runSuite(browser, cases, {
    widths, states: !flag('no-states'), concurrency: Number(arg('jobs') ?? defaultConcurrency()),
    // every fifth website is also measured the way Safari and Firefox show it (framer-motion instead of scroll timelines)
    fallback: c => c.kind === 'website' && cases.indexOf(c) % 5 === 0,
    onCase: (id, width, n) => console.log(`${++done} ${id} @${width}: ${n}`),
  })
  await browser.close()
  const groups = groupFindings(result.findings)
  fs.writeFileSync(path.join(out, 'findings.json'), JSON.stringify({ coverage, errors: result.errors, fontFailures: [...fontFailures], groups, findings: result.findings }, null, 1))
  const lines = groups.map(g => `${g.check.padEnd(22)} x${String(g.count).padEnd(4)} cases:${String(g.cases.length).padEnd(3)} [${g.widths.sort((a, b) => a - b).join(',')}] ${g.component} ${g.el} | "${g.sample.text.slice(0, 40)}" | ${g.detail} | e.g. ${g.cases[0]} (${g.sample.state})`)
  fs.writeFileSync(path.join(out, 'findings.txt'), lines.join('\n') + '\n')
  console.log(lines.join('\n'))
  console.log(`\n${result.pages} pages in ${Math.round((Date.now() - started) / 1000)}s. ${result.findings.length} findings in ${groups.length} groups. ${result.errors.length} page errors. Font requests that failed: ${fontFailures.size}.`)
  if (result.errors.length) console.log(result.errors.slice(0, 20).join('\n'))
  process.exit(result.findings.length || result.errors.length ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(2) })
