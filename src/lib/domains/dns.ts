import { VERCEL_A_IP, VERCEL_CNAME } from '@/lib/dns-records'
import type { DnsRecord } from './types'

// The records that make a purchased domain serve the published site, and the records Google Workspace mail needs.
// The site records are the same ones /api/custom-domain checks (src/lib/dns-records.ts), so connection and
// verification agree.

export function siteRecords(): DnsRecord[] {
  return [
    { type: 'A', host: '@', value: VERCEL_A_IP, ttl: 300 },
    { type: 'CNAME', host: 'www', value: VERCEL_CNAME, ttl: 300 },
  ]
}

/**
 * Google's current mail setup is one MX record, smtp.google.com at priority 1 (Google Workspace Admin Help,
 * "Set up MX records for Google Workspace"), plus an SPF record. The Google site-verification TXT value is specific to
 * each customer and is not returned by the reseller API we read, so it is carried separately when we have it.
 */
export function workspaceRecords(opts: { verificationToken?: string | null } = {}): DnsRecord[] {
  const recs: DnsRecord[] = [
    { type: 'MX', host: '@', value: 'smtp.google.com', ttl: 3600, priority: 1 },
    { type: 'TXT', host: '@', value: 'v=spf1 include:_spf.google.com ~all', ttl: 3600 },
  ]
  if (opts.verificationToken) {
    recs.push({ type: 'TXT', host: '@', value: opts.verificationToken, ttl: 3600 })
  }
  return recs
}

/** Provider call shape for one record: host is omitted for the root domain. */
export function providerPath(record: DnsRecord): { path: string; params: Record<string, string> } {
  const kind = { A: 'ipv4', AAAA: 'ipv6', CNAME: 'cname', MX: 'mx', TXT: 'txt' }[record.type]
  const params: Record<string, string> = { value: record.value, ttl: String(record.ttl) }
  if (record.host !== '@') params.host = record.host
  if (record.type === 'MX' && record.priority != null) params.priority = String(record.priority)
  return { path: `dns/manage/add-${kind}-record.json`, params }
}

/** Plain-text version for the copy button. */
export function recordsAsText(domain: string, records: DnsRecord[]): string {
  return records
    .map(r => `${r.type}\t${r.host === '@' ? domain : `${r.host}.${domain}`}\t${r.priority != null ? r.priority + '\t' : ''}${r.value}\tTTL ${r.ttl}`)
    .join('\n')
}
