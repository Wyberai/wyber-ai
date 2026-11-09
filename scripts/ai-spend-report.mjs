#!/usr/bin/env node
/**
 * Where did the Anthropic money go?
 *
 *   node scripts/ai-spend-report.mjs            # last 24 hours
 *   node scripts/ai-spend-report.mjs 6h         # last 6 hours
 *   node scripts/ai-spend-report.mjs 7d         # last 7 days
 *
 * Reads generation_usage_log (service role, read only). Build rows come from src/app/api/generate/route.ts; every other
 * model call is logged by src/lib/ai-usage.ts as action_type "call:<route>". Cost is RECOMPUTED from the stored token
 * counts, so it is exact even though the old cost_usd column rounded tiny calls to zero.
 * Keep the rates below in step with src/lib/ai-usage.ts (Anthropic pricing page, checked 2026-11-09).
 * Compare the total with the Anthropic Console, whose data runs behind by tens of minutes ("Data as of ..." at the top).
 */
import fs from 'node:fs'

const env = { ...process.env }
for (const f of ['.env.local', '.env']) {
  if (!fs.existsSync(f)) continue
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
}
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env.local).'); process.exit(1) }

const arg = process.argv[2] || '24h'
const m = arg.match(/^(\d+)([hd])$/)
if (!m) { console.error('Window must look like 6h or 7d'); process.exit(1) }
const ms = Number(m[1]) * (m[2] === 'h' ? 3600e3 : 86400e3)
const since = new Date(Date.now() - ms).toISOString()

const SONNET = [2, 10, 2.5, 0.1]
const HAIKU_S = [0.1, 0.5, 0.125, 0.01]
const HAIKU_L = [0.5, 2.5, 0.625, 0.05]
function cost(model, x) {
  const r = /sonnet-5-5/.test(model) ? SONNET
    : /haiku-5-5/.test(model) ? (x.input_tokens + x.cache_creation_input_tokens + x.cache_read_input_tokens > 100000 ? HAIKU_L : HAIKU_S)
    : null
  if (!r) return null
  return (x.input_tokens * r[0] + x.output_tokens * r[1] + x.cache_creation_input_tokens * r[2] + x.cache_read_input_tokens * r[3]) / 1e6
}

const rows = []
for (let from = 0; ; from += 1000) {
  const r = await fetch(`${url}/rest/v1/generation_usage_log?select=created_at,action_type,model_id,input_tokens,output_tokens,cache_creation_input_tokens,cache_read_input_tokens,credits_charged&created_at=gte.${since}&order=created_at.asc&limit=1000&offset=${from}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!r.ok) { console.error('HTTP', r.status, (await r.text()).slice(0, 200)); process.exit(1) }
  const page = await r.json()
  rows.push(...page)
  if (page.length < 1000) break
}

const groups = new Map()
let total = 0, unknown = 0
for (const x of rows) {
  if (x.action_type === 'build-overage') continue // a marker that copies the build's token count; counting it would double the build
  const label = x.action_type.startsWith('call:') ? x.action_type : `build:${x.action_type}`
  const g = groups.get(label) || { calls: 0, usd: 0, out: 0, credits: 0, unknown: 0 }
  const c = cost(x.model_id, x)
  g.calls++; g.out += x.output_tokens; g.credits += x.credits_charged || 0
  if (c === null) { g.unknown++; unknown++ } else { g.usd += c; total += c }
  groups.set(label, g)
}

const list = [...groups.entries()].sort((a, b) => b[1].usd - a[1].usd)
const pad = (s, n) => String(s).padEnd(n)
console.log(`Window: last ${arg}  (since ${since.slice(0, 16)}Z)   rows: ${rows.length}`)
console.log(pad('where', 44), pad('calls', 7), pad('USD', 10), pad('out tokens', 11), 'credits charged')
for (const [label, g] of list) console.log(pad(label, 44), pad(g.calls, 7), pad(g.usd.toFixed(4), 10), pad(g.out, 11), g.credits + (g.unknown ? `   (${g.unknown} calls on an unpriced model)` : ''))
console.log('-'.repeat(86))
console.log(pad('TOTAL', 44), pad(rows.length, 7), '$' + total.toFixed(4) + (unknown ? `   (+${unknown} calls on models with no known price)` : ''))
