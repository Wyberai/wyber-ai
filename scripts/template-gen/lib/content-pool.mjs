// Shared vocabulary pools + a compact-spec assembler, so each new SaaS/Web-App
// category only has to supply what's genuinely vertical-specific (fields, real
// rows, KPI numbers) — names, activity phrasing, and notification phrasing get
// mechanically assembled from real, varied pools instead of hand-authored per
// template. This is what makes scaling past the first 10 tractable.

export const FIRST_NAMES = [
  'Sarah', 'Marcus', 'Priya', 'James', 'Aisha', 'Tomás', 'Elena', 'Kwame', 'Mei', 'Arjun',
  'Ingrid', 'Rafael', 'Naomi', 'Diego', 'Helga', 'Owen', 'Colette', 'Julian', 'Beatrix', 'Felix',
  'Marguerite', 'Rem', 'Yuki', 'Dara', 'Liv', 'Rosa', 'David', 'Sun', 'Paulo', 'Grace',
  'Isabelle', 'Rupert', 'Noelle', 'Théo', 'Simone', 'Kofi', 'Ines', 'Amara', 'Adrian', 'Nina',
]
export const LAST_NAMES = [
  'Chen', 'Rivera', 'Sharma', "O'Brien", 'Patel', 'Kowalski', 'Vasquez', 'Asante', 'Zhou', 'Nair',
  'Solheim', 'Achebe', 'Sato', 'Álvarez', 'Berg', 'Fairbanks', 'Verrier', 'Cass', 'Ondo', 'Marchetti',
  'Fontaine', 'Tanaka', 'Okonkwo', 'Bergström', 'Mancini', 'Reyes', 'Kwan', 'Almeida', 'Whitfield', 'Ellison',
  'Vale', 'Ashcombe', 'Devereux', 'Marchand', 'Achterberg', 'Mensah', 'Duarte', 'Osei', 'Harrow', 'Solis',
]
export const COMPANY_WORDS_A = [
  'Whitfield', 'Meridian', 'Ashgrove', 'Halden', 'Ridgeline', 'Fenwick', 'Delacroix', 'Marchbanks', 'Blackwood',
  'Northgate', 'Coppermill', 'Palladium', 'Ferrous', 'Alderman', 'Cascade', 'Tamarisk', 'Prairie', 'Highland',
  'Salton', 'Kestrel', 'Vantage', 'Redshaw', 'Brightwell', 'Birchwood', 'Sundstrom', 'Pemberton', 'Aldergate',
]
export const COMPANY_WORDS_B = [
  'Holdings', 'Partners', 'Group', 'Collective', 'Ventures', 'Industries', 'Trust', 'Associates', 'Capital',
  'Studio', 'Foundation', 'Alliance', 'Network', 'Consortium', 'Guild', 'Works', 'Cooperative',
]

export function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)] }

export function personName(rnd) { return `${pick(FIRST_NAMES, rnd)} ${pick(LAST_NAMES, rnd)}` }
export function initials(name) { return name.split(' ').map((w) => w[0]).join('') }

export function companyName(rnd) {
  return `${pick(COMPANY_WORDS_A, rnd)} ${pick(COMPANY_WORDS_B, rnd)}`
}

const ACTIVITY_VERBS = [
  (n, f) => `${n} moved to ${f}`,
  (n, f) => `New record opened for ${n} — ${f}`,
  (n, f) => `${n} updated — now in ${f}`,
  (n, f) => `Follow-up completed for ${n}`,
  (n, f) => `${n} flagged for review — ${f}`,
]
const TIME_AGO = ['12 minutes ago', '45 minutes ago', '1 hour ago', '3 hours ago', 'yesterday', '2 days ago']

export function genActivity(rnd, count, fieldPool) {
  const out = []
  for (let i = 0; i < count; i++) {
    const name = pick(rnd() > 0.5 ? [companyName(rnd)] : [personName(rnd)], rnd)
    const verb = pick(ACTIVITY_VERBS, rnd)
    out.push({ label: verb(name, pick(fieldPool, rnd)), time: TIME_AGO[Math.min(i, TIME_AGO.length - 1)] })
  }
  return out
}

const NOTIF_TITLES = ['Status updated', 'New record added', 'Review requested', 'Task completed', 'Reminder']
export function genNotifications(rnd, count, fieldPool) {
  const tones = ['default', 'outline', 'solid', 'default']
  const out = []
  for (let i = 0; i < count; i++) {
    const name = rnd() > 0.5 ? companyName(rnd) : personName(rnd)
    out.push({
      title: pick(NOTIF_TITLES, rnd),
      description: `${name} — ${pick(fieldPool, rnd)}.`,
      time: TIME_AGO[Math.min(i, TIME_AGO.length - 1)],
      unread: i < 2,
      tone: tones[i % tones.length],
    })
  }
  return out
}

const ROLES = ['Owner', 'Partner', 'Manager', 'Lead', 'Associate', 'Coordinator']
export function genTeam(rnd, count, domain) {
  const out = []
  for (let i = 0; i < count; i++) {
    const name = personName(rnd)
    const slug = name.toLowerCase().replace(/\s+/g, '.')
    out.push({ name, email: `${slug}@${domain}`, role: i === 0 ? 'Owner' : pick(ROLES.slice(1), rnd) })
  }
  return out
}

export function genSpark(base, growth, rnd) {
  const out = []
  let v = base
  for (let i = 0; i < 8; i++) { v += growth * (0.7 + rnd() * 0.6); out.push(Math.round(v)) }
  return out
}

export function genWeeklyBars(base, rnd) {
  return Array.from({ length: 8 }, (_, i) => ({ label: `W${i + 1}`, value: Math.round(base * (0.6 + rnd() * 0.8)) }))
}

/**
 * Generate primaryTable rows from a light spec instead of hand-written rows:
 * real per-vertical vocabulary (itemTypes, details — still hand-authored,
 * genuinely domain-specific) combined with the name pools to produce varied
 * subject/owner combinations. col3 is the "owner" field (staff/agent/advisor
 * name) unless spec.rows.ownerless is set, in which case it's pulled from
 * itemTypes/details instead (for verticals with no per-row staff owner).
 */
export function genRows(rnd, rowsSpec, staffPool) {
  const { count, subjectKind, itemTypes, details, statuses, statusWeights } = rowsSpec
  const weighted = statusWeights || statuses
  const out = []
  for (let i = 0; i < count; i++) {
    const subject = subjectKind === 'company' ? companyName(rnd) : personName(rnd)
    const owner = rowsSpec.ownerless ? pick(details, rnd) : pick(staffPool, rnd)
    const cells = [subject, pick(itemTypes, rnd), owner, pick(details, rnd)]
    out.push({ cells, status: pick(weighted, rnd) })
  }
  return out
}

/**
 * Assemble a full category config from a compact spec. `spec` supplies the
 * genuinely vertical-specific parts by hand (name, columns, item-type/detail
 * vocabulary, KPI labels/values); everything else (rows, activity,
 * notifications, team, sparks, weekly bars) is mechanically generated from
 * the pools above, seeded so output is stable across re-runs.
 */
export function assembleConfig(spec) {
  const rnd = seededRandom(spec.seed)
  const domain = spec.appName.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.com'
  const staffPool = Array.from({ length: 4 }, () => personName(rnd)).map((n) => {
    const parts = n.split(' ')
    return `${parts[0][0]}. ${parts[1]}`
  })
  const rows = spec.primaryTable.rows || genRows(rnd, spec.primaryTable.rowsSpec, staffPool)
  const primaryTable = { columns: spec.primaryTable.columns, filters: spec.primaryTable.filters, rows }
  const fieldPool = spec.primaryTable.rowsSpec ? spec.primaryTable.rowsSpec.itemTypes : rows.map((r) => r.cells[1])

  return {
    description: spec.description,
    appName: spec.appName,
    tagline: spec.tagline,
    loginQuote: spec.loginQuote,
    navIcon: spec.navIcon,
    primaryFeatureRoute: spec.primaryFeatureRoute,
    primaryFeaturePascal: spec.primaryFeaturePascal,
    primaryFeatureLabel: spec.primaryFeatureLabel,
    primaryFeatureSingular: spec.primaryFeatureSingular,
    greetingName: personName(rnd),
    greetingInsight: spec.greetingInsight,
    dashboardVariant: spec.dashboardVariant || 'activity',
    highlights: spec.highlights,
    kpis: spec.kpis.map((k) => ({ ...k, spark: genSpark(k.value * 0.75, k.value * 0.03, rnd) })),
    weeklyBars: genWeeklyBars(spec.weeklyBase || 10, rnd),
    activity: genActivity(rnd, 5, fieldPool),
    primaryTable,
    analyticsKpis: spec.analyticsKpis,
    trend: spec.trend,
    sources: spec.sources,
    rankedTable: spec.rankedTable || {
      label: spec.rankedLabel || 'Top performers',
      rows: staffPool.slice(0, 3).map((name, i) => ({ name, value: Math.round((spec.kpis[0].value * 0.4) * (1 - i * 0.25)) })),
    },
    notifications: genNotifications(rnd, 4, fieldPool),
    team: genTeam(rnd, 4, domain),
  }
}
