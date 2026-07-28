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
    const tableName = searchParams.get('table')
    const schema = searchParams.get('schema') || 'public'

    if (!projectId || !tableName) {
      return NextResponse.json({ error: 'Missing projectId or table' }, { status: 400 })
    }

    // Get cloud database credentials (with decrypted password)
    const credentials = await getCloudDatabaseCredentials(projectId, user.id)
    if (!credentials) {
      return NextResponse.json({ error: 'Database credentials not found' }, { status: 404 })
    }

    // Connect to user's database
    const connection = await getPostgresConnection(credentials)

    // Get column information
    const result = await connection.query(`
      SELECT
        column_name as name,
        data_type as type,
        is_nullable as nullable,
        column_default as default_value,
        character_maximum_length as max_length
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, tableName])

    await connection.end()

    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('[cloud/database/columns] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
