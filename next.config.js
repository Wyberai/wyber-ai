/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pins the workspace root explicitly — without this, Turbopack finds the
  // stray C:\Users\sumit\package-lock.json one directory up and infers THAT
  // as the root instead of this project, which breaks its dev-mode route
  // manifest (App Router routes 404 unpredictably even though the files
  // exist — reproduced with src/app/auth/callback/route.ts).
  turbopack: { root: __dirname },
  serverExternalPackages: ['esbuild', 'googleapis', 'google-auth-library'],
  productionBrowserSourceMaps: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      // OAuth discovery documents must live at these well-known paths. Next
      // App Router doesn't route dotfolders reliably, so serve them from API
      // route handlers and map the canonical URLs here.
      { source: '/.well-known/oauth-authorization-server', destination: '/api/oauth/well-known/authorization-server' },
      { source: '/.well-known/oauth-protected-resource', destination: '/api/oauth/well-known/protected-resource' },
      // Some clients probe the path-suffixed form (RFC 9728) — map it too.
      { source: '/.well-known/oauth-protected-resource/api/mcp', destination: '/api/oauth/well-known/protected-resource' },
    ]
  },
  async redirects() {
    return [
      { source: '/auth/login', destination: '/login', permanent: false },
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/dashboard/projects', destination: '/dashboard', permanent: false },
      { source: '/home', destination: '/', permanent: true },
      // The scroll-journey demo page was retired; keep old links and bookmarks working.
      { source: '/space-journey', destination: '/', permanent: true },
      // Retired blog posts: they described products no longer sold from the site, or carried competitor and pricing claims that had gone stale.
      { source: '/blog/ai-workflow-automation-guide', destination: '/blog', permanent: true },
      { source: '/blog/what-are-ai-agents-guide', destination: '/blog', permanent: true },
      { source: '/blog/built-lovable-competitor-6-weeks', destination: '/blog', permanent: true },
      { source: '/blog/why-we-charge-less-than-lovable', destination: '/blog', permanent: true },
      { source: '/blog/wyber-vs-lovable', destination: '/lovable-alternatives', permanent: true },
      { source: '/app', destination: '/dashboard', permanent: false },
      { source: '/community', destination: '/gallery', permanent: true },
      // NOTE: the old `/build → /dashboard` vanity alias was removed Jul 2026:
      // /build is now the programmatic-SEO namespace (app/build/*).
      { source: '/lp/ecommerce-dashboard', destination: '/ecommerce', permanent: false },
      // Weekly Build Challenge rebranded + relaunched as Wyber Premier League.
      { source: '/challenge', destination: '/premier-league', permanent: true },
      // Gujarat Tech Expo landing page lives at /gujaratexpo. The short link
      // lands there too. (Mixed-case forms are handled in src/proxy.ts: Next
      // matches redirect sources case-insensitively, so a case-only redirect
      // here would loop.)
      { source: '/expo', destination: '/gujaratexpo', permanent: false },
    ]
  },
  async headers() {
    return [
      // Public marketing/intro assets — allow embedding in any iframe (video
      // render services, partner sites). No X-Frame-Options; permissive CSP.
      {
        source: '/:file(demo-intro|demo-intro-mobile|demo-intro-short|launch-intro).html',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      // Everything else keeps strict security headers (intro files excluded above).
      {
        source: '/((?!demo-intro\\.html|demo-intro-mobile\\.html|demo-intro-short\\.html|launch-intro\\.html).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // microphone=(self): voice prompting (Web Speech API) needs the page's
          // own mic; still denied to all embedded third-party frames.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), interest-cohort=()' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          // REPORT-ONLY: nothing is blocked. It logs what a real Content-Security-Policy would have blocked (to
          // /api/csp-report) so the policy can be tightened from real traffic before it is enforced.
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://www.redditstatic.com https://esm.sh https://cdn.jsdelivr.net https://*.sentry.io https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https:",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "form-action 'self' https:",
              'report-uri /api/csp-report',
            ].join('; '),
          },
        ],
      },
      // Client-facing pages and their APIs are private to one client: the secret is in the address. Never cache them
      // (a shared cache must not hand one client's page to another), never send the address as a referrer, and keep
      // them out of search. These come after the general rule above, so they win for the same header.
      ...['/client/:path*', '/brief/:path*', '/preview/:path*', '/api/portal/:path*', '/api/brief/:path*'].map(source => ({
        source,
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      })),
    ]
  },
}

const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options
  org: 'signalpulse-technologies',
  project: 'javascript-nextjs',

  // Only print logs for uploading source maps in CI.
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time).
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to
  // circumvent ad-blockers. Increases server load/hosting bill — left off by
  // default (the wizard's interactive prompt for this couldn't complete
  // non-interactively; revisit once EXPO_PUBLIC_SENTRY_DSN-equivalent traffic
  // volume makes ad-blocker loss worth the tradeoff).
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    automaticVercelMonitors: true,
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size.
      removeDebugLogging: true,
    },
  },
})
