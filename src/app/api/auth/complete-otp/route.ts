import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { onboardUser } from '@/lib/auth/onboard-user';

// Called by /login and /signup right after a client-side supabase.auth.verifyOtp()
// succeeds (the typed 6-digit code path). verifyOtp() already set the session
// cookies directly — no code exchange needed here, unlike /auth/callback — but
// the SAME onboarding side effects (welcome email, referral/student perks, Meta
// conversion event) still need to run exactly once, so this hits the shared
// onboardUser() helper rather than skipping straight to "you're logged in."
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { ref, next: nextPath } = await req.json().catch(() => ({} as { ref?: string; next?: string }));
  const next = nextPath || '/dashboard';
  const { origin } = new URL(req.url);
  const cookieStore = await cookies();

  const { isFirstSignup } = await onboardUser({
    user,
    supabase,
    origin,
    next,
    refCode: ref || cookieStore.get('wyber_ref')?.value || '',
    ipCountry: req.headers.get('x-vercel-ip-country'),
    clientIp: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: req.headers.get('user-agent'),
    fbp: cookieStore.get('_fbp')?.value || null,
    fbc: cookieStore.get('_fbc')?.value || null,
  });

  cookieStore.set('wyber_ref', '', { maxAge: 0, path: '/' });

  return NextResponse.json({ ok: true, isFirstSignup, next });
}
