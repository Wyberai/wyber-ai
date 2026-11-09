/**
 * Article markup for a blog post: headline, dates and publisher, so search and answer engines can read when it was written
 * and by whom. Rendered from each post's route layout, so the post pages themselves stay untouched.
 */
export function ArticleJsonLd(p: { headline: string; description: string; url: string; datePublished: string; dateModified: string }) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.headline,
    description: p.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': p.url },
    url: p.url,
    datePublished: p.datePublished,
    dateModified: p.dateModified,
    author: { '@type': 'Organization', name: 'WyberAi', url: 'https://wyberai.com' },
    publisher: { '@type': 'Organization', name: 'WyberAi', url: 'https://wyberai.com', logo: { '@type': 'ImageObject', url: 'https://wyberai.com/brand/wyberai-icon-512.png' } },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, '\\u003c') }} />
}
