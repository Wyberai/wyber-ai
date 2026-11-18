// Scores one page of HTML with our three graders (SEO, AI visibility, anti-slop), so two sites can be compared on the same
// ruler. Usage: node scripts/score-site.mjs <file-or-url> [--as-ai-crawler] [--base <public base url>]
//   a file path: the file is read as the page (for a site you built locally)
//   a url: the page is fetched with an AI crawler user agent (for a live site)
// Graders are bundled on the fly with esbuild so no build step is needed. Writes JSON to stdout.
import { build } from 'esbuild'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const [target, ...rest] = process.argv.slice(2)
if (!target) { console.error('usage: node scripts/score-site.mjs <file-or-url>'); process.exit(1) }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'score-'))
const out = path.join(tmp, 'graders.mjs')
await build({
  stdin: {
    contents: `export { gradeSlop } from './src/lib/slop-scan'\nexport { gradeVisibility } from './src/lib/ai-visibility'\nexport { analyzeHtml } from './src/lib/seo-audit'`,
    resolveDir: process.cwd(), sourcefile: 'entry.ts', loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
})
const { gradeSlop, gradeVisibility, analyzeHtml } = await import('file://' + out.replace(/\\/g, '/'))

const UA = 'Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)'
const isUrl = /^https?:\/\//i.test(target)
let html, url, robots = { ok: false, status: 404, text: '' }, llms = { ok: false, status: 404, text: '' }, sitemap = { ok: false, status: 404, text: '' }
const get = async (u) => { try { const r = await fetch(u, { headers: { 'User-Agent': UA } }); return { ok: r.ok, status: r.status, text: await r.text() } } catch { return { ok: false, status: 0, text: '' } } }

if (isUrl) {
  const page = await get(target)
  html = page.text; url = target
  const u = new URL(target); const origin = u.origin; const base = origin + u.pathname.replace(/\/+$/, '')
  robots = await get(origin + '/robots.txt'); llms = await get(base + '/llms.txt'); sitemap = await get(base + '/sitemap.xml')
  // a site published on WyberAi serves its app in an iframe srcdoc: judge the app's own document for style, the outer page for text
  const sd = html.match(/srcdoc="([^"]*)"/i)?.[1]
  if (sd) {
    const un = (s) => s.replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    html = html.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/\sstyle="[^"]*"/gi, '') + '\n' + un(sd)
  }
} else {
  html = fs.readFileSync(target, 'utf8'); url = 'file:' + path.basename(target)
  const dir = path.dirname(target)
  const read = (f) => { const p = path.join(dir, f); return fs.existsSync(p) ? { ok: true, status: 200, text: fs.readFileSync(p, 'utf8') } : { ok: false, status: 404, text: '' } }
  robots = read('robots.txt'); llms = read('llms.txt'); sitemap = read('sitemap.xml')
}

const seo = analyzeHtml(url, isUrl ? (await get(target)).text : html, robots.ok, sitemap.ok)
const ai = gradeVisibility({ url, page: { ok: true, status: 200, text: isUrl ? (await get(target)).text : html }, robots, llms, sitemap })
const slop = gradeSlop({ url, html })
const brief = (r) => ({ score: r.score, checks: (r.checks || []).map((c) => `${c.status || c.severity}:${c.id}`).join(' ') })
console.log(JSON.stringify({ url, seo: brief(seo), aiVisibility: brief(ai), slop: { ...brief(slop), verdict: slop.verdict } }, null, 2))
fs.rmSync(tmp, { recursive: true, force: true })
