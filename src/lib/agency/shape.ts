// What the agency dashboard is allowed to see about a client. The passcode hash never leaves the server: the
// dashboard only learns whether one is set.

export const CLIENT_LIST_SELECT =
  '*, client_deliverables(id, headline, description, sort_order, is_visible, project_id, review_status, reviewed_at, projects(id, name, thumbnail_url)), client_feedback(id, deliverable_id, kind, author_name, body, created_at), client_updates(id, body, created_at)'

export function clientForOwner<T extends Record<string, unknown>>(row: T): Omit<T, 'portal_passcode_hash'> & { has_passcode: boolean } {
  const { portal_passcode_hash, ...rest } = row as T & { portal_passcode_hash?: string | null }
  return { ...rest, has_passcode: !!portal_passcode_hash }
}

export function newSlug(name: string, id: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'client'
  return `${base}-${id}`
}
