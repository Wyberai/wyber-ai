import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// Find the broken project
const { data: projects } = await sb
  .from('projects')
  .select('id,user_id,name,project_type,framework,first_prompt,initial_prompt,description,created_at')
  .ilike('name', "%don't see any attached%")

console.log(`Found ${projects?.length} matching projects:\n`)

for (const p of projects || []) {
  console.log(`ID: ${p.id}`)
  console.log(`Name: ${p.name}`)
  console.log(`Type: ${p.project_type} | Framework: ${p.framework}`)
  console.log(`Created: ${p.created_at.slice(0,16).replace('T',' ')}`)
  console.log(`first_prompt: ${(p.first_prompt || '').slice(0, 300)}`)
  console.log(`initial_prompt: ${(p.initial_prompt || '').slice(0, 300)}`)
  console.log(`description: ${(p.description || '').slice(0, 300)}`)

  // Get user
  const { data: user } = await sb.from('profiles').select('email,plan,credits').eq('id', p.user_id).single()
  console.log(`User: ${user?.email} | plan: ${user?.plan} | credits: ${user?.credits}`)

  // Get their credit usage
  const { data: usage } = await sb.from('credit_usage').select('amount,reason,created_at').eq('user_id', p.user_id).order('created_at', { ascending: false }).limit(10)
  console.log(`\nCredit history:`)
  for (const u of usage || []) {
    console.log(`  ${u.created_at.slice(0,16).replace('T',' ')}  -${u.amount}cr  ${u.reason}`)
  }
  console.log('---')
}
