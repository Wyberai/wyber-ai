import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

  const admin = await createAdminClient();
  const { data } = await admin
    .from('generations')
    .select('id, prompt, files_changed, created_at, credits_used, prompt_tokens, completion_tokens')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ history: data ?? [] });
}
