import { MetadataRoute } from 'next'

const DISALLOW = ['/dashboard', '/settings', '/api/', '/project/']
// /api/og/ serves share-card images; LinkedInBot and other preview crawlers
// honour robots.txt, so it must stay reachable despite the /api/ block
// (the longer, more specific Allow wins).
const ALLOW = ['/', '/api/og/']

// This route overrides public/robots.txt at the served /robots.txt URL, so the
// AI-crawler allow rules must live here, not in the static file.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'GPTBot', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'ChatGPT-User', allow: ALLOW, disallow: DISALLOW },
      // ChatGPT search's own crawler (distinct from GPTBot / ChatGPT-User).
      { userAgent: 'OAI-SearchBot', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'ClaudeBot', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'Claude-Web', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'anthropic-ai', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'PerplexityBot', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'Perplexity-User', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'CCBot', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'Google-Extended', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'Applebot-Extended', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'Bytespider', allow: ALLOW, disallow: DISALLOW },
      { userAgent: 'Bravebot', allow: ALLOW, disallow: DISALLOW },
    ],
    sitemap: 'https://wyberai.com/sitemap.xml',
  }
}
