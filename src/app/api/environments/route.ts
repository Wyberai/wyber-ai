import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  const { data } = await supabase.from('project_environments').select('*').eq('project_id', projectId).eq('user_id', user.id);
  return NextResponse.json({ environments: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, action, sourceEnv } = await req.json();

  if (action === 'promote') {
    const { data: project } = await supabase.from('projects').select('files, name').eq('id', projectId).single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: env } = await supabase.from('project_environments').upsert({
      project_id: projectId,
      user_id: user.id,
      name: 'live',
      files_snapshot: project.files,
      promoted_at: new Date().toISOString(),
      status: 'live',
    }, { onConflict: 'project_id,name' }).select().single();

    return NextResponse.json({ environment: env });
  }

  if (action === 'restore') {
    const { data: env } = await supabase.from('project_environments').select('files_snapshot').eq('project_id', projectId).eq('name', sourceEnv).single();
    if (!env) return NextResponse.json({ error: 'Environment not found' }, { status: 404 });

    await supabase.from('projects').update({ files: env.files_snapshot, updated_at: new Date().toISOString() }).eq('id', projectId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}