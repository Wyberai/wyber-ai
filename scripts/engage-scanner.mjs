// WyberAi engage scanner — finds fresh threads worth COMMENTING on (karma
// warmup + becoming a known name), not leads. Sibling of lead-scanner.mjs,
// same RSS/Algolia plumbing, different queries + scoring.
//
// Lanes (matched to Sumeet's expertise):
//   SECURITY  — RLS / leaked keys / auth questions → be the security expert
//   AI-BUILD  — AI builder tools, failures, credits, vibe-coding talk
//   FEEDBACK  — "roast my app" / "just launched" → give sharp, kind feedback
//   QUESTION  — "which tool / how do I" → helpful answers
//
// Usage:
//   node scripts/engage-scanner.mjs               # last 18h, digest to Desktop
//   node scripts/engage-scanner.mjs --since=36h
//   node scripts/engage-scanner.mjs --all         # ignore seen-state
//
// Output: <Desktop>/Wyber Ai/engage/engage-<date>.md  (+ .json + seen state)
// RULE: comments this feeds must NEVER pitch the product. Warmup only.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const UA = 'WyberAi-engage-scanner/1.0 (+https://wyberai.com)'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'engage')
const STATE_FILE = path.join(OUT, 'seen.json')

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=')
  return [k, v ?? true]
}))
const SINCE_HOURS = (() => {
  const m = String(args.since || '').match(/^(\d+)\s*([hd])?$/i)
  return m ? Number(m[1]) * (m[2]?.toLowerCase() === 'd' ? 24 : 1) : 18
})()
const IGNORE_SEEN = !!args.all
const SINCE_TS = Date.now() - SINCE_HOURS * 3600 * 1000
const MAX = Number(args.limit ?? 40)

// STAR tier gets scanned deep; REGULAR tier too (they're cheap).
const SUBREDDITS = [
  'vibecoding', 'SideProject', 'indiehackers', 'nocode', 'NoCodeSaaS',
  'SaaS', 'developersIndia', 'webdev', 'ClaudeAI', 'cursor', 'lovable',
]

// ── lanes ────────────────────────────────────────────────────────────────────
const LANES = {
  SECURITY: {
    weight: 5,
    phrases: ['rls', 'row level security', 'supabase security', 'anon key', 'api key exposed',
      'leaked', 'data leak', 'security scan', 'is it safe', 'got hacked', 'exposed my',
      'auth broken', 'jwt', 'security audit', 'pentest'],
    tip: 'Your strongest lane. Explain the attacker-view probe concept, share the "config looks right but is not enforced" insight. No product mention.',
  },
  'AI-BUILD': {
    weight: 4,
    phrases: ['lovable', 'bolt.new', 'v0.dev', 'ai builder', 'ai built', 'vibe coding', 'vibe coded',
      'claude code', 'cursor broke', 'credits burned', 'ai generated app', 'prompt engineering app',
      'ai keeps breaking', 'hallucinated import', 'build failed', 'ai coding tool'],
    tip: 'War stories from running a builder: hallucinated imports, self-heal loops, credit economics. Speak as a fellow sufferer, not a vendor.',
  },
  FEEDBACK: {
    weight: 3,
    phrases: ['roast my', 'feedback on my', 'just launched', 'i built', "i've built", 'i made this',
      'launched my', 'show off', 'first saas', 'side project i', 'rate my landing'],
    tip: 'Funny-but-useful. One genuine compliment + one concrete fix (load time, signup friction, unclear headline). Builders remember good feedback.',
  },
  QUESTION: {
    weight: 3,
    phrases: ['which tool', 'how do i build', 'should i use', 'recommend a', 'best way to build',
      'no code or', 'without coding', 'non technical founder', 'where do i start', 'tech stack for'],
    tip: 'Answer honestly, include competitors when they fit. Credibility now converts later.',
  },
}
const NEGATIVE = ['hiring', 'for hire', 'promo code', 'discount', 'course', 'webinar', 'giveaway']

// ── shared plumbing (mirrors lead-scanner.mjs) ───────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
async function getText(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/atom+xml, text/xml' } })
      if (res.status === 429) { await sleep(3000 * (i + 1)); continue }
      if (!res.ok) throw new Error(`${res.status}`)
      return await res.text()
    } catch (e) {
      if (i === tries - 1) { console.warn('  ! fetch failed:', url.slice(0, 70), String(e.message)); return null }
      await sleep(1500 * (i + 1))
    }
  }
  return null
}
function decodeEntities(s = '') {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&')
}
function parseAtom(xml) {
  const out = []
  for (const e of xml.match(/<entry>[\s\S]*?<\/entry>/g) || []) {
    const pick = (tag) => (e.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1] || ''
    const link = (e.match(/<link[^>]*href="([^"]+)"/) || [])[1] || ''
    out.push({
      id: pick('id').trim(),
      title: decodeEntities(pick('title').trim()),
      link,
      author: decodeEntities((e.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/) || [])[1] || '').replace(/^\/u\//, ''),
      updated: pick('updated') || pick('published'),
      content: decodeEntities(pick('content')).replace(/<[^>]+>/g, ' '),
      sub: (link.match(/reddit\.com\/r\/([^/]+)/) || [])[1] || '',
    })
  }
  return out
}

// ── scoring: lane match + freshness ─────────────────────────────────────────
function classify(text) {
  const t = text.toLowerCase()
  if (NEGATIVE.some(n => t.includes(n))) return null
  let best = null
  for (const [lane, def] of Object.entries(LANES)) {
    const hits = def.phrases.filter(p => t.includes(p))
    if (!hits.length) continue
    const s = def.weight + Math.min(hits.length - 1, 2)
    if (!best || s > best.score) best = { lane, score: s, hits }
  }
  return best
}

// ── run ──────────────────────────────────────────────────────────────────────
console.log(`\nWyberAi engage scanner · last ${SINCE_HOURS}h\n`)
fs.mkdirSync(OUT, { recursive: true })
let seen = new Set()
try { seen = new Set(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))) } catch {}
if (IGNORE_SEEN) seen = new Set()

const found = []
for (const sub of SUBREDDITS) {
  const xml = await getText(`https://www.reddit.com/r/${sub}/new/.rss?limit=100`)
  if (xml) {
    for (const e of parseAtom(xml)) {
      if (!e.id || seen.has(e.id)) continue
      const created = Date.parse(e.updated) || 0
      if (created < SINCE_TS) continue
      const hit = classify(`${e.title} ${e.content}`)
      if (!hit) continue
      const ageH = (Date.now() - created) / 3600000
      // freshness bonus: <3h is prime commenting time (few comments, still rising)
      const fresh = ageH < 3 ? 2 : ageH < 8 ? 1 : 0
      found.push({
        id: e.id, lane: hit.lane, score: hit.score + fresh, hits: hit.hits,
        where: `r/${e.sub || sub}`, title: e.title, author: e.author, url: e.link, created,
      })
    }
  }
  await sleep(2500)
}

const top = found
  .sort((a, b) => b.score - a.score || b.created - a.created)
  .slice(0, MAX)
top.forEach(x => seen.add(x.id))
fs.writeFileSync(STATE_FILE, JSON.stringify([...seen].slice(-5000)))

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
const datestr = new Date().toISOString().slice(0, 10)
const byLane = {}
for (const x of top) (byLane[x.lane] ??= []).push(x)

let md = `# Engage digest — ${stamp}\n${top.length} comment opportunities · last ${SINCE_HOURS}h\n**Rule: no product pitches. You're building a reputation, not funnels.**\n`
for (const [lane, items] of Object.entries(byLane)) {
  md += `\n## ${lane} — ${LANES[lane].tip}\n\n`
  for (const x of items) {
    const age = Math.round((Date.now() - x.created) / 3600000)
    md += `- ${x.score}★ · ${x.where} · ${age}h ago — **[${x.title.replace(/\n/g, ' ').slice(0, 120)}](${x.url})** (u/${x.author}) · _${x.hits.slice(0, 3).join(', ')}_\n`
  }
}
if (!top.length) md += '\n_Nothing fresh this run. Try `--since=36h`._\n'
fs.writeFileSync(path.join(OUT, `engage-${datestr}.md`), md)
fs.writeFileSync(path.join(OUT, `engage-${datestr}.json`), JSON.stringify(top, null, 2))

console.log(`── ${top.length} opportunities ──`)
for (const x of top.slice(0, 15)) console.log(`  ${String(x.score).padStart(2)}★ ${x.lane.padEnd(9)} ${x.where.padEnd(18)} ${x.title.slice(0, 58)}`)
console.log(`\nSaved → ${OUT}\n`)
