/**
 * Google Cloud Storage client for the WyberCode template library — talks to
 * the wybercloud-bridge Cloud Run service, not the GCS API directly. Same
 * reasoning as src/lib/google-cloud-sql.ts: Vercel has no ambient GCP
 * identity and the org enforces `iam.disableServiceAccountKeyCreation`, so
 * this reuses the exact same shared-bearer-secret bridge rather than
 * standing up a second one. See gcp-bridge/README.md and gcp-bridge/server.js
 * (the `/storage/*` routes) for the service side.
 */

const BRIDGE_URL = process.env.GCP_BRIDGE_URL
const BRIDGE_SECRET = process.env.GCP_BRIDGE_SECRET
export const WYBERCODE_TEMPLATE_BUCKET = process.env.WYBERCODE_TEMPLATE_BUCKET || 'wyberai-wybercode-templates'

async function bridgeFetch(path: string, init?: RequestInit) {
  if (!BRIDGE_URL || !BRIDGE_SECRET) {
    throw new Error('WyberCode template storage is not configured: GCP_BRIDGE_URL / GCP_BRIDGE_SECRET are missing.')
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

export async function readTemplateObject(bucket: string, path: string): Promise<string> {
  const q = new URLSearchParams({ bucket, path })
  const data = await bridgeFetch(`/storage/object?${q.toString()}`)
  return data.content
}

export async function writeTemplateObject(bucket: string, path: string, content: string): Promise<void> {
  await bridgeFetch('/storage/object', { method: 'POST', body: JSON.stringify({ bucket, path, content }) })
}

export async function listTemplateObjects(bucket: string, prefix: string): Promise<string[]> {
  const q = new URLSearchParams({ bucket, prefix })
  const data = await bridgeFetch(`/storage/list?${q.toString()}`)
  return data.paths ?? []
}
