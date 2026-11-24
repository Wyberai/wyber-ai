import { NextRequest, NextResponse } from 'next/server'
import { healDomain } from '@/lib/domains/heal'
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
  const r = await healDomain({ provider: ctx.provider, admin: ctx.admin, store: ctx.store }, d)
  if (!r.dnsWritten) return NextResponse.json({ error: r.error ?? 'DNS update failed' }, { status: 502 })
  return NextResponse.json({ dnsWritten: r.dnsWritten, attached: r.attached, error: r.error })
}
