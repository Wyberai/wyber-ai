/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['esbuild'],
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/dashboard/projects', destination: '/dashboard', permanent: false },
      { source: '/home', destination: '/', permanent: true },
      { source: '/app', destination: '/dashboard', permanent: false },
      { source: '/community', destination: '/gallery', permanent: true },
      { source: '/build', destination: '/dashboard', permanent: false },
    ]
  },
  async headers() {
    return [
      // Public marketing/intro assets — allow embedding in any iframe (video
      // render services, partner sites). No X-Frame-Options; permissive CSP.
      {
        source: '/:file(demo-intro|launch-intro).html',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      // Everything else keeps strict security headers (intro files excluded above).
      {
        source: '/((?!demo-intro\\.html|launch-intro\\.html).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
