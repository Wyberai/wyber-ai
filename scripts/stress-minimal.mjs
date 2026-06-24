// Minimal test: force ONE list_team call, then stop. Cheap (~1-2 iterations).
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of env.split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: prof } = await db.from('profiles').select('id, credits').eq('email', 'admin@reconsignal.com').maybeSingle()
await db.from('profiles').update({ credits: 500 }).eq('id', prof.id)
const id = Math.random().toString(36).slice(2, 6)
const { data: emp } = await db.from('ai_employees').insert({
  user_id: prof.id, name: 'ListTeam Probe', role: 'Marketing Manager', emoji: '📣',
  instructions: 'Call WYBERAI_list_team exactly once with no query, and report verbatim what it returns. Then immediately finish — do NOTHING else, deploy nothing.',
  tools: [], kpis: [], schedule_type: 'manual',
  email_local: `probe.${id}`, email_domain: 'employees.wyberai.com', email_address: `probe.${id}@employees.wyberai.com`, handle: `probe-${id}`, is_active: true,
}).select('id').single()
console.log(JSON.stringify({ employeeId: emp.id, userId: prof.id, origCredits: prof.credits }))
