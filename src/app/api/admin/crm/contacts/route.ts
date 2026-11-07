import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { loadContacts, syncIncoming } from '@/lib/crm/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json({ contacts: await loadContacts(admin) })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to load' }, { status: 500 })
  }
}

// Add one contact by hand. Goes through the same de-duplicating sync as every
// other source, so adding someone who already exists enriches them instead of
// creating a second row.
export async function POST(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null) as Record<string, unknown> | null
  const name = String(b?.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const res = await syncIncoming(admin, [{
    name, email: String(b?.email ?? '') || null, phone: String(b?.phone ?? '') || null,
    company: String(b?.company ?? '') || null, title: String(b?.title ?? '') || null, country: String(b?.country ?? '') || null,
    segment: String(b?.segment ?? '') || null, source: 'manual', notes: String(b?.notes ?? '') || null,
    valueUsd: Number(b?.value_usd) || 0,
    nextAction: String(b?.next_action ?? '') || 'First contact', nextActionAt: new Date().toISOString(),
  }])
  if (res.skippedOwned) return NextResponse.json({ error: 'That is one of your own addresses' }, { status: 400 })
  if (res.errors.length) return NextResponse.json({ error: res.errors[0] }, { status: 500 })
  return NextResponse.json({ ok: true, ...res })
}
