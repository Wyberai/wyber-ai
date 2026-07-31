import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const logType = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const admin = await createAdminClient()

    let query = admin
      .from('cloud_query_logs')
      .select('*')
      .eq('wyber_project_id', projectId)
      .eq('user_id', user.id)
      .order('executed_at', { ascending: false })
      .limit(limit)

    if (logType !== 'all') {
      query = query.eq('type', logType)
    }

    const { data, error } = await query

    if (error) {
      console.error('[cloud/logs] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[cloud/logs] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
