// Read-only: recent signups + what they've done since. No writes.
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const DAYS = Number(process.argv[2] ?? 7)
const since = new Date(Date.now() - DAYS * 86400000).toISOString()

const { data: profiles, error: pErr } = await sb
  .from('profiles')
  .select('id, email, full_name, plan, credits, created_at')
  .gte('created_at', since)
  .order('created_at', { ascending: false })

if (pErr) { console.error('profiles error:', pErr.message); process.exit(1) }

console.log(`\nSignups in last ${DAYS} day(s): ${profiles.length}\n`)

if (!profiles.length) process.exit(0)

const ids = profiles.map(p => p.id)

const [{ data: projects, error: prErr }, { data: deployments, error: dErr }, { data: subs, error: sErr }] = await Promise.all([
  sb.from('projects').select('id, user_id, name, created_at, updated_at, published_url').in('user_id', ids),
  sb.from('deployments').select('id, project_id, user_id, created_at').in('user_id', ids).then(r => r).catch(() => ({ data: [], error: null })),
  sb.from('subscriptions').select('user_id, status, plan').in('user_id', ids),
])

if (prErr) console.warn('projects warn:', prErr.message)
if (dErr) console.warn('deployments warn:', dErr.message)
if (sErr) console.warn('subscriptions warn:', sErr.message)

const projByUser = new Map()
for (const pr of projects || []) {
  if (!projByUser.has(pr.user_id)) projByUser.set(pr.user_id, [])
  projByUser.get(pr.user_id).push(pr)
}
const subByUser = new Map((subs || []).map(s => [s.user_id, s]))

let activated = 0, published = 0, paying = 0

for (const p of profiles) {
  const own = projByUser.get(p.id) || []
  const pub = own.filter(pr => pr.published_url)
  const sub = subByUser.get(p.id)
  if (own.length) activated++
  if (pub.length) published++
  if (sub?.status === 'active') paying++

  const isInternal = /@(wyberai\.com|signalpulsehq\.com)$/i.test(p.email || '')
  console.log(`${p.created_at.slice(0, 16).replace('T', ' ')}  ${p.email}${isInternal ? '  [internal]' : ''}`)
  console.log(`  plan=${p.plan}  credits=${p.credits}  projects=${own.length}${pub.length ? `  published=${pub.length}` : ''}${sub ? `  sub=${sub.status}/${sub.plan}` : ''}`)
  if (own.length) {
    for (const pr of own.slice(0, 5)) {
      console.log(`    · "${pr.name}"${pr.published_url ? ' (published: ' + pr.published_url + ')' : ''} — updated ${pr.updated_at.slice(0, 16).replace('T', ' ')}`)
    }
  }
  console.log('')
}

console.log(`── summary (last ${DAYS}d) ──`)
console.log(`signups: ${profiles.length}  |  activated (built something): ${activated}  |  published: ${published}  |  paying: ${paying}`)
