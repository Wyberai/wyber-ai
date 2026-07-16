import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { OnboardingTour } from '@/components/shared/OnboardingTour';
import { createClient, createAdminClient, createServiceClient } from '@/lib/supabase/server';
import { sendWelcomeEmail, sendAdminSignupAlert } from '@/lib/email';
import { claimDemos } from '@/lib/gtm/claim';
import { cookies } from 'next/headers';
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

  // GTM: if we built a personalized demo dashboard for this founder during a
  // cold campaign, transfer it to their account now so it shows up as their own
  // project (same slug/live URL) on this very first load. Matches by claim token
  // (from the outreach link, set as a cookie by /api/gtm/start-claim) or by
  // email. No-op otherwise.
  try {
    const claimToken = (await cookies()).get('gtm_claim')?.value;
    await claimDemos(createServiceClient(), user.id, { email: user.email, token: claimToken });
  } catch (e) { console.error('gtm demo claim failed:', e); }

  const { data: projects } = await supabase
    .from('projects')
    .select('id,name,framework,is_public,deployed_url,published_url,thumbnail_url,updated_at,project_type')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  // Latest security scan per project, for the dashboard's security chrome.
  // Reads only our own security_scans table — never live-probes a customer's
  // Supabase on page load (that only happens via the manual "scan now" action
  // or the daily /api/cron/security-rescan job).
  const { data: scans } = await supabase
    .from('security_scans')
    .select('project_id,score,critical_count,reachable,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const securityByProject: Record<string, { score: number; criticalCount: number; reachable: boolean; scannedAt: string }> = {};
  for (const s of scans ?? []) {
    if (securityByProject[s.project_id]) continue; // already have the newest (query is desc)
    securityByProject[s.project_id] = {
      score: s.score,
      criticalCount: s.critical_count,
      reachable: s.reachable,
      scannedAt: s.created_at,
    };
  }

  // `profile` here still holds the value fetched at the top of this request —
  // the atomic claim above updates the DB but never mutates this local object.
  // So `welcome_sent === false` is true on exactly one request per account: the
  // very first dashboard load after signup (every later load re-fetches the
  // now-flipped row). That makes it a reliable, per-account "is this genuinely
  // a new signup" signal — unlike the tour's old localStorage-only gate, which
  // showed the tour to any existing user on a browser that never set the flag.
  const isNewUser = profile?.welcome_sent === false;

  return (
    <>
      <OnboardingTour isNewUser={isNewUser} />
      <DashboardClient profile={profile} projects={projects ?? []} securityByProject={securityByProject} />
    </>
  );
}
