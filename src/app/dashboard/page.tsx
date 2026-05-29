import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: projects } = await supabase
    .from('projects')
    .select('id,name,framework,is_public,deployed_url,published_url,thumbnail_url,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return <DashboardClient profile={profile} projects={projects ?? []} />;
}