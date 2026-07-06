import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendWelcomeEmail, sendAdminSignupAlert } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (user) {
      // .edu signups get a doubled starting balance (100 vs 50). The profile row
      // is created at the base 50 by the handle_new_user trigger; the extra 50
      // (plus is_student and any referral payout) is applied ONCE below, guarded
      // by the atomic welcome_sent flip so nothing can double-grant on a revisit.
      const isStudent = !!(user.email?.endsWith('.edu') || user.email?.includes('.edu.'))

      // Backstop the trigger: if handle_new_user didn't run, create the row at the
      // base 50. ignoreDuplicates → never overwrites an existing balance/plan.
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

      // Persist the login/signup country (Vercel edge geo header) so lifecycle
      // emails sent later from cron — which have no request IP — can localize
      // currency (India → ₹, else $). Best-effort: the column comes from a
      // pending migration, so a missing-column error is harmless and ignored.
      const ipCountry = request.headers.get('x-vercel-ip-country');
      if (ipCountry) {
        try { await supabase.from('profiles').update({ country: ipCountry }).eq('id', user.id); } catch { /* column may not exist yet */ }
      }

      // Referral code this signup arrived with — from ?ref= on the callback URL
      // (survives OAuth cross-tab) or the cookie stashed on the signup page.
      const refCode = (searchParams.get('ref') || cookieStore.get('wyber_ref')?.value || '')
        .trim().toUpperCase().slice(0, 32);

      // First-signup-only block. The atomic welcome_sent flip (admin client
      // bypasses RLS) returns a row exactly once per user, so the emails, the
      // student bonus, and the referral payout each fire at most once.
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

          // Emails + Meta FIRST, so the welcome path can never be blocked by the
          // referral/student writes below (which touch columns from a migration
          // that may not be applied yet — see the self-contained try that wraps
          // them). Keeps this route safe to deploy before the migration lands.
          if (user.email) {
            const fullName = (user.user_metadata?.full_name as string | undefined);
            const provider = (user.app_metadata?.provider as string | undefined);
            sendWelcomeEmail(user.email, fullName).catch(() => {});
            sendAdminSignupAlert(user.email, provider).catch(() => {});

            // Meta Conversions API — server-side signup conversion. Awaited so it
            // survives the redirect (once per real account; the helper caps at 5s
            // and never throws). eventID matches the browser Pixel on /dashboard.
            const { sendMetaEvent } = await import('@/lib/meta-capi');
            await sendMetaEvent({
              eventName: 'CompleteRegistration',
              eventId: `reg_${user.id}`,
              email: user.email,
              eventSourceUrl: `${origin}${next}`,
              clientIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
              userAgent: request.headers.get('user-agent'),
              fbp: cookieStore.get('_fbp')?.value || null,
              fbc: cookieStore.get('_fbc')?.value || null,
            });
          }

          // Perks — student bonus + referral payout. Fully self-contained and
          // best-effort: a missing column (migration not yet applied) is logged
          // and swallowed, never affecting the credit/email path above.
          try {
            // Student bonus: 50 → 100.
            if (isStudent) {
              await admin.rpc('adjust_credits', { p_user_id: user.id, p_delta: 50 });
              await admin.from('profiles').update({ is_student: true }).eq('id', user.id);
            }

            // Give this user their own shareable referral code (matches the lazy
            // code /api/referral generates, so the dashboard card is ready).
            const ownCode = user.id.slice(0, 8).toUpperCase();
            await admin.from('profiles').update({ referral_code: ownCode })
              .eq('id', user.id).is('referral_code', null);

            // Redeem an incoming referral: +20 to this new user, +50 to the
            // referrer. Guards: code exists, referrer isn't self. Atomic grants.
            if (refCode) {
              const { data: referrer } = await admin.from('profiles')
                .select('id, referral_count, referral_credits_earned')
                .eq('referral_code', refCode).maybeSingle();
              if (referrer && referrer.id !== user.id) {
                await admin.rpc('adjust_credits', { p_user_id: user.id, p_delta: 20 });
                await admin.rpc('adjust_credits', { p_user_id: referrer.id, p_delta: 50 });
                await admin.from('profiles').update({ referred_by: referrer.id }).eq('id', user.id);
                await admin.from('profiles').update({
                  referral_count: (referrer.referral_count ?? 0) + 1,
                  referral_credits_earned: (referrer.referral_credits_earned ?? 0) + 50,
                }).eq('id', referrer.id);
                if (user.email) sendAdminSignupAlert(user.email, `referred by ${refCode}`).catch(() => {});
              }
            }
          } catch (e) { console.error('signup perks (referral/student) failed:', e); }
        }
      } catch (e) { console.error('welcome/signup-alert failed:', e); }

      // Referral is redeemed (or was absent) — clear the cookie so it can't apply
      // to a future different signup on this browser.
      cookieStore.set('wyber_ref', '', { maxAge: 0, path: '/' });

      // Tag the redirect for GENUINE first signups only, so the Reddit/analytics
      // SignUp conversion fires once per real account — not on every returning
      // user's dashboard load (the old sessionStorage approach counted both).
      const dest = new URL(`${origin}${next}`);
      if (isFirstSignup) dest.searchParams.set('signup', '1');
      return NextResponse.redirect(dest.toString());
    }

    console.error('Auth callback error:', error);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}