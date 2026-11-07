// Ahmedabad small-team owner leads via Apollo. Spends credits ONLY in the `enrich` stage.
// Usage:
//   node scripts/gujarat-expo-leads.mjs search  <workdir>            (free: search + local pre-filters)
//   node scripts/gujarat-expo-leads.mjs enrich  <workdir> <maxReveals> [keepTarget]
//   node scripts/gujarat-expo-leads.mjs finish  <workdir> <outCsv>   (DNS/website checks + 16-col CSV)
// Key is read from .env.local and never printed.
import fs from 'node:fs'
import path from 'node:path'
import dns from 'node:dns/promises'

// The local Windows resolver refuses Node's DNS queries (ECONNREFUSED), which makes every MX check
// look like "no MX". Use public resolvers instead.
dns.setServers(['8.8.8.8', '1.1.1.1'])

const [stage, workdir, a3, a4] = process.argv.slice(2)
fs.mkdirSync(workdir, { recursive: true })
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^APOLLO_API_KEY=(.*)$/)
  if (m) process.env.K = m[1].replace(/^['"]|['"]$/g, '')
}
if (!process.env.K) throw new Error('APOLLO_API_KEY missing')

const H = { 'Content-Type': 'application/json', 'x-api-key': process.env.K, 'Cache-Control': 'no-cache' }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const OWN = /reconsignal|continuum|wyberai|signalpulse|sumit\.sutar|vthaku89/i

// Name keywords for sectors we exclude (checked BEFORE spending credits), and again on industry after reveal.
const EXCL_NAME = /agri|agro|farm|dairy|seed|fertili[sz]|pesticid|kisan|krishi|fisher|poultry|mining|\bmines?\b|cattle|horticult|tractor|irrigation|cotton ginning|oil mill|rice mill|flour mill/i
const EXCL_INDUSTRY = /agricult|farming|dairy|fisher|ranching|mining|metals & mining|food production/i
const TITLE_OK = /\b(founder|co-?founder|owner|proprietor|ceo|chief executive|managing director|managing partner|partner|md)\b/i
const TITLE_BAD = /\b(former|ex-|advisor|adviser|consultant|intern|student|assistant|manager|associate|retired|vice president|vp|head of|lawyer|advocate|chartered accountant)\b/i

const file = n => path.join(workdir, n)
const load = (n, d) => (fs.existsSync(file(n)) ? JSON.parse(fs.readFileSync(file(n), 'utf8')) : d)
const save = (n, v) => fs.writeFileSync(file(n), JSON.stringify(v, null, 1))

async function post(url, body) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { method: 'POST', headers: H, body: JSON.stringify(body) })
    if (r.status === 429) { await sleep(15000); continue }
    const t = await r.text()
    if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)}`)
    return JSON.parse(t)
  }
  throw new Error('rate limited')
}

if (stage === 'search') {
  const seen = new Set(); const raw = []
  for (const range of [['1,10'], ['11,50']]) {
    for (let page = 1; page <= 25; page++) {
      const j = await post('https://api.apollo.io/api/v1/mixed_people/api_search', {
        person_locations: ['Ahmedabad, Gujarat, India'],
        organization_locations: ['Ahmedabad, Gujarat, India'],
        person_titles: ['founder', 'co-founder', 'owner', 'proprietor', 'ceo', 'managing director', 'partner'],
        include_similar_titles: false,
        organization_num_employees_ranges: range,
        contact_email_status: ['verified'],
        per_page: 100, page,
      })
      const people = j.people || []
      for (const p of people) if (!seen.has(p.id)) { seen.add(p.id); raw.push(p) }
      if (page === 1) console.log(`range ${range}: total_entries=${j.total_entries}`)
      if (people.length < 100) break
      await sleep(1200)
    }
  }
  const stats = { raw: raw.length, noEmail: 0, badTitle: 0, exclName: 0, stale: 0, dupOrg: 0 }
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 548 // ~18 months
  const orgs = new Set(); const keep = []
  for (const p of raw) {
    const org = (p.organization?.name || '').trim()
    if (!p.has_email) { stats.noEmail++; continue }
    if (!TITLE_OK.test(p.title || '') || TITLE_BAD.test(p.title || '')) { stats.badTitle++; continue }
    if (EXCL_NAME.test(org)) { stats.exclName++; continue }
    if (p.last_refreshed_at && Date.parse(p.last_refreshed_at) < cutoff) { stats.stale++; continue }
    const k = org.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!k || orgs.has(k)) { stats.dupOrg++; continue }
    orgs.add(k); keep.push({ id: p.id, first_name: p.first_name, title: p.title, org })
  }
  save('candidates.json', keep)
  console.log(JSON.stringify({ ...stats, candidates: keep.length }))
}

if (stage === 'enrich') {
  const maxReveals = Number(a3); const keepTarget = Number(a4 || 500)
  const cands = load('candidates.json', []); const done = load('enriched.json', { ids: [], kept: [], dropped: [], reveals: 0 })
  const todo = cands.filter(c => !done.ids.includes(c.id))
  for (let i = 0; i < todo.length && done.reveals < maxReveals && done.kept.length < keepTarget; i += 10) {
    const batch = todo.slice(i, i + Math.min(10, maxReveals - done.reveals))
    const j = await post('https://api.apollo.io/api/v1/people/bulk_match', {
      details: batch.map(b => ({ id: b.id })), reveal_personal_emails: false, reveal_phone_number: false,
    })
    for (const m of j.matches || []) {
      if (!m) continue
      done.ids.push(m.id)
      if (m.email) done.reveals++ // a revealed work email is what Apollo charges for
      const o = m.organization || {}
      const email = (m.email || '').toLowerCase()
      const why = []
      if (!email || m.email_status !== 'verified') why.push(`email_status=${m.email_status}`)
      if (OWN.test(email)) why.push('owned')
      if (!/ahmedabad/i.test(`${m.city || ''} ${o.city || ''}`)) why.push(`city=${m.city || o.city}`)
      if (o.estimated_num_employees && o.estimated_num_employees > 50) why.push(`employees=${o.estimated_num_employees}`)
      if (EXCL_INDUSTRY.test(`${o.industry || ''}`) || EXCL_NAME.test(o.name || '')) why.push(`industry=${o.industry}`)
      const rec = {
        id: m.id, first_name: m.first_name, last_name: m.last_name, email, email_status: m.email_status, title: m.title,
        linkedin: m.linkedin_url || '', city: m.city || o.city || '', state: m.state || o.state || '',
        company: o.name || '', website: o.website_url || '', domain: o.primary_domain || '', industry: o.industry || '',
        employees: o.estimated_num_employees || '', phone: o.phone || '',
      }
      if (why.length) done.dropped.push({ ...rec, why: why.join('; ') }); else done.kept.push(rec)
    }
    for (const b of batch) if (!done.ids.includes(b.id)) done.ids.push(b.id) // unmatched: no charge
    save('enriched.json', done)
    console.log(`batch done: reveals=${done.reveals} kept=${done.kept.length} dropped=${done.dropped.length}`)
    await sleep(1500)
  }
}

if (stage === 'finish') {
  const out = a3
  const { kept } = load('enriched.json', { kept: [] })
  const rows = []; const rejected = []
  const seenDomain = new Set()
  for (const r of kept) {
    const dom = (r.domain || r.email.split('@')[1] || '').toLowerCase()
    if (seenDomain.has(dom)) { rejected.push({ ...r, why: 'duplicate company domain' }); continue }
    let esp = 'Other', mx = []
    try { mx = await dns.resolveMx(r.email.split('@')[1]) } catch { /* no MX */ }
    if (!mx.length) { rejected.push({ ...r, why: 'no MX' }); continue }
    const mxs = mx.map(m => m.exchange.toLowerCase()).join(' ')
    esp = /google|gmail/.test(mxs) ? 'Google' : /outlook|protection\.outlook|microsoft/.test(mxs) ? 'Outlook' : 'Other'
    let live = false
    if (dom) {
      for (const host of [dom, `www.${dom}`]) {
        try { if ((await dns.resolve4(host)).length > 0) { live = true; break } } catch { /* try next host */ }
      }
    }
    if (!live) { rejected.push({ ...r, why: 'website domain does not resolve' }); continue }
    seenDomain.add(dom)
    rows.push({ r, esp })
  }
  const link = 'https://wyberai.com/expo?utm_source=email&utm_campaign=expo'
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = 'First Name,Last Name,Email,Phone Number,Company Name,Website,LinkedIn Profile,Location,Status,Category,ESP Type,Current Sequence Number,url,country,industry,job_title'
  const lines = rows.map(({ r, esp }) => [r.first_name, r.last_name, r.email, r.phone, r.company, r.website, r.linkedin, [r.city, r.state].filter(Boolean).join(', '), 'New', 'Ahmedabad small team', esp, 0, link, 'India', r.industry, r.title].map(q).join(','))
  fs.writeFileSync(out, '﻿' + [head, ...lines].join('\r\n'))
  save('rejected.json', rejected)
  console.log(JSON.stringify({ kept: kept.length, written: rows.length, rejected: rejected.length }))
}
