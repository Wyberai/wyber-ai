import type { NextRequest } from 'next/server'
import { logAuditEvent } from '@/lib/orgs/audit'
import type { ClientAccess } from './access'

/**
 * Records a sensitive change to an agency workspace's client in the workspace's audit log, so an owner can see who did
 * what. Solo freelancers have no workspace, so nothing is written for them. Never pass a passcode, token or note text:
 * `detail` is for facts like "rotate_link" or a status, not secrets. Fire and forget; it can never fail a request.
 */
export function auditClient(access: Pick<ClientAccess, 'client'>, userId: string, action: string, detail?: Record<string, unknown>, req?: NextRequest): void {
  const orgId = access.client.org_id
  if (!orgId) return
  logAuditEvent({ orgId, userId, action: `client.${action}`, resourceType: 'client', resourceId: access.client.id, after: detail, req }).catch(() => {})
}
