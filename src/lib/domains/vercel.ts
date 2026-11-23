import { VERCEL_A_IP } from '@/lib/dns-records'

type Fetch = typeof fetch
export interface VercelResult { attached: boolean; verified: boolean; error?: string }

const tokenOf = (env: Record<string, string | undefined>) => env.WYBERAI_DOMAINS || env.VERCEL_TOKEN
const team = (env: Record<string, string | undefined>, first: boolean) => (env.VERCEL_TEAM_ID ? `${first ? '?' : '&'}teamId=${env.VERCEL_TEAM_ID}` : '')

/** Adds the domain (and www) to the Vercel project that serves published sites; Vercel issues the certificate once DNS points at it. */
export async function attachDomain(domain: string, env: Record<string, string | undefined> = process.env, f: Fetch = fetch): Promise<VercelResult> {
  const token = tokenOf(env)
  const project = env.VERCEL_PROJECT_ID
  if (!token || !project) return { attached: false, verified: false, error: 'Vercel is not configured' }
  let verified = false
  for (const name of [domain, `www.${domain}`]) {
    const res = await f(`https://api.vercel.com/v10/projects/${project}/domains${team(env, true)}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    })
    const j = (await res.json().catch(() => ({}))) as { verified?: boolean; error?: { code?: string; message?: string } }
    if (!res.ok && j.error?.code !== 'domain_already_in_use' && !/already/i.test(j.error?.message ?? '')) {
      return { attached: false, verified: false, error: j.error?.message ?? `Vercel ${res.status}` }
    }
    if (name === domain) verified = Boolean(j.verified)
  }
  return { attached: true, verified }
}

export type ConnectionStatus = 'dns_pending' | 'certificate_pending' | 'live' | 'needs_attention'

/** DNS first (does the domain resolve to our address?), then the project's own view of it. */
export async function connectionStatus(domain: string, env: Record<string, string | undefined> = process.env, f: Fetch = fetch): Promise<ConnectionStatus> {
  try {
    const r = await f(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, { headers: { Accept: 'application/dns-json' } })
    const j = (await r.json()) as { Answer?: { type: number; data: string }[] }
    if (!(j.Answer ?? []).some(a => a.type === 1 && a.data === VERCEL_A_IP)) return 'dns_pending'
    const token = tokenOf(env), project = env.VERCEL_PROJECT_ID
    if (!token || !project) return 'certificate_pending'
    const v = await f(`https://api.vercel.com/v9/projects/${project}/domains/${encodeURIComponent(domain)}${team(env, true)}`, { headers: { Authorization: `Bearer ${token}` } })
    const vj = (await v.json()) as { verified?: boolean }
    if (!vj.verified) return 'certificate_pending'
    const probe = await f(`https://${domain}`, { method: 'HEAD', redirect: 'manual' }).catch(() => null)
    return probe && probe.status < 500 ? 'live' : 'certificate_pending'
  } catch {
    return 'dns_pending'
  }
}
