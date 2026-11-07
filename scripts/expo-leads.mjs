// Tech Expo Gujarat booth leads: list, export and update status.
//
//   node scripts/expo-leads.mjs                  # table of leads, newest first
//   node scripts/expo-leads.mjs --status new     # only leads in a status
//   node scripts/expo-leads.mjs --csv > leads.csv
//   node scripts/expo-leads.mjs --set <id-prefix> contacted "called 4pm"
//
// Needs migration 20261107020000_expo_leads.sql. Reads .env.local.
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const STATUSES = ['new', 'contacted', 'meeting_booked', 'met_at_booth', 'building', 'won', 'lost']
const args = process.argv.slice(2)
const flag = n => args.includes(n)
const val = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null }

// The founder's own test submissions must not count as leads.
const OWNED = ['hello@wyberai.com', 'sumeet.sutar@tryreconsignal.com', 'sumit.sutar259@gmail.com', 'reconsignal', 'continuum', 'vthaku89']
const isOwned = l => OWNED.some(o => (l.email || '').toLowerCase().includes(o))

if (flag('--set')) {
  const i = args.indexOf('--set')
  const [prefix, status, ...note] = args.slice(i + 1)
  if (!prefix || !STATUSES.includes(status)) { console.error(`Usage: --set <id-prefix> <${STATUSES.join('|')}> [note]`); process.exit(1) }
  const { data: all, error } = await sb.from('expo_leads').select('id, name').order('created_at', { ascending: false })
  if (error) { console.error(error.message); process.exit(1) }
  const hits = all.filter(l => l.id.startsWith(prefix))
  if (hits.length !== 1) { console.error(hits.length ? `Prefix matches ${hits.length} leads; use more characters.` : 'No lead with that id prefix.'); process.exit(1) }
  const patch = { status, updated_at: new Date().toISOString(), ...(note.length ? { notes: note.join(' ') } : {}) }
  const { error: uErr } = await sb.from('expo_leads').update(patch).eq('id', hits[0].id)
  if (uErr) { console.error(uErr.message); process.exit(1) }
  console.log(`${hits[0].name}: ${status}`)
  process.exit(0)
}

let q = sb.from('expo_leads').select('*').order('created_at', { ascending: false })
if (val('--status')) q = q.eq('status', val('--status'))
const { data, error } = await q
if (error) { console.error(error.message.includes('expo_leads') ? 'Table missing: apply migration 20261107020000_expo_leads.sql' : error.message); process.exit(1) }
const leads = (data || []).filter(l => !isOwned(l))

// Which sequence emails each lead has received (needs migration 20261107030000).
const sentMap = new Map()
if (leads.length) {
  const { data: sent } = await sb.from('expo_lead_emails').select('lead_id, kind').in('lead_id', leads.map(l => l.id))
  for (const r of sent || []) sentMap.set(r.lead_id, [...(sentMap.get(r.lead_id) || []), r.kind])
}

if (flag('--csv')) {
  const cols = ['created_at', 'status', 'name', 'whatsapp', 'email', 'business', 'audience', 'preferred_day', 'source', 'pain_point', 'notes', 'id']
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  console.log(cols.join(','))
  for (const l of leads) console.log(cols.map(c => esc(l[c])).join(','))
  process.exit(0)
}

console.log(`\n${leads.length} lead(s)${data.length !== leads.length ? ` (${data.length - leads.length} owned/test excluded)` : ''}\n`)
const counts = {}
for (const l of leads) counts[l.status] = (counts[l.status] || 0) + 1
console.log(STATUSES.map(s => `${s}: ${counts[s] || 0}`).join('   '))
console.log('')
for (const l of leads) {
  console.log(`${l.id.slice(0, 8)}  ${l.created_at.slice(5, 16).replace('T', ' ')}  [${l.status}]  ${l.name} · ${l.whatsapp} · ${l.preferred_day} · ${l.source}`)
  console.log(`          ${l.business ? l.business + ' — ' : ''}${l.pain_point.slice(0, 110)}`)
  console.log(`          email: ${l.email ? (l.email_opt_out ? 'OPTED OUT' : (sentMap.get(l.id) || []).join(', ') || 'none sent yet') : 'no email given (WhatsApp only)'}`)
}
const stale = leads.filter(l => l.status === 'new' && Date.now() - new Date(l.created_at).getTime() > 4 * 3600_000)
if (stale.length) console.log(`\n${stale.length} lead(s) still "new" after 4h: reply on WhatsApp.`)
console.log('')
