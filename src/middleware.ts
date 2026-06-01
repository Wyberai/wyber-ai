import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const isLocal = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

  // Local dev — bypass all auth
  if (isLocal) {
    return NextResponse.next();
  }

  // Production — enforce auth
  const { createServerClient } = await import('@supabase/ssr');
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const PUBLIC_ROUTES = ['/', '/login', '/signup', '/pricing', '/templates', '/privacy', '/terms', '/status', '/vs', '/blog', '/security', '/changelog', '/gallery', '/setup-call', '/complexity-guide', '/pay', '/connectors', '/founders', '/marketers', '/designers', '/affiliates', '/about', '/api/webhooks', '/api/dodo', '/api/admin', '/api/support', '/api/stats', '/api/referral', '/credits', '/docs'];
  const isPublic = PUBLIC_ROUTES.some(r => path.startsWith(r)) || path.startsWith('/_next') || path.startsWith('/favicon');

  // Already logged in hitting auth pages → dashboard
  if (user && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
