import { NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { istDay } from '@/lib/ops/schedule'
import { growthSnapshot } from '@/lib/ops/marketing/snapshot'

export const dynamic = 'force-dynamic'

// The signup goal, where we really are against it, today's content, and the channels that close the gap.
export async function GET() {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await growthSnapshot(admin, new Date(), istDay(new Date())))
}
