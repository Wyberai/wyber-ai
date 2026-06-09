import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// POST /api/projects/rename — rename a project
export async function POST(req: NextRequest) {
  try {
    const { projectId, name } = await req.json();
    if (!projectId || !name || !name.trim()) {
      return NextResponse.json({ error: 'Missing projectId or name' }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('projects')
      .update({ name: name.trim().slice(0, 80), updated_at: new Date().toISOString() })
      .eq('id', projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, name: name.trim().slice(0, 80) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
