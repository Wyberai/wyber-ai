import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// Uploads a JSON file to GCS using the JSON API (no SDK needed)
async function uploadToGcs(bucket: string, path: string, data: unknown, accessToken: string) {
  const body = JSON.stringify(data)
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GCS upload failed for ${path}: ${res.status} ${err}`)
  }
  return res.json()
}

// Get access token from service account key (JWT → OAuth2)
async function getAccessToken(): Promise<string> {
  const keyJson = process.env.GCS_SERVICE_ACCOUNT_KEY
  if (!keyJson) throw new Error('GCS_SERVICE_ACCOUNT_KEY not set')

  const key = JSON.parse(keyJson) as { client_email: string; private_key: string; token_uri: string }

  // Build JWT
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const claim = btoa(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/devstorage.read_write',
    aud: key.token_uri,
    exp: now + 3600,
    iat: now,
  }))

  // Sign with private key using Web Crypto
  const pemBody = key.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')
  const binaryKey = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  )

  const signatureInput = new TextEncoder().encode(`${header}.${claim}`)
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signatureInput)
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const jwt = `${header}.${claim}.${sig}`

  // Exchange JWT for access token
  const tokenRes = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`)
  const tokenData = await tokenRes.json() as { access_token: string }
  return tokenData.access_token
}

// POST /api/admin/sync-gcs
// Syncs all templates from Supabase → GCS bucket as individual JSON files + index files
export async function POST(req: NextRequest) {
  const authKey = req.headers.get('x-admin-key')
  if (authKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bucket = process.env.GCS_TEMPLATE_BUCKET
  if (!bucket) {
    return NextResponse.json({ error: 'GCS_TEMPLATE_BUCKET not set. Create a bucket in GCP Console first.' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({})) as { type?: 'web' | 'mobile' | 'workflow' | 'all' }
  const syncType = body.type ?? 'all'

  let accessToken: string
  try {
    accessToken = await getAccessToken()
  } catch (e) {
    return NextResponse.json({ error: `Auth failed: ${String(e)}. Set GCS_SERVICE_ACCOUNT_KEY env var.` }, { status: 503 })
  }

  const admin = getAdmin()
  const results: Record<string, { synced: number; errors: string[] }> = {}

  // ── Web + Mobile templates (from prebuilt_apps) ─────────────────────────
  if (syncType === 'all' || syncType === 'web' || syncType === 'mobile') {
    const { data: apps } = await admin
      .from('prebuilt_apps')
      .select('id, name, category, description, keywords, preview_color, files')
      .eq('valid', true)
      .order('category')

    const webApps = (apps ?? []).filter(a => !a.category?.startsWith('Mobile-'))
    const mobileApps = (apps ?? []).filter(a => a.category?.startsWith('Mobile-'))

    for (const [label, list] of [['web', webApps], ['mobile', mobileApps]] as const) {
      if (syncType !== 'all' && syncType !== label) continue

      const result = { synced: 0, errors: [] as string[] }
      const index: Array<{ id: string; name: string; category: string; description: string; preview_color: string }> = []

      for (const app of list) {
        try {
          await uploadToGcs(bucket, `templates/${app.id}.json`, app, accessToken)
          index.push({ id: app.id, name: app.name, category: app.category, description: app.description, preview_color: app.preview_color })
          result.synced++
        } catch (e) {
          result.errors.push(`${app.name}: ${String(e).slice(0, 100)}`)
        }
      }

      // Upload index file
      try {
        await uploadToGcs(bucket, `index/${label}.json`, index, accessToken)
      } catch (e) {
        result.errors.push(`index upload: ${String(e).slice(0, 100)}`)
      }

      results[label] = result
    }
  }

  // ── Workflow templates ─────────────────────────────────────────────────
  if (syncType === 'all' || syncType === 'workflow') {
    const { data: workflows } = await admin
      .from('workflow_templates')
      .select('id, name, category, description, nodes, edges')
      .order('category')

    const result = { synced: 0, errors: [] as string[] }
    const index: Array<{ id: string; name: string; category: string; description: string }> = []

    for (const wf of workflows ?? []) {
      try {
        await uploadToGcs(bucket, `templates/wf-${wf.id}.json`, wf, accessToken)
        index.push({ id: wf.id, name: wf.name, category: wf.category, description: wf.description })
        result.synced++
      } catch (e) {
        result.errors.push(`${wf.name}: ${String(e).slice(0, 100)}`)
      }
    }

    try {
      await uploadToGcs(bucket, `index/workflow.json`, index, accessToken)
    } catch (e) {
      result.errors.push(`index upload: ${String(e).slice(0, 100)}`)
    }

    results.workflow = result
  }

  return NextResponse.json({ results, bucket, cdn_url: `https://storage.googleapis.com/${bucket}` })
}
