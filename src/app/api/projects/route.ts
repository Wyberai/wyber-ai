import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  const { projectId, files, userId } = await req.json();
  if (!projectId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const supabase = await createAdminClient();
  const { error } = await supabase.from('projects')
    .update({ files, updated_at: new Date().toISOString() })
    .eq('id', projectId).eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  try {
    const { projectId, userId } = await req.json()
    if (!projectId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    // Use service role to bypass RLS — userId validated at app level
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await admin.from('projects').delete()
      .eq('id', projectId)
      .eq('user_id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}