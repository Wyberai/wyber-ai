// Report on the stress run + clean up. Usage: node stress-report.mjs <employeeId> <userId> <origCredits>
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const [employeeId, userId, origCredits] = process.argv.slice(2)

const { data: run } = await db.from('ai_employee_runs').select('*').eq('employee_id', employeeId).order('created_at', { ascending: false }).limit(1).maybeSingle()
console.log('=== RUN ===')
console.log('status:', run?.status, '| credits_used:', run?.credits_used)
console.log('error:', run?.error_message ?? 'none')
console.log('summary:', run?.summary ?? '(none)')
const actions = run?.actions_taken ?? []
console.log(`\n=== ACTIONS (${actions.length}) ===`)
const toolCounts = {}
for (const a of actions) { toolCounts[a.action] = (toolCounts[a.action] ?? 0) + 1 }
for (const [t, n] of Object.entries(toolCounts).sort((x, y) => y[1] - x[1])) console.log(`  ${String(n).padStart(3)}×  ${t}`)
console.log('\n--- action detail (first 18) ---')
for (const a of actions.slice(0, 18)) console.log(`  • ${a.action}: ${String(a.result_summary ?? '').slice(0, 130)}`)

const { data: eps } = await db.from('employee_episodes').select('summary, learnings, outcome').eq('employee_id', employeeId)
console.log(`\n=== EPISODES written (${eps?.length ?? 0}) ===`)
for (const e of eps ?? []) console.log(`  outcome=${e.outcome} | ${String(e.summary).slice(0, 90)} | learned: ${String(e.learnings ?? '').slice(0, 90)}`)

const { data: ents } = await db.from('employee_entities').select('kind, name, state').eq('employee_id', employeeId)
console.log(`\n=== ENTITIES written (${ents?.length ?? 0}) ===`)
for (const e of ents ?? []) console.log(`  [${e.kind}] ${e.name} (${e.state ?? ''})`)

// Cleanup: delete test employee (cascades runs/episodes/entities) + restore credits.
await db.from('ai_employees').delete().eq('id', employeeId)
if (origCredits !== undefined) await db.from('profiles').update({ credits: Number(origCredits) }).eq('id', userId)
console.log('\n=== cleaned up (employee deleted, credits restored) ===')
