import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, files } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

  const { error } = await supabase.from('projects')
    .update({ files, updated_at: new Date().toISOString() })
    .eq('id', projectId).eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const { error } = await supabase.from('projects').delete()
      .eq('id', projectId)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }); }
}