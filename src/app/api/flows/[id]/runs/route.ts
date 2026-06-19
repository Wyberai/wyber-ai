import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Verify ownership
  const { data: flow } = await db.from('flows').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!flow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100)

  const { data: runs, error } = await db
    .from('flow_run_logs')
    .select('id, status, node_count, duration_ms, triggered_by, created_at, steps')
    .eq('source_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ runs: runs ?? [] })
}
