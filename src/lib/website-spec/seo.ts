import type { BuildSpec, SiteCopy } from './types'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** schema.org JSON-LD built only from what is known: owner facts and the copy. Unknown properties are left out, never guessed. */
export function jsonLd(spec: BuildSpec, copy: SiteCopy, canonical: string): object[] {
  const f = spec.brief.facts
  const name = f.name || copy.brand
  const main: Record<string, unknown> = {
    '@context': 'https://schema.org', '@type': spec.seo.schemaType, name, url: canonical, description: copy.seo.description,
  }
  if (f.city || f.address) main.address = { '@type': 'PostalAddress', ...(f.address ? { streetAddress: f.address } : {}), ...(f.city ? { addressLocality: f.city } : {}), addressCountry: 'IN' }
  if (f.phone) main.telephone = f.phone
  if (f.email) main.email = f.email
  if (f.hours) main.openingHours = f.hours
  const out: object[] = [main]
  const faq = spec.sections.find(s => s.kind === 'faq')
  const items = faq ? copy.sections[faq.id]?.faq : undefined
  if (spec.seo.faqSchema && items?.length) {
    out.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: items.map(i => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answer } })),
    })
  }
  return out
}

export function canonicalFor(spec: BuildSpec): string { return `https://${spec.seo.slug}.example.com/` }

export function renderIndexHtml(spec: BuildSpec, copy: SiteCopy, fontsHref: string, lang = 'en'): string {
  const canonical = canonicalFor(spec)
  const t = esc(copy.seo.title)
  const d = esc(copy.seo.description)
  const ld = jsonLd(spec, copy, canonical).map(o => `    <script type="application/ld+json">\n      ${JSON.stringify(o)}\n    </script>`).join('\n')
  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${canonical}og.jpg" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${canonical}og.jpg" />
${ld}
    <link href="${fontsHref}" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
}

export function robotsTxt(spec: BuildSpec): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${canonicalFor(spec)}sitemap.xml\n`
}
export function sitemapXml(spec: BuildSpec): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${canonicalFor(spec)}</loc></url>\n</urlset>\n`
}
/** A plain-text summary for AI crawlers. Built from the copy and facts only. */
export function llmsTxt(spec: BuildSpec, copy: SiteCopy): string {
  const f = spec.brief.facts
  const lines = [`# ${f.name || copy.brand}`, '', `> ${copy.seo.description}`, '']
  if (f.city) lines.push(`Based in ${f.city}.`)
  for (const s of spec.sections) {
    const c = copy.sections[s.id]
    if (!c) continue
    lines.push('', `## ${c.title}`)
    if (c.items) c.items.forEach(i => lines.push(`- ${i.title}: ${i.text}`))
    if (c.faq) c.faq.forEach(q => lines.push(`- ${q.question} ${q.answer}`))
    if (c.paragraphs) lines.push(...c.paragraphs)
  }
  return lines.join('\n') + '\n'
}
