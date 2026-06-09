import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/projects/messages?projectId=xxx — load chat history
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('project_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const messages = (data || []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at).getTime(),
      status: 'done',
      filesChanged: m.files_changed || [],
    }));
    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/projects/messages — save one message
export async function POST(req: NextRequest) {
  try {
    const { projectId, role, content, filesChanged } = await req.json();
    if (!projectId || !role || content === undefined) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }
    const supabase = await createAdminClient();
    const { error } = await supabase.from('project_messages').insert({
      project_id: projectId,
      role,
      content,
      files_changed: filesChanged || [],
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
