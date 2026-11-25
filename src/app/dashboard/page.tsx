import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { getProvider } from '@/lib/domains';
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

  // The lookups below do not depend on each other, so they run together instead of one after another. A trip back to
  // the dashboard used to wait for about nine database round trips in a row, which is what made it feel slow.
  const t0 = Date.now();
  const claimToken = (await cookies()).get('gtm_claim')?.value;
  const orgAdmin = createServiceClient();
  const ownQuery = () => supabase
    .from('projects')
    .select('id,name,framework,is_public,deployed_url,published_url,thumbnail_url,updated_at,project_type,org_id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  const [profileRes, ownRes, memRes, scanRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    ownQuery(),
    // Same service-role membership lookup /api/organizations/route.ts does, rather than trusting an RLS self-read policy.
    orgAdmin.from('organization_members').select('org_id').eq('user_id', user.id),
    // The newest scan per project is all that is shown, so the read is bounded: a daily rescan of many projects would
    // otherwise make this list grow without limit.
    supabase.from('security_scans')
      .select('project_id,score,critical_count,reachable,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(400),
  ]);
  const profile = profileRes.data;
  let ownProjects = ownRes.data;
  const memberships = memRes.data;
  const scans = scanRes.data;

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

  // GTM: a personalized demo built for this founder during a cold campaign becomes theirs on their first load. That is
  // when they arrive through the outreach link (claim cookie) or have just signed up. For everyone else the lookup was a
  // query over all projects on every single visit, for nothing, so it is skipped. Never throws.
  try {
    if (claimToken || profile?.welcome_sent === false) {
      const claimed = await claimDemos(createServiceClient(), user.id, { email: user.email, token: claimToken });
      if (claimed.length > 0) ownProjects = (await ownQuery()).data;
    }
  } catch (e) { console.error('gtm demo claim failed:', e); }

  // Org-scoped projects the user can access as a member (see 038/042).
  const orgIds = (memberships ?? []).map(m => m.org_id).filter(Boolean);

  let orgProjects: typeof ownProjects = [];
  if (orgIds.length > 0) {
    const { data } = await supabase
      .from('projects')
      .select('id,name,framework,is_public,deployed_url,published_url,thumbnail_url,updated_at,project_type,org_id')
      .in('org_id', orgIds)
      .order('updated_at', { ascending: false });
    orgProjects = data ?? [];
  }

  const ownIds = new Set((ownProjects ?? []).map(p => p.id));
  const projects = [...(ownProjects ?? []), ...orgProjects.filter(p => !ownIds.has(p.id))]
    .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());

  // Latest security scan per project, for the dashboard's security chrome.
  // Reads only our own security_scans table — never live-probes a customer's
  // Supabase on page load (that only happens via the manual "scan now" action
  // or the daily /api/cron/security-rescan job).
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
  const serverMs = Date.now() - t0;
  if (serverMs > 1500) console.warn(`[perf] dashboard server work took ${serverMs}ms`);
  const isNewUser = profile?.welcome_sent === false;

  return (
    <>
      <OnboardingTour isNewUser={isNewUser} />
      <DashboardClient profile={profile} projects={projects ?? []} securityByProject={securityByProject} domainsEnabled={getProvider() !== null} />
    </>
  );
}
