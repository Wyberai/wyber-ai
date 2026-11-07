// Internal CRM from the terminal. Run with: npx vite-node scripts/crm.ts <command>
//
//   sync                         pull expo leads, consult bookings and active signups into the CRM
//   import <file.csv> [options]  import a lead list
//        --source apollo         where the list came from (default: import)
//        --segment business      business | software | student
//        --country India
//        --tags a,b              tags to add
//        --dry                   read the file and show what WOULD happen; writes nothing, needs no database
//   queue                        today's list: who to contact and why
//   brief                        the revenue brief (same text as the daily email)
//
// Reads .env.local for the Supabase service key. Prints counts, never contact details.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { csvToIncoming } from '../src/lib/crm/csv'
import { planSync } from '../src/lib/crm/upsert'
import { collectIncoming, loadContacts, syncIncoming } from '../src/lib/crm/db'
import { todayQueue, COLD_LEAD_MIN_SCORE } from '../src/lib/crm/queue'
import { buildBrief } from '../src/lib/crm/brief'

dotenv.config({ path: '.env.local' })
const [cmd, ...rest] = process.argv.slice(2)
const flag = (n: string) => rest.includes(n)
const opt = (n: string) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : undefined }

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

async function main() {
  if (cmd === 'import') {
    const file = rest.find(a => !a.startsWith('--') && a !== opt('--source') && a !== opt('--segment') && a !== opt('--country') && a !== opt('--tags'))
    if (!file) throw new Error('Usage: import <file.csv> [--source x] [--segment business] [--country India] [--tags a,b] [--dry]')
    const { incoming, headers, unmapped } = csvToIncoming(readFileSync(file, 'utf8'), {
      source: opt('--source') ?? 'import', segment: opt('--segment'), country: opt('--country'),
      tags: (opt('--tags') ?? '').split(',').map(t => t.trim()).filter(Boolean),
    })
    console.log(`Read ${incoming.length} rows. Columns: ${headers.length}. Unused columns: ${unmapped.join(', ') || 'none'}`)
    const withEmail = incoming.filter(i => i.email).length
    const withPhone = incoming.filter(i => i.phone).length
    console.log(`With email: ${withEmail}   with phone: ${withPhone}   with company: ${incoming.filter(i => i.company).length}   with title: ${incoming.filter(i => i.title).length}`)

    if (flag('--dry')) {
      const plan = planSync([], incoming)
      const owned = plan.skipped.filter(s => s.reason === 'owned').length
      console.log(`DRY RUN (nothing written): would add ${plan.inserts.length} contacts, merge ${incoming.length - plan.inserts.length - plan.skipped.length} duplicates within the file, skip ${owned} of your own addresses and ${plan.skipped.length - owned} unusable rows.`)
      const scores = plan.inserts.map(r => r.score).sort((a, b) => b - a)
      if (scores.length) console.log(`Scores: best ${scores[0]}, median ${scores[Math.floor(scores.length / 2)]}, worst ${scores[scores.length - 1]}; ${scores.filter(s => s >= COLD_LEAD_MIN_SCORE).length} clear the ${COLD_LEAD_MIN_SCORE}-point bar to surface in Today unprompted.`)
      const byStage: Record<string, number> = {}
      for (const r of plan.inserts) byStage[r.stage] = (byStage[r.stage] ?? 0) + 1
      console.log('Stages: ' + Object.entries(byStage).map(([k, v]) => `${k} ${v}`).join(', '))
      return
    }
    const r = await syncIncoming(admin(), incoming)
    console.log(`Imported: ${r.inserted} new, ${r.updated} enriched, ${r.skippedOwned} of your own skipped, ${r.skippedInvalid} unusable.${r.errors.length ? ' Errors: ' + r.errors.join('; ') : ''}`)
    return
  }

  if (cmd === 'sync') {
    const a = admin()
    const { incoming, counts, warnings } = await collectIncoming(a)
    console.log(`Found: expo ${counts.expo}, consults ${counts.consult}, active signups ${counts.signups}.${warnings.length ? ' Notes: ' + warnings.join('; ') : ''}`)
    const r = await syncIncoming(a, incoming)
    console.log(`Synced: ${r.inserted} new, ${r.updated} enriched, ${r.skippedOwned} of your own skipped.${r.errors.length ? ' Errors: ' + r.errors.join('; ') : ''}`)
    return
  }

  if (cmd === 'queue' || cmd === 'brief') {
    const contacts = await loadContacts(admin())
    if (cmd === 'brief') { console.log(buildBrief(contacts).text); return }
    const q = todayQueue(contacts, new Date(), 25)
    if (!q.length) console.log('Nothing urgent.')
    for (const [i, item] of q.entries()) console.log(`${String(i + 1).padStart(2)}. ${item.name}: ${item.reason}`)
    return
  }

  console.log('Commands: sync | import <file.csv> [--source x --segment business --country India --tags a,b --dry] | queue | brief')
}

main().catch(e => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1 })
