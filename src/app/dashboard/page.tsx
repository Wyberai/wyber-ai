import { DashboardClient } from '@/components/dashboard/DashboardClient';

const IS_LOCAL = process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');

export default async function DashboardPage() {
  if (IS_LOCAL) {
    return <DashboardClient profile={null} projects={[]} />;
  }

  const { createClient } = await import('@/lib/supabase/server');
  const { redirect } = await import('next/navigation');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const userId = user!.id;

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', userId).single();
  const { data: projects } = await supabase
    .from('projects')
    .select('id,name,framework,is_public,deployed_url,thumbnail_url,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return <DashboardClient profile={profile} projects={projects ?? []} />;
}
