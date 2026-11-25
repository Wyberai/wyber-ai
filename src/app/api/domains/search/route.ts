import { NextRequest, NextResponse } from 'next/server'
import { searchDomains, suggestAlternatives } from '@/lib/domains/search'
import { getProvider, inrPerUsd, isSandbox } from '@/lib/domains'
import { policyLines } from '@/lib/domains/policy'
import { SUPPORTED_YEARS } from '@/lib/domains/config'
import { notConfigured, requireUser, unauthorized } from '@/lib/domains/route-helpers'

// GET /api/domains/search?q=ashabakery&years=1: availability and real prices for a handful of sensible extensions.
export async function GET(req: NextRequest) {
  if (!(await requireUser())) return unauthorized()
  const provider = getProvider()
  if (!provider) return notConfigured()
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const years = Number(req.nextUrl.searchParams.get('years') ?? 1)
  if (!(SUPPORTED_YEARS as readonly number[]).includes(years)) return NextResponse.json({ error: 'Choose 1, 2, 3, 5 or 10 years' }, { status: 400 })
  try {
    const { label, results } = await searchDomains(provider, q, { years, inrPerUsd: inrPerUsd() })
    // The .com is what most people want. When it is taken, offer a few close names that are free.
    const com = results.find(r => r.tld === 'com')
    const alternatives = label.length >= 2 && com && com.status === 'taken' ? await suggestAlternatives(provider, label, { years, inrPerUsd: inrPerUsd() }).catch(() => []) : []
    return NextResponse.json({ label, years, sandbox: isSandbox(provider), results, alternatives, policyByTld: Object.fromEntries([...results, ...alternatives].map(r => [r.tld, policyLines(r.tld)])) })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Search failed' }, { status: 502 })
  }
}
