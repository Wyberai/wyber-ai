import { NextResponse } from 'next/server'
import { resolveRegion } from '@/lib/region'

export const dynamic = 'force-dynamic'

// Read-only: is the caller in India? Same rule the editor uses to show the
// Grow tab (project/[id]/page.tsx passes `resolveRegion() === 'INR'` as
// indiaFeatures). The companion app has no IP-country header of its own, so it
// asks here instead of guessing from the device locale.
export async function GET() {
  const india = (await resolveRegion()) === 'INR'
  return NextResponse.json({ india }, { headers: { 'Cache-Control': 'no-store' } })
}
