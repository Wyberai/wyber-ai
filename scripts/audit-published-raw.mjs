// Raw-HTML audit of published apps: what a crawler and an attacker see before any JavaScript runs. Read-only GET requests.
//   node scripts/audit-published-raw.mjs <slug> [<slug> ...]
// Reports title and description length, canonical, Open Graph, JSON-LD, h1 count, image alt, security headers, the iframe sandbox flags,
// the crawler snapshot (noscript and llms.txt), banned marketing phrases and leaked secrets. Added 18 Nov 2026.
const slugs = process.argv.slice(2)
const unesc = s => s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const BANNED = /lorem ipsum|seamless|cutting-edge|revolutioni[sz]e|elevate your|unlock the power|game-?changer|world-class|state-of-the-art|leverage|delve|ai-powered|next-gen|supercharge|soc ?2|iso ?27001|gdpr[- ]compliant|hipaa|24\/7|money-back|trusted by/i
const SECRET = /(sk_live_[A-Za-z0-9]{10,}|service_role|sb_secret_[A-Za-z0-9_]+|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|xox[bp]-[A-Za-z0-9-]{10,}|ghp_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,})/
for (const slug of slugs) {
  const url = `https://wyberai.com/app/${slug}`
  const res = await fetch(url, { redirect: 'follow' })
  const html = await res.text()
  const meta = n => (html.match(new RegExp(`<meta[^>]+(?:name|property)="${n}"[^>]+content="([^"]*)"`, 'i')) || [])[1]
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1]
  const iframe = (html.match(/<iframe[^>]*>/) || [''])[0]
  const sandbox = (iframe.match(/sandbox="([^"]*)"/) || [])[1]
  const srcdoc = (() => { const m = html.match(/srcDoc="([\s\S]*?)"(?=[ >])/i) || html.match(/srcdoc="([\s\S]*?)"(?=[ >])/i); return m ? unesc(m[1]) : '' })()
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => { try { const j = JSON.parse(m[1]); return j['@type'] } catch { return 'unparseable' } })
  const text = srcdoc.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
  const visible = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const h1Top = (html.replace(/<iframe[\s\S]*?<\/iframe>/g, '').match(/<h1[\s>]/g) || []).length
  const h1In = (srcdoc.match(/<h1[\s>]/g) || []).length
  const imgs = srcdoc.match(/<img\b[^>]*>/g) || []
  const noAlt = imgs.filter(i => !/\salt="[^"]+"/.test(i)).length
  const robots = await fetch(`${url}/robots.txt`).then(r => `${r.status}`).catch(() => 'err')
  const llms = await fetch(`${url}/llms.txt`).then(r => `${r.status}`).catch(() => 'err')
  const out = {
    slug, status: res.status,
    crawlerSnapshot: { noscriptMain: /<noscript><main>/.test(html), llmsTxt: llms },
    headers: Object.fromEntries(['content-security-policy', 'x-frame-options', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy'].map(h => [h, res.headers.get(h) ? 'set' : 'MISSING'])),
    title, titleLen: title?.length, descLen: meta('description')?.length, canonical: (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1],
    og: ['og:title', 'og:description', 'og:image', 'og:url'].map(n => meta(n) ? n.slice(3) : `NO ${n}`).join(','), twitter: meta('twitter:card') || 'none',
    htmlLang: (html.match(/<html[^>]*lang="([^"]*)"/) || [])[1], robotsMeta: meta('robots') || 'none',
    jsonld: ld.join('+') || 'none',
    iframe: iframe ? 'yes' : 'no', sandbox: sandbox || 'none',
    h1TopLevel: h1Top, h1InsideFrame: h1In, imgs: imgs.length, imgsNoAlt: noAlt,
    visibleWordsInFrame: visible.split(' ').filter(Boolean).length, wordsOutsideFrame: html.replace(/<iframe[\s\S]*?<\/iframe>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').split(' ').filter(Boolean).length,
    bannedPhrases: [...new Set((visible.match(new RegExp(BANNED, 'gi')) || []).map(s => s.toLowerCase()))],
    secretsInFrame: [...new Set((srcdoc.match(new RegExp(SECRET, 'g')) || []).map(s => s.slice(0, 12) + '…'))],
    hrefHash: (srcdoc.match(/href="#"/g) || []).length, emptyMailtoTel: (srcdoc.match(/href="(mailto|tel):"/g) || []).length,
    waLinks: (srcdoc.match(/wa\.me\/[0-9]*/g) || []).slice(0, 3), robotsTxtAtAppPath: robots,
  }
  console.log(JSON.stringify(out, null, 1))
}
const root = await fetch('https://wyberai.com/robots.txt').then(r => r.text())
console.log('ROOT robots.txt:\n' + root.split('\n').filter(l => /app|sitemap|disallow/i.test(l)).slice(0, 12).join('\n'))
