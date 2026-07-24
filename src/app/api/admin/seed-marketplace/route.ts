import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST /api/admin/seed-marketplace
// Bootstraps the marketplace with "studio" listings copied from prebuilt_apps
// — the platform's own catalog of real, already-generated apps (currently
// only used to instantly load a free starting template in /gallery). Only
// rows that have genuine generated source (not the metadata-only
// `{ prompt: ... }` placeholder some prebuilt_apps rows still carry — see
// generate-templates route) are eligible; a marketplace buyer pays real
// money and must get a real working app, not a prompt.
//
// prebuilt_apps itself is never modified — marketplace_listings.files is an
// independent snapshot, so pricing/moderation on listings can't affect the
// free /gallery flow, and re-running this seed is safe (upserts by name).

// Impulse-buy band — deliberately undercuts every other price anchor in the
// app (cheapest plan is $6/mo, cheapest credit top-up is $19) so a listing
// reads as its own cheap tier instead of "another top-up."
const PRICE_POINTS = [5, 7, 9, 12, 15]

// Deterministic "price" per app so re-seeding never reshuffles prices —
// simple string hash into the PRICE_POINTS table, banded a bit richer for
// categories that read as more complex/business-critical.
const PREMIUM_CATEGORIES = new Set(['SaaS', 'CRM', 'Finance', 'Healthcare', 'HR', 'RealEstate', 'ProjectManagement'])

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function priceFor(name: string, category: string): number {
  const bandStart = PREMIUM_CATEGORIES.has(category) ? 3 : 0 // skip the cheapest points for premium categories
  const bandSize = PRICE_POINTS.length - bandStart
  return PRICE_POINTS[bandStart + (hash(name) % bandSize)]
}

// A prebuilt_apps row's own `description` is often either empty or this exact
// generic pattern (baked in by an earlier seeding pass), e.g. "Audit Log
// Viewer — ready-to-use saas app." — every listing with it reads as obviously
// auto-generated filler. Replace it (and any missing description) with a
// varied, punchier line instead of a single fixed fallback string, so two
// undescribed listings don't read identically either.
const GENERIC_DESC_RE = /—\s*ready-to-use\s+\S+\s+app\.?\s*$/i

const DESC_TEMPLATES: ((name: string, category: string) => string)[] = [
  (name, category) => `${name} — real, working ${category.toLowerCase()} source you can start customizing today.`,
  (name) => `${name}, fully built and wired up. Buy it, tweak it, ship it.`,
  (name, category) => `A working ${category.toLowerCase()} app: ${name}. Swap in your own data and go.`,
  (name) => `${name} — no boilerplate feel, just open it in the editor and start changing things.`,
  (name, category) => `Skip the blank page: ${name} is a real ${category.toLowerCase()} app, ready to customize.`,
]

function descriptionFor(name: string, category: string, rawDescription: string | null): string {
  const trimmed = (rawDescription || '').trim()
  if (trimmed && !GENERIC_DESC_RE.test(trimmed)) return trimmed
  const template = DESC_TEMPLATES[hash(name) % DESC_TEMPLATES.length]
  return template(name, category || 'Other')
}

function hasRealCode(files: unknown): boolean {
  if (!files || typeof files !== 'object') return false
  const f = files as Record<string, unknown>
  if (typeof f.code === 'string' && f.code.trim().length > 0) return true
  return Boolean(f['src/App.tsx'] || f['src/App.jsx'])
}

export async function POST(req: NextRequest) {
  try {
    const authKey = req.headers.get('x-admin-key')
    const adminSecret = process.env.ADMIN_SECRET_KEY
    if (!adminSecret || authKey !== adminSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 503 })

    const admin = getAdmin()
    const { batch } = await req.json().catch(() => ({ batch: 0 })) as { batch?: number }
    const batchSize = 25
    const offset = (batch ?? 0) * batchSize

    const { data: candidates, error: fetchErr } = await admin
      .from('prebuilt_apps')
      .select('id, name, category, description, files, preview_color, framework')
      .eq('valid', true)
      .order('id')
      .range(offset, offset + batchSize - 1)

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    if (!candidates?.length) return NextResponse.json({ processed: 0, remaining: 0, message: 'All done' })

    const withRealCode = candidates.filter(c => hasRealCode(c.files))
    const skipped = candidates.length - withRealCode.length

    if (withRealCode.length === 0) {
      return NextResponse.json({ processed: 0, skipped, remaining: undefined, message: 'No templates in this batch have generated code yet' })
    }

    // Studio listings are 1:1 with a prebuilt_apps name — re-running the seed
    // updates price/description instead of duplicating the listing. Done as an
    // explicit select-then-insert/update rather than a DB-level upsert: the
    // uniqueness guarantee (marketplace_listings_studio_title_uniq) is a
    // *partial* index (WHERE source = 'studio'), and Postgres can't match a
    // bare `ON CONFLICT (title)` — the shape PostgREST's upsert generates —
    // against a partial index at all ("no unique or exclusion constraint
    // matching the ON CONFLICT specification").
    const titles = withRealCode.map(app => app.name)
    const { data: existing } = await admin
      .from('marketplace_listings')
      .select('id, title')
      .eq('source', 'studio')
      .in('title', titles)
    const existingIdByTitle = new Map((existing ?? []).map(row => [row.title, row.id]))

    let processed = 0
    for (const app of withRealCode) {
      const row = {
        seller_id: null,
        project_id: null,
        source: 'studio' as const,
        title: app.name,
        description: descriptionFor(app.name, app.category || '', app.description),
        category: app.category || 'Other',
        tags: [] as string[],
        framework: app.framework || 'react-vite',
        files: app.files,
        thumbnail_url: null,
        preview_color: app.preview_color || '#0EA5E9',
        price_usd: priceFor(app.name, app.category || ''),
        status: 'approved' as const,
      }
      const existingId = existingIdByTitle.get(app.name)
      const { error } = existingId
        ? await admin.from('marketplace_listings').update(row).eq('id', existingId)
        : await admin.from('marketplace_listings').insert(row)
      if (error) {
        console.error(`Seed marketplace error on "${app.name}":`, error)
        continue // one bad row shouldn't abort the whole batch
      }
      processed++
    }

    return NextResponse.json({ processed, skipped, nextBatch: (batch ?? 0) + 1 })
  } catch (err) {
    console.error('Seed marketplace error:', String(err))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
