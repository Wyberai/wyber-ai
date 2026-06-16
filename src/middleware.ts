import { NextRequest, NextResponse } from 'next/server'

const WYBER_HOSTS = ['wyberai.com', 'www.wyberai.com', 'localhost', '127.0.0.1']

function isWyberHost(host: string) {
  return WYBER_HOSTS.some(h => host === h || host.endsWith(`.${h}`)) ||
    host.includes('vercel.app') || host.includes('localhost')
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const { pathname } = req.nextUrl

  // Custom domain routing: netenrich.com/marketing-manager → /employees/[slug]?domain=netenrich.com
  if (!isWyberHost(host)) {
    // Strip port for lookup
    const domain = host.split(':')[0]

    // Path-based employee slug: /marketing-manager → slug
    const slug = pathname === '/' ? null : pathname.slice(1).split('/')[0]

    if (slug) {
      // Rewrite to our internal employee page
      const url = req.nextUrl.clone()
      url.pathname = `/employees/${slug}`
      url.searchParams.set('domain', domain)
      return NextResponse.rewrite(url)
    }

    // Root of custom domain → org landing page
    const url = req.nextUrl.clone()
    url.pathname = '/org-landing'
    url.searchParams.set('domain', domain)
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
