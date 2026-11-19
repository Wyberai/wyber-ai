import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { clientAccess } from '@/lib/agency/access'
import { canEditProject } from '@/lib/project-access'
import { hit } from '@/lib/agency/limits'
import { auditClient } from '@/lib/agency/audit'
import { buildWebPreview, makePreviewToken, removePreviewFile } from '@/lib/agency/preview'

export const maxDuration = 150

// A private, updatable preview of one client project: { action: 'create' | 'refresh' | 'off' | 'rotate' }.
//   create / refresh: build the latest SAVED version and make the link live (a mobile project renders on request, so
//                     there is nothing to build).
//   off:              the link stops working and the stored page is removed.
//   rotate:           a new link; the old one stops working at once.
// It never publishes the project, never bills credits, and never returns the project id.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; deliverableId: string }> }) {
  const { id: clientId, deliverableId } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, clientId)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Your role in this workspace is view-only' }, { status: 403 })

  const { data: del } = await admin.from('client_deliverables').select('id, client_id, project_id, preview_token, preview_enabled').eq('id', deliverableId).eq('client_id', clientId).maybeSingle()
  if (!del) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const action = body.action as string
  if (!['create', 'refresh', 'off', 'rotate'].includes(action)) return NextResponse.json({ error: 'Choose create, refresh, off or rotate' }, { status: 400 })

  if (action === 'off') {
    await removePreviewFile(admin as never, del.preview_token)
    await admin.from('client_deliverables').update({ preview_enabled: false }).eq('id', deliverableId)
    auditClient(access, user.id, 'preview_off', { deliverable: deliverableId }, req)
    return NextResponse.json({ preview: { enabled: false } })
  }

  // The caller must be able to change the project itself, not only the client record.
  if (!(await canEditProject(admin, user.id, del.project_id))) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  const { data: project } = await admin.from('projects').select('id, name, files, project_type, feedback_mode_enabled').eq('id', del.project_id).maybeSingle()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const isMobile = project.project_type === 'mobile'
  // Building runs the build server, so it is limited per person.
  if (!isMobile && !(await hit(`preview-build:${user.id}`, 12, 60 * 60_000))) {
    return NextResponse.json({ error: 'Too many preview builds this hour. Try again later.' }, { status: 429 })
  }

  const rotate = action === 'rotate' || !del.preview_token
  const token = rotate ? makePreviewToken() : del.preview_token

  if (!isMobile) {
    const built = await buildWebPreview(admin as never, project, token)
    if (!built.ok) return NextResponse.json({ error: built.error }, { status: built.status })
  }
  // The old page is only removed once the new one exists, so a failed rebuild never leaves the client with nothing.
  if (rotate && del.preview_token && del.preview_token !== token) await removePreviewFile(admin as never, del.preview_token)

  const builtAt = new Date().toISOString()
  const { error } = await admin.from('client_deliverables').update({ preview_token: token, preview_enabled: true, preview_built_at: builtAt }).eq('id', deliverableId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  auditClient(access, user.id, action === 'rotate' ? 'preview_rotated' : 'preview_shared', { deliverable: deliverableId }, req)
  return NextResponse.json({ preview: { enabled: true, token, built_at: builtAt, kind: isMobile ? 'mobile' : 'web' } })
}
