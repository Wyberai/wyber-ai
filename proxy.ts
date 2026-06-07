import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip static assets immediately
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.startsWith('/icon') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // All public routes — skip auth entirely
  const PUBLIC_PREFIXES = [
    '/', '/login', '/signup', '/pricing', '/templates', '/privacy', '/terms',
    '/status', '/vs', '/blog', '/security', '/changelog', '/gallery',
    '/setup-call', '/complexity-guide', '/pay', '/connectors', '/founders',
    '/marketers', '/designers', '/affiliates', '/about', '/credits', '/docs',
    '/agents', '/flows', '/community', '/p/',
    '/auth',  // CRITICAL: auth callback must never be intercepted
    '/api/',  // All API routes are public — they handle auth themselves
  ]

  const isPublic = PUBLIC_PREFIXES.some(prefix =>
    path === prefix ||
    path === prefix.replace(/\/$/, '') ||
    path.startsWith(prefix.endsWith('/') ? prefix : prefix + '/')
  )

  if (isPublic) {
    return NextResponse.next()
  }

  // Protected routes: /dashboard, /project/*, /settings, /onboarding
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
            cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // Not logged in — redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }

    // Logged in hitting auth pages — redirect to dashboard
    if (path === '/login' || path === '/signup') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (err) {
    // Never crash — let the page handle it
    console.error('Proxy error:', err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg).*)'],
}
