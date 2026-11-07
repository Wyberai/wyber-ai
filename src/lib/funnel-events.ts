// First-party funnel events.
//
// track() used to reach only GA/PostHog, and PostHog was stubbed out, so the
// founder could not query where signups stop. A small allowlist of the
// activation/conversion events is now ALSO written to our own funnel_events
// table (see /api/funnel/event). Pure helpers live here so they are testable.

export const FUNNEL_EVENTS = new Set<string>([
  'signup_completed',
  'first_generation_started',
  'project_created',
  'app_published',
  'checkout_initiated',
  // Credit-wall moments (editor): wall shown -> simpler version offered ->
  // chosen, or upgrade clicked. No pricing involved, just visibility.
  'editor_credit_wall_shown',
  'editor_simple_build_offered',
  'editor_simple_build_chosen',
  'editor_out_of_credits_upgrade_clicked',
  'editor_low_credit_nudge_upgrade_clicked',
  'editor_post_build_nudge_upgrade_clicked',
])

export const MAX_PROP_KEYS = 12
export const MAX_PROP_STRING = 120

/** Keep only small primitive props so a client can't store arbitrary blobs. */
export function sanitizeProps(input: unknown): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {}
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out
  let n = 0
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (n >= MAX_PROP_KEYS) break
    const key = k.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40)
    if (!key) continue
    if (typeof v === 'string') out[key] = v.slice(0, MAX_PROP_STRING)
    else if (typeof v === 'number' && Number.isFinite(v)) out[key] = v
    else if (typeof v === 'boolean' || v === null) out[key] = v
    else continue
    n++
  }
  return out
}
