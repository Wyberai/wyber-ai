import { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://wyberai.com';
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/templates`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/vs/lovable`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/status`, lastModified: now, changeFrequency: 'hourly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
