import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard', '/settings', '/api/', '/project/'] },
    ],
    sitemap: 'https://wyberai.com/sitemap.xml',
  }
}
