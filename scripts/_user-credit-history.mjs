// Show credit usage history for a specific user
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const EMAIL = process.argv[2]
if (!EMAIL) { console.error('Usage: node _user-credit-history.mjs <email>'); process.exit(1) }

const { data: profile } = await sb.from('profiles').select('id, email, plan, credits, created_at').eq('email', EMAIL).single()
if (!profile) { console.error('User not found'); process.exit(1) }

const [{ data: usage }, { data: projects }] = await Promise.all([
  sb.from('credit_usage').select('amount, reason, credits_before, credits_after, created_at').eq('user_id', profile.id).order('created_at', { ascending: true }),
  sb.from('projects').select('id, name, project_type, created_at').eq('user_id', profile.id).order('created_at', { ascending: true }),
])

console.log(`\n── ${EMAIL} ──`)
console.log(`plan=${profile.plan}  credits now=${profile.credits}  joined=${profile.created_at.slice(0,16).replace('T',' ')}\n`)

console.log('Projects:')
for (const p of projects || []) {
  console.log(`  ${p.created_at.slice(0,16).replace('T',' ')}  "${p.name}" [${p.project_type}]`)
}

console.log('\nCredit history:')
let total = 0
for (const u of usage || []) {
  total += u.amount
  console.log(`  ${u.created_at.slice(0,16).replace('T',' ')}  ${u.amount === 0 ? ' 0' : `-${u.amount}`}cr  ${u.reason.padEnd(20)}  balance: ${u.credits_after ?? '?'}`)
}
console.log(`\nTotal spent: ${total}cr  |  Current balance: ${profile.credits}cr`)
