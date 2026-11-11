import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { clientAccess, myWorkspaces } from '@/lib/agency/access'
import { hashPasscode, MIN_PASSCODE, MAX_PASSCODE } from '@/lib/agency/passcode'
import { clientForOwner, newSlug } from '@/lib/agency/shape'
import { auditClient } from '@/lib/agency/audit'

const PATCHABLE = ['name', 'companyName', 'contactEmail', 'contactName', 'logoUrl', 'brandColor', 'introText', 'status', 'notes'] as const
const COLUMN_FOR: Record<(typeof PATCHABLE)[number], string> = {
  name: 'name', companyName: 'company_name', contactEmail: 'contact_email', contactName: 'contact_name',
  logoUrl: 'logo_url', brandColor: 'brand_color', introText: 'intro_text', status: 'status', notes: 'notes',
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Your role in this workspace is view-only' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of PATCHABLE) {
    if (body[key] !== undefined) updates[COLUMN_FOR[key]] = body[key]
  }
  if (updates.brand_color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(String(updates.brand_color))) {
    return NextResponse.json({ error: 'Brand colour must look like #0EA5E9' }, { status: 400 })
  }
  if (updates.status !== undefined && !['lead', 'active', 'paused', 'archived'].includes(updates.status as string)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Lock or unlock the page. A string sets the passcode; null or an empty string removes it.
  if (body.passcode !== undefined) {
    if (body.passcode === null || body.passcode === '') updates.portal_passcode_hash = null
    else if (typeof body.passcode !== 'string' || body.passcode.length < MIN_PASSCODE || body.passcode.length > MAX_PASSCODE) {
      return NextResponse.json({ error: `Passcode must be ${MIN_PASSCODE} to ${MAX_PASSCODE} characters` }, { status: 400 })
    } else updates.portal_passcode_hash = hashPasscode(body.passcode)
  }

  // A new link: the old one stops working at once (it will 404), and every browser unlocked on it is signed out.
  if (body.rotateLink === true) updates.slug = newSlug(String(updates.name ?? access.client.name ?? 'client'), nanoid(12))

  // Move a client between your own account and a workspace you can edit in. Only the person who created it can move it.
  if (body.orgId !== undefined) {
    if (access.client.owner_id !== user.id) return NextResponse.json({ error: 'Only the person who added this client can move it' }, { status: 403 })
    if (body.orgId === null) updates.org_id = null
    else {
      const space = (await myWorkspaces(admin, user.id)).find(s => s.id === body.orgId)
      if (!space || space.role === 'viewer') return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      updates.org_id = space.id
    }
  }

  const { data, error } = await admin
    .from('clients').update(updates)
    .eq('id', id)
    .select().maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (body.rotateLink === true) auditClient(access, user.id, 'link_rotated', undefined, req)
  if (body.passcode !== undefined) auditClient(access, user.id, body.passcode ? 'passcode_set' : 'passcode_removed', undefined, req)
  if (updates.status !== undefined && updates.status !== access.client.status) auditClient(access, user.id, 'status_changed', { from: access.client.status, to: updates.status }, req)
  if (body.orgId !== undefined) auditClient(access, user.id, 'workspace_changed', { to: body.orgId }, req)
  return NextResponse.json({ client: clientForOwner(data) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const access = await clientAccess(admin, user.id, id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canDelete) return NextResponse.json({ error: 'Only workspace owners and admins can delete a client' }, { status: 403 })

  const { error } = await admin.from('clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  auditClient(access, user.id, 'deleted', { name: access.client.name }, req)
  return NextResponse.json({ success: true })
}
