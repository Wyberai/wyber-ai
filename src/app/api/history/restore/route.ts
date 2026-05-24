import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { projectId, snapshotId } = await req.json();
  if (!projectId || !snapshotId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const supabase = await createAdminClient();
  const { data: snapshot } = await supabase
    .from('project_snapshots')
    .select('files')
    .eq('id', snapshotId)
    .single();

  if (!snapshot) return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
  await supabase.from('projects').update({ files: snapshot.files }).eq('id', projectId);
  return NextResponse.json({ files: snapshot.files });
}
