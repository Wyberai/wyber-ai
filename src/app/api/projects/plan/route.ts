import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET /api/projects/plan?projectId=xxx — load saved plan. Scoped to the
// caller's own project: previously this read/wrote by id alone with no
// ownership check, so anyone could read or overwrite any project's plan.
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('projects')
      .select('plan')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ plan: data?.plan || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/projects/plan — save plan
export async function POST(req: NextRequest) {
  try {
    const { projectId, plan } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const { data: rows, error } = await supabase
      .from('projects')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!rows || rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
