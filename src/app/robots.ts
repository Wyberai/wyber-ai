import { MetadataRoute } from 'next'

const DISALLOW = ['/dashboard', '/settings', '/api/', '/project/']

// This route overrides public/robots.txt at the served /robots.txt URL, so the
// AI-crawler allow rules must live here, not in the static file.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: 'GPTBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: DISALLOW },
      { userAgent: 'ClaudeBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'Claude-Web', allow: '/', disallow: DISALLOW },
      { userAgent: 'anthropic-ai', allow: '/', disallow: DISALLOW },
      { userAgent: 'PerplexityBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'Perplexity-User', allow: '/', disallow: DISALLOW },
      { userAgent: 'CCBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'Google-Extended', allow: '/', disallow: DISALLOW },
      { userAgent: 'Bytespider', allow: '/', disallow: DISALLOW },
      { userAgent: 'Bravebot', allow: '/', disallow: DISALLOW },
    ],
    sitemap: 'https://wyberai.com/sitemap.xml',
  }
}
