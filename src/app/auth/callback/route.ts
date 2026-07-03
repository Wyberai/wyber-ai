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
      // Students with .edu emails get double credits on signup
      const isStudent = user.email?.endsWith('.edu') || user.email?.includes('.edu.')
      const signupCredits = isStudent ? 100 : 50

      // Create profile on first signup only — never overwrite existing credits/plan
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email ?? '',
        credits: signupCredits,
        plan: 'free',
        is_student: isStudent || false,
        onboarded: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: true,
      });

      // Send welcome + owner alert exactly once per user. Atomically flip
      // welcome_sent (admin client bypasses RLS); a returned row = first time.
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
        if (firstTime?.id && user.email) {
          isFirstSignup = true;
          const fullName = (user.user_metadata?.full_name as string | undefined);
          const provider = (user.app_metadata?.provider as string | undefined);
          sendWelcomeEmail(user.email, fullName).catch(() => {});
          sendAdminSignupAlert(user.email, provider).catch(() => {});
        }
      } catch (e) { console.error('welcome/signup-alert failed:', e); }

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