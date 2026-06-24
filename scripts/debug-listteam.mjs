import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of env.split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// exact category values for the core marketing agents
const { data: cats } = await db.from('agent_workflows').select('agent_id, category').in('agent_id', ['WYBER-086','WYBER-088','WYBER-092'])
console.log('core marketing agent categories:', cats)

// Replicate list_team's exact query (deptTerm = "marketing")
console.log('\n--- ilike category %marketing% + order agent_id + limit 60 ---')
const r1 = await db.from('agent_workflows').select('agent_id, name, category, required_tools').ilike('category', '%marketing%').order('agent_id', { ascending: true }).limit(60)
console.log('error:', r1.error?.message ?? 'none', '| rows:', r1.data?.length ?? 0)
if (r1.data?.length) console.log('first 3:', r1.data.slice(0,3).map(a => `${a.agent_id}/${a.category}`))

// Without order
console.log('\n--- ilike only, no order ---')
const r2 = await db.from('agent_workflows').select('agent_id').ilike('category', '%marketing%').limit(60)
console.log('error:', r2.error?.message ?? 'none', '| rows:', r2.data?.length ?? 0)

// employee_episodes table sanity
console.log('\n--- employee_episodes table ---')
const r3 = await db.from('employee_episodes').select('id', { count: 'exact', head: true })
console.log('error:', r3.error?.message ?? 'none', '| total episodes in table:', r3.count)
