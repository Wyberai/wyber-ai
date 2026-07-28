import { createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/secrets-crypto'

export interface CloudDatabaseCredentials {
  host: string
  port: number
  database: string
  user: string
  password: string
}

/**
 * Fetch and decrypt cloud database credentials from both cloud_databases
 * and project_connectors tables. Returns credentials ready for pg connection.
 */
export async function getCloudDatabaseCredentials(
  projectId: string,
  userId: string
): Promise<CloudDatabaseCredentials | null> {
  const admin = await createAdminClient()

  // Get cloud database info from cloud_databases table
  const { data: database, error: dbError } = await admin
    .from('cloud_databases')
    .select('*')
    .eq('wyber_project_id', projectId)
    .eq('user_id', userId)
    .single()

  if (dbError || !database) {
    console.error('[get-db-credentials] Database record not found:', dbError)
    return null
  }

  // Get encrypted password from project_connectors table
  const { data: connector, error: connError } = await admin
    .from('project_connectors')
    .select('config, api_key')
    .eq('project_id', projectId)
    .eq('service', 'cloud-database')
    .single()

  if (connError || !connector?.config) {
    console.error('[get-db-credentials] Connector not found:', connError)
    return null
  }

  try {
    // Decrypt password from connector.api_key (where it's stored by create-database endpoint)
    const decryptedPassword = decrypt(connector.api_key)

    return {
      host: database.db_host,
      port: database.db_port,
      database: database.db_name,
      user: database.db_user,
      password: decryptedPassword
    }
  } catch (err) {
    console.error('[get-db-credentials] Failed to decrypt password:', err)
    return null
  }
}
