import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createCloudSQLInstance, generateInstanceName } from '@/lib/google-cloud-sql'
import { encrypt } from '@/lib/secrets-crypto'

const CLOUD_DB_CREATION_CREDITS = 5
const GCP_REGION = process.env.GOOGLE_CLOUD_REGION || 'us-central1'

// A Postgres identifier must start with a letter/underscore, contain only
// letters/digits/underscores, and fit in 63 bytes. Users pick their own
// database name (this used to be hardcoded to 'wyberai_db' for everyone,
// which is exactly what showed up when auditing a fresh project) — sanitize
// rather than trust it verbatim since it goes straight into a CREATE DATABASE
// statement's identifier position.
function sanitizeDbName(raw: string | undefined, fallbackSeed: string): string {
  const base = (raw || fallbackSeed || 'app')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  const withValidStart = /^[a-z]/.test(base) ? base : `db_${base}`
  return (withValidStart || 'app_db').slice(0, 63)
}

const MIN_PASSWORD_LENGTH = 8

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, dbName, dbPassword, region = GCP_REGION } = await req.json()
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    if (dbPassword !== undefined && String(dbPassword).length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Database password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Check user has sufficient credits
    const { data: profile } = await admin
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    // ✅ TEMPORARY: Free databases during testing phase
    // if (!profile || profile.credits < CLOUD_DB_CREATION_CREDITS) {
    //   return NextResponse.json({
    //     error: 'Insufficient credits',
    //     required: CLOUD_DB_CREATION_CREDITS,
    //     available: profile?.credits ?? 0,
    //   }, { status: 402 })
    // }

    // Verify project ownership
    const { data: project } = await admin
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Kick off Cloud SQL instance creation — this is async and takes
    // 5-10 minutes. We store the operation name and poll it from
    // /api/cloud/create-database/status instead of blocking this request.
    const sanitizedDbName = sanitizeDbName(dbName, project.name)

    let gcpInstanceName: string
    let operationName: string | undefined
    let postgresPassword: string

    try {
      gcpInstanceName = generateInstanceName(projectId, project.name)
      console.log(`[cloud-create-database] Requesting Cloud SQL instance: ${gcpInstanceName}`)

      const sqlInstance = await createCloudSQLInstance(gcpInstanceName, {
        region,
        database: sanitizedDbName,
        password: dbPassword,
      })

      operationName = sqlInstance.operationName || undefined
      postgresPassword = sqlInstance.password
    } catch (gcpErr) {
      console.error('[cloud-create-database] Google Cloud SQL provisioning failed:', gcpErr)
      return NextResponse.json({
        error: 'Failed to provision database on Google Cloud SQL',
        details: String(gcpErr),
      }, { status: 502 })
    }

    const cloudDatabaseId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)

    try {
      // Insert cloud database record in 'provisioning' state — the
      // frontend polls /api/cloud/create-database/status until it flips
      // to 'ready' (or 'failed').
      const { error: dbInsertErr } = await admin
        .from('cloud_databases')
        .insert({
          id: cloudDatabaseId,
          wyber_project_id: projectId,
          user_id: user.id,
          gcp_instance_name: gcpInstanceName,
          operation_name: operationName,
          db_name: sanitizedDbName,
          db_user: 'postgres',
          region,
          status: 'provisioning',
        })

      if (dbInsertErr) {
        console.error('[cloud-create-database] Failed to insert cloud_databases:', dbInsertErr)
        throw dbInsertErr
      }

      // Stash the generated password now (encrypted) so the status-poll
      // step can finish wiring up project_connectors once the host IP
      // is known, without needing to re-derive or re-generate it.
      const encryptedPassword = encrypt(postgresPassword)
      const { error: connectorErr } = await admin
        .from('project_connectors')
        .upsert({
          project_id: projectId,
          user_id: user.id,
          service: 'cloud-database',
          api_key: encryptedPassword,
          config: { ref: cloudDatabaseId, user: 'postgres', database: sanitizedDbName },
          connected_at: new Date().toISOString(),
        }, { onConflict: 'project_id,service' })

      if (connectorErr) {
        console.error('[cloud-create-database] Failed to insert project_connectors:', connectorErr)
        throw connectorErr
      }

      // ✅ TEMPORARY: Skip credit deduction — WyberCloud is free during the
      // 2-year launch offer, so there is nothing to deduct.

      return NextResponse.json({
        success: true,
        cloudDatabaseId,
        gcpInstanceName,
        dbName: sanitizedDbName,
        status: 'provisioning',
        message: 'Provisioning your free WyberCloud database — this takes 5-10 minutes.',
      })
    } catch (err) {
      console.error('[cloud-create-database] Database insertion failed:', err)
      return NextResponse.json({
        error: 'Failed to store database credentials',
        details: String(err),
      }, { status: 500 })
    }
  } catch (err) {
    console.error('[cloud-create-database] Unexpected error:', err)
    return NextResponse.json({
      error: String(err),
    }, { status: 500 })
  }
}
