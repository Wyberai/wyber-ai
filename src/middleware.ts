import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Always skip static assets
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.startsWith('/icon') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  const PUBLIC_ROUTES = [
    '/', '/login', '/signup', '/pricing', '/templates', '/privacy', '/terms',
    '/status', '/vs', '/blog', '/security', '/changelog', '/gallery', '/setup-call',
    '/complexity-guide', '/pay', '/connectors', '/founders', '/marketers',
    '/designers', '/affiliates', '/about', '/credits', '/docs',
    '/agents', '/flows', '/community', '/p/',
    '/api/webhooks', '/api/dodo', '/api/admin', '/api/support',
    '/api/stats', '/api/referral', '/api/og', '/api/agents',
    '/api/prebuilt-apps', '/api/auth',
  ];

  const isPublic = PUBLIC_ROUTES.some(r => path === r || path.startsWith(r + '/') || path.startsWith(r + '?'));

  // For public routes, skip auth entirely
  if (isPublic) {
    return NextResponse.next();
  }

  // Protected routes — check auth
  try {
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

    const { data: { user }, error } = await supabase.auth.getUser();

    // If Supabase itself errors, let the page handle it gracefully
    if (error) {
      console.error('Middleware auth error:', error.message);
      // Don't crash — redirect to login for protected routes
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }

    // Already logged in hitting auth pages → dashboard
    if (user && (path === '/login' || path === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Not logged in on protected route → login
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (err) {
    // Middleware must never crash — fallback to letting the page render
    console.error('Middleware exception:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
