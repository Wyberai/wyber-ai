import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, snapshotId } = await req.json();
  if (!projectId || !snapshotId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const admin = await createAdminClient();

  // Verify the caller owns the project before touching anything.
  const { data: project } = await admin
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Verify the snapshot belongs to the same project (prevents cross-project file injection).
  const { data: snapshot } = await admin
    .from('project_snapshots')
    .select('files')
    .eq('id', snapshotId)
    .eq('project_id', projectId)
    .single();
  if (!snapshot) return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });

  await admin.from('projects').update({ files: snapshot.files }).eq('id', projectId).eq('user_id', user.id);
  return NextResponse.json({ files: snapshot.files });
}
