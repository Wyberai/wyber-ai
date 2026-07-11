// Daily KPI pull for the Chief of Staff employee. Read-only.
// Usage: node scripts/staff-kpis.mjs
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const dayStart = (offset = 0) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - offset)
  return d.toISOString()
}

async function countSince(table, since, until, extra) {
  try {
    let q = sb.from(table).select('*', { count: 'exact', head: true }).gte('created_at', since)
    if (until) q = q.lt('created_at', until)
    if (extra) q = extra(q)
    const { count, error } = await q
    return error ? 'err:' + error.message : count
  } catch (e) { return 'err:' + e.message }
}

async function creditsSpent(since, until) {
  try {
    let q = sb.from('credit_transactions').select('amount').lt('amount', 0).gte('created_at', since)
    if (until) q = q.lt('created_at', until)
    const { data, error } = await q
    return error ? 'err:' + error.message : Math.abs(data.reduce((s, r) => s + r.amount, 0))
  } catch (e) { return 'err:' + e.message }
}

const [t0, t1] = [dayStart(0), dayStart(1)]
const [signupsToday, signupsYest, projectsToday, projectsYest, deploysToday, spentToday, spentYest] = await Promise.all([
  countSince('profiles', t0), countSince('profiles', t1, t0),
  countSince('projects', t0), countSince('projects', t1, t0),
  countSince('deployments', t0),
  creditsSpent(t0), creditsSpent(t1, t0),
])
let paying = 'n/a'
try {
  const { count, error } = await sb.from('profiles').select('*', { count: 'exact', head: true }).neq('plan', 'free')
  paying = error ? 'err:' + error.message : count
} catch (e) { paying = 'err:' + e.message }
let activeSubs = 'n/a'
try {
  const { count, error } = await sb.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')
  activeSubs = error ? 'err:' + error.message : count
} catch (e) { activeSubs = 'err:' + e.message }

const today = new Date().toISOString().slice(0, 10)
console.log(`WyberAi KPIs · ${today}`)
console.log(`signups        today ${signupsToday} · yesterday ${signupsYest}`)
console.log(`projects       today ${projectsToday} · yesterday ${projectsYest}`)
console.log(`publishes      today ${deploysToday}`)
console.log(`credits spent  today ${spentToday} · yesterday ${spentYest}`)
console.log(`paying users   ${paying} (active subs ${activeSubs})`)
console.log(`\nKPI-LOG row:`)
console.log(`| ${today} | ${signupsToday} | ${projectsToday} | ${deploysToday} | ${paying} | ${spentToday} | active subs ${activeSubs} |`)
