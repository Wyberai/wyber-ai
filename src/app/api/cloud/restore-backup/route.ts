import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { listPostgresBackups, restorePostgresBackup, getPostgresCredentials } from '@/lib/railway-api'
import { encrypt } from '@/lib/secrets-crypto'

export async function GET(req: NextRequest) {
  // List available backups for a cloud database
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const cloudDatabaseId = searchParams.get('cloudDatabaseId')
    if (!cloudDatabaseId) return NextResponse.json({ error: 'Missing cloudDatabaseId' }, { status: 400 })

    const admin = await createAdminClient()

    // Verify ownership
    const { data: cloudDb } = await admin
      .from('cloud_databases')
      .select('railway_project_id, railway_service_id')
      .eq('id', cloudDatabaseId)
      .eq('user_id', user.id)
      .single()

    if (!cloudDb) {
      return NextResponse.json({ error: 'Cloud database not found' }, { status: 404 })
    }

    // Fetch backups from Railway
    const backups = await listPostgresBackups(cloudDb.railway_project_id, cloudDb.railway_service_id)

    return NextResponse.json({ backups })
  } catch (err) {
    console.error('[cloud-restore-backup] GET error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Restore a backup to a new database instance
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { cloudDatabaseId, backupId, newDatabaseName } = await req.json()
    if (!cloudDatabaseId || !backupId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Verify ownership
    const { data: cloudDb } = await admin
      .from('cloud_databases')
      .select('railway_project_id, railway_service_id, id, user_id')
      .eq('id', cloudDatabaseId)
      .eq('user_id', user.id)
      .single()

    if (!cloudDb) {
      return NextResponse.json({ error: 'Cloud database not found' }, { status: 404 })
    }

    let newRailwayServiceId: string
    let newPostgresUrl: string
    let newPostgresHost: string
    let newPostgresPort: number
    let newPostgresDatabase: string
    let newPostgresUser: string
    let newPostgresPassword: string

    try {
      // Restore backup to new service
      console.log(`[cloud-restore-backup] Restoring backup ${backupId}`)
      newRailwayServiceId = await restorePostgresBackup(
        cloudDb.railway_project_id,
        cloudDb.railway_service_id,
        backupId,
        'production'
      )

      // Wait for service initialization
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Get credentials from new service
      const creds = await getPostgresCredentials(cloudDb.railway_project_id, newRailwayServiceId, 'production')
      newPostgresUrl = creds.url
      newPostgresHost = creds.host
      newPostgresPort = creds.port
      newPostgresDatabase = creds.database
      newPostgresUser = creds.user
      newPostgresPassword = creds.password
    } catch (railwayErr) {
      console.error('[cloud-restore-backup] Railway restore failed:', railwayErr)
      return NextResponse.json({
        error: 'Failed to restore backup on Railway',
        details: String(railwayErr),
      }, { status: 502 })
    }

    // Create new cloud_databases record for the restored instance
    const restoredDatabaseId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)

    try {
      // Insert restored database record
      const { error: dbInsertErr } = await admin
        .from('cloud_databases')
        .insert({
          id: restoredDatabaseId,
          wyber_project_id: cloudDb.id, // Same project
          user_id: user.id,
          railway_project_id: cloudDb.railway_project_id,
          railway_environment: 'production',
          railway_service_id: newRailwayServiceId,
          db_host: newPostgresHost,
          db_port: newPostgresPort,
          db_name: newPostgresDatabase || (newDatabaseName || 'restored'),
          db_user: newPostgresUser,
          region: 'us-west',
          status: 'ready',
        })

      if (dbInsertErr) {
        console.error('[cloud-restore-backup] Failed to insert restored database:', dbInsertErr)
        throw dbInsertErr
      }

      // Store encrypted credentials
      const encryptedUrl = encrypt(newPostgresUrl)
      const encryptedPassword = encrypt(newPostgresPassword)

      const { error: connectorErr } = await admin
        .from('project_connectors')
        .insert({
          project_id: cloudDb.id,
          user_id: user.id,
          service: `cloud-database-restored-${Date.now()}`, // Unique service name for restored DB
          api_key: encryptedPassword,
          config: {
            ref: restoredDatabaseId,
            url: encryptedUrl,
            host: newPostgresHost,
            port: newPostgresPort,
            database: newPostgresDatabase,
            user: newPostgresUser,
            isRestore: true,
            originalBackupId: backupId,
          },
          connected_at: new Date().toISOString(),
        })

      if (connectorErr) {
        console.error('[cloud-restore-backup] Failed to store restored credentials:', connectorErr)
        throw connectorErr
      }

      // Log restore event (no credit charge for restore)
      await admin.from('credit_usage').insert({
        user_id: user.id,
        project_id: cloudDb.id,
        amount: 0,
        reason: 'cloud-database-restore',
      }).then(undefined, e => console.warn('Failed to log restore event:', e))

      return NextResponse.json({
        success: true,
        restoredDatabaseId,
        newRailwayServiceId,
        databaseName: newPostgresDatabase,
        databaseUser: newPostgresUser,
        message: 'Backup restored to new database instance',
      })
    } catch (err) {
      console.error('[cloud-restore-backup] Database insertion failed:', err)
      return NextResponse.json({
        error: 'Failed to store restored database credentials',
        details: String(err),
      }, { status: 500 })
    }
  } catch (err) {
    console.error('[cloud-restore-backup] Unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
