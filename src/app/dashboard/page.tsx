import { Suspense } from 'react';
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

  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <DashboardClient profile={profile} projects={projects ?? []} />
    </Suspense>
  );
}
