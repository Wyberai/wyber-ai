// Google Cloud Storage template cache
// Serves pre-built app templates from GCS (private bucket, authenticated reads)
// Bucket does NOT need to be public — uses service account auth

const GCS_BUCKET = process.env.GCS_TEMPLATE_BUCKET || ''

export interface CachedTemplate {
  id: string
  name: string
  category: string
  description: string
  keywords: string[]
  preview_color: string
  files: Record<string, string>
}

export function isGcsConfigured(): boolean {
  return !!GCS_BUCKET && !!process.env.GCS_SERVICE_ACCOUNT_KEY
}

let _cachedToken: { token: string; expires: number } | null = null

async function getGcsAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _cachedToken.expires) return _cachedToken.token

  const keyJson = process.env.GCS_SERVICE_ACCOUNT_KEY
  if (!keyJson) throw new Error('GCS_SERVICE_ACCOUNT_KEY not set')

  const key = JSON.parse(keyJson) as { client_email: string; private_key: string; token_uri: string }

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const claim = btoa(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/devstorage.read_only',
    aud: key.token_uri,
    exp: now + 3600,
    iat: now,
  }))

  const pemBody = key.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')
  const binaryKey = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(`${header}.${claim}`))
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const tokenRes = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${header}.${claim}.${sig}`,
  })
  if (!tokenRes.ok) throw new Error(`GCS token exchange failed: ${tokenRes.status}`)
  const { access_token } = await tokenRes.json() as { access_token: string }

  _cachedToken = { token: access_token, expires: Date.now() + 3500_000 }
  return access_token
}

async function gcsGet(path: string): Promise<Response> {
  const token = await getGcsAccessToken()
  return fetch(`https://storage.googleapis.com/storage/v1/b/${GCS_BUCKET}/o/${encodeURIComponent(path)}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function fetchTemplateFromGcs(templateId: string): Promise<CachedTemplate | null> {
  if (!isGcsConfigured()) return null
  try {
    const res = await gcsGet(`templates/${templateId}.json`)
    if (!res.ok) return null
    return await res.json() as CachedTemplate
  } catch {
    return null
  }
}

export async function fetchTemplateIndex(type: 'web' | 'mobile' | 'workflow'): Promise<Array<{ id: string; name: string; category: string; description: string; preview_color: string }>> {
  if (!isGcsConfigured()) return []
  try {
    const res = await gcsGet(`index/${type}.json`)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}
