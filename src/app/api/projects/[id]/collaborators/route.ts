import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendTeamInviteEmail as sendCollaboratorInviteEmail } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

// GET — list collaborators for this project
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: project } = await db.from('projects').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await db
    .from('project_collaborators')
    .select('id, collaborator_email, role, status, invited_at, accepted_at')
    .eq('project_id', id)
    .order('invited_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ collaborators: data ?? [] })
}

// POST — invite a collaborator
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: project } = await db.from('projects').select('id, name').eq('id', id).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as { email?: string; role?: string }
  const email = (body.email ?? '').trim().toLowerCase()
  const role = body.role === 'viewer' ? 'viewer' : 'editor'

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (email === user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 })
  }

  // Check if this user exists in auth.users
  const { data: existingUser } = await db
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle()

  const { data: inserted, error } = await db
    .from('project_collaborators')
    .upsert({
      project_id: id,
      owner_id: user.id,
      collaborator_email: email,
      collaborator_id: existingUser?.id ?? null,
      role,
      status: 'pending',
    }, { onConflict: 'project_id,collaborator_email', ignoreDuplicates: false })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire invite email (best-effort)
  const senderName = user.email ?? 'A teammate'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'
  sendCollaboratorInviteEmail(email, senderName, project.name, `${appUrl}/project/${id}`).catch(() => {})

  return NextResponse.json({ collaborator: inserted, invited: true })
}

// DELETE — remove a collaborator
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const collaboratorId = url.searchParams.get('id')
  if (!collaboratorId) return NextResponse.json({ error: 'id param required' }, { status: 400 })

  const db = createServiceClient()
  const { error } = await db
    .from('project_collaborators')
    .delete()
    .eq('id', collaboratorId)
    .eq('project_id', id)
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ removed: true })
}
