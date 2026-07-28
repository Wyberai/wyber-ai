import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPostgresConnection } from '@/lib/database/postgres'
import { getCloudDatabaseCredentials } from '@/lib/cloud/get-db-credentials'

function convertToCSV(data: any[]) {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csv = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...data.map(row =>
      headers.map(h => {
        const value = row[h]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
        return value
      }).join(',')
    )
  ].join('\n')

  return csv
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const tableName = searchParams.get('table')
    const schema = searchParams.get('schema') || 'public'
    const format = searchParams.get('format') || 'csv'

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

    // Get all data
    const result = await connection.query(`SELECT * FROM "${schema}"."${tableName}"`)
    await connection.end()

    const filename = `${tableName}-export.${format}`

    if (format === 'json') {
      return new NextResponse(JSON.stringify(result.rows, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }

    // CSV format
    const csv = convertToCSV(result.rows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (err) {
    console.error('[cloud/database/export] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
