import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkInstanceOperation } from '@/lib/google-cloud-sql'
import { decrypt, encrypt } from '@/lib/secrets-crypto'

// Polled by the editor UI every ~10s while a database is 'provisioning'.
// Finalizes the row (host/port, connector credentials) once Cloud SQL
// reports the instance ready.
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const cloudDatabaseId = searchParams.get('cloudDatabaseId')
    if (!cloudDatabaseId) return NextResponse.json({ error: 'Missing cloudDatabaseId' }, { status: 400 })

    const admin = await createAdminClient()

    const { data: db, error } = await admin
      .from('cloud_databases')
      .select('*')
      .eq('id', cloudDatabaseId)
      .eq('user_id', user.id)
      .single()

    if (error || !db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    if (db.status !== 'provisioning') {
      return NextResponse.json({ status: db.status, host: db.db_host, port: db.db_port })
    }

    if (!db.operation_name || !db.gcp_instance_name) {
      return NextResponse.json({ error: 'Database is missing provisioning metadata' }, { status: 500 })
    }

    const result = await checkInstanceOperation(db.operation_name, db.gcp_instance_name, db.db_name)

    if (result.status === 'provisioning') {
      return NextResponse.json({ status: 'provisioning' })
    }

    if (result.status === 'failed') {
      await admin.from('cloud_databases').update({ status: 'failed', status_message: result.error }).eq('id', cloudDatabaseId)
      return NextResponse.json({ status: 'failed', error: result.error })
    }

    // Wire the connector's full connection URL BEFORE marking the row
    // 'ready' — the poller's early-return above (`status !== 'provisioning'`)
    // means this block only ever runs once. If it were ordered the other way
    // and this step failed partway (transient error, cold start), the row
    // would be stuck permanently 'ready' with no usable connection string,
    // since nothing would ever retry it. Keeping the row 'provisioning'
    // until the connector is actually usable makes that failure self-heal
    // on the next poll instead.
    const { data: connector } = await admin
      .from('project_connectors')
      .select('api_key, config')
      .eq('project_id', db.wyber_project_id)
      .eq('service', 'cloud-database')
      .single()

    if (!connector?.api_key) {
      // Connector row not visible yet (created alongside cloud_databases in
      // the same request) — treat as still-provisioning so the poll retries.
      return NextResponse.json({ status: 'provisioning' })
    }

    const password = decrypt(connector.api_key)
    const url = `postgresql://postgres:${password}@${result.host}:${result.port}/${result.database}?sslmode=require`
    await admin
      .from('project_connectors')
      .update({
        config: { ...connector.config, url: encrypt(url), host: result.host, port: result.port },
      })
      .eq('project_id', db.wyber_project_id)
      .eq('service', 'cloud-database')

    await admin
      .from('cloud_databases')
      .update({ status: 'ready', db_host: result.host, db_port: result.port })
      .eq('id', cloudDatabaseId)

    return NextResponse.json({ status: 'ready', host: result.host, port: result.port })
  } catch (err) {
    console.error('[cloud/create-database/status] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
