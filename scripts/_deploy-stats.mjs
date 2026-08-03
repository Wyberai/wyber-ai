import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// All projects
const { data: projects } = await sb.from('projects').select('id,user_id,name,project_type,deployed_url,created_at')

const total = projects.length
const deployed = projects.filter(p => p.deployed_url).length
const notDeployed = total - deployed

// Projects that have been built (had a credit burn) vs just scaffolded
// Check credit_usage for build events
const { data: builds } = await sb.from('credit_usage').select('user_id,reason').in('reason', ['web-build','mobile-build','website-build','saas-build'])

const builtUserIds = new Set(builds.map(b => b.user_id))
const builtProjects = projects.filter(p => builtUserIds.has(p.user_id))
const builtAndDeployed = builtProjects.filter(p => p.deployed_url)

// By type
const byType = {}
for (const p of projects) {
  const t = p.project_type || 'unknown'
  if (!byType[t]) byType[t] = { total: 0, deployed: 0 }
  byType[t].total++
  if (p.deployed_url) byType[t].deployed++
}

// Recent 7 days
const since7d = new Date(Date.now() - 7 * 86400000).toISOString()
const recent = projects.filter(p => p.created_at >= since7d)
const recentDeployed = recent.filter(p => p.deployed_url)

console.log(`\n── Deploy Stats ──`)
console.log(`Total projects:        ${total}`)
console.log(`Deployed:              ${deployed}  (${Math.round(deployed/total*100)}%)`)
console.log(`Not deployed:          ${notDeployed}  (${Math.round(notDeployed/total*100)}%)`)
console.log(``)
console.log(`Users who've built:    ${builtUserIds.size}`)
console.log(`Built + deployed:      ${builtAndDeployed.length}  (${Math.round(builtAndDeployed.length/Math.max(builtUserIds.size,1)*100)}% of builders deployed)`)
console.log(``)
console.log(`Last 7 days:           ${recent.length} projects, ${recentDeployed.length} deployed (${Math.round(recentDeployed.length/Math.max(recent.length,1)*100)}%)`)
console.log(``)
console.log(`── By project type ──`)
for (const [type, stats] of Object.entries(byType).sort((a,b) => b[1].total - a[1].total)) {
  const pct = Math.round(stats.deployed/stats.total*100)
  console.log(`  ${type.padEnd(12)} ${stats.total} total, ${stats.deployed} deployed (${pct}%)`)
}

// Sample of built-but-not-deployed
console.log(`\n── Recent builds NOT deployed (last 10) ──`)
const { data: recentBuilds } = await sb.from('credit_usage').select('user_id,reason,created_at').in('reason', ['web-build','mobile-build','website-build','saas-build']).order('created_at', { ascending: false }).limit(20)
const userIds = [...new Set(recentBuilds.map(b => b.user_id))]
const { data: profiles } = await sb.from('profiles').select('id,email,plan').in('id', userIds)
const profileMap = Object.fromEntries((profiles||[]).map(p => [p.id, p]))

let shown = 0
for (const b of recentBuilds) {
  const userProjects = projects.filter(p => p.user_id === b.user_id && !p.deployed_url)
  if (userProjects.length && shown < 10) {
    const prof = profileMap[b.user_id]
    console.log(`  ${b.created_at.slice(0,16).replace('T',' ')}  ${b.reason}  ${prof?.email || b.user_id.slice(0,8)}  [${prof?.plan}]`)
    for (const pr of userProjects.slice(0,2)) console.log(`    · "${pr.name}" [${pr.project_type}] - not deployed`)
    shown++
  }
}
