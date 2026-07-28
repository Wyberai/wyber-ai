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
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit

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

    // Get total count
    const countResult = await connection.query(
      `SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`
    )
    const totalCount = parseInt(countResult.rows[0].count, 10)

    // Get data
    const dataResult = await connection.query(
      `SELECT * FROM "${schema}"."${tableName}" LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    await connection.end()

    return NextResponse.json({
      data: dataResult.rows,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    })
  } catch (err) {
    console.error('[cloud/database/data] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
