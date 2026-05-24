import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminClient } from './AdminClient';

const ADMIN_EMAILS = ['hello@wyberai.com', 'sumit@reconsignal.com', 'sumit.sutar259@gmail.com'];

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) redirect('/dashboard');

  const admin = await createAdminClient();

  const [
    { count: totalUsers },
    { count: totalProjects },
    { count: totalGenerations },
    { data: recentUsers },
    { data: recentProjects },
    { data: allProfiles },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('projects').select('*', { count: 'exact', head: true }),
    admin.from('generations').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('id,email,plan,credits,created_at').order('created_at', { ascending: false }).limit(25),
    admin.from('projects').select('id,name,framework,created_at,deployed_url').order('created_at', { ascending: false }).limit(25),
    admin.from('profiles').select('plan'),
  ]);

  const planBreakdown: Record<string, number> = {};
  allProfiles?.forEach(p => { planBreakdown[p.plan] = (planBreakdown[p.plan] || 0) + 1; });

  return (
    <AdminClient data={{
      totalUsers: totalUsers ?? 0,
      totalProjects: totalProjects ?? 0,
      totalGenerations: totalGenerations ?? 0,
      recentUsers: recentUsers ?? [],
      recentProjects: recentProjects ?? [],
      planBreakdown,
    }} />
  );
}
