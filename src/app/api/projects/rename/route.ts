import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// POST /api/projects/rename — rename a project. Scoped to the caller's own
// row: previously this updated by id alone with no ownership check, so
// anyone who knew/guessed a project or flow id could rename it.
export async function POST(req: NextRequest) {
  try {
    const { projectId, flowId, name } = await req.json();
    const id = projectId || flowId;
    const table = flowId ? 'flows' : 'projects';
    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: 'Missing id or name' }, { status: 400 });
    }
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const { error, count } = await supabase
      .from(table)
      .update({ name: name.trim().slice(0, 80), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id', { count: 'exact' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!count) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, name: name.trim().slice(0, 80) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
