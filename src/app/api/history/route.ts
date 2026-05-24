import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('generations')
    .select('id, prompt, files_changed, created_at, credits_used, prompt_tokens, completion_tokens')
    .eq('project_id', projectId)
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ history: data ?? [] });
}
