// Builds the pre-analyzed BYOS tool library by running each tool through the real
// analyzer (the local dev server's /api/byos/analyze), so the committed data is
// exactly what a visitor would have been served.
//   npm run dev   (in another terminal)
//   node scripts/byos-build-library.mjs [--base http://localhost:3000] [domain ...]
// Merges into src/lib/byos/library-data.json + library-index.json; re-running
// refreshes the domains you pass (or all defaults) and keeps the rest.
import { readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const baseIdx = args.indexOf('--base')
const BASE = baseIdx >= 0 ? args.splice(baseIdx, 2)[1] : 'http://localhost:3000'
const DATA = 'src/lib/byos/library-data.json'
const INDEX = 'src/lib/byos/library-index.json'

const DEFAULTS = [
  // CRM and sales
  'pipedrive.com', 'hubspot.com', 'close.com', 'copper.com',
  // project and work management
  'linear.app', 'asana.com', 'monday.com', 'clickup.com', 'trello.com', 'airtable.com',
  // forms, scheduling, e-sign
  'typeform.com', 'jotform.com', 'tally.so', 'calendly.com', 'docusign.com', 'pandadoc.com',
  // support
  'freshdesk.com', 'zendesk.com', 'intercom.com', 'helpscout.com',
  // people, time, money
  'bamboohr.com', 'gusto.com', 'getharvest.com', 'toggl.com', 'freshbooks.com',
  // analytics and marketing
  'mixpanel.com', 'amplitude.com', 'hotjar.com', 'mailchimp.com', 'convertkit.com',
]
const domains = args.length ? args : DEFAULTS

const MIN_MODULES = 5
const MIN_FEATURES = 15

async function analyze(domain) {
  const res = await fetch(`${BASE}/api/byos/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: domain, fresh: true }) })
  const text = await res.text()
  if ((res.headers.get('content-type') || '').includes('ndjson')) {
    for (const line of text.split('\n').filter(Boolean).map(l => JSON.parse(l))) {
      if (line.type === 'result') return { analysis: line.analysis }
      if (line.type === 'error') return { error: line.error }
    }
    return { error: 'stream ended without a result' }
  }
  const j = JSON.parse(text)
  return j.analysis ? { analysis: j.analysis } : { error: j.error }
}

const existing = new Map(JSON.parse(readFileSync(DATA, 'utf8')).map(a => [a.domain, a]))
const report = []
for (const d of domains) {
  const t0 = Date.now()
  try {
    const { analysis, error } = await analyze(d)
    const n = analysis?.modules.reduce((s, m) => s + m.features.length, 0) ?? 0
    if (!analysis) report.push({ domain: d, result: 'FAILED', note: error })
    else if (typeof analysis.fitSummary !== 'string' || !analysis.fitSummary) report.push({ domain: d, result: 'NO FIT DATA', note: 'missing fitSummary' })
    else if (analysis.modules.length < MIN_MODULES || n < MIN_FEATURES) report.push({ domain: d, result: 'TOO THIN', note: `${analysis.modules.length} modules, ${n} features` })
    else {
      existing.set(analysis.domain, analysis)
      report.push({ domain: d, result: 'ok', note: `${analysis.modules.length} modules, ${n} features, ${analysis.integrations.length} integrations${analysis.integrationsComplete ? '' : ' (no integrations page)'}` })
    }
  } catch (e) {
    report.push({ domain: d, result: 'ERROR', note: String(e.message || e) })
  }
  console.log(`${report.at(-1).result.padEnd(8)} ${d.padEnd(18)} ${report.at(-1).note}  (${Math.round((Date.now() - t0) / 1000)}s)`)
  // Persist after every tool so a long run can be interrupted and resumed.
  const all = [...existing.values()].sort((a, b) => a.product.localeCompare(b.product))
  writeFileSync(DATA, JSON.stringify(all, null, 1) + '\n')
  writeFileSync(INDEX, JSON.stringify(all.map(a => ({ domain: a.domain, product: a.product, category: a.category })), null, 1) + '\n')
}
console.log(`\nLibrary now holds ${existing.size} tools.`)
