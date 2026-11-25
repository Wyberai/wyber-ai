#!/usr/bin/env node
// SEO health check: the 10-second start of the daily 15 minutes. Run:  node scripts/seo-health.mjs  [--site https://wyberai.com]
// It reads robots.txt, the sitemap and every sitemap URL the way Googlebot would, prints a short pass/fail report and appends one
// line to docs/seo/health-history.csv so the trend is visible. Exit code 1 means something needs attention today.
import fs from 'node:fs'
import path from 'node:path'

const SITE = (process.argv.includes('--site') ? process.argv[process.argv.indexOf('--site') + 1] : 'https://wyberai.com').replace(/\/$/, '')
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
const strip = h => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const decode = s => s.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
const problems = [], warnings = []
const fail = m => problems.push(m), warn = m => warnings.push(m)

async function get(url) {
  try { return await fetch(url, { redirect: 'manual', headers: UA, signal: AbortSignal.timeout(30000) }) } catch (e) { return { status: 0, error: e.message } }
}

// --- site level
const robotsRes = await get(`${SITE}/robots.txt`)
const robots = robotsRes.status === 200 ? await robotsRes.text() : ''
if (robotsRes.status !== 200) fail('robots.txt does not answer 200')
if (!/Sitemap:\s*\S+/i.test(robots)) fail('robots.txt has no Sitemap line')
if (/^Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt blocks the whole site (Disallow: /)')
for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) if (!robots.includes(bot)) warn(`robots.txt has no rule for ${bot}`)

const llmsRes = await get(`${SITE}/llms.txt`)
if (llmsRes.status !== 200) warn('llms.txt does not answer 200')

const smRes = await get(`${SITE}/sitemap.xml`)
const sm = smRes.status === 200 ? await smRes.text() : ''
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
if (smRes.status !== 200 || !urls.length) fail('sitemap.xml missing or empty')
const fresh = [...sm.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m => m[1].slice(0, 10))
if (fresh.length && new Set(fresh).size === 1 && urls.length > 20) warn(`every sitemap page has the same lastmod (${fresh[0]}); real dates help Google`)

// --- every sitemap URL
const rows = []
let idx = 0
await Promise.all(Array.from({ length: 6 }, async () => {
  while (idx < urls.length) {
    const u = urls[idx++]
    const r = await get(u)
    if (!r.status) { rows.push({ u, status: 0, note: r.error }); continue }
    if (r.status !== 200) { rows.push({ u, status: r.status, loc: r.headers?.get('location') }); continue }
    const h = await r.text()
    rows.push({
      u, status: 200,
      canonical: (h.match(/<link[^>]+rel="canonical"[^>]*href="([^"]+)"/) || h.match(/<link[^>]+href="([^"]+)"[^>]*rel="canonical"/) || [])[1] || null,
      robots: (h.match(/<meta[^>]+name="robots"[^>]*content="([^"]+)"/) || [])[1] || '',
      title: decode((h.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || ''),
      words: strip(h).split(' ').length,
    })
  }
}))
const norm = u => u.replace(/\/$/, '')
const home = rows.find(r => norm(r.u) === SITE)
for (const r of rows) {
  const p = r.u.replace(SITE, '') || '/'
  if (r.status !== 200) { fail(`${p}: answers ${r.status}${r.loc ? ' -> ' + r.loc : ''}`); continue }
  if (/noindex/i.test(r.robots)) fail(`${p}: is in the sitemap but says noindex`)
  if (!r.canonical) fail(`${p}: no canonical tag`)
  else if (norm(r.canonical) !== norm(r.u)) fail(`${p}: canonical points elsewhere (${r.canonical.replace(SITE, '') || '/'})`)
  if (!r.title) fail(`${p}: no title`)
  else if (home && r.u !== home.u && r.title === home.title) fail(`${p}: has the homepage title`)
  if (/\|\s*WyberAi\s*\|\s*WyberAi/i.test(r.title)) warn(`${p}: brand repeated in title`)
  if (r.words < 150) warn(`${p}: thin (${r.words} words)`)
}
const titles = {}
for (const r of rows.filter(r => r.status === 200 && r.title)) (titles[r.title] ||= []).push(r.u)
for (const [t, us] of Object.entries(titles)) if (us.length > 1 && !(home && t === home.title)) warn(`duplicate title on ${us.length} pages: "${t.slice(0, 50)}"`)

// --- report
const ok = rows.filter(r => r.status === 200).length
console.log(`SEO health for ${SITE}  (${new Date().toISOString().slice(0, 10)})`)
console.log(`  sitemap URLs: ${urls.length}   healthy pages: ${ok}   problems: ${problems.length}   warnings: ${warnings.length}`)
if (problems.length) { console.log('\nPROBLEMS (fix first):'); problems.slice(0, 25).forEach(p => console.log('  x ' + p)); if (problems.length > 25) console.log(`  ... and ${problems.length - 25} more`) }
if (warnings.length) { console.log('\nWarnings:'); warnings.slice(0, 15).forEach(w => console.log('  - ' + w)); if (warnings.length > 15) console.log(`  ... and ${warnings.length - 15} more`) }
if (!problems.length) console.log('\nAll sitemap pages are healthy. Spend today on the daily task.')

// --- history
try {
  const dir = path.join(process.cwd(), 'docs', 'seo'); fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'health-history.csv')
  if (!fs.existsSync(file)) fs.writeFileSync(file, 'date,sitemap_urls,healthy,problems,warnings\n')
  const today = new Date().toISOString().slice(0, 10)
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(l => l && !l.startsWith(today + ','))
  fs.writeFileSync(file, lines.join('\n') + `\n${today},${urls.length},${ok},${problems.length},${warnings.length}\n`)
} catch { /* history is a convenience only */ }
process.exit(problems.length ? 1 : 0)
