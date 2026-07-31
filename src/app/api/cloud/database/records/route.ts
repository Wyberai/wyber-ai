import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPostgresConnection } from '@/lib/database/postgres'
import { getCloudDatabaseCredentials } from '@/lib/cloud/get-db-credentials'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, table, schema = 'public', record } = await req.json()

    if (!projectId || !table || !record) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get cloud database credentials (with decrypted password)
    const credentials = await getCloudDatabaseCredentials(projectId, user.id)
    if (!credentials) {
      return NextResponse.json({ error: 'Database credentials not found' }, { status: 404 })
    }

    // Connect to user's database
    const connection = await getPostgresConnection(credentials)

    // Build INSERT query
    const columns = Object.keys(record)
    const values = Object.values(record)
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')

    const query = `
      INSERT INTO "${schema}"."${table}" (${columns.map(c => `"${c}"`).join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `

    const result = await connection.query(query, values)
    await connection.end()

    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('[cloud/database/records] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, table, schema = 'public', id, idColumn, record } = await req.json()

    if (!projectId || !table || !id || !idColumn || !record) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Get cloud database connection details
    const { data: database, error: dbError } = await admin
      .from('cloud_databases')
      .select('*')
      .eq('wyber_project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (dbError) return NextResponse.json({ error: 'Database not found' }, { status: 404 })

    // Connect to user's database
    const connection = await getPostgresConnection({
      host: database.db_host,
      port: database.db_port,
      database: database.db_name,
      user: database.db_user,
      password: database.db_password
    })

    // Build UPDATE query
    const columns = Object.keys(record)
    const values = Object.values(record)
    const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ')

    const query = `
      UPDATE "${schema}"."${table}"
      SET ${setClause}
      WHERE "${idColumn}" = $${columns.length + 1}
      RETURNING *
    `

    const result = await connection.query(query, [...values, id])
    await connection.end()

    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('[cloud/database/records] PUT Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, table, schema = 'public', id, idColumn } = await req.json()

    if (!projectId || !table || !id || !idColumn) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Get cloud database connection details
    const { data: database, error: dbError } = await admin
      .from('cloud_databases')
      .select('*')
      .eq('wyber_project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (dbError) return NextResponse.json({ error: 'Database not found' }, { status: 404 })

    // Connect to user's database
    const connection = await getPostgresConnection({
      host: database.db_host,
      port: database.db_port,
      database: database.db_name,
      user: database.db_user,
      password: database.db_password
    })

    const query = `DELETE FROM "${schema}"."${table}" WHERE "${idColumn}" = $1`
    await connection.query(query, [id])
    await connection.end()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[cloud/database/records] DELETE Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
