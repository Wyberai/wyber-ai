import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { projectId, orgId } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  // The caller — never the client-supplied body — owns the fork. Previously
  // this trusted a `userId` field straight off the request body, so anyone
  // could fork any project (private or public) into any account they named.
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();

  // Fetch original — only your own project, or one that's public, can be forked.
  const { data: original, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error || !original) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (original.user_id !== user.id && !original.is_public) {
    return NextResponse.json({ error: 'Not authorized to duplicate this project' }, { status: 403 });
  }

  // A copy can be made inside an agency workspace so teammates can open it. The caller must be able to create there.
  let forkOrgId: string | null = null
  if (typeof orgId === 'string' && orgId) {
    const { requireOrgCapability } = await import('@/lib/orgs/rbac')
    const check = await requireOrgCapability(user.id, orgId, 'project.create')
    if (!check.ok) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    forkOrgId = orgId
  }

  // Create fork
  const { data: fork, error: forkError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: `${original.name} (copy)`,
      description: original.description,
      framework: original.framework,
      files: original.files,
      is_public: false,
      ...(forkOrgId ? { org_id: forkOrgId } : {}),
    })
    .select('id, name')
    .single();

  if (forkError) return NextResponse.json({ error: forkError.message }, { status: 500 });

  return NextResponse.json({ project: fork });
}
