import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

  const PUBLIC_ROUTES = [
    '/', '/login', '/signup', '/pricing', '/templates',
    '/privacy', '/terms', '/status', '/vs', '/about',
    '/blog', '/security', '/changelog', '/community',
    '/connectors', '/founders', '/marketers', '/designers',
    '/affiliates', '/api/webhooks', '/api/dodo',
  ];

  const isPublic =
    PUBLIC_ROUTES.some(r => path === r || path.startsWith(r + '/')) ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.startsWith('/api/auth');

  // Already logged in + hitting login/signup → go to dashboard
  if (user && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Not logged in + private route → go to login
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