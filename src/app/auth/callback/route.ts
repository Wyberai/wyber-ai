import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { onboardUser } from '@/lib/auth/onboard-user';

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
      // Referral code this signup arrived with — from ?ref= on the callback URL
      // (survives OAuth cross-tab) or the cookie stashed on the signup page.
      const refCode = searchParams.get('ref') || cookieStore.get('wyber_ref')?.value || '';

      const { isFirstSignup } = await onboardUser({
        user,
        supabase,
        origin,
        next,
        refCode,
        ipCountry: request.headers.get('x-vercel-ip-country'),
        clientIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: request.headers.get('user-agent'),
        fbp: cookieStore.get('_fbp')?.value || null,
        fbc: cookieStore.get('_fbc')?.value || null,
      });

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