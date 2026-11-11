// One answer to "may this person change this project?", for server routes that use the service-role client (which
// bypasses row-level security, so the route has to ask). A project can be changed by:
//   - the person who owns it,
//   - a member, admin or owner of the workspace it belongs to (org_id), but not a viewer,
//   - an accepted collaborator invited as an editor.
// Anyone else may not, including when the project is public: public means anyone may VIEW or fork it, not write to it.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = { from: (table: string) => any }

export type ProjectRole = 'owner' | 'org-editor' | 'org-viewer' | 'collab-editor' | 'collab-viewer'

export async function projectRole(db: Db, userId: string, projectId: string): Promise<{ exists: boolean; role: ProjectRole | null }> {
  const { data: p } = await db.from('projects').select('id, user_id, org_id').eq('id', projectId).maybeSingle()
  if (!p) return { exists: false, role: null }
  if (p.user_id === userId) return { exists: true, role: 'owner' }

  if (p.org_id) {
    const { data: m } = await db.from('organization_members').select('role').eq('org_id', p.org_id).eq('user_id', userId).maybeSingle()
    if (m) return { exists: true, role: m.role === 'viewer' ? 'org-viewer' : 'org-editor' }
  }

  const { data: c } = await db.from('project_collaborators').select('role').eq('project_id', projectId).eq('collaborator_id', userId).eq('status', 'accepted').maybeSingle()
  if (c) return { exists: true, role: c.role === 'editor' ? 'collab-editor' : 'collab-viewer' }

  return { exists: true, role: null }
}

export const canEditRole = (r: ProjectRole | null): boolean => r === 'owner' || r === 'org-editor' || r === 'collab-editor'

/** True when the caller may change the project. A project id that does not exist is "no": there is nothing to change. */
export async function canEditProject(db: Db, userId: string, projectId: string): Promise<boolean> {
  const { exists, role } = await projectRole(db, userId, projectId)
  return exists && canEditRole(role)
}

/**
 * For routes that used to accept any project id: a request about a project that EXISTS but that the caller cannot edit
 * must be refused. An id that matches no project passes through, so nothing that worked before stops working.
 */
export async function mayActOnProject(db: Db, userId: string, projectId: string): Promise<boolean> {
  const { exists, role } = await projectRole(db, userId, projectId)
  return !exists || canEditRole(role)
}
