import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/secrets-crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  listOrganizations, listProjects, getApiKeys, createProject, projectUrl,
  refreshTokens, getProject, listTablesWithoutRls,
} from '@/lib/supabase-management'

/**
 * After OAuth: list the user's Supabase orgs/projects, and link or create one.
 * Linking writes the standard service='supabase' connector ({ url, anon key })
 * that the code generator's getSupabaseContext already reads — so codegen is
 * untouched.
 */

// WyberAi's OWN platform Supabase project ref — derived from the app's URL.
// It must NEVER be linkable to a generated app (that would point a customer app
// at our production database). We hide it from the picker and reject linking it.
const PLATFORM_REF = (() => {
  const m = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase/i)
  return m ? m[1] : ''
})()

// Read the stored OAuth tokens for this project, refreshing if near expiry.
async function getValidToken(supabase: SupabaseClient, projectId: string, userId: string): Promise<string> {
  const { data } = await supabase
    .from('project_connectors')
    .select('api_key, config')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('service', 'supabase-oauth')
    .single()
  if (!data) throw new Error('Supabase is not connected for this project. Click "Connect Supabase" first.')

  const expiresAt = Number(data.config?.expires_at ?? 0)
  let accessToken = decrypt(data.api_key)

  if (Date.now() > expiresAt - 60_000) {
    // Expired (or within 60s) → refresh and persist.
    const refresh = decrypt(String(data.config?.refresh_token ?? ''))
    const t = await refreshTokens(refresh)
    accessToken = t.access_token
    await supabase.from('project_connectors').update({
      api_key: encrypt(t.access_token),
      config: { refresh_token: encrypt(t.refresh_token), expires_at: Date.now() + t.expires_in * 1000 },
    }).eq('project_id', projectId).eq('user_id', userId).eq('service', 'supabase-oauth')
  }
  return accessToken
}

// Write the standard supabase connector (url + anon key) that codegen reads.
async function linkProject(supabase: SupabaseClient, projectId: string, userId: string, token: string, ref: string) {
  // anon key may take a moment after creation — retry a few times.
  let anon = ''
  for (let i = 0; i < 5 && !anon; i++) {
    try {
      const keys = await getApiKeys(token, ref)
      anon = keys.find(k => k.name === 'anon')?.api_key ?? ''
    } catch { /* provisioning — retry */ }
    if (!anon) await new Promise(r => setTimeout(r, 1500))
  }
  if (!anon) throw new Error('Project is still provisioning — try linking again in a moment.')

  await supabase.from('project_connectors').upsert({
    project_id: projectId,
    user_id: userId,
    service: 'supabase',
    api_key: encrypt(anon),
    config: { url: projectUrl(ref), ref, via: 'oauth' },
    connected_at: new Date().toISOString(),
  }, { onConflict: 'project_id,service' })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = new URL(req.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  try {
    const token = await getValidToken(supabase, projectId, user.id)
    const [orgs, projects] = await Promise.all([listOrganizations(token), listProjects(token)])
    // Never expose WyberAi's own platform DB as a linkable option.
    const safe = projects.filter(p => p.id !== PLATFORM_REF)
    return NextResponse.json({ orgs, projects: safe })
  } catch (e) {
    console.error('[supabase/projects GET] failed:', String(e))
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, action, ref, name, orgId, dbPass, region } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  // Hard block: refuse to link WyberAi's own platform database.
  if (ref && PLATFORM_REF && ref === PLATFORM_REF) {
    return NextResponse.json({ error: 'That project cannot be linked.' }, { status: 403 })
  }

  try {
    const token = await getValidToken(supabase, projectId, user.id)

    if (action === 'create') {
      if (!orgId || !name || !dbPass) return NextResponse.json({ error: 'orgId, name, dbPass required' }, { status: 400 })
      const created = await createProject(token, { organization_id: orgId, name, db_pass: dbPass, region: region || 'us-east-1' })
      await linkProject(supabase, projectId, user.id, token, created.id)
      return NextResponse.json({ linked: true, ref: created.id, url: projectUrl(created.id) })
    }

    // default: link an existing project
    if (!ref) return NextResponse.json({ error: 'ref required to link' }, { status: 400 })
    await getProject(token, ref) // validates the ref belongs to the user
    await linkProject(supabase, projectId, user.id, token, ref)
    // Best-effort: warn if any table has RLS disabled — a freshly linked
    // existing project may already have tables, unlike a brand-new one.
    let rlsWarning: string[] = []
    try {
      rlsWarning = await listTablesWithoutRls(token, ref)
    } catch { /* non-fatal — surfaced as empty warning */ }
    return NextResponse.json({ linked: true, ref, url: projectUrl(ref), tablesWithoutRls: rlsWarning })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
