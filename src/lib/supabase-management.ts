/**
 * Supabase OAuth + Management API wrapper.
 *
 * Powers the one-click "Connect Supabase" flow: the customer authorizes via
 * Supabase OAuth, and we use the Management API (on their behalf, in THEIR org)
 * to list/create a project, read its anon key, and optionally run the app's SQL.
 * Data stays in the customer's Supabase account — we never host it.
 *
 * Docs: https://supabase.com/docs/reference/api / OAuth: https://api.supabase.com/v1/oauth
 */

const OAUTH_BASE = 'https://api.supabase.com/v1/oauth'
const MGMT_BASE = 'https://api.supabase.com/v1'

export interface OAuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number // seconds
  token_type: string
}

export interface SupabaseProject {
  id: string // the project ref
  organization_id: string
  name: string
  region: string
  created_at: string
  status: string
}

export interface SupabaseOrg {
  id: string
  name: string
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export function redirectUri(): string {
  return `${appUrl()}/api/connectors/supabase/callback`
}

export function authorizeUrl(state: string): string {
  const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID
  if (!clientId) throw new Error('SUPABASE_OAUTH_CLIENT_ID is not set')
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    state,
  })
  return `${OAUTH_BASE}/authorize?${params.toString()}`
}

function basicAuthHeader(): string {
  const id = process.env.SUPABASE_OAUTH_CLIENT_ID
  const secret = process.env.SUPABASE_OAUTH_CLIENT_SECRET
  if (!id || !secret) throw new Error('Supabase OAuth client credentials are not set')
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64')
}

/** Exchange an authorization code for tokens. */
export async function exchangeCode(code: string): Promise<OAuthTokens> {
  const res = await fetch(`${OAUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
    }).toString(),
  })
  if (!res.ok) throw new Error(`Supabase token exchange failed: ${res.status} ${await res.text()}`)
  return res.json()
}

/** Refresh an expired access token. */
export async function refreshTokens(refreshToken: string): Promise<OAuthTokens> {
  const res = await fetch(`${OAUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  })
  if (!res.ok) throw new Error(`Supabase token refresh failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function mgmt<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MGMT_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`Supabase Management API ${path} failed: ${res.status} ${await res.text()}`)
  return res.status === 204 ? (undefined as T) : res.json()
}

export function listOrganizations(token: string): Promise<SupabaseOrg[]> {
  return mgmt(token, '/organizations')
}

export function listProjects(token: string): Promise<SupabaseProject[]> {
  return mgmt(token, '/projects')
}

export function getProject(token: string, ref: string): Promise<SupabaseProject> {
  return mgmt(token, `/projects/${ref}`)
}

/** Create a new project in the user's org. Returns the new project (ref = id). */
export function createProject(token: string, body: {
  organization_id: string
  name: string
  db_pass: string
  region: string
  plan?: 'free' | 'pro'
}): Promise<SupabaseProject> {
  return mgmt(token, '/projects', { method: 'POST', body: JSON.stringify({ plan: 'free', ...body }) })
}

export interface ApiKey { name: string; api_key: string }
export function getApiKeys(token: string, ref: string): Promise<ApiKey[]> {
  return mgmt(token, `/projects/${ref}/api-keys`)
}

/** The public project URL for a ref. */
export function projectUrl(ref: string): string {
  return `https://${ref}.supabase.co`
}

/** Run SQL against the project's database (used for schema push). */
export function runSql(token: string, ref: string, query: string): Promise<unknown> {
  return mgmt(token, `/projects/${ref}/database/query`, {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}
