// What the agency dashboard is allowed to see about a client. The passcode hash never leaves the server: the
// dashboard only learns whether one is set.

export const CLIENT_LIST_SELECT =
  '*, client_deliverables(id, headline, description, sort_order, is_visible, project_id, review_status, reviewed_at, delivered_at, handover_note, preview_token, preview_enabled, preview_built_at, projects(id, name, project_type, thumbnail_url, published_url, deployed_url, custom_domain, custom_domain_verified)), client_feedback(id, deliverable_id, kind, author_name, body, resolved, created_at), client_updates(id, body, created_at, emailed_at), client_quotes(id, number, title, currency, items, total, note, terms, recurrence, payment_instructions, payment_url, status, sent_at, responded_at, responded_by, decline_reason, paid_at, created_at)'

export function clientForOwner<T extends Record<string, unknown>>(row: T): Omit<T, 'portal_passcode_hash'> & { has_passcode: boolean } {
  const { portal_passcode_hash, ...rest } = row as T & { portal_passcode_hash?: string | null }
  return { ...rest, has_passcode: !!portal_passcode_hash }
}

export function newSlug(name: string, id: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'client'
  return `${base}-${id}`
}

/** Credits used on a client's projects, from the generation usage log (the one place every build and edit is recorded
 *  against its project). Self-heal passes and plan stages log 0, so they add nothing. */
export function creditsSpentFor(projectIds: string[], usage: Array<{ project_id: string | null; credits_charged: number | null }>): number {
  const ids = new Set(projectIds)
  return usage.reduce((sum, u) => (u.project_id && ids.has(u.project_id) ? sum + (u.credits_charged ?? 0) : sum), 0)
}
