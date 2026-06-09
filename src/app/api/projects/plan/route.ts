import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/projects/plan?projectId=xxx — load saved plan
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('projects')
      .select('plan')
      .eq('id', projectId)
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
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('projects')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
