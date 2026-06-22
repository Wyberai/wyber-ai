import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('Auth callback error:', error);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}