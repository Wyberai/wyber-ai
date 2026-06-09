import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/projects/knowledge?projectId=xxx
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('projects')
      .select('knowledge')
      .eq('id', projectId)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ knowledge: data?.knowledge || '' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/projects/knowledge — save knowledge
export async function POST(req: NextRequest) {
  try {
    const { projectId, knowledge } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from('projects')
      .update({ knowledge: knowledge || '', updated_at: new Date().toISOString() })
      .eq('id', projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
