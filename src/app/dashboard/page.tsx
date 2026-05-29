import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const isLocal = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

  if (isLocal) {
    return <DashboardClient profile={null} projects={[]} />;
  }

  const { createClient } = await import('@/lib/supabase/server');
  const { redirect } = await import('next/navigation');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const { data: projects } = await supabase
    .from('projects')
    .select('id,name,framework,is_public,deployed_url,published_url,thumbnail_url,updated_at')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false });

  return <DashboardClient profile={profile} projects={projects ?? []} />;
}
