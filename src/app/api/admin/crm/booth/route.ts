import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { syncIncoming } from '@/lib/crm/db'
import { boothIncoming } from '@/lib/crm/booth'

export const dynamic = 'force-dynamic'

// Save one person you just spoke to at the booth. Same de-duplicating path as every other source.
export async function POST(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null) as Record<string, unknown> | null
  const r = boothIncoming(b ?? {})
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  const res = await syncIncoming(admin, [r.incoming])
  if (res.skippedOwned) return NextResponse.json({ error: 'That is one of your own addresses' }, { status: 400 })
  if (res.errors.length) return NextResponse.json({ error: res.errors[0] }, { status: 500 })
  return NextResponse.json({ ok: true, added: res.inserted > 0, updated: res.updated > 0 })
}
