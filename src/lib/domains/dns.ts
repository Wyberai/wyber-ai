import { VERCEL_A_IP, VERCEL_CNAME } from '@/lib/dns-records'
import type { DnsRecord } from './types'

// The records that make a purchased domain serve the published site, and the records Google Workspace mail needs.
// The site records are the same ones /api/custom-domain checks (src/lib/dns-records.ts), so connection and
// verification agree.

/** The provider refuses a record with a TTL under 7200 seconds (it answers HTTP 200 with status "Failed"; found in the sandbox). */
export const MIN_TTL = 7200

export function siteRecords(): DnsRecord[] {
  return [
    { type: 'A', host: '@', value: VERCEL_A_IP, ttl: MIN_TTL },
    { type: 'CNAME', host: 'www', value: VERCEL_CNAME, ttl: MIN_TTL },
  ]
}

/**
 * The mail records the provider itself returns for Google Workspace (its gapps/{region}/dns-record.json call, read from
 * the sandbox 2026-11-24): the five classic Google MX records at priorities 1, 5, 5, 10, 10. We use the provider's own
 * list so it matches what its panel tells customers. Plus an SPF record. The Google site-verification TXT value is
 * specific to each customer and that call does not return it, so it is carried separately when we have it.
 */
export const GOOGLE_MX: { value: string; priority: number }[] = [
  { value: 'aspmx.l.google.com', priority: 1 },
  { value: 'alt1.aspmx.l.google.com', priority: 5 },
  { value: 'alt2.aspmx.l.google.com', priority: 5 },
  { value: 'alt3.aspmx.l.google.com', priority: 10 },
  { value: 'alt4.aspmx.l.google.com', priority: 10 },
]

export function workspaceRecords(opts: { verificationToken?: string | null } = {}): DnsRecord[] {
  const recs: DnsRecord[] = [
    ...GOOGLE_MX.map(m => ({ type: 'MX' as const, host: '@', value: m.value, ttl: MIN_TTL, priority: m.priority })),
    { type: 'TXT', host: '@', value: 'v=spf1 include:_spf.google.com ~all', ttl: MIN_TTL },
  ]
  if (opts.verificationToken) {
    recs.push({ type: 'TXT', host: '@', value: opts.verificationToken, ttl: MIN_TTL })
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
