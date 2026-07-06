// IndexNow ping — instantly tells Bing / DuckDuckGo / Yandex / Seznam to re-crawl.
// Brave Search falls back to Bing's index when its own (young) index is thin, so
// keeping Bing fresh also improves Brave visibility. Brave itself has NO IndexNow
// endpoint — the direct Brave lever is https://search.brave.com/submit-url (manual).
//
// Run manually after a deploy:   npm run indexnow
// Also runs automatically via the "postbuild" hook, but ONLY on Vercel production
// builds (guarded on VERCEL_ENV) so preview/branch deploys never ping.
//
// The key below MUST match the filename served at:
//   https://wyberai.com/a2e23e8d8250d0a201b350d25222a3ff.txt
// (see public/a2e23e8d8250d0a201b350d25222a3ff.txt). IndexNow verifies ownership
// by fetching that file and checking its contents equal the key.

const HOST = 'wyberai.com'
const KEY = 'a2e23e8d8250d0a201b350d25222a3ff'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const SITEMAP = `https://${HOST}/sitemap.xml`
// One submission endpoint is enough — IndexNow participants share submissions.
const ENDPOINT = 'https://api.indexnow.org/indexnow'

async function urlsFromSitemap() {
  const res = await fetch(SITEMAP, { headers: { 'user-agent': 'wyberai-indexnow' } })
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`)
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])
  // Only submit URLs on our own host (IndexNow rejects mixed hosts in one batch).
  return [...new Set(urls.filter((u) => u.startsWith(`https://${HOST}`)))]
}

async function main() {
  const urlList = await urlsFromSitemap()
  if (urlList.length === 0) {
    console.error('indexnow: no URLs found in sitemap — skipping')
    process.exit(0)
  }

  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  })

  // IndexNow returns 200 (accepted) or 202 (accepted, pending). Anything else is
  // a soft failure — log it but never fail the build (this is best-effort SEO).
  const label = `indexnow: ${res.status} for ${urlList.length} urls`
  if (res.ok || res.status === 202) console.log(label)
  else console.warn(`${label} (non-success; ignored) — ${await res.text().catch(() => '')}`)
}

main().catch((err) => {
  console.warn('indexnow: skipped —', err?.message || err)
  process.exit(0) // never break a deploy over a ping
})
