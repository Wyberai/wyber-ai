// Read-only funnel health check: signups → activated → published → checkout
// attempts → paying, for a given lookback window. Run this any time instead
// of re-deriving the numbers by hand — this is what a full manual audit
// (2026-07-30) put together ad hoc; keeping it as a script so the next check
// is one command instead of a fresh investigation.
//
// Usage: node scripts/_funnel-report.mjs [days]   (default 30)
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const DAYS = Number(process.argv[2] ?? 30)
const since = new Date(Date.now() - DAYS * 86400000).toISOString()

const { data: profiles, error: pErr } = await sb
  .from('profiles')
  .select('id, email, plan, credits, created_at')
  .gte('created_at', since)
if (pErr) { console.error('profiles error:', pErr.message); process.exit(1) }

const ids = profiles.map(p => p.id)
const isInternal = e => /@(wyberai\.com|signalpulsehq\.com)$/i.test(e || '')
const external = profiles.filter(p => !isInternal(p.email))
const extIds = external.map(p => p.id)

const [{ data: projects }, { data: attempts, error: caErr }] = await Promise.all([
  sb.from('projects').select('id, user_id, published_url').in('user_id', extIds.length ? extIds : ['00000000-0000-0000-0000-000000000000']),
  sb.from('checkout_attempts').select('id, user_id, plan_key, currency, created_at, converted').gte('created_at', since),
])

const projByUser = new Map()
for (const pr of projects || []) {
  if (!projByUser.has(pr.user_id)) projByUser.set(pr.user_id, [])
  projByUser.get(pr.user_id).push(pr)
}

let activated = 0, published = 0
for (const p of external) {
  const own = projByUser.get(p.id) || []
  if (own.length) activated++
  if (own.some(pr => pr.published_url)) published++
}

const externalAttempts = caErr ? [] : (attempts || []).filter(a => extIds.includes(a.user_id))
const converted = externalAttempts.filter(a => a.converted)

console.log(`\n── Funnel report — last ${DAYS}d (excluding internal @wyberai.com/@signalpulsehq.com accounts) ──\n`)
console.log(`Signups:            ${external.length}`)
console.log(`Activated (built):  ${activated}  (${external.length ? Math.round(activated/external.length*100) : 0}%)`)
console.log(`Published:          ${published}  (${external.length ? Math.round(published/external.length*100) : 0}%)`)
console.log(`Checkout attempts:  ${caErr ? 'n/a — ' + caErr.message : externalAttempts.length}`)
console.log(`Converted (paid):   ${converted.length}`)

if (externalAttempts.length) {
  console.log(`\nAttempt detail:`)
  for (const a of externalAttempts) {
    console.log(`  ${a.created_at.slice(0,16).replace('T',' ')}  ${a.plan_key} (${a.currency})  converted=${a.converted}`)
  }
}
console.log('')
