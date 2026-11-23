import { NextRequest, NextResponse } from 'next/server'
import { siteRecords } from '@/lib/domains/dns'
import { attachDomain } from '@/lib/domains/vercel'
import { context, notConfigured, requireUser, unauthorized } from '@/lib/domains/route-helpers'

// POST /api/domains/connect { domain }: retries the connection for a domain bought here (DNS records at the registrar,
// then the project). Used by the "Try again" button on My domains when a step did not finish the first time.
export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()
  const ctx = await context()
  if (!ctx) return notConfigured()
  const { domain } = (await req.json().catch(() => ({}))) as { domain?: string }
  const { data: d } = await ctx.admin.from('managed_domains').select('*').eq('user_id', user.id).eq('domain', String(domain ?? '').toLowerCase()).maybeSingle()
  if (!d) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
  let dnsWritten = Boolean(d.dns_written)
  if (!dnsWritten) {
    try {
      await ctx.provider.activateDns(d.rc_order_id).catch(() => undefined)
      for (const rec of siteRecords()) await ctx.provider.addDnsRecord(d.domain, rec)
      dnsWritten = true
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'DNS update failed' }, { status: 502 })
    }
  }
  const v = await attachDomain(d.domain)
  await ctx.admin.from('managed_domains').update({ dns_written: dnsWritten, vercel_attached: v.attached }).eq('domain', d.domain)
  if (d.project_id && v.attached) await ctx.store.linkProject(d.project_id, d.domain)
  return NextResponse.json({ dnsWritten, attached: v.attached, error: v.error })
}
