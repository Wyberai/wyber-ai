// Read-only: free users who are almost out of credits AND have built something real.
// "close to empty" = credits <= 20 (can't afford another full build at 30cr default)
// "build is good"  = has a published project OR has >= 2 projects
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const CREDIT_THRESHOLD = Number(process.argv[2] ?? 20)

// 1. Free users with low credits
const { data: profiles, error: pErr } = await sb
  .from('profiles')
  .select('id, email, full_name, plan, credits, created_at')
  .eq('plan', 'free')
  .lte('credits', CREDIT_THRESHOLD)
  .order('credits', { ascending: true })

if (pErr) { console.error('profiles error:', pErr.message); process.exit(1) }
if (!profiles.length) { console.log('No matching users found.'); process.exit(0) }

const ids = profiles.map(p => p.id)

// 2. Their projects
const { data: projects, error: prErr } = await sb
  .from('projects')
  .select('id, user_id, name, framework, project_type, deployed_url, created_at')
  .in('user_id', ids)
  .order('created_at', { ascending: false })

if (prErr) { console.error('projects error:', prErr.message); process.exit(1) }

const projByUser = new Map()
for (const pr of projects || []) {
  if (!projByUser.has(pr.user_id)) projByUser.set(pr.user_id, [])
  projByUser.get(pr.user_id).push(pr)
}

// 3. Filter: only users who've actually built something
const qualified = profiles.filter(p => {
  const own = projByUser.get(p.id) || []
  const published = own.filter(pr => pr.deployed_url)
  return published.length >= 1 || own.length >= 2
})

const internal = (email) => /@(wyberai\.com|reconsignal\.com|signalpulsehq\.com)$/i.test(email || '')

console.log(`\n── Low-credit builders (≤ ${CREDIT_THRESHOLD} credits, free plan, has real builds) ──\n`)
console.log(`Candidates: ${profiles.length} low-credit free users → ${qualified.length} have real builds\n`)

let withPublished = 0, withMultiple = 0

for (const p of qualified) {
  const own = projByUser.get(p.id) || []
  const published = own.filter(pr => pr.deployed_url)
  if (published.length) withPublished++
  if (own.length >= 2) withMultiple++

  const tag = internal(p.email) ? '  [internal]' : ''
  console.log(`${p.email}${tag}`)
  console.log(`  credits=${p.credits}  projects=${own.length}  published=${published.length}  joined=${p.created_at.slice(0,10)}`)
  for (const pr of own.slice(0, 4)) {
    const type = pr.project_type ? `[${pr.project_type}]` : ''
    const live = pr.deployed_url ? ' ✓ live' : ''
    console.log(`    · "${pr.name}" ${type}${live}`)
  }
  if (own.length > 4) console.log(`    · … +${own.length - 4} more`)
  console.log('')
}

console.log(`── summary ──`)
console.log(`target segment: ${qualified.filter(p => !internal(p.email)).length} users (excl. internal)`)
console.log(`  with published app: ${withPublished}`)
console.log(`  with 2+ projects:   ${withMultiple}`)
console.log(`\nEmails for campaign:`)
qualified.filter(p => !internal(p.email)).forEach(p => console.log(`  ${p.email}`))
