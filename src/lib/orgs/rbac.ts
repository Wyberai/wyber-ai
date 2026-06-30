import { createServiceClient } from '@/lib/supabase/server'

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

export type OrgCapability =
  | 'org.manage_settings'
  | 'org.manage_billing'
  | 'org.manage_sso'
  | 'org.view_audit_logs'
  | 'org.invite_members'
  | 'org.remove_members'
  | 'org.change_member_role'
  | 'project.view'
  | 'project.create'
  | 'project.update'
  | 'project.delete'

const MATRIX: Record<OrgRole, OrgCapability[]> = {
  owner: [
    'org.manage_settings', 'org.manage_billing', 'org.manage_sso', 'org.view_audit_logs',
    'org.invite_members', 'org.remove_members', 'org.change_member_role',
    'project.view', 'project.create', 'project.update', 'project.delete',
  ],
  admin: [
    'org.manage_settings', 'org.manage_sso', 'org.view_audit_logs',
    'org.invite_members', 'org.remove_members', 'org.change_member_role',
    'project.view', 'project.create', 'project.update', 'project.delete',
  ],
  member: [
    'project.view', 'project.create', 'project.update',
  ],
  viewer: [
    'project.view',
  ],
}

export function can(role: OrgRole, capability: OrgCapability): boolean {
  return MATRIX[role]?.includes(capability) ?? false
}

export type OrgCapabilityResult =
  | { ok: true; role: OrgRole }
  | { ok: false; status: 401 | 403 | 404 }

// Looks up the caller's membership in orgId and checks they hold `capability`.
// Uses the service-role client so this works the same whether called from a route
// that already resolved the user via createClient(), or in background jobs.
export async function requireOrgCapability(
  userId: string | null | undefined,
  orgId: string,
  capability: OrgCapability
): Promise<OrgCapabilityResult> {
  if (!userId) return { ok: false, status: 401 }

  const db = createServiceClient()
  const { data: membership } = await db
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership) return { ok: false, status: 404 }

  const role = membership.role as OrgRole
  if (!can(role, capability)) return { ok: false, status: 403 }

  return { ok: true, role }
}
