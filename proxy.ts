import { NextResponse, type NextRequest } from 'next/server'

// Routes that never need auth checks
const PUBLIC_PREFIXES = [
  '/_next', '/favicon', '/icon', '/apple-icon', '/robots', '/sitemap', '/manifest',
  '/auth',     // CRITICAL: auth callback must NEVER be intercepted
  '/api/',     // All API routes handle their own auth
  '/login',
  '/signup',
  '/',
  '/pricing',
  '/templates',
  '/gallery',
  '/community',
  '/agents',
  '/flows',
  '/privacy',
  '/terms',
  '/status',
  '/vs',
  '/blog',
  '/security',
  '/changelog',
  '/setup-call',
  '/complexity-guide',
  '/pay',
  '/connectors',
  '/founders',
  '/marketers',
  '/designers',
  '/affiliates',
  '/about',
  '/credits',
  '/docs',
  '/p/',
]

function isPublicPath(path: string): boolean {
  return PUBLIC_PREFIXES.some(prefix => {
    if (prefix.endsWith('/')) return path.startsWith(prefix)
    return path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '?')
  }) || path.includes('.')  // any file with extension is public (static assets)
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Always allow public paths
  if (isPublicPath(path)) {
    return NextResponse.next()
  }

  // Protected routes: /dashboard, /project/*, /onboarding, /settings (app)
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

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }

    return response
  } catch (err) {
    // Never crash the proxy — let the page handle auth itself
    console.error('Proxy error:', err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|apple-icon\\.png).*)'],
}
