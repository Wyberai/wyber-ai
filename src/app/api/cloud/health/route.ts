import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/secrets-crypto'
import { Pool } from 'pg'

export async function GET(req: NextRequest) {
  let pool: Pool | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ ok: false }, { status: 400 })

    const admin = await createAdminClient()

    // Verify the requesting user actually owns this project before ever
    // touching its connector — this endpoint used to skip auth entirely,
    // which let anyone who knew/guessed a projectId make the server decrypt
    // a stranger's real database password and open a live connection to it.
    const { data: project } = await admin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    if (!project) return NextResponse.json({ ok: false }, { status: 403 })

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
    // Cloud SQL's self-signed per-instance CA needs rejectUnauthorized: false
    // (same as lib/database/postgres.ts). The connection string's own
    // "?sslmode=require" is treated as an alias for "verify-full" by newer
    // pg-connection-string versions and overrides that explicit ssl option —
    // strip it so rejectUnauthorized: false actually takes effect.
    const sslStrippedUrl = postgresUrl.replace(/[?&]sslmode=[^&]*/, '')
    pool = new Pool({ connectionString: sslStrippedUrl, max: 1, connectionTimeoutMillis: 5000, ssl: { rejectUnauthorized: false } })

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
