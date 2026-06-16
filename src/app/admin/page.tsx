import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminClient } from './AdminClient';

const ADMIN_EMAILS = ['hello@wyberai.com', 'sumit@reconsignal.com', 'sumit.sutar259@gmail.com', 'admin@reconsignal.com'];

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) redirect('/dashboard');

  const db = createServiceClient();

  const [
    { count: totalUsers },
    { count: totalProjects },
    { count: totalGenerations },
    { count: totalFlows },
    { count: waitlistCount },
    { data: recentUsers },
    { data: allProfiles },
    { data: recentProjects },
    { data: recentFlows },
    { data: waitlistEmails },
    { data: creditUsage },
    { data: todaySignups },
    { data: recentGenerations },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('projects').select('*', { count: 'exact', head: true }),
    db.from('generations').select('*', { count: 'exact', head: true }),
    db.from('flows').select('*', { count: 'exact', head: true }),
    db.from('ai_employee_waitlist').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('id,email,plan,credits,created_at').order('created_at', { ascending: false }).limit(50),
    db.from('profiles').select('plan,credits'),
    db.from('projects').select('id,name,framework,created_at,deployed_url,user_id').order('created_at', { ascending: false }).limit(30),
    db.from('flows').select('id,name,run_count,last_run_at,created_at,user_id').order('created_at', { ascending: false }).limit(20),
    db.from('ai_employee_waitlist').select('email,created_at').order('created_at', { ascending: false }).limit(100),
    db.from('credit_usage').select('user_id,amount,reason,created_at').order('created_at', { ascending: false }).limit(50),
    db.from('profiles').select('id').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    db.from('generations').select('id,created_at').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);

  const planBreakdown: Record<string, number> = {};
  let totalCreditsInSystem = 0;
  allProfiles?.forEach(p => {
    planBreakdown[p.plan ?? 'free'] = (planBreakdown[p.plan ?? 'free'] || 0) + 1;
    totalCreditsInSystem += p.credits ?? 0;
  });

  const totalCreditsBurned = creditUsage?.reduce((s, r) => s + (r.amount ?? 0), 0) ?? 0;

  // Generations per day for the last 7 days
  const genByDay: Record<string, number> = {};
  recentGenerations?.forEach(g => {
    const d = new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    genByDay[d] = (genByDay[d] || 0) + 1;
  });

  return (
    <AdminClient data={{
      totalUsers: totalUsers ?? 0,
      totalProjects: totalProjects ?? 0,
      totalGenerations: totalGenerations ?? 0,
      totalFlows: totalFlows ?? 0,
      waitlistCount: waitlistCount ?? 0,
      todaySignups: todaySignups?.length ?? 0,
      totalCreditsBurned,
      totalCreditsInSystem,
      recentUsers: recentUsers ?? [],
      allProfiles: allProfiles ?? [],
      recentProjects: recentProjects ?? [],
      recentFlows: recentFlows ?? [],
      waitlistEmails: waitlistEmails ?? [],
      creditUsage: creditUsage ?? [],
      planBreakdown,
      genByDay,
      estimatedMRR: ((planBreakdown['pro'] ?? 0) * 18.99 + (planBreakdown['business'] ?? 0) * 37.99),
    }} />
  );
}
