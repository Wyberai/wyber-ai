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

    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

    if (user) {
      // Upsert profile -- create if missing, leave alone if exists
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        credits: 50,
        plan: 'free',
        onboarded: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true });

      // Check if onboarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
        .single();

      if (!profile?.onboarded) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}