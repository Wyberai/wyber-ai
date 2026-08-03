import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const UID = process.argv[2]
if (!UID) { console.error('Usage: node _lookup-user.mjs <user-id>'); process.exit(1) }

const { data: p } = await sb.from('profiles').select('id,email,full_name,plan,credits,created_at').eq('id', UID).single()
if (!p) { console.error('User not found'); process.exit(1) }

console.log(`\n── User ──`)
console.log(`email:   ${p.email}`)
console.log(`name:    ${p.full_name || '(none)'}`)
console.log(`plan:    ${p.plan}  |  credits: ${p.credits}  |  joined: ${p.created_at.slice(0,16).replace('T',' ')}`)

const { data: prs } = await sb.from('projects').select('id,name,project_type,framework,deployed_url,description,created_at,updated_at').eq('user_id', UID).order('created_at', { ascending: false })

console.log(`\n── Projects (${(prs||[]).length}) ──`)
for (const pr of prs || []) {
  const live = pr.deployed_url ? `  ✓ LIVE: ${pr.deployed_url}` : '  (not deployed)'
  console.log(`  "${pr.name}" [${pr.project_type}]${live}`)
  if (pr.description) console.log(`   desc: ${pr.description.slice(0, 300)}`)
  console.log(`   created: ${pr.created_at.slice(0,16).replace('T',' ')}  |  updated: ${(pr.updated_at||'').slice(0,16).replace('T',' ')}`)
}

const { data: usage } = await sb.from('credit_usage').select('amount,reason,created_at').eq('user_id', UID).order('created_at', { ascending: false }).limit(15)
console.log(`\n── Credit history (last 15) ──`)
for (const u of usage || []) {
  console.log(`  ${u.created_at.slice(0,16).replace('T',' ')}  -${u.amount}cr  ${u.reason}`)
}
