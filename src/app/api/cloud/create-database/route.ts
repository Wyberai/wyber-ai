import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createCloudSQLInstance, generateInstanceName } from '@/lib/google-cloud-sql'
import { encrypt } from '@/lib/secrets-crypto'

const CLOUD_DB_CREATION_CREDITS = 5
const GCP_REGION = process.env.GOOGLE_CLOUD_REGION || 'us-central1'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, dbName, region = GCP_REGION } = await req.json()
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

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
    let gcpInstanceName: string
    let operationName: string | undefined
    let postgresPassword: string

    try {
      gcpInstanceName = generateInstanceName(projectId, project.name)
      console.log(`[cloud-create-database] Requesting Cloud SQL instance: ${gcpInstanceName}`)

      const sqlInstance = await createCloudSQLInstance(gcpInstanceName, {
        region,
        database: 'wyberai_db',
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
          db_name: 'wyberai_db',
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
          config: { ref: cloudDatabaseId, user: 'postgres', database: 'wyberai_db' },
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
