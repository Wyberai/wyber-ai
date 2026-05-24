import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { templateId } = await req.json();
  const admin = await createAdminClient();

  // Toggle upvote
  const { data: existing } = await admin.from('template_upvotes')
    .select('template_id').eq('template_id', templateId).eq('user_id', user.id).single();

  if (existing) {
    await admin.from('template_upvotes').delete().eq('template_id', templateId).eq('user_id', user.id);
    return NextResponse.json({ action: 'removed' });
  } else {
    await admin.from('template_upvotes').insert({ template_id: templateId, user_id: user.id });
    return NextResponse.json({ action: 'added' });
  }
}
