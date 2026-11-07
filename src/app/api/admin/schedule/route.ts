import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { loadContacts } from '@/lib/crm/db'
import type { Contact } from '@/lib/crm/contact'
import { buildSchedule, istDay } from '@/lib/ops/schedule'

export const dynamic = 'force-dynamic'

// Everything that will happen, day by day: automatic jobs, follow-ups and meetings due, expo dates.
export async function GET(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = req.nextUrl.searchParams
  const from = /^\d{4}-\d{2}-\d{2}$/.test(q.get('from') ?? '') ? (q.get('from') as string) : istDay(new Date())
  const days = Number(q.get('days')) || 7
  let contacts: Contact[]
  try { contacts = await loadContacts(admin) } catch { contacts = [] }
  const pending = await admin.from('ops_agent_drafts').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  return NextResponse.json({ today: istDay(new Date()), days: buildSchedule(from, days, contacts), pendingDrafts: pending.error ? null : pending.count ?? 0 })
}
