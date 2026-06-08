import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip all API routes and public pages — handle auth themselves
  if (
    path.startsWith('/api/') ||
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/pricing') ||
    path.startsWith('/gallery') ||
    path.startsWith('/agents') ||
    path.startsWith('/flows') ||
    path.startsWith('/templates') ||
    path.startsWith('/community') ||
    path.startsWith('/privacy') ||
    path.startsWith('/terms') ||
    path.startsWith('/status') ||
    path.startsWith('/vs') ||
    path.startsWith('/blog') ||
    path.startsWith('/security') ||
    path.startsWith('/changelog') ||
    path.startsWith('/setup-call') ||
    path.startsWith('/complexity-guide') ||
    path.startsWith('/pay') ||
    path.startsWith('/connectors') ||
    path.startsWith('/founders') ||
    path.startsWith('/marketers') ||
    path.startsWith('/designers') ||
    path.startsWith('/affiliates') ||
    path.startsWith('/about') ||
    path.startsWith('/credits') ||
    path.startsWith('/docs') ||
    path.startsWith('/p/') ||
    path === '/'
  ) {
    return NextResponse.next()
  }

  // Protected routes only: /dashboard, /project/*, /onboarding, /settings
  try {
    const { createServerClient } = await import('@supabase/ssr')
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookies.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }

    return response
  } catch (err) {
    console.error('Proxy error:', err)
    return NextResponse.next()
  }
}

// CRITICAL: /auth/* excluded from matcher entirely — never intercepted
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/project/:path*',
    '/onboarding/:path*',
    '/settings/:path*',
  ],
}
