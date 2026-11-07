import { NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { collectIncoming, syncIncoming } from '@/lib/crm/db'

export const maxDuration = 60

// Pull everything the CRM is fed from (expo leads, consult bookings, signups
// that built something) and merge it in. Safe to press repeatedly: matching
// people are enriched, never duplicated, and existing stages are never moved.
export async function POST() {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { incoming, counts, warnings } = await collectIncoming(admin)
    const result = await syncIncoming(admin, incoming)
    return NextResponse.json({ ok: result.errors.length === 0, found: counts, warnings, ...result })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sync failed' }, { status: 500 })
  }
}
