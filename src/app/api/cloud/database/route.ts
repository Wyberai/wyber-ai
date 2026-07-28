import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const admin = await createAdminClient()

    // Get cloud database
    const { data: database, error: dbError } = await admin
      .from('cloud_databases')
      .select('*')
      .eq('wyber_project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (dbError) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    return NextResponse.json(database)
  } catch (err) {
    console.error('[cloud/database] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
