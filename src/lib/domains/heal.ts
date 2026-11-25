import type { createAdminClient } from '@/lib/supabase/server'
import { siteRecords } from './dns'
import { attachDomain } from './vercel'
import type { OrderStore } from './orders'
import type { DomainsProvider } from './types'

type Admin = Awaited<ReturnType<typeof createAdminClient>>

export interface ManagedDomainRow { domain: string; rc_order_id: number; project_id: string | null; dns_written: boolean | null; expires_at: string | null }

/**
 * Finishes the connection of a domain bought here: fills in the expiry date if the registry had not confirmed it yet,
 * writes the site records at the registrar if that did not finish, and adds the domain to the project. Found in the
 * sandbox: a new .in order is not Active for a while, so DNS cannot be activated straight after registering. The "Try
 * again" button and the daily job both call this, so the customer is not left waiting on a button.
 */
export async function healDomain(
  deps: { provider: DomainsProvider; admin: Admin; store: OrderStore },
  d: ManagedDomainRow,
): Promise<{ dnsWritten: boolean; attached: boolean; error?: string }> {
  let expiresAt = d.expires_at
  if (!expiresAt) {
    try { expiresAt = (await deps.provider.getDomainDetails(d.rc_order_id)).expiresAt } catch { /* still not confirmed */ }
  }
  let dnsWritten = Boolean(d.dns_written)
  let error: string | undefined
  if (!dnsWritten) {
    try {
      await deps.provider.activateDns(d.rc_order_id).catch(() => undefined)
      for (const rec of siteRecords()) await deps.provider.addDnsRecord(d.domain, rec)
      dnsWritten = true
    } catch (e) {
      error = e instanceof Error ? e.message : 'DNS update failed'
    }
  }
  const v = await attachDomain(d.domain)
  await deps.admin.from('managed_domains').update({ dns_written: dnsWritten, vercel_attached: v.attached, expires_at: expiresAt }).eq('domain', d.domain)
  if (d.project_id && v.attached) await deps.store.linkProject(d.project_id, d.domain)
  return { dnsWritten, attached: v.attached, error: error ?? v.error }
}
