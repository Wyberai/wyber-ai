import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const host = (request.headers.get('host') || '').toLowerCase().replace(/:\d+$/, '')

  // Handle custom domains — if the host is not wyberai.com, serve the published app
  const isWyberDomain = host.includes('wyberai.com') || host.includes('vercel.app') || host.includes('localhost')
  
  if (!isWyberDomain && host.includes('.')) {
    // Custom domain request — rewrite to /api/serve-custom-domain
    const url = new URL(
      `/api/serve-custom-domain?domain=${encodeURIComponent(host)}&path=${encodeURIComponent(path)}`,
      request.url
    )
    return NextResponse.rewrite(url)
  }

  // Skip everything that is clearly public
  if (
    path.startsWith('/auth') ||
    path.startsWith('/api/') ||
    path.startsWith('/_next') ||
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
    path.startsWith('/delete-account') ||
    path.startsWith('/status') ||
    path.startsWith('/vs') ||
    path.startsWith('/lovable-alternatives') ||
    path.startsWith('/use-cases') ||
    path.startsWith('/employees') ||
    path.startsWith('/blog') ||
    path.startsWith('/contact') ||
    path.startsWith('/press') ||
    path.startsWith('/what-is-wyberai') ||
    path.startsWith('/cookies') ||
    path.startsWith('/security') ||
    path.startsWith('/changelog') ||
    path.startsWith('/setup-call') ||
    path.startsWith('/complexity-guide') ||
    path.startsWith('/learn') ||
    path.startsWith('/coming-soon') ||
    path.startsWith('/org-landing') ||
    path.startsWith('/pay') ||
    path.startsWith('/connectors') ||
    path.startsWith('/mcp') ||
    path.startsWith('/tools') ||
    // Public verify page a published app's security badge links to — anonymous
    // visitors clicking it must never be bounced to /login.
    path.startsWith('/verify') ||
    // OAuth consent page handles its own auth: it redirects to /login preserving
    // the FULL authorization query in `next`. The generic gate below would strip
    // those params (next=pathname only), breaking the consent flow.
    path.startsWith('/oauth') ||
    // /mfa is the 2FA step-up page itself — must be reachable at aal1, or the
    // enforcement below would redirect it to itself forever.
    path.startsWith('/mfa') ||
    path.startsWith('/founders') ||
    path.startsWith('/marketers') ||
    path.startsWith('/designers') ||
    path.startsWith('/affiliates') ||
    path.startsWith('/challenge') ||
    path.startsWith('/community-programs') ||
    path.startsWith('/about') ||
    path.startsWith('/credits') ||
    path.startsWith('/docs') ||
    path.startsWith('/p/') ||
    path.startsWith('/app/') ||
    // Shareable, phone-framed mobile preview (/m/<projectId>) — public by design
    // so a link can be opened/tested by anyone, like a published app.
    path.startsWith('/m/') ||
    path.startsWith('/unsubscribe') ||
    path.startsWith('/space-journey') ||
    path === '/' ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // Protected routes: /dashboard, /project/*, /onboarding, /settings
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

    // 2FA login gate. Keyed on the mfa_enabled flag, which is set ONLY once a
    // user has BOTH a verified factor AND recovery codes — so enforcement can
    // never apply to someone without a way back in. If the flag/column is absent
    // (migration not applied) the read yields false and the gate stays off.
    // Everything here is fail-open: an MFA hiccup must never lock out the app.
    try {
      const { data: prof } = await supabase.from('profiles').select('mfa_enabled').eq('id', user.id).single()
      if (prof?.mfa_enabled) {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aal && aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2') {
          const url = request.nextUrl.clone()
          const dest = path + (request.nextUrl.search || '')
          url.pathname = '/mfa'
          url.search = ''
          url.searchParams.set('next', dest)
          return NextResponse.redirect(url)
        }
      }
    } catch { /* fail open — never block the app on an MFA check error */ }

    return response
  } catch (err) {
    console.error('Proxy error:', err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/project/:path*',
    '/onboarding/:path*',
    '/settings/:path*',
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
}
