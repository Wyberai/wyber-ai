// WyberAi lead scanner — finds people publicly asking for a web/mobile app built.
// Feeds the "I'll just build it for you" outreach play: scan → rank → reach out.
//
// Sources (all free, no paid API keys):
//   • Reddit    — public .json search + subreddit "new" feeds
//   • HackerNews — Algolia search API (stories + comments)
//
// Usage:
//   node scripts/lead-scanner.mjs                 # scan, write digest to Desktop
//   node scripts/lead-scanner.mjs --since=72h     # look back further (default 48h)
//   node scripts/lead-scanner.mjs --min-score=4   # only stronger-intent leads
//   node scripts/lead-scanner.mjs --email         # also email the digest (needs RESEND_API_KEY)
//   node scripts/lead-scanner.mjs --all           # ignore the "already seen" memory
//
// Output: <Desktop>/Wyber Ai/leads/  (leads-<date>.md + leads-<date>.json + seen state)
// Schedule it (Task Scheduler / cron) to run daily and you get a fresh lead list each morning.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// ── config ───────────────────────────────────────────────────────────────────
const UA = 'WyberAi-lead-scanner/1.0 (+https://wyberai.com)'
const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'leads')
const STATE_FILE = path.join(OUT, 'seen.json')

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=')
  return [k, v ?? true]
}))
const SINCE_HOURS = parseHours(args.since) ?? 48
const MIN_SCORE = Number(args['min-score'] ?? 3)
const SEND_EMAIL = !!args.email
const IGNORE_SEEN = !!args.all
const MAX_LEADS = Number(args.limit ?? 60)
const SINCE_TS = Date.now() - SINCE_HOURS * 3600 * 1000

// Subreddits where people ask for apps to be built. new.json is scanned; search runs site-wide.
const SUBREDDITS = [
  'SideProject', 'somebodymakethis', 'AppIdeas', 'nocode', 'NoCodeSaaS',
  'Entrepreneur', 'EntrepreneurRideAlong', 'smallbusiness', 'startups',
  'SaaS', 'indiehackers', 'webdev', 'AppDevelopers', 'Business_Ideas',
]

// Site-wide Reddit search queries (quoted phrases = high intent).
const REDDIT_QUERIES = [
  '"looking for a developer"', '"need an app built"', '"someone build"',
  '"build my app"', '"turn my idea into an app"', '"how do i build an app"',
  '"need a website built"', '"build an mvp"', '"want to build an app"',
  '"no code app"', '"hire a developer"',
]

// HN Algolia queries.
const HN_QUERIES = ['build an app', 'need a developer', 'no-code app builder', 'build my mvp']

// ── intent scoring ───────────────────────────────────────────────────────────
// Strong phrases = clear "I want this built" intent. Weight is how much each adds.
const STRONG = [
  ['looking for a developer', 4], ['looking for a technical', 4], ['need a developer', 4],
  ['need an app', 4], ['need a website', 3], ['someone build', 4], ['somebody make', 4],
  ['can someone build', 4], ['can someone make', 4], ['how do i build', 3], ['how to build an app', 3],
  ['want to build an app', 3], ['want to create an app', 3], ['trying to build an app', 3],
  ['build my app', 4], ['build an app for', 3], ['build an mvp', 4], ['build a mvp', 4],
  ['turn my idea', 4], ['hire a developer', 4], ['need help building', 3], ['looking to build', 3],
  ['want to make an app', 3], ['app idea', 2], ['built my mvp', 2],
]
// Context terms confirm it's about a web/mobile app (not e.g. a "book app"-review). At least one required.
const CONTEXT = ['app', 'website', 'web app', 'webapp', 'mobile app', 'saas', 'platform', 'mvp', 'ios', 'android', 'landing page', 'no-code', 'no code']
// Kill signals — not a buyer. Covers service-sellers, people SHARING a build, and advice/discussion posts.
const NEGATIVE = [
  // selling a service
  'i offer', 'dm me for', 'my agency', 'for hire', 'i can build your', 'i will build your',
  'promo code', 'we provide', 'check out my', 'i built this', 'launched my', 'i made this',
  // sharing their own build / asking for feedback or testers (not seeking a builder)
  'helped me build', 'i built', "i've built", "i'm building", 'im building', 'i just built',
  'i created', 'feedback on my', 'beta tester', 'roast my', 'hardest part', 'update:',
  // advice / listicle / discussion, not a request
  'before you hire', 'nobody talks about', 'here are', 'lessons learned', 'stop building',
  'what i learned', 'ask for these',
]
const MOBILE_HINT = ['mobile app', 'ios', 'android', 'flutter', 'react native', 'app store', 'play store']

// ── helpers ──────────────────────────────────────────────────────────────────
function parseHours(v) {
  if (!v || v === true) return null
  const m = String(v).match(/^(\d+)\s*([hd])?$/i)
  if (!m) return null
  return Number(m[1]) * (m[2]?.toLowerCase() === 'd' ? 24 : 1)
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
      if (res.status === 429) { await sleep(2500 * (i + 1)); continue }
      if (!res.ok) throw new Error(`${res.status}`)
      return await res.json()
    } catch (e) {
      if (i === tries - 1) { console.warn('  ! fetch failed:', url.slice(0, 80), String(e.message)); return null }
      await sleep(800 * (i + 1))
    }
  }
  return null
}

// Reddit's JSON API IP-blocks bots, but the Atom/RSS feeds stay open. We read those.
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
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&')
}

// Minimal Atom parser (no XML dep) — Reddit RSS entries carry everything we need.
function parseAtom(xml) {
  const out = []
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || []
  for (const e of entries) {
    const pick = (tag) => (e.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1] || ''
    const id = pick('id').trim()
    const title = decodeEntities(pick('title').trim())
    const link = (e.match(/<link[^>]*href="([^"]+)"/) || [])[1] || ''
    const author = decodeEntities((e.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/) || [])[1] || '')
      .replace(/^\/u\//, '')
    const updated = pick('updated') || pick('published')
    const content = decodeEntities(pick('content')).replace(/<[^>]+>/g, ' ')
    const sub = (link.match(/reddit\.com\/r\/([^/]+)/) || [])[1] || ''
    out.push({ id, title, link, author, updated, content, sub })
  }
  return out
}

function score(text) {
  const t = text.toLowerCase()
  if (!CONTEXT.some(c => t.includes(c))) return { score: 0, hits: [] }
  if (NEGATIVE.some(n => t.includes(n))) return { score: 0, hits: [] }
  let s = 0
  const hits = []
  for (const [phrase, w] of STRONG) {
    if (t.includes(phrase)) { s += w; hits.push(phrase) }
  }
  return { score: s, hits }
}

function replyAngle(text, hits) {
  const t = text.toLowerCase()
  const mobile = MOBILE_HINT.some(m => t.includes(m))
  const open = mobile
    ? `Saw you're after a mobile app — I put together a quick working version on WyberAi (ships a real iOS/Android app, not just a webpage). Happy to hand you the live link, no strings.`
    : `Saw you're looking to get this built — I spun up a quick working version on WyberAi in a few minutes. Want the live link to poke at? No pitch, just thought it'd save you time.`
  return open
}

// ── sources ──────────────────────────────────────────────────────────────────
async function scanReddit() {
  const leads = []
  const seenIds = new Set()

  const push = (e, via) => {
    if (!e.id || seenIds.has(e.id)) return
    if (e.updated && Date.parse(e.updated) < SINCE_TS) return
    // Search feeds pull cross-topic junk (a stray phrase in an unrelated post). For those,
    // demand the app/website context be in the *title*. Subreddit feeds are already on-topic.
    if (via === 'search' && !CONTEXT.some(c => e.title.toLowerCase().includes(c))) return
    const body = `${e.title} ${e.content}`
    const { score: sc, hits } = score(body)
    if (sc < MIN_SCORE) return
    seenIds.add(e.id)
    leads.push({
      id: `reddit_${e.id}`, source: 'reddit', where: e.sub ? `r/${e.sub}` : 'reddit',
      title: e.title, author: e.author || '?', score: sc, hits,
      url: e.link, created: Date.parse(e.updated) || Date.now(), reply: replyAngle(body, hits),
    })
  }

  // subreddit "new" RSS feeds — the reliable path (200 OK, catches every fresh post)
  for (const sub of SUBREDDITS) {
    const xml = await getText(`https://www.reddit.com/r/${sub}/new/.rss?limit=100`)
    if (xml) parseAtom(xml).forEach(e => push(e, 'feed'))
    await sleep(2500)
  }
  // site-wide phrase searches via RSS — higher-intent, rate-limited so we go gently
  for (const q of REDDIT_QUERIES) {
    const url = `https://www.reddit.com/search.rss?q=${encodeURIComponent(q)}&sort=new&limit=50&t=week`
    const xml = await getText(url)
    if (xml) parseAtom(xml).forEach(e => push(e, 'search'))
    await sleep(3000)
  }
  return leads
}

async function scanHN() {
  const leads = []
  const seenIds = new Set()
  const sinceSec = Math.floor(SINCE_TS / 1000)
  for (const q of HN_QUERIES) {
    // Ask HN only — genuine "help me build X" posts, not noisy comment threads.
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(q)}&tags=ask_hn&numericFilters=created_at_i>${sinceSec}&hitsPerPage=50`
    const j = await getJSON(url)
    for (const h of j?.hits || []) {
      if (seenIds.has(h.objectID)) continue
      const body = `${h.title || h.story_title || ''} ${h.story_text || ''}`
        .replace(/<[^>]+>/g, ' ')
      const { score: sc, hits } = score(body)
      if (sc < MIN_SCORE) continue
      seenIds.add(h.objectID)
      const title = (h.title || h.story_title || body.slice(0, 90)).trim()
      leads.push({
        id: `hn_${h.objectID}`, source: 'hn', where: 'Hacker News',
        title, author: h.author, score: sc, hits,
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        created: (h.created_at_i || 0) * 1000, reply: replyAngle(body, hits),
      })
    }
    await sleep(600)
  }
  return leads
}

// ── output ───────────────────────────────────────────────────────────────────
function loadSeen() {
  try { return new Set(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))) } catch { return new Set() }
}
function saveSeen(set) {
  fs.writeFileSync(STATE_FILE, JSON.stringify([...set].slice(-5000)))
}

function toMarkdown(leads, stamp) {
  const line = (l) => {
    const age = Math.round((Date.now() - l.created) / 3600000)
    return `### ${l.score}★ · ${l.where} · ${age}h ago
**[${l.title.replace(/\n/g, ' ').slice(0, 140)}](${l.url})** — u/${l.author}
Signals: ${l.hits.join(', ') || '—'}
> ${l.reply}
`
  }
  return `# WyberAi leads — ${stamp}
${leads.length} new lead${leads.length === 1 ? '' : 's'} · looking back ${SINCE_HOURS}h · min score ${MIN_SCORE}

${leads.map(line).join('\n')}
${leads.length ? '' : '_No new leads this run. Try `--since=96h` or lower `--min-score`._'}`
}

async function emailDigest(leads, stamp) {
  if (!process.env.RESEND_API_KEY) { console.warn('  ! --email set but RESEND_API_KEY missing; skipping.'); return }
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const rows = leads.slice(0, 25).map(l => {
    const age = Math.round((Date.now() - l.created) / 3600000)
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #2e2e38;color:#0EA5E9;font-weight:700">${l.score}★</td>
      <td style="padding:10px 12px;border-bottom:1px solid #2e2e38">
        <a href="${l.url}" style="color:#f0f0f4;text-decoration:none;font-weight:600">${l.title.replace(/</g, '&lt;').slice(0, 110)}</a><br>
        <span style="color:#8888a0;font-size:12px">${l.where} · u/${l.author} · ${age}h ago · ${l.hits.slice(0, 3).join(', ')}</span>
      </td></tr>`
  }).join('')
  const html = `<div style="font-family:Inter,system-ui,sans-serif;background:#0d0d0f;color:#f0f0f4;padding:24px">
    <h2 style="margin:0 0 4px">🎯 ${leads.length} people want an app built</h2>
    <p style="color:#8888a0;margin:0 0 18px;font-size:13px">${stamp} · looking back ${SINCE_HOURS}h. Reply fast — freshest first.</p>
    <table style="width:100%;border-collapse:collapse;background:#141416;border-radius:12px">${rows}</table>
    <p style="color:#555566;font-size:12px;margin-top:16px">Full digest saved to your Desktop → Wyber Ai → leads.</p>
  </div>`
  await resend.emails.send({
    from: 'WyberAi <hello@wyberai.com>',
    to: process.env.OWNER_EMAIL || 'hello@wyberai.com',
    subject: `🎯 ${leads.length} app-build leads — ${stamp}`,
    html,
  })
  console.log('  ✓ emailed digest to', process.env.OWNER_EMAIL || 'hello@wyberai.com')
}

// ── run ──────────────────────────────────────────────────────────────────────
console.log(`\nWyberAi lead scanner · last ${SINCE_HOURS}h · min score ${MIN_SCORE}\n`)
fs.mkdirSync(OUT, { recursive: true })
const seen = IGNORE_SEEN ? new Set() : loadSeen()

console.log('› scanning Reddit…')
const reddit = await scanReddit()
console.log(`  ${reddit.length} candidate(s)`)
console.log('› scanning Hacker News…')
const hn = await scanHN()
console.log(`  ${hn.length} candidate(s)`)

const dupe = new Set()
let leads = [...reddit, ...hn]
  .filter(l => IGNORE_SEEN || !seen.has(l.id))
  .sort((a, b) => b.score - a.score || b.created - a.created)
  .filter(l => {                       // drop the same person's cross-posts
    const key = `${l.author}::${l.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50)}`
    if (dupe.has(key)) return false
    dupe.add(key); return true
  })
  .slice(0, MAX_LEADS)

leads.forEach(l => seen.add(l.id))
saveSeen(seen)

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
const datestr = new Date().toISOString().slice(0, 10)
const md = toMarkdown(leads, stamp)
fs.writeFileSync(path.join(OUT, `leads-${datestr}.md`), md)
fs.writeFileSync(path.join(OUT, `leads-${datestr}.json`), JSON.stringify(leads, null, 2))

console.log(`\n── ${leads.length} new lead(s) ──`)
for (const l of leads.slice(0, 15)) {
  console.log(`  ${String(l.score).padStart(2)}★  ${l.where.padEnd(22)}  ${l.title.replace(/\n/g, ' ').slice(0, 64)}`)
}
console.log(`\nSaved → ${OUT}`)
if (SEND_EMAIL) await emailDigest(leads, stamp)
console.log('Done.\n')
