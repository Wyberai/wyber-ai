import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export type AuditEvent = {
  orgId: string
  userId: string | null
  action: string
  resourceType: string
  resourceId?: string | null
  before?: unknown
  after?: unknown
  req?: NextRequest
}

function extractIp(req?: NextRequest): string | null {
  if (!req) return null
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
}

// Writes one audit_logs row via the service-role client (no INSERT RLS policy exists,
// this is the only writer by design). Call this fire-and-forget: `logAuditEvent(...).catch(() => {})`,
// mirroring the existing best-effort email pattern in collaborators/route.ts.
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const db = createServiceClient()
  const { error } = await db.from('audit_logs').insert({
    org_id: event.orgId,
    user_id: event.userId,
    action: event.action,
    resource_type: event.resourceType,
    resource_id: event.resourceId ?? null,
    before_state: event.before ?? null,
    after_state: event.after ?? null,
    ip_address: extractIp(event.req),
    user_agent: event.req?.headers.get('user-agent') ?? null,
  })
  if (error) throw error
}
