import type { NextRequest } from 'next/server'
import { isUnlocked, unlockCookieName } from './passcode'
import type { Db } from './access'

export interface PortalClient {
  id: string
  owner_id: string
  org_id: string | null
  name: string
  slug: string
  status: string
  portal_passcode_hash: string | null
  view_count: number | null
}

/** The client behind a public link, but only while it is active. Paused, archived and lead clients look like no page. */
export async function loadActivePortalClient(db: Db, slug: string): Promise<PortalClient | null> {
  if (!slug || slug.length > 120) return null
  const { data } = await db.from('clients').select('id, owner_id, org_id, name, slug, status, portal_passcode_hash, view_count').eq('slug', slug).maybeSingle()
  if (!data || data.status !== 'active') return null
  return data as PortalClient
}

/** Whether this request may use the client's page: no passcode set, or the signed unlock cookie is present and current. */
export function portalAllowed(client: Pick<PortalClient, 'slug' | 'portal_passcode_hash'>, req: NextRequest): boolean {
  return isUnlocked(client.slug, client.portal_passcode_hash, req.cookies.get(unlockCookieName(client.slug))?.value)
}

export function requestIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
