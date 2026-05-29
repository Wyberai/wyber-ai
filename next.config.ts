import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // WebContainer preview frame needs cross-origin isolation
      // This MUST be on the preview-frame route only so Google OAuth still works everywhere else
      {
        source: '/preview-frame/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      // Main app headers
      {
        source: '/((?!preview-frame).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
