import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPostgresConnection } from '@/lib/database/postgres'
import { getCloudDatabaseCredentials } from '@/lib/cloud/get-db-credentials'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    // Get cloud database credentials (with decrypted password)
    const credentials = await getCloudDatabaseCredentials(projectId, user.id)
    if (!credentials) {
      return NextResponse.json({ error: 'Database credentials not found' }, { status: 404 })
    }

    const connection = await getPostgresConnection(credentials)

    // Get statistics from database
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public')::int as table_count,
        (SELECT SUM(pg_total_relation_size(schemaname||'.'||tablename))::bigint FROM pg_tables WHERE schemaname = 'public') as storage_bytes,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active')::int as active_connections
    `

    const result = await connection.query(statsQuery)
    await connection.end()

    const row = result.rows[0]

    return NextResponse.json({
      tableCount: row.table_count || 0,
      storageBytes: parseInt(row.storage_bytes) || 0,
      activeConnections: row.active_connections || 0,
      lastQuery: new Date().toISOString()
    })
  } catch (err) {
    console.error('[cloud/database/stats] Error:', err)
    return NextResponse.json({
      tableCount: 0,
      storageBytes: 0,
      activeConnections: 0,
      error: String(err)
    }, { status: 200 }) // Return 200 even on error so UI doesn't break
  }
}
