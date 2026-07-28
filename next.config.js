/** @type {import('next').NextConfig} */
const nextConfig = {
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
      { source: '/app', destination: '/dashboard', permanent: false },
      { source: '/community', destination: '/gallery', permanent: true },
      // NOTE: the old `/build → /dashboard` vanity alias was removed Jul 2026:
      // /build is now the programmatic-SEO namespace (app/build/*).
      { source: '/lp/ecommerce-dashboard', destination: '/ecommerce', permanent: false },
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
        ],
      },
    ]
  },
}
module.exports = nextConfig
