/**
 * Google Cloud SQL Helper
 *
 * Uses the Cloud SQL Admin REST API via googleapis + Application Default
 * Credentials — NOT the gcloud CLI. Shelling out to `gcloud` only works on a
 * machine that has the SDK installed and on PATH; it can never work on
 * serverless hosting (Vercel, Cloud Run) where the CLI isn't present. ADC
 * works locally (via `gcloud auth application-default login`) and in
 * production on Cloud Run (via the attached service account, no key file
 * needed) or anywhere else via GOOGLE_APPLICATION_CREDENTIALS.
 *
 * Instance creation is asynchronous and takes 5-10 minutes. This module
 * returns immediately with a 'provisioning' status and an operation name;
 * call checkInstanceOperation() to poll completion.
 */

import { google, sqladmin_v1 } from 'googleapis'
import { GoogleAuth } from 'google-auth-library'

const GCP_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'wyberai'
const GCP_REGION = process.env.GOOGLE_CLOUD_REGION || 'us-central1'

let sqlAdminClient: sqladmin_v1.Sqladmin | null = null

async function getSqlAdminClient() {
  if (sqlAdminClient) return sqlAdminClient

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/sqlservice.admin', 'https://www.googleapis.com/auth/cloud-platform'],
  })
  const authClient = await auth.getClient()
  sqlAdminClient = google.sqladmin({ version: 'v1', auth: authClient as any })
  return sqlAdminClient
}

/**
 * Kick off creation of a new Cloud SQL instance. Returns immediately —
 * the instance is not ready yet. Poll checkInstanceOperation() with the
 * returned operationName until status is 'DONE'.
 */
export async function createCloudSQLInstance(
  instanceName: string,
  options: {
    tier?: string
    region?: string
    database?: string
    /** User-chosen root password — falls back to a generated one if omitted. */
    password?: string
  } = {}
) {
  const tier = options.tier || 'db-f1-micro'
  const region = options.region || GCP_REGION
  const database = options.database || 'wyberai_db'
  const password = options.password || generatePassword()

  const sqladminClient = await getSqlAdminClient()

  console.log(`[google-cloud-sql] Requesting instance creation: ${instanceName}`)

  try {
    const insertRes = await sqladminClient.instances.insert({
      project: GCP_PROJECT,
      requestBody: {
        name: instanceName,
        region,
        databaseVersion: 'POSTGRES_15',
        settings: {
          tier,
          availabilityType: 'ZONAL',
          // This holds real customer data now — daily automated backups
          // (7-day retention) are cheap relative to the risk of an
          // unrecoverable data-loss incident on a free product.
          backupConfiguration: { enabled: true, startTime: '03:00', transactionLogRetentionDays: 7 },
          ipConfiguration: {
            ipv4Enabled: true,
            // A public IP alone accepts no inbound traffic — Cloud SQL
            // denies everything until a network is authorized. Customer
            // apps deploy to arbitrary, unpredictable hosts (Vercel, etc.),
            // so we can't allowlist specific IPs; encrypted transport +
            // per-instance random password is the actual security boundary.
            authorizedNetworks: [{ name: 'all', value: '0.0.0.0/0' }],
            // ENCRYPTED_ONLY enforces TLS in transit without demanding a
            // client certificate (the legacy requireSsl flag does both,
            // which would break every generated app's plain connection
            // string — they have no client cert to present).
            sslMode: 'ENCRYPTED_ONLY',
          },
        },
        rootPassword: password,
      },
    })

    return {
      instanceName,
      projectId: GCP_PROJECT,
      region,
      database,
      user: 'postgres',
      password,
      status: 'provisioning' as const,
      operationName: insertRes.data.name,
    }
  } catch (err: any) {
    if (!String(err?.message || err).includes('already exists')) throw err

    // A prior request for this instance name already went through (e.g.
    // a double-submit) — reuse it instead of erroring.
    console.log(`[google-cloud-sql] Instance already exists, reusing it: ${instanceName}`)
    const existing = await sqladminClient.instances.get({ project: GCP_PROJECT, instance: instanceName })

    if (existing.data.state !== 'RUNNABLE') {
      // Still mid-creation from the earlier request — can't set a password
      // yet, just hand back the still-running create operation to poll.
      const opsRes = await sqladminClient.operations.list({ project: GCP_PROJECT, instance: instanceName })
      const latestOp = opsRes.data.items?.[0]
      return {
        instanceName, projectId: GCP_PROJECT, region, database, user: 'postgres',
        password, // not yet valid — checkInstanceOperation() will only report 'ready' once this can be set
        status: 'provisioning' as const,
        operationName: latestOp?.name,
      }
    }

    // Instance is up — safe to (re)set the root password to the one we
    // just generated so it matches what gets stored (encrypted) below.
    const passwordOpRes = await sqladminClient.users.update({
      project: GCP_PROJECT,
      instance: instanceName,
      name: 'postgres',
      requestBody: { password },
    })

    return {
      instanceName,
      projectId: GCP_PROJECT,
      region,
      database,
      user: 'postgres',
      password,
      status: 'provisioning' as const,
      operationName: passwordOpRes.data.name,
    }
  }
}

/**
 * Poll an instance-creation operation. Once done, creates the default
 * database and returns connection details. Call repeatedly (e.g. every
 * 10-15s from a background job or status-check endpoint) until
 * `status === 'ready'` or `status === 'failed'`.
 */
export async function checkInstanceOperation(
  operationName: string,
  instanceName: string,
  database: string
) {
  const sqladminClient = await getSqlAdminClient()

  const opRes = await sqladminClient.operations.get({
    project: GCP_PROJECT,
    operation: operationName,
  })

  if (opRes.data.status !== 'DONE') {
    return { status: 'provisioning' as const }
  }

  if (opRes.data.error?.errors?.length) {
    return {
      status: 'failed' as const,
      error: opRes.data.error.errors.map(e => e.message).join('; '),
    }
  }

  // Instance is up — fetch its public IP
  const instanceRes = await sqladminClient.instances.get({
    project: GCP_PROJECT,
    instance: instanceName,
  })

  const publicIp = instanceRes.data.ipAddresses?.find(ip => ip.type === 'PRIMARY')?.ipAddress
  if (!publicIp) {
    return { status: 'failed' as const, error: 'No public IP assigned to instance' }
  }

  // Create the default database (idempotent — ignore "already exists")
  try {
    await sqladminClient.databases.insert({
      project: GCP_PROJECT,
      instance: instanceName,
      requestBody: { name: database },
    })
  } catch (err: any) {
    if (!String(err?.message || err).includes('already exists')) {
      return { status: 'failed' as const, error: `Failed to create database: ${String(err)}` }
    }
  }

  return {
    status: 'ready' as const,
    host: publicIp,
    port: 5432,
    database,
  }
}

/**
 * Delete a Cloud SQL instance.
 */
export async function deleteCloudSQLInstance(instanceName: string) {
  const sqladminClient = await getSqlAdminClient()
  console.log(`[google-cloud-sql] Deleting instance: ${instanceName}`)
  await sqladminClient.instances.delete({
    project: GCP_PROJECT,
    instance: instanceName,
  })
}

/**
 * Get instance details.
 */
export async function getCloudSQLInstance(instanceName: string) {
  const sqladminClient = await getSqlAdminClient()
  const res = await sqladminClient.instances.get({
    project: GCP_PROJECT,
    instance: instanceName,
  })
  return res.data
}

/**
 * Generate a random secure password.
 */
function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 24; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Generate instance name from project info.
 */
export function generateInstanceName(projectId: string, projectName: string): string {
  // Cloud SQL instance names must be lowercase alphanumeric with hyphens
  const sanitized = `wyberai-${projectId.slice(0, 8)}-${projectName
    .slice(0, 20)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')}`

  // Truncate to 63 chars (Cloud SQL limit)
  return sanitized.slice(0, 63)
}
