import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { loadContacts, syncIncoming } from '@/lib/crm/db'
import { boothIncoming, boothThanks, boothToday } from '@/lib/crm/booth'
import { whatsappLink } from '@/lib/ops/agents/draft-actions'

export const dynamic = 'force-dynamic'

// Who you have spoken to at the booth today, with a one-tap thank-you for each.
export async function GET() {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let contacts
  try { contacts = await loadContacts(admin) } catch { return NextResponse.json({ error: 'The CRM could not be read' }, { status: 500 }) }
  const today = boothToday(contacts)
  return NextResponse.json({ ...today, recent: today.recent.map(e => ({ ...e, whatsapp: whatsappLink(e.phone, boothThanks(e.name)) })) })
}

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
