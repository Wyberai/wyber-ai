// Growth Outreach — daily scan for "product-stuck" signals: free-plan users who
// signed up, built at least one project, and never published it. This is a warm
// signal (they tried the product), not a cold list.
//
// Pipeline: find candidates → upsert into growth_signals (dedup via the table's
// own unique index, never re-flags an already-actioned row) → for the top N
// still-'new' stuck_rescue rows, enrich via Apollo (name/company/title) and
// draft a genuine 1:1 personalization line via Claude → mark 'queued'.
//
// Usage:
//   node scripts/growth-signals-scan.mjs                # full run
//   node scripts/growth-signals-scan.mjs --dry-run       # find + draft, no Apollo call, no DB writes
//   node scripts/growth-signals-scan.mjs --max-enrich=5  # cap Apollo+Claude spend this run (default 10)
//   node scripts/growth-signals-scan.mjs --min-age-days=3 --max-age-days=30

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=')
  return [k, v ?? true]
}))
const DRY_RUN = !!args['dry-run']
const MAX_ENRICH = Number(args['max-enrich'] ?? 10)
const MIN_AGE_DAYS = Number(args['min-age-days'] ?? 3)
const MAX_AGE_DAYS = Number(args['max-age-days'] ?? 30)

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()

// ── 1. find stuck signups ──────────────────────────────────────────────────
async function findStuckSignups() {
  const { data: profiles, error: pErr } = await sb
    .from('profiles')
    .select('id, email, full_name, plan, credits, created_at')
    .eq('plan', 'free')
    .eq('email_opt_out', false)
    .lte('created_at', daysAgo(MIN_AGE_DAYS))
    .gte('created_at', daysAgo(MAX_AGE_DAYS))
  if (pErr) throw new Error('profiles query: ' + pErr.message)
  if (!profiles.length) return []

  const ids = profiles.map(p => p.id)
  const { data: projects, error: prErr } = await sb
    .from('projects')
    .select('id, user_id, name, created_at, updated_at, published_url')
    .in('user_id', ids)
  if (prErr) throw new Error('projects query: ' + prErr.message)

  const byUser = new Map()
  for (const proj of projects) {
    if (!byUser.has(proj.user_id)) byUser.set(proj.user_id, [])
    byUser.get(proj.user_id).push(proj)
  }

  const candidates = []
  for (const p of profiles) {
    if (p.email?.toLowerCase().endsWith('@wyberai.com')) continue // internal/test accounts, never a real lead
    const own = byUser.get(p.id) || []
    if (own.length === 0) continue // never built anything — not a "stuck" signal, just unactivated
    if (own.some(pr => pr.published_url)) continue // published something — not stuck
    const latest = own.reduce((a, b) => (a.updated_at > b.updated_at ? a : b))
    candidates.push({
      person_identifier: p.email,
      person_name: p.full_name || null,
      signal_detail: `Signed up ${p.created_at.slice(0, 10)}, built ${own.length} project(s), never published. ${p.credits} credits remaining.`,
      intent_score: Math.min(100, 30 + own.length * 10 + (Date.parse(latest.updated_at) > Date.now() - 7 * 86400000 ? 20 : 0)),
      project_name: latest.name,
      credits: p.credits,
      signup_date: p.created_at.slice(0, 10),
    })
  }
  return candidates
}

// ── 2. upsert candidates (dedup is the table's job) ────────────────────────
async function upsertCandidates(candidates) {
  if (!candidates.length) return { inserted: 0 }
  const rows = candidates.map(c => ({
    source: 'product_stuck',
    channel: 'product',
    person_identifier: c.person_identifier,
    person_name: c.person_name,
    signal_detail: c.signal_detail,
    intent_score: c.intent_score,
    segment: 'stuck_rescue',
    recommended_action: `Send a warm 1:1 note referencing their "${c.project_name}" build and ${c.credits} remaining credits — offer to help them finish, not a pitch.`,
    status: 'new',
    metadata: { project_name: c.project_name, credits: c.credits, signup_date: c.signup_date },
  }))
  const { data, error } = await sb
    .from('growth_signals')
    .upsert(rows, { onConflict: 'source,person_identifier,source_url', ignoreDuplicates: true })
    .select('id')
  if (error) throw new Error('upsert: ' + error.message)
  return { inserted: data?.length ?? 0 }
}

// ── 3. Apollo enrichment (sparing — trial credit budget) ───────────────────
async function enrichApollo(email) {
  if (!process.env.APOLLO_API_KEY) return null
  try {
    const res = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.APOLLO_API_KEY}` },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) { console.warn(`  ! Apollo ${res.status} for ${email}`); return null }
    const j = await res.json()
    const person = j?.person
    if (!person) return null
    return {
      name: [person.first_name, person.last_name].filter(Boolean).join(' ') || null,
      title: person.title || null,
      company: person.organization?.name || null,
    }
  } catch (e) {
    console.warn(`  ! Apollo request failed for ${email}: ${e.message}`)
    return null
  }
}

// ── 4. draft a genuine 1:1 opening line ────────────────────────────────────
async function draftPersonalization(row, enriched) {
  const projectName = row.metadata?.project_name || row.project_name || null
  const prompt = `Write ONE short, genuine opening line (max 2 sentences, no greeting, no sign-off) for a founder-to-user email. Context: this person signed up for WyberAi (an AI app builder). What we know about them: ${row.signal_detail}${projectName ? ` Their project is named "${projectName}".` : ''}${enriched?.company ? ` They work at ${enriched.company}${enriched.title ? ' as ' + enriched.title : ''}.` : ''}

Write it like a founder who noticed someone got stuck and wants to genuinely help them finish — not a sales pitch, no "just checking in", no exclamation points, no emoji. Reference something specific from what we know about them. Output ONLY the line itself, nothing else.`
  const res = await ai.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })
  return res.content.find(b => b.type === 'text')?.text?.trim() || null
}

// ── run ──────────────────────────────────────────────────────────────────
console.log(`\nGrowth Outreach scan${DRY_RUN ? ' (DRY RUN)' : ''} · window ${MIN_AGE_DAYS}-${MAX_AGE_DAYS}d · max enrich ${MAX_ENRICH}\n`)

const candidates = await findStuckSignups()
console.log(`› found ${candidates.length} stuck-signup candidate(s) this scan`)

if (!DRY_RUN && candidates.length) {
  const { inserted } = await upsertCandidates(candidates)
  console.log(`  ${inserted} new row(s) inserted (existing ones left untouched by design)`)
} else if (DRY_RUN) {
  for (const c of candidates) console.log(`  · ${c.person_identifier} — ${c.signal_detail}`)
}

// pull rows still needing enrichment+draft (includes today's inserts + any earlier 'new' rows)
let toProcess = []
if (!DRY_RUN) {
  const { data, error } = await sb
    .from('growth_signals')
    .select('id, person_identifier, person_name, signal_detail, metadata')
    .eq('segment', 'stuck_rescue')
    .eq('status', 'new')
    .order('intent_score', { ascending: false })
    .limit(MAX_ENRICH)
  if (error) throw new Error('select for enrich: ' + error.message)
  toProcess = data
} else {
  toProcess = candidates.slice(0, MAX_ENRICH).map(c => ({ id: null, person_identifier: c.person_identifier, person_name: c.person_name, signal_detail: c.signal_detail, metadata: {}, ...c }))
}

console.log(`\n› enriching + drafting up to ${toProcess.length} lead(s)${DRY_RUN ? ' (Apollo skipped in dry-run)' : ''}`)
let apolloUsed = 0
let queued = 0
for (const row of toProcess) {
  const enriched = DRY_RUN ? null : await enrichApollo(row.person_identifier)
  if (enriched) apolloUsed++
  const draft = await draftPersonalization(row, enriched)
  console.log(`  · ${row.person_identifier}${enriched?.name ? ` (${enriched.name}${enriched.company ? ', ' + enriched.company : ''})` : ''}`)
  console.log(`    "${draft}"`)
  if (!DRY_RUN && row.id) {
    const { error } = await sb.from('growth_signals').update({
      drafted_response: draft,
      metadata: { ...(row.metadata || {}), ...(enriched || {}) },
      status: 'queued',
    }).eq('id', row.id)
    if (error) console.warn(`    ! update failed: ${error.message}`)
    else queued++
  }
}

console.log(`\n── summary ──`)
console.log(`candidates found: ${candidates.length}`)
console.log(`Apollo credits used: ${apolloUsed}`)
console.log(`queued for send: ${queued}${DRY_RUN ? ' (dry-run — nothing written)' : ''}`)
console.log('Done.\n')
