import { NextRequest, NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { loadSchedule } from '@/lib/ops/schedule-load'

export const dynamic = 'force-dynamic'

// Everything that will happen, day by day: automatic jobs, follow-ups and meetings due, expo dates.
export async function GET(req: NextRequest) {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = req.nextUrl.searchParams
  const from = /^\d{4}-\d{2}-\d{2}$/.test(q.get('from') ?? '') ? (q.get('from') as string) : undefined
  return NextResponse.json(await loadSchedule(admin, from, Number(q.get('days')) || 7))
}
