import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/secrets-crypto'
import { Pool } from 'pg'

export async function GET(req: NextRequest) {
  let pool: Pool | null = null

  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ ok: false }, { status: 400 })

    const admin = await createAdminClient()

    // Get connector
    const { data: connector } = await admin
      .from('project_connectors')
      .select('config')
      .eq('project_id', projectId)
      .eq('service', 'cloud-database')
      .single()

    if (!connector?.config?.url) {
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    const postgresUrl = decrypt(connector.config.url)
    pool = new Pool({ connectionString: postgresUrl, max: 1, connectionTimeoutMillis: 5000 })

    // Test connection
    const result = await pool.query('SELECT NOW()')

    return NextResponse.json({ ok: !!result.rows.length })
  } catch (err) {
    console.error('[cloud/health] Error:', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  } finally {
    if (pool) await pool.end()
  }
}
