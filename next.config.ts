import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // preview-frame needs full cross-origin isolation for WebContainers
      {
        source: '/preview-frame',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
      // Main app - no COOP/COEP so Google OAuth popup works
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
