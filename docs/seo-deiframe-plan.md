# SEO — de-iframe published apps (the last mile)

## Done already (shipped to main)
- **Generation SEO pack** (`generate/route.ts`): every website build emits full
  `<head>` (title, description, canonical, OG/Twitter), `<html lang>`, semantic
  landmarks + single `<h1>`, JSON-LD, `public/robots.txt` + `public/sitemap.xml`.
- **Publish metadata hoist** (`src/app/app/[slug]/page.tsx`): `generateMetadata`
  extracts the generated `<head>`'s title/description/OG and the page hoists the
  JSON-LD to the top-level document. Crawlers now get correct title/description/
  social previews + rich-result structured data.

## The remaining gap
The published app **body** is still rendered inside a sandboxed
`<iframe srcDoc={html}>` (XSS isolation — user HTML must not run on the
wyberai.com origin). So crawlers see correct metadata but **don't index the page
body** (headings, copy, links) as the page's own content. This is the last mile
to Lovable-level SEO (their pages ARE the content, server-rendered).

## The fix: serve published apps as real top-level documents on a separate origin
1. **Per-app origin.** Serve each published app from its own origin/subdomain
   (e.g. `{slug}.wyberai.app`) instead of a path on wyberai.com. A separate
   origin means the app's HTML can be the top-level document without XSS risk to
   the main app/cookies. (Wildcard DNS + wildcard TLS for `*.wyberai.app`.)
2. **Serve the stored index.html directly** at that origin (route handler returns
   the HTML with `text/html`, or static hosting), so the body is real crawlable
   content — no iframe.
3. **Security review required:** CSP, no shared cookies, sanitize/scope what the
   user HTML can reach, rate limiting. This is why it needs its own focused pass.
4. Optional bigger step (full Lovable parity): **SSR** the generated apps (move
   generation target to a server-rendered framework) so content is in the initial
   HTML response. Much larger; do only if crawl/JS-render proves insufficient.

## Sequencing
- Step 1–2 (separate-origin top-level serving) closes ~most of the gap and is the
  right next chunk. Step 4 (SSR) is a separate, larger initiative.
- Keep the iframe path for the in-editor PREVIEW (safe); only the PUBLISHED route
  changes to top-level serving.

## Acceptance
- View-source of a published URL shows the app's real `<title>`, meta, JSON-LD
  AND the actual body content (headings, paragraphs, links) — not an iframe.
- Lighthouse SEO ~100; Google Rich Results test validates the JSON-LD.
