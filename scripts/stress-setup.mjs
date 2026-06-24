// Stress-test setup: create a throwaway Marketing Manager under a real profile,
// give it credits, and print the ids. Cleaned up by stress-cleanup.mjs after.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Use a real profile (FK target). Prefer the owner; else the highest-credit one.
let { data: prof } = await db.from('profiles').select('id, email, credits').eq('email', 'admin@reconsignal.com').maybeSingle()
if (!prof) ({ data: prof } = await db.from('profiles').select('id, email, credits').order('credits', { ascending: false }).limit(1).maybeSingle())
if (!prof) { console.error('No profile found'); process.exit(1) }

const origCredits = prof.credits
await db.from('profiles').update({ credits: 3000 }).eq('id', prof.id)

const brief = `You are Marcus, a Marketing Manager. TASK (do this now): Plan and kick off a multi-channel launch campaign for our new product feature — an AI analytics dashboard — targeting B2B SaaS CFOs and RevOps leaders.

Work like a senior operator:
1. Plan the campaign (channels, sequence, deliverables).
2. Use WYBERAI_list_team to find the right marketing specialist agents; use WYBERAI_check_tools to see what's connected.
3. Deploy the relevant agents (WYBERAI_command_agent) to do the work — research the ICP, draft content, plan SEO, outline ads and email.
4. Verify their output and synthesize a launch plan.
This is a planning dry-run: if tools/accounts are missing, NOTE them clearly and proceed to plan/draft what you can WITHOUT escalating. Do NOT call WYBERAI_escalate. Finish with a clear summary.`

const id = Math.random().toString(36).slice(2, 6)
const { data: emp, error } = await db.from('ai_employees').insert({
  user_id: prof.id,
  name: 'StressTest Marcus',
  role: 'Marketing Manager',
  emoji: '📣',
  instructions: brief,
  tools: [],
  kpis: [{ name: 'Pipeline generated', description: 'pipeline $', unit: '$/mo', target: 250000 }],
  schedule_type: 'manual',
  email_local: `stress.${id}`,
  email_domain: 'employees.wyberai.com',
  email_address: `stress.${id}@employees.wyberai.com`,
  handle: `stress-${id}`,
  is_active: true,
}).select('id').single()
if (error) { console.error('Insert failed:', error.message); await db.from('profiles').update({ credits: origCredits }).eq('id', prof.id); process.exit(1) }

console.log(JSON.stringify({ employeeId: emp.id, userId: prof.id, origCredits, cronSecret: process.env.CRON_SECRET }))
