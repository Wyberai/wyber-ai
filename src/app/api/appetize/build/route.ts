import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

const GITHUB_BUILD_TOKEN  = process.env.GITHUB_BUILD_TOKEN   // PAT with repo+workflow scope
const GITHUB_BUILD_REPO   = process.env.GITHUB_BUILD_REPO    // e.g. 'wyberai/mobile-builds'
const APPETIZE_BUILD_SECRET = process.env.APPETIZE_BUILD_SECRET // static shared secret
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.com'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await req.json() as { projectId?: string }
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id, files, appetize_build_status')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Don't re-trigger an in-flight build
  if (project.appetize_build_status === 'queued' || project.appetize_build_status === 'building') {
    return NextResponse.json({ status: project.appetize_build_status })
  }

  if (!GITHUB_BUILD_TOKEN || !GITHUB_BUILD_REPO) {
    return NextResponse.json({ error: 'Build service not configured (set GITHUB_BUILD_TOKEN + GITHUB_BUILD_REPO)' }, { status: 503 })
  }

  if (!APPETIZE_BUILD_SECRET) {
    return NextResponse.json({ error: 'APPETIZE_BUILD_SECRET not set' }, { status: 503 })
  }

  // Snapshot current files so the build service can fetch them even if the
  // project is edited while the build is running.
  const admin = await createAdminClient()
  await admin
    .from('projects')
    .update({
      appetize_build_status: 'queued',
      appetize_build_started_at: new Date().toISOString(),
      appetize_build_id: null,
      appetize_build_snapshot: project.files,
    })
    .eq('id', projectId)

  const filesUrl   = `${APP_URL}/api/appetize/files?projectId=${projectId}&secret=${encodeURIComponent(APPETIZE_BUILD_SECRET)}`
  const callbackUrl = `${APP_URL}/api/appetize/webhook`

  const ghRes = await fetch(
    `https://api.github.com/repos/${GITHUB_BUILD_REPO}/actions/workflows/build-preview.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_BUILD_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: { project_id: projectId, files_url: filesUrl, callback_url: callbackUrl },
      }),
    },
  )

  if (!ghRes.ok) {
    const errText = await ghRes.text()
    await admin.from('projects').update({ appetize_build_status: 'error' }).eq('id', projectId)
    return NextResponse.json({ error: `Build trigger failed (${ghRes.status}): ${errText}` }, { status: 500 })
  }

  return NextResponse.json({ status: 'queued' })
}
