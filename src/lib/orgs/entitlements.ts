import { createServiceClient } from '@/lib/supabase/server'

// Independent of profiles.plan/credits — organizations.plan gates enterprise-only
// features (SSO, audit logs). SCIM is intentionally excluded for this MVP.
export type OrgFeature = 'sso' | 'audit_logs'

export async function orgHasFeature(orgId: string, _feature: OrgFeature): Promise<boolean> {
  const db = createServiceClient()
  const { data } = await db
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .maybeSingle()

  return data?.plan === 'enterprise'
}
