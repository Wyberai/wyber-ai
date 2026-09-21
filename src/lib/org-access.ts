import type { SupabaseClient } from '@supabase/supabase-js'

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

// Looks up a user's role in an org via the service-role client — deliberately
// NOT the session-scoped client, so this check doesn't depend on an RLS
// policy existing/behaving a particular way on organization_members. This is
// an application-layer authorization decision, same posture as the
// project/[id]/page.tsx redirect it's used from.
export async function getOrgRole(admin: SupabaseClient, orgId: string, userId: string): Promise<OrgRole | null> {
  const { data } = await admin
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data?.role as OrgRole | undefined) ?? null
}

// Pure — unit-testable. member/admin/owner can open and edit an org project;
// viewer is read-only.
export function canViewOrgProject(role: OrgRole | null): boolean {
  return role !== null
}

export function canEditOrgProject(role: OrgRole | null): boolean {
  return role === 'owner' || role === 'admin' || role === 'member'
}

export function canManageOrgProject(role: OrgRole | null): boolean {
  return role === 'owner' || role === 'admin'
}
