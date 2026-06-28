import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { OnboardingTour } from '@/components/shared/OnboardingTour';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendWelcomeEmail, sendAdminSignupAlert } from '@/lib/email';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Reliable welcome-email trigger: every new user lands here. Atomically claim
  // welcome_sent (admin client) so it sends exactly once, regardless of how they
  // signed up (OAuth, email, magic link).
  if (profile && profile.welcome_sent === false) {
    try {
      const admin = await createAdminClient();
      const { data: claimed } = await admin
        .from('profiles')
        .update({ welcome_sent: true })
        .eq('id', user.id)
        .eq('welcome_sent', false)
        .select('id')
        .maybeSingle();
      if (claimed?.id) {
        const fullName = (profile.full_name as string | undefined) || (user.user_metadata?.full_name as string | undefined);
        const provider = (user.app_metadata?.provider as string | undefined);
        sendWelcomeEmail(user.email ?? profile.email, fullName).catch(() => {});
        sendAdminSignupAlert(user.email ?? profile.email, provider).catch(() => {});
      }
    } catch (e) { console.error('welcome email (dashboard) failed:', e); }
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id,name,framework,is_public,deployed_url,published_url,thumbnail_url,updated_at,project_type')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <>
      <OnboardingTour />
      <DashboardClient profile={profile} projects={projects ?? []} />
    </>
  );
}
