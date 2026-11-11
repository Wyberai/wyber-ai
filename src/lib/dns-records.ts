// Where a customer's domain must point for a WyberAi site to serve on it. One source of truth: the same record is shown
// in the editor, checked by /api/custom-domain when verifying, and written into the instructions a freelancer sends to
// their client's IT person.

export const VERCEL_A_IP = '76.76.21.21'
export const VERCEL_CNAME = 'cname.vercel-dns.com'

/** A root domain (example.com) cannot use a CNAME, so it needs an A record. Anything deeper (www.example.com) uses a CNAME. */
export const isApexDomain = (domain: string): boolean => domain.replace(/\.$/, '').split('.').length <= 2

export function dnsRecordFor(domain: string): { type: 'A' | 'CNAME'; name: string; value: string; ttl: string } {
  return isApexDomain(domain)
    ? { type: 'A', name: '@', value: VERCEL_A_IP, ttl: '300' }
    : { type: 'CNAME', name: domain.split('.')[0], value: VERCEL_CNAME, ttl: '300' }
}

/** A plain-English message a freelancer can send to whoever manages the client's domain (the client, or their IT person). */
export function dnsInstructionsText(domain: string, opts: { from?: string | null } = {}): string {
  const r = dnsRecordFor(domain)
  const sign = opts.from ? `\n\nThanks,\n${opts.from}` : ''
  return [
    `Hello,`,
    ``,
    `To put the new website live on ${domain}, please add this DNS record where the domain is managed (your domain registrar or DNS provider, for example GoDaddy, Namecheap, Cloudflare or Google Domains):`,
    ``,
    `  Type:   ${r.type}`,
    `  Name:   ${r.name}${r.name === '@' ? '   (the root domain; some providers want the domain name itself, or leave it blank)' : ''}`,
    `  Value:  ${r.value}`,
    `  TTL:    ${r.ttl} seconds (or "Automatic")`,
    ``,
    `Please keep any existing MX records. Those are for email, and changing them would stop your email working. Only the website record above should be added or replaced.`,
    ``,
    `The change can take from a few minutes up to 24 hours to take effect. Please let me know when it is done and I will confirm the site is live.${sign}`,
  ].join('\n')
}
