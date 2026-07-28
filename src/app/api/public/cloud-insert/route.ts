import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/secrets-crypto'
import { checkRateLimit } from '@/lib/cloud/rate-limit'
import { Pool } from 'pg'

// Public, unauthenticated insert endpoint for WyberCloud — called from an
// anonymous visitor's browser (a form on a published static site has no
// WyberAi session), the same trust model as /api/analytics/track. Unlike
// Supabase (PostgREST + anon key + Row Level Security), a raw Postgres
// instance has no browser-safe query layer, so this endpoint intentionally
// does NOT proxy arbitrary SQL. It only allows INSERT, only into tables
// named `public_*` (a table an app's own schema SQL explicitly opted into
// public writes by naming it that way), and only into columns that table
// actually has — validated against the live schema on every call, never
// trusted from the request body. No SELECT/UPDATE/DELETE: reading back or
// modifying existing rows still requires the project owner's authenticated
// Query console.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const PUBLIC_TABLE_RE = /^public_[a-z][a-z0-9_]{0,62}$/
const MAX_FIELDS = 20
const MAX_VALUE_LENGTH = 4000

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const projectId = body?.projectId
    const table = body?.table
    const data = body?.data

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing projectId' }, { status: 400, headers: CORS_HEADERS })
    }
    if (typeof table !== 'string' || !PUBLIC_TABLE_RE.test(table)) {
      return NextResponse.json({ success: false, error: 'table must match public_<name> and only contain lowercase letters, numbers, underscores' }, { status: 400, headers: CORS_HEADERS })
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({ success: false, error: 'data must be an object of column:value pairs' }, { status: 400, headers: CORS_HEADERS })
    }
    const fields = Object.keys(data)
    if (fields.length === 0 || fields.length > MAX_FIELDS) {
      return NextResponse.json({ success: false, error: `data must have 1-${MAX_FIELDS} fields` }, { status: 400, headers: CORS_HEADERS })
    }
    for (const v of Object.values(data)) {
      if (typeof v === 'string' && v.length > MAX_VALUE_LENGTH) {
        return NextResponse.json({ success: false, error: `A field value exceeds ${MAX_VALUE_LENGTH} characters` }, { status: 400, headers: CORS_HEADERS })
      }
    }

    // Rate-limit per project+IP — this is a public endpoint on the open
    // internet, spam/abuse is the expected threat model, not a logged-in user.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = checkRateLimit({ route: '/api/public/cloud-insert', userId: `${projectId}:${ip}`, limit: 30, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests — please try again shortly.' }, { status: 429, headers: CORS_HEADERS })
    }

    const admin = await createAdminClient()

    // Only a project with a READY WyberCloud database can be written to —
    // scoped purely by projectId since there's no visitor session to also
    // check a user_id against (same boundary the analytics beacon uses).
    const { data: cloudDb } = await admin
      .from('cloud_databases')
      .select('id, status')
      .eq('wyber_project_id', projectId)
      .eq('status', 'ready')
      .maybeSingle()
    if (!cloudDb) {
      return NextResponse.json({ success: false, error: 'No WyberCloud database is ready for this project' }, { status: 404, headers: CORS_HEADERS })
    }

    const { data: connector } = await admin
      .from('project_connectors')
      .select('config')
      .eq('project_id', projectId)
      .eq('service', 'cloud-database')
      .maybeSingle()
    if (!connector?.config?.url) {
      return NextResponse.json({ success: false, error: 'Database credentials unavailable' }, { status: 500, headers: CORS_HEADERS })
    }

    let pool: Pool | null = null
    try {
      const postgresUrl = decrypt(connector.config.url)
      pool = new Pool({ connectionString: postgresUrl, max: 1, connectionTimeoutMillis: 8000, idleTimeoutMillis: 5000 })

      // Validate the table exists and get its REAL column set — never trust
      // column names from the request body directly into SQL.
      const colsRes = await pool.query(
        `select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`,
        [table]
      )
      if (colsRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: `Table "${table}" does not exist` }, { status: 404, headers: CORS_HEADERS })
      }
      const realColumns = new Set(colsRes.rows.map(r => r.column_name))
      const unknownField = fields.find(f => !realColumns.has(f))
      if (unknownField) {
        return NextResponse.json({ success: false, error: `Unknown column "${unknownField}" on ${table}` }, { status: 400, headers: CORS_HEADERS })
      }

      // Parameterized insert — column names come only from the validated
      // realColumns set (never string-concatenated from the request), values
      // are always bound as $1, $2... placeholders.
      const columnList = fields.map(f => `"${f}"`).join(', ')
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ')
      const values = fields.map(f => data[f])
      await pool.query(`insert into "${table}" (${columnList}) values (${placeholders})`, values)

      return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
    } catch (err) {
      console.error('[public/cloud-insert] Insert failed:', String(err).slice(0, 300))
      return NextResponse.json({ success: false, error: 'Could not save — please try again.' }, { status: 500, headers: CORS_HEADERS })
    } finally {
      if (pool) await pool.end()
    }
  } catch (err) {
    console.error('[public/cloud-insert] Error:', err)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500, headers: CORS_HEADERS })
  }
}
