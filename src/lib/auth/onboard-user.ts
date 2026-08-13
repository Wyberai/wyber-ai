import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { sendWelcomeEmail, sendAdminSignupAlert } from '@/lib/email';
import { notify } from '@/lib/push';

// The post-authentication side effects every sign-in path (OAuth, clicked
// magic link, typed OTP code) must run exactly once per real account:
// profile creation, country tagging, welcome email, referral/student perks,
// and the server-side Meta conversion event. Extracted from /auth/callback
// so the OTP-verify path (which authenticates client-side via verifyOtp,
// never touching that route) doesn't silently skip all of it.
type SupabaseServer = {
  from: (table: string) => any;
};

export interface OnboardParams {
  user: User;
  supabase: SupabaseServer;
  ipCountry?: string | null;
  refCode?: string | null;
  origin: string;
  next: string;
  clientIp?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export async function onboardUser({ user, supabase, ipCountry, refCode, origin, next, clientIp, userAgent, fbp, fbc }: OnboardParams): Promise<{ isFirstSignup: boolean }> {
  const isStudent = !!(user.email?.endsWith('.edu') || user.email?.includes('.edu.'));

  // Backstop the handle_new_user trigger: create the row at the base 50 if it
  // didn't run. ignoreDuplicates → never overwrites an existing balance/plan.
  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email ?? '',
    credits: 50,
    plan: 'free',
    onboarded: true,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'id',
    ignoreDuplicates: true,
  });

  if (ipCountry) {
    try { await supabase.from('profiles').update({ country: ipCountry }).eq('id', user.id); } catch { /* column may not exist yet */ }
  }

  const cleanRefCode = (refCode || '').trim().toUpperCase().slice(0, 32);

  let isFirstSignup = false;
  try {
    const admin = await createAdminClient();
    const { data: firstTime } = await admin
      .from('profiles')
      .update({ welcome_sent: true })
      .eq('id', user.id)
      .eq('welcome_sent', false)
      .select('id')
      .maybeSingle();
    if (firstTime?.id) {
      isFirstSignup = true;

      if (user.email) {
        const fullName = (user.user_metadata?.full_name as string | undefined);
        const provider = (user.app_metadata?.provider as string | undefined);
        // Branch the welcome-email opener by acquisition source. `_fbc` is the
        // Meta Pixel's own cookie — it's only ever set when the page loaded
        // with a `fbclid` param, i.e. a genuine Meta/Instagram ad click — so
        // this reuses existing ad-attribution plumbing instead of adding new
        // UTM cookie capture just for email copy.
        const welcomeSource: import('@/lib/email').WelcomeSource = cleanRefCode ? 'referral' : fbc ? 'paid-ads' : 'organic';
        sendWelcomeEmail(user.email, fullName, welcomeSource).catch(() => {});
        sendAdminSignupAlert(user.email, provider).catch(() => {});

        const { sendMetaEvent } = await import('@/lib/meta-capi');
        await sendMetaEvent({
          eventName: 'CompleteRegistration',
          eventId: `reg_${user.id}`,
          email: user.email,
          eventSourceUrl: `${origin}${next}`,
          clientIp: clientIp ?? null,
          userAgent: userAgent ?? null,
          fbp: fbp ?? null,
          fbc: fbc ?? null,
        });
      }

      try {
        if (isStudent) {
          await admin.rpc('adjust_credits', { p_user_id: user.id, p_delta: 50 });
          await admin.from('profiles').update({ is_student: true }).eq('id', user.id);
        }

        const ownCode = user.id.slice(0, 8).toUpperCase();
        await admin.from('profiles').update({ referral_code: ownCode })
          .eq('id', user.id).is('referral_code', null);

        if (cleanRefCode) {
          const { data: referrer } = await admin.from('profiles')
            .select('id, referral_count, referral_credits_earned')
            .eq('referral_code', cleanRefCode).maybeSingle();
          if (referrer && referrer.id !== user.id) {
            // New user always gets their 20-credit welcome bonus regardless of cap.
            await admin.rpc('adjust_credits', { p_user_id: user.id, p_delta: 20 });
            await admin.from('profiles').update({ referred_by: referrer.id }).eq('id', user.id);

            // Referrer only earns credits for the first 5 referrals — beyond that
            // the code still works but pays nothing, stopping bot-farming loops.
            const referralCount = referrer.referral_count ?? 0;
            const earnedThisReferral = referralCount < 5;
            if (earnedThisReferral) {
              await admin.rpc('adjust_credits', { p_user_id: referrer.id, p_delta: 50 });
            }
            await admin.from('profiles').update({
              referral_count: referralCount + 1,
              ...(earnedThisReferral && { referral_credits_earned: (referrer.referral_credits_earned ?? 0) + 50 }),
            }).eq('id', referrer.id);
            if (user.email) sendAdminSignupAlert(user.email, `referred by ${cleanRefCode}`).catch(() => {});
            if (earnedThisReferral) notify(admin, referrer.id, 'referral', { credits: 50 }).catch(() => {});
          }
        }
      } catch (e) { console.error('signup perks (referral/student) failed:', e); }
    }
  } catch (e) { console.error('welcome/signup-alert failed:', e); }

  return { isFirstSignup };
}
