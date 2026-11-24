import { NextRequest, NextResponse } from 'next/server'
import { workspaceQuoteFor } from '@/lib/domains/search'
import { getProvider, inrPerUsd, isSandbox } from '@/lib/domains'
import { workspaceEnabled, workspaceMarginCents, workspaceRegionFor, WORKSPACE_PLANS, WORKSPACE_MAX_SEATS } from '@/lib/domains/config'
import { workspacePolicyLines } from '@/lib/domains/policy'
import { workspaceRecords, recordsAsText } from '@/lib/domains/dns'
import { notConfigured, requireUser, unauthorized } from '@/lib/domains/route-helpers'

// GET /api/workspace/quote?seats=3&country=IN&domain=example.com: price and the mail records that will be connected.
export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()
  if (!workspaceEnabled(process.env, user.email)) return NextResponse.json({ error: 'Google Workspace is not available yet' }, { status: 503 })
  const provider = getProvider()
  if (!provider) return notConfigured()
  const p = req.nextUrl.searchParams
  const seats = Number(p.get('seats') ?? 1)
  if (!Number.isInteger(seats) || seats < 1 || seats > WORKSPACE_MAX_SEATS) return NextResponse.json({ error: `Choose between 1 and ${WORKSPACE_MAX_SEATS} seats` }, { status: 400 })
  const region = workspaceRegionFor(p.get('country'))
  try {
    const quote = await workspaceQuoteFor(provider, region, seats, 12, inrPerUsd())
    const renewal = await workspaceQuoteFor(provider, region, seats, 12, inrPerUsd(), process.env, 'renew').catch(() => null)
    const domain = (p.get('domain') ?? 'yourdomain.com').toLowerCase()
    const records = workspaceRecords()
    return NextResponse.json({
      sandbox: isSandbox(provider), plans: WORKSPACE_PLANS, quote, renewalTotalCents: renewal?.totalCents ?? null, region,
      policy: workspacePolicyLines(workspaceMarginCents()), records, recordsText: recordsAsText(domain, records),
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Quote failed' }, { status: 502 })
  }
}
