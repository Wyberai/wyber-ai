import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.provider_token) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?github_error=1`);
  }
  const admin = await createAdminClient();
  await admin.from('profiles').update({ github_token: session.provider_token }).eq('id', session.user.id);
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?github_connected=1`);
}
