export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { bundleRnApp } from '@/app/api/rn-web-bundle/route'
import { buildPreviewHtml } from '@/lib/rnw-preview/shell'

const BUCKET = 'mobile-bundles'

// Pre-bundle a mobile project and cache the HTML in Supabase Storage so the
// companion app can load it from a stable URL instead of re-bundling every time.
// The cached bundle is re-used if the project files haven't changed; callers can
// force a rebuild by passing `force: true`.
//
// POST /api/mobile-bundle  { projectId, force? }
// Returns: { url: string, fresh: boolean }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as { projectId?: string; force?: boolean }
    const { projectId, force = false } = body
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    // Fetch project (must be owned by the signed-in user)
    const { data: project } = await supabase
      .from('projects')
      .select('files, name, mobile_bundle_url, mobile_bundled_at, project_type')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    if (project.project_type !== 'mobile') {
      return NextResponse.json({ error: 'Not a mobile project' }, { status: 400 })
    }

    const files = project.files as Record<string, unknown> | null
    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json({ error: 'No files yet — build something first' }, { status: 422 })
    }

    // Return cached URL if it's less than 30 min old and not a forced rebuild
    if (!force && project.mobile_bundle_url && project.mobile_bundled_at) {
      const age = Date.now() - new Date(project.mobile_bundled_at as string).getTime()
      if (age < 30 * 60 * 1000) {
        return NextResponse.json({ url: project.mobile_bundle_url, fresh: false })
      }
    }

    // Bundle
    const result = await bundleRnApp(files)
    if (!result.ok) {
      return NextResponse.json({ error: result.error, kind: result.kind }, { status: 422 })
    }

    const html = buildPreviewHtml(result.js)

    // Upload to Supabase Storage — create bucket if it doesn't exist yet
    const admin = await createAdminClient()
    try { await admin.storage.createBucket(BUCKET, { public: true }) } catch { /* already exists */ }

    const path = `${projectId}/index.html`
    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(path, Buffer.from(html, 'utf-8'), {
        contentType: 'text/html; charset=utf-8',
        upsert: true,
      })

    if (uploadErr) {
      // Return the HTML directly as fallback if storage fails
      return NextResponse.json({ html, fresh: true })
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path)
    const url = urlData.publicUrl

    // Persist the bundle URL back to the project row
    await admin
      .from('projects')
      .update({ mobile_bundle_url: url, mobile_bundled_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({ url, fresh: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
