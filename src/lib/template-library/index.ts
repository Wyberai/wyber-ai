/**
 * WyberCode template/component library: the retrieve-then-patch mechanism
 * that makes "multiple pages/screens within a minute" achievable without a
 * self-hosted model generating every page from scratch on every build.
 *
 * - planPages(): a deliberately dumb, dependency-free keyword heuristic for
 *   "what pages does this request need" — same spirit as lib/intent.ts's
 *   cheap-heuristic-first approach. Meant to be swapped for (or backed by) an
 *   LLM-based planner once WyberCode's own inference endpoint exists; kept
 *   pure and synchronous for now so this module has zero network dependency
 *   on its own and is trivially unit-testable.
 * - retrieve(): ranked search against the wybercode_templates index
 *   (Postgres full-text search — see the search_wybercode_templates RPC in
 *   the 20260801000000 migration). Returns [] on any failure (table not
 *   migrated yet, RPC missing, no rows) rather than throwing — an empty
 *   result is a normal, expected outcome (route the page to full generation)
 *   not an error condition.
 * - fetchTemplateFiles(): pulls the actual file bodies for a match from GCS
 *   via the gcp-bridge storage routes.
 * - promote(): grows the library from a successful novel generation (e.g. one
 *   that went through the Claude fallback path) — gated by the caller's own
 *   quality signal, not re-verified here.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { readTemplateObject, writeTemplateObject, listTemplateObjects, WYBERCODE_TEMPLATE_BUCKET } from '@/lib/google-cloud-storage'
import type { PageSpec, TemplateMatch, TemplateFiles, PromoteInput, TemplateFramework } from './types'

// Keyword → archetype map. Order matters only in that a prompt can match
// multiple archetypes — each match becomes its own planned page, which is
// the intended behavior for "build me a dashboard with settings and a
// pricing page" style prompts.
const ARCHETYPE_KEYWORDS: Record<string, string[]> = {
  dashboard: ['dashboard', 'overview page', 'analytics page', 'stats page'],
  'auth-login': ['login page', 'log in page', 'sign in page', 'login screen'],
  'auth-signup': ['signup page', 'sign up page', 'register page', 'registration page'],
  'auth-forgot-password': ['forgot password', 'reset password'],
  settings: ['settings page', 'settings screen', 'preferences page', 'account settings'],
  pricing: ['pricing page', 'plans page', 'subscription page'],
  profile: ['profile page', 'profile screen', 'my account', 'user profile'],
  'list-detail': ['list page', 'directory page', 'catalog page'],
  onboarding: ['onboarding', 'welcome screen', 'get started flow', 'walkthrough'],
  checkout: ['checkout page', 'cart page', 'payment page'],
  'empty-error': ['empty state', '404 page', 'error page', 'not found page'],
}

const MIN_ARCHETYPE_SCORE_TO_SPLIT = 1

/**
 * Turn a build/edit prompt into a list of pages to plan for. Always returns
 * at least one entry (archetype 'home') so a caller always has something to
 * retrieve against, even for a prompt that matches no known keyword — that
 * entry naturally falls through to full generation when retrieve() finds
 * nothing for it.
 */
export function planPages(prompt: string, framework: TemplateFramework, paletteId?: string): PageSpec[] {
  const lower = (prompt || '').toLowerCase()
  const specs: PageSpec[] = []
  for (const [archetype, keywords] of Object.entries(ARCHETYPE_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      specs.push({ archetype, description: prompt, framework, paletteId })
    }
  }
  if (specs.length < MIN_ARCHETYPE_SCORE_TO_SPLIT) {
    specs.push({ archetype: 'home', description: prompt, framework, paletteId })
  }
  return specs
}

/**
 * Ranked retrieval for one planned page. First pass is scoped to the exact
 * archetype; if that comes back empty, a second, wider pass searches across
 * all archetypes (a close cross-archetype match is still a better starting
 * point for a patch than generating from nothing). Never throws — any
 * failure (migration not applied, RPC missing, transient DB error) is logged
 * and treated as "no match", which is a safe, expected fallback outcome.
 */
export async function retrieve(spec: PageSpec, limit = 3): Promise<TemplateMatch[]> {
  try {
    const admin = await createAdminClient()
    const narrow = await admin.rpc('search_wybercode_templates', {
      query: spec.description.slice(0, 500),
      want_framework: spec.framework,
      want_archetype: spec.archetype,
      limit_n: limit,
    })
    let rows = narrow.data as RawMatchRow[] | null
    if (narrow.error) {
      console.error('[template-library] retrieve (narrow) failed:', narrow.error)
      rows = null
    }
    if (!rows || rows.length === 0) {
      const wide = await admin.rpc('search_wybercode_templates', {
        query: spec.description.slice(0, 500),
        want_framework: spec.framework,
        want_archetype: null,
        limit_n: limit,
      })
      if (wide.error) {
        console.error('[template-library] retrieve (wide) failed:', wide.error)
        return []
      }
      rows = wide.data as RawMatchRow[] | null
    }
    return (rows ?? []).map(rowToMatch)
  } catch (e) {
    console.error('[template-library] retrieve threw:', e)
    return []
  }
}

interface RawMatchRow {
  id: string
  archetype: string
  framework: string
  palette_id: string | null
  description: string
  gcs_bucket: string
  gcs_path: string
  wyber_ui_kit_parts: string[] | null
  rank: number
}

function rowToMatch(r: RawMatchRow): TemplateMatch {
  return {
    id: r.id,
    archetype: r.archetype,
    framework: r.framework as TemplateFramework,
    paletteId: r.palette_id ?? undefined,
    description: r.description,
    gcsBucket: r.gcs_bucket,
    gcsPath: r.gcs_path,
    wyberUiKitParts: r.wyber_ui_kit_parts ?? [],
    // ts_rank has no fixed upper bound in general, but in practice (short
    // description fields, a handful of query terms) it stays well under 1 —
    // clamp defensively so callers can treat this as a 0-1 confidence value.
    score: Math.max(0, Math.min(1, r.rank)),
  }
}

/** Pull the actual file bodies for one retrieved match from GCS. */
export async function fetchTemplateFiles(match: TemplateMatch): Promise<TemplateFiles> {
  const paths = await listTemplateObjects(match.gcsBucket, match.gcsPath)
  const files: Record<string, string> = {}
  await Promise.all(paths.map(async (objectPath) => {
    const relativePath = objectPath.startsWith(match.gcsPath) ? objectPath.slice(match.gcsPath.length).replace(/^\/+/, '') : objectPath
    if (!relativePath) return
    files[relativePath] = await readTemplateObject(match.gcsBucket, objectPath)
  }))
  return { files }
}

/**
 * Add a successful novel generation to the library so future requests for a
 * similar page get a retrieval hit instead of falling to full generation
 * again. The caller (wybercode.ts) decides what counts as "successful" —
 * this function trusts the qualityScore it's given rather than re-deriving
 * it, so it stays a pure storage operation.
 */
export async function promote(input: PromoteInput): Promise<void> {
  const admin = await createAdminClient()
  const id = crypto.randomUUID()
  const gcsPath = `${input.framework}/${input.archetype}/${id}/`
  await Promise.all(
    Object.entries(input.files).map(([path, content]) => writeTemplateObject(WYBERCODE_TEMPLATE_BUCKET, `${gcsPath}${path}`, content))
  )
  const { error } = await admin.from('wybercode_templates').insert({
    id,
    archetype: input.archetype,
    framework: input.framework,
    palette_id: input.paletteId ?? null,
    description: input.description,
    gcs_bucket: WYBERCODE_TEMPLATE_BUCKET,
    gcs_path: gcsPath,
    wyber_ui_kit_parts: input.wyberUiKitParts ?? [],
    source: 'promoted',
    quality_score: input.qualityScore,
  })
  if (error) console.error('[template-library] promote insert failed:', error)
}

export type { PageSpec, TemplateMatch, TemplateFiles, PromoteInput, TemplateFramework } from './types'
