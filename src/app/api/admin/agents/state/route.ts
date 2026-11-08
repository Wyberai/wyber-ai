import { NextResponse } from 'next/server'
import { getCrmAdmin } from '@/lib/crm/admin-auth'
import { loadAgentsState } from '@/lib/ops/agents/state'

export const dynamic = 'force-dynamic'

// Everything the /admin/agents page needs: the drafts to review (with their
// contact), each agent's switch and last run, results, and whether the AI key is set.
export async function GET() {
  const { admin } = await getCrmAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await loadAgentsState(admin))
}
