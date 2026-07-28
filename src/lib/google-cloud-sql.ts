/**
 * Google Cloud SQL client — talks to the wybercloud-bridge Cloud Run service,
 * not the Cloud SQL Admin API directly.
 *
 * Vercel serverless functions have no ambient GCP identity, and the wyberai
 * org enforces `iam.disableServiceAccountKeyCreation`, so the usual fix (a
 * downloadable service-account JSON key passed via GOOGLE_APPLICATION_CREDENTIALS)
 * isn't available. Cloud Run doesn't have that problem — a service deployed
 * there runs AS its attached service account automatically, no key ever
 * created. gcp-bridge/ is that service: it wraps the actual Cloud SQL Admin
 * API calls and exposes them over HTTP, gated by a shared bearer secret
 * (GCP_BRIDGE_SECRET) instead of a GCP credential. See gcp-bridge/README.md
 * for how it's deployed.
 *
 * Instance creation is asynchronous and takes 5-10 minutes. This module
 * returns immediately with a 'provisioning' status and an operation name;
 * call checkInstanceOperation() to poll completion.
 */

const BRIDGE_URL = process.env.GCP_BRIDGE_URL
const BRIDGE_SECRET = process.env.GCP_BRIDGE_SECRET

async function bridgeFetch(path: string, init?: RequestInit) {
  if (!BRIDGE_URL || !BRIDGE_SECRET) {
    throw new Error('WyberCloud is not configured: GCP_BRIDGE_URL / GCP_BRIDGE_SECRET are missing.')
  }
  const res = await fetch(`${BRIDGE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BRIDGE_SECRET}`,
      ...(init?.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || data?.details || `Bridge request failed (${res.status})`)
  return data
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
  return bridgeFetch('/instances', {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      region: options.region,
      database: options.database,
      password: options.password,
    }),
  }) as Promise<{
    instanceName: string
    projectId: string
    region: string
    database: string
    user: string
    password: string
    status: 'provisioning'
    operationName?: string
  }>
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
  const params = new URLSearchParams({ instanceName, database })
  return bridgeFetch(`/operations/${encodeURIComponent(operationName)}?${params}`) as Promise<
    | { status: 'provisioning' }
    | { status: 'failed'; error: string }
    | { status: 'ready'; host: string; port: number; database: string }
  >
}

/**
 * Delete a Cloud SQL instance.
 */
export async function deleteCloudSQLInstance(instanceName: string) {
  await bridgeFetch(`/instances/${encodeURIComponent(instanceName)}`, { method: 'DELETE' })
}

/**
 * Get instance details.
 */
export async function getCloudSQLInstance(instanceName: string) {
  return bridgeFetch(`/instances/${encodeURIComponent(instanceName)}`)
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
