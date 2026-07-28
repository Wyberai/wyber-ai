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

    // Ready — persist host/port and finish wiring the connector with the
    // full connection URL now that we know the IP.
    await admin
      .from('cloud_databases')
      .update({ status: 'ready', db_host: result.host, db_port: result.port })
      .eq('id', cloudDatabaseId)

    const { data: connector } = await admin
      .from('project_connectors')
      .select('api_key, config')
      .eq('project_id', db.wyber_project_id)
      .eq('service', 'cloud-database')
      .single()

    if (connector?.api_key) {
      const password = decrypt(connector.api_key)
      const url = `postgresql://postgres:${password}@${result.host}:${result.port}/${result.database}?sslmode=require`
      await admin
        .from('project_connectors')
        .update({
          config: { ...connector.config, url: encrypt(url), host: result.host, port: result.port },
        })
        .eq('project_id', db.wyber_project_id)
        .eq('service', 'cloud-database')
    }

    return NextResponse.json({ status: 'ready', host: result.host, port: result.port })
  } catch (err) {
    console.error('[cloud/create-database/status] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
