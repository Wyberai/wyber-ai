// One-off: how big is the agent fleet, and how many can the Marketing Manager command?
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { count: total } = await db.from('agent_workflows').select('id', { count: 'exact', head: true })
console.log('TOTAL agents in library:', total)

// Distinct categories + counts
const { data: rows } = await db.from('agent_workflows').select('category')
const byCat = {}
for (const r of rows ?? []) { const c = r.category ?? '(none)'; byCat[c] = (byCat[c] ?? 0) + 1 }
console.log('\nBy category:')
for (const [c, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(5)}  ${c}`)

// What the Marketing Manager sees (category ilike marketing)
const { count: mk } = await db.from('agent_workflows').select('id', { count: 'exact', head: true }).ilike('category', '%marketing%')
console.log(`\nMarketing-category agents (what Marcus commands): ${mk}`)
const { data: mkSample } = await db.from('agent_workflows').select('agent_id, name').ilike('category', '%marketing%').limit(20)
console.log('Sample:'); for (const a of mkSample ?? []) console.log(`  • ${a.agent_id} — ${a.name}`)
