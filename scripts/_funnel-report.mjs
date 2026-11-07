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

// signup_source only exists once migration 20261107000000_signup_attribution.sql
// is applied, so fall back to the old column set rather than failing.
let hasSource = true
let { data: profiles, error: pErr } = await sb
  .from('profiles')
  .select('id, email, plan, credits, created_at, country, signup_source, signup_campaign')
  .gte('created_at', since)
if (pErr) {
  hasSource = false
  ;({ data: profiles, error: pErr } = await sb
    .from('profiles')
    .select('id, email, plan, credits, created_at, country')
    .gte('created_at', since))
}
if (pErr) { console.error('profiles error:', pErr.message); process.exit(1) }

const ids = profiles.map(p => p.id)
// Standing rule: never count the founder's own / test accounts. Substring
// match, case-insensitive.
const OWNED = ['hello@wyberai.com', 'sumeet.sutar@tryreconsignal.com', 'sumit.sutar259@gmail.com', 'reconsignal', 'continuum', 'vthaku89', 'signalpulsehq.com']
const isInternal = e => {
  const v = (e || '').toLowerCase()
  return /@wyberai\.com$/.test(v) || OWNED.some(o => v.includes(o))
}
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

console.log(`\n── Funnel report — last ${DAYS}d (excluding owned/internal accounts) ──\n`)
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

// Where do signups come from, and do they build? Rows with no source are
// signups from before attribution existed.
function breakdown(title, keyFn) {
  const rows = new Map()
  for (const p of external) {
    const k = keyFn(p) || '(unknown)'
    const r = rows.get(k) || { n: 0, built: 0, pub: 0 }
    const own = projByUser.get(p.id) || []
    r.n++
    if (own.length) r.built++
    if (own.some(pr => pr.published_url)) r.pub++
    rows.set(k, r)
  }
  console.log(`\n${title}`)
  for (const [k, r] of [...rows].sort((a, b) => b[1].n - a[1].n).slice(0, 12)) {
    console.log(`  ${k.padEnd(24)} signups ${String(r.n).padStart(4)}   built ${String(r.built).padStart(3)} (${Math.round(r.built / r.n * 100)}%)   published ${r.pub}`)
  }
}
breakdown('By country', p => p.country)
if (hasSource) breakdown('By first-touch source', p => p.signup_source)
else console.log('\n(source breakdown unavailable: apply migration 20261107000000_signup_attribution.sql)')
// Credit-wall behaviour, from first-party funnel_events (needs migration
// 20261107010000_funnel_events.sql; empty until the tracking ships).
{
  const { data: ev, error: evErr } = await sb
    .from('funnel_events')
    .select('user_id, event, created_at')
    .gte('created_at', since)
    .in('user_id', extIds.length ? extIds : ['00000000-0000-0000-0000-000000000000'])
  if (evErr) {
    console.log('\n(credit-wall events unavailable: apply migration 20261107010000_funnel_events.sql)')
  } else {
    const usersFor = name => new Set((ev || []).filter(e => e.event === name).map(e => e.user_id))
    console.log('\nCredit wall (distinct users, external accounts)')
    for (const name of ['first_generation_started', 'editor_credit_wall_shown', 'editor_simple_build_offered', 'editor_simple_build_chosen', 'editor_out_of_credits_upgrade_clicked', 'checkout_initiated', 'app_published']) {
      console.log(`  ${name.padEnd(42)} ${usersFor(name).size}`)
    }
    if (!(ev || []).length) console.log('  (no events yet: deploy the tracking, then check back)')
  }
}
const excluded = profiles.length - external.length
if (excluded) console.log(`\nExcluded ${excluded} owned/internal account(s) from all numbers above.`)
console.log('')
