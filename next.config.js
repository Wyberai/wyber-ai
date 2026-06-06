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
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
