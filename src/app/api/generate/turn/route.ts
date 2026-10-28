import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// A dropped /api/generate stream keeps running server-side, which saves the
// finished output under the client's turnId (see "Resumable turns" in
// ../route.ts). The editor polls here to pick it up and finish the turn.
// 404 = not finished yet (or not this user's turn).
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const admin = await createAdminClient();
  const { data } = await admin
    .from('generations')
    .select('status, response_text')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return NextResponse.json({ status: 'pending' }, { status: 404 });
  return NextResponse.json({ status: data.status, text: data.response_text ?? '' }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
