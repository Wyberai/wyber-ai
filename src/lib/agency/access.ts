// One place that decides who can see and change a client. Everything in agency mode goes through it, so a route
// cannot forget the org check. A client belongs to one account (owner_id) and may also belong to an agency
// workspace (org_id). Workspace roles come from organization_members: owner and admin manage everything, member edits
// but cannot delete, viewer can only look.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = { from: (table: string) => any }

export type ClientRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface ClientAccess {
  client: Record<string, unknown> & { id: string; owner_id: string; org_id: string | null }
  role: ClientRole
  canEdit: boolean
  canDelete: boolean
}

function toAccess(client: ClientAccess['client'], role: ClientRole): ClientAccess {
  return { client, role, canEdit: role !== 'viewer', canDelete: role === 'owner' || role === 'admin' }
}

/** What the caller may do with this client, or null when they have no access at all (callers answer 404). */
export async function clientAccess(db: Db, userId: string, clientId: string): Promise<ClientAccess | null> {
  const { data: client } = await db.from('clients').select('*').eq('id', clientId).maybeSingle()
  if (!client) return null
  if (client.owner_id === userId) return toAccess(client, 'owner')
  if (!client.org_id) return null
  const { data: m } = await db.from('organization_members').select('role').eq('org_id', client.org_id).eq('user_id', userId).maybeSingle()
  if (!m) return null
  return toAccess(client, m.role as ClientRole)
}

/** The workspaces the caller belongs to, with their role. */
export async function myWorkspaces(db: Db, userId: string): Promise<Array<{ id: string; name: string; slug: string; role: ClientRole }>> {
  const { data: members } = await db.from('organization_members').select('org_id, role').eq('user_id', userId)
  const mine = (members ?? []) as Array<{ org_id: string; role: ClientRole }>
  if (!mine.length) return []
  const { data: orgs } = await db.from('organizations').select('id, name, slug').in('id', mine.map(m => m.org_id))
  const byId = new Map(((orgs ?? []) as Array<{ id: string; name: string; slug: string }>).map(o => [o.id, o]))
  return mine.flatMap(m => {
    const o = byId.get(m.org_id)
    return o ? [{ id: o.id, name: o.name, slug: o.slug, role: m.role }] : []
  })
}

/** Every client the caller can see: their own, plus the ones in their workspaces. Newest first, with their role on each. */
export async function visibleClients(db: Db, userId: string, select: string): Promise<Array<Record<string, unknown> & { id: string; _role: ClientRole; _canEdit: boolean; _canDelete: boolean }>> {
  const spaces = await myWorkspaces(db, userId)
  const roleByOrg = new Map(spaces.map(s => [s.id, s.role]))
  const own = (await db.from('clients').select(select).eq('owner_id', userId)).data ?? []
  const shared = spaces.length ? (await db.from('clients').select(select).in('org_id', spaces.map(s => s.id))).data ?? [] : []
  const seen = new Set<string>()
  const out: Array<Record<string, unknown> & { id: string; _role: ClientRole; _canEdit: boolean; _canDelete: boolean }> = []
  for (const c of [...own, ...shared] as Array<Record<string, unknown> & { id: string; owner_id: string; org_id: string | null; created_at: string }>) {
    if (seen.has(c.id)) continue
    seen.add(c.id)
    const role: ClientRole = c.owner_id === userId ? 'owner' : roleByOrg.get(c.org_id ?? '') ?? 'viewer'
    const a = toAccess(c, role)
    out.push({ ...c, _role: role, _canEdit: a.canEdit, _canDelete: a.canDelete })
  }
  return out.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
}

/** The caller may attach a project to a client if it is theirs, or belongs to the client's workspace. */
export async function canAttachProject(db: Db, userId: string, projectId: string, client: { org_id: string | null }): Promise<boolean> {
  const { data: p } = await db.from('projects').select('id, user_id, org_id').eq('id', projectId).maybeSingle()
  if (!p) return false
  if (p.user_id === userId) return true
  return !!client.org_id && p.org_id === client.org_id
}
