import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CloudError, Validation } from '@/lib/cloud/errors'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Get all databases for this project
    const { data: databases, error } = await admin
      .from('cloud_databases')
      .select('*')
      .eq('wyber_project_id', projectId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[cloud/databases] Query failed:', error)
      return NextResponse.json({ error: error.message, databases: [] }, { status: 500 })
    }

    const result = databases || []

    return NextResponse.json({
      databases: result,
      count: result.length,
    })
  } catch (err) {
    console.error('[cloud/databases] Error:', err)
    return NextResponse.json(
      { error: String(err), databases: [] },
      { status: 500 }
    )
  }
}
