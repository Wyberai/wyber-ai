// Default Open Graph image for pages that define their own `openGraph` block. In the Next.js metadata API a page's
// `openGraph` object REPLACES the root layout's, so any page that set a title and description but no `images` lost the
// share card: 78 of 159 sitemap pages (pricing, tools, every /vs and /use-cases page, most of /build and the blog)
// had no og:image, and links shared on WhatsApp, X and LinkedIn showed no preview. Spread this into those blocks.
export const DEFAULT_OG_IMAGES = [
  {
    url: '/api/og?title=Build%20any%20digital%20product&sub=Web%20Apps%20%C2%B7%20Mobile%20%C2%B7%20Websites%20%C2%B7%20SaaS%20%C2%B7%20AI-powered',
    width: 1200,
    height: 630,
    alt: 'WyberAi',
  },
]
