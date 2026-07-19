// Best-effort DNS/registrar provider detection via nameserver lookup, so the
// custom-domain setup flow can point users at their actual provider's DNS
// panel instead of a generic "go to your registrar" message.

export type DnsProvider = {
  name: string
  dashboardUrl: (domain: string) => string
}

type ProviderRule = { match: string[]; provider: DnsProvider }

const RULES: ProviderRule[] = [
  { match: ['cloudflare.com'], provider: { name: 'Cloudflare', dashboardUrl: () => 'https://dash.cloudflare.com/' } },
  { match: ['domaincontrol.com'], provider: { name: 'GoDaddy', dashboardUrl: (d) => `https://dcc.godaddy.com/control/dnsmanagement?domainName=${encodeURIComponent(d)}` } },
  { match: ['registrar-servers.com'], provider: { name: 'Namecheap', dashboardUrl: (d) => `https://ap.www.namecheap.com/domains/domaincontrolpanel/${encodeURIComponent(d)}/advancedns` } },
  { match: ['squarespacedomains.com', 'domains.google'], provider: { name: 'Squarespace Domains (formerly Google Domains)', dashboardUrl: () => 'https://domains.squarespace.com/' } },
  { match: ['namesilo.com'], provider: { name: 'NameSilo', dashboardUrl: () => 'https://www.namesilo.com/account_domains.php' } },
  { match: ['hostinger.com', 'dns-parking.com'], provider: { name: 'Hostinger', dashboardUrl: () => 'https://hpanel.hostinger.com/' } },
  { match: ['bluehost.com'], provider: { name: 'Bluehost', dashboardUrl: () => 'https://www.bluehost.com/my-account/domain-center' } },
  { match: ['awsdns'], provider: { name: 'AWS Route 53', dashboardUrl: () => 'https://console.aws.amazon.com/route53/v2/hostedzones' } },
  { match: ['digitalocean.com'], provider: { name: 'DigitalOcean', dashboardUrl: () => 'https://cloud.digitalocean.com/networking/domains' } },
  { match: ['vercel-dns.com'], provider: { name: 'Vercel', dashboardUrl: () => 'https://vercel.com/dashboard/domains' } },
  { match: ['name.com'], provider: { name: 'Name.com', dashboardUrl: () => 'https://www.name.com/account/domain' } },
  { match: ['zoho.com'], provider: { name: 'Zoho', dashboardUrl: () => 'https://www.zoho.com/domains/' } },
]

// Resolves nameservers via Cloudflare DoH (no native `dns` module needed —
// works the same in serverless/edge). Returns null if nothing recognized.
export async function detectProvider(domain: string): Promise<DnsProvider | null> {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`, {
      headers: { Accept: 'application/dns-json' },
    })
    const data = await res.json()
    const nameservers: string[] = (data.Answer ?? [])
      .filter((r: { type: number }) => r.type === 2) // NS = type 2
      .map((r: { data: string }) => (r.data ?? '').toLowerCase())

    if (nameservers.length === 0) return null

    for (const rule of RULES) {
      if (nameservers.some((ns) => rule.match.some((m) => ns.includes(m)))) {
        return rule.provider
      }
    }
    return null
  } catch {
    return null
  }
}
