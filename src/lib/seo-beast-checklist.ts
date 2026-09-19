// Single source of truth for the "SEO & Marketing Beast" scan's id/label/order
// — the actual checks are computed in src/app/api/seo/scan/route.ts (which
// reads the project's real index.html/public files, same as before), this
// just lets the UI show the full "here's what we'll check" list up front,
// before the scan runs, without duplicating the label strings.
export const SEO_BEAST_CHECKLIST: { id: string; label: string }[] = [
  { id: 'title', label: 'Page title is set' },
  { id: 'description', label: 'Meta description is set' },
  { id: 'opengraph', label: 'Social preview tags (Open Graph)' },
  { id: 'twitter-card', label: 'Twitter Card meta tags' },
  { id: 'structured-data', label: 'Structured data (JSON-LD)' },
  { id: 'canonical', label: 'Canonical URL tag' },
  { id: 'viewport', label: 'Mobile viewport meta tag' },
  { id: 'favicon', label: 'Favicon present' },
  { id: 'alt-text', label: 'Images have alt text' },
  { id: 'lang-attr', label: 'HTML lang attribute set' },
  { id: 'heading', label: 'Page has a proper H1 heading' },
  { id: 'lazy-loading', label: 'Images use lazy loading' },
  { id: 'analytics', label: 'Analytics tracking installed' },
  { id: 'cookie-consent', label: 'Cookie consent banner' },
  { id: 'custom-404', label: 'Custom 404 page' },
  { id: 'robots', label: 'robots.txt present' },
  { id: 'sitemap', label: 'sitemap.xml present' },
  { id: 'llms-txt', label: 'AI assistants can read your site (llms.txt)' },
]

// Only for the checks the scan does NOT already fix mechanically (see
// src/lib/seo-beast-fix.ts) — the ones that need real written copy or
// judgment. Used both by each check's individual "Fix with AI" button and by
// "Apply all fixes" to bundle whatever's left into one prompt.
export const SEO_FIX_PROMPTS: Record<string, string> = {
  title: 'Set a descriptive, keyword-rich <title> tag in index.html for this app.',
  description: 'Add a compelling <meta name="description"> (under 160 characters) to index.html.',
  opengraph: 'Add complete Open Graph meta tags (og:title, og:description, og:image, og:url) to index.html so shared links show a rich preview.',
  'twitter-card': 'Add a twitter:card meta tag (and twitter:title/twitter:description/twitter:image) to index.html so links render richly on X/Twitter.',
  'structured-data': 'Add appropriate schema.org JSON-LD structured data to index.html for this type of site.',
  favicon: "Generate and add a favicon matching this app's branding, and link it in index.html.",
  heading: 'Add a clear <h1> heading to the main page describing what this app/site does.',
  'custom-404': 'Add a custom 404/not-found page styled to match the rest of the app, with a link back home.',
}
