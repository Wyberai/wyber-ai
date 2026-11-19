// Generated sites carry made-up addresses such as https://dental-clinic-example.com/ in canonical, og:url, og:image and
// JSON-LD (18 Nov 2026: five occurrences on a live site). A canonical pointing at a domain that does not exist tells search
// engines to ignore the real page, and the og:image link is broken. On a published page the real address is known, so the
// placeholders are replaced with it. Only absolute URLs are touched; an email such as you@example.com is left alone.

const PLACEHOLDER_HOST = /https?:\/\/[a-z0-9.-]*example\.(?:com|org|net)/gi

export function fixPlaceholderDomains(html: string, slug: string, origin = 'https://wyberai.com'): string {
  const page = `${origin}/app/${encodeURIComponent(slug)}`
  const ogImage = `${origin}/api/og/app/${encodeURIComponent(slug)}`
  return html
    // a placeholder image file (og.svg, og.png) becomes the generated share card
    .replace(new RegExp(`${PLACEHOLDER_HOST.source}\\/[^"'\\s<>]*og[^"'\\s<>]*\\.(?:svg|png|jpe?g|webp)`, 'gi'), ogImage)
    // any other placeholder URL becomes the published address
    .replace(new RegExp(`${PLACEHOLDER_HOST.source}\\/?`, 'gi'), `${page}/`)
}
