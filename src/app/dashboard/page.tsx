import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Use admin client to bypass RLS for profile read
  // Safe because we already verified the user above
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If profile missing, create it
  if (!profile) {
    await admin.from('profiles').upsert({
      id: user.id,
      email: user.email,
      credits: 50,
      plan: 'free',
      onboarded: true,
    }, { onConflict: 'id', ignoreDuplicates: true });
  }

  const { data: projects } = await admin
    .from('projects')
    .select('id,name,framework,is_public,deployed_url,published_url,thumbnail_url,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const finalProfile = profile ?? {
    id: user.id,
    email: user.email,
    credits: 50,
    plan: 'free',
  };

  return <DashboardClient profile={finalProfile as any} projects={projects ?? []} />;
}