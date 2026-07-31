import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const APPETIZE_BUILD_SECRET = process.env.APPETIZE_BUILD_SECRET

// Called by the GitHub Actions build workflow to fetch the project's file
// snapshot without requiring user auth. Protected by a static shared secret.
export async function GET(req: NextRequest) {
  const secret    = req.nextUrl.searchParams.get('secret')
  const projectId = req.nextUrl.searchParams.get('projectId')

  if (!APPETIZE_BUILD_SECRET || secret !== APPETIZE_BUILD_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: project } = await admin
    .from('projects')
    .select('appetize_build_snapshot, appetize_build_status, name')
    .eq('id', projectId)
    .single()

  if (!project?.appetize_build_snapshot) {
    return NextResponse.json({ error: 'No build snapshot — trigger a build first' }, { status: 404 })
  }

  return NextResponse.json({
    projectId,
    projectName: project.name ?? 'WyberAi App',
    files: project.appetize_build_snapshot,
  })
}
