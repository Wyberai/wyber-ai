import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/secrets-crypto'
import { Pool } from 'pg'

/**
 * Apply schema SQL to a WyberAI Cloud (Railway Postgres) database.
 * Similar to /api/connectors/supabase/apply-schema but uses direct Postgres
 * connection instead of Supabase Management API.
 */

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, sql } = await req.json().catch(() => ({} as { projectId?: string; sql?: string }))
  if (!projectId || typeof sql !== 'string' || !sql.trim()) {
    return NextResponse.json({ error: 'projectId and sql required' }, { status: 400 })
  }
  if (sql.length > 20_000) {
    return NextResponse.json({ error: 'SQL too large' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Get cloud database for this project
  const { data: cloudDb } = await admin
    .from('cloud_databases')
    .select('id')
    .eq('wyber_project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!cloudDb) {
    return NextResponse.json({ applied: false, reason: 'no-cloud-database' })
  }

  // Get encrypted credentials from project_connectors
  const { data: connector } = await admin
    .from('project_connectors')
    .select('api_key, config')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('service', 'cloud-database')
    .maybeSingle()

  if (!connector || !connector.config?.url) {
    console.error('[cloud-apply-schema] Missing connector credentials for project:', projectId)
    return NextResponse.json({ applied: false, reason: 'no-credentials' }, { status: 500 })
  }

  let pool: Pool | null = null
  try {
    // Decrypt credentials
    const postgresUrl = decrypt(connector.config.url)
    const config = connector.config as any

    // Create connection pool
    pool = new Pool({
      connectionString: postgresUrl,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000,
    })

    // Apply SQL
    console.log('[cloud-apply-schema] Applying schema to cloud database:', cloudDb.id)
    const result = await pool.query(sql)

    return NextResponse.json({ applied: true, rowsAffected: result.rowCount })
  } catch (e) {
    const msg = String(e)
    console.error('[cloud-apply-schema] failed:', msg.slice(0, 300))

    // Re-running non-idempotent statements is benign
    if (/already exists|duplicate key|constraint violation/i.test(msg)) {
      return NextResponse.json({ applied: true, note: 'already-exists' })
    }

    return NextResponse.json({
      applied: false,
      reason: 'sql-error',
      error: msg.slice(0, 500),
    })
  } finally {
    if (pool) {
      await pool.end()
    }
  }
}
