import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { deleteCloudSQLInstance } from '@/lib/google-cloud-sql'

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const databaseId = searchParams.get('databaseId')

    if (!projectId || !databaseId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Verify ownership
    const { data: db, error: fetchError } = await admin
      .from('cloud_databases')
      .select('*')
      .eq('id', databaseId)
      .eq('wyber_project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    // Tear down the real Cloud SQL instance first — deleting only the
    // metadata row leaves a running, billed Postgres instance with the
    // customer's data on it orphaned forever.
    if (db.gcp_instance_name) {
      try {
        await deleteCloudSQLInstance(db.gcp_instance_name)
      } catch (gcpErr: any) {
        if (!String(gcpErr?.message || gcpErr).includes('does not exist')) {
          console.error('[cloud/delete-database] Failed to delete Cloud SQL instance:', gcpErr)
          return NextResponse.json({
            error: 'Failed to delete the Cloud SQL instance — not removing the record so this can be retried.',
            details: String(gcpErr),
          }, { status: 502 })
        }
      }
    }

    const { error: deleteError } = await admin
      .from('cloud_databases')
      .delete()
      .eq('id', databaseId)

    if (deleteError) {
      throw new Error(`Failed to delete database: ${deleteError.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[cloud/delete-database] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
