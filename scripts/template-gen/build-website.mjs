// Builds single-page marketing websites from marketing-landing specs. Much
// lighter than build.mjs's SaaS pipeline — no shell/auth/routing, matching
// WyberAi's own single-page-by-default convention for marketing sites.
// Usage: node scripts/template-gen/build-website.mjs [--insert] [--out DIR]

import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

import { getPaletteById, PALETTES } from '../../src/lib/design-palettes.ts'
import { GOOGLE_FONTS_LINKS, BASE_LAYER_CSS } from '../../src/lib/design-system.ts'
import { templateFilesToProjectFiles } from '../../src/lib/template-to-project.ts'
import { indexCssFor } from './lib/render-tokens.mjs'
import { buildMarketingLandingPage } from './archetypes/marketing-landing.mjs'

import { websiteBatch1 } from './categories/website-batch-1.mjs'
import { websiteBatch2 } from './categories/website-batch-2.mjs'
import { websiteBatch3 } from './categories/website-batch-3.mjs'
import { websiteBatch4 } from './categories/website-batch-4.mjs'
import { websiteBatch5 } from './categories/website-batch-5.mjs'
import { websiteBatch6 } from './categories/website-batch-6.mjs'
import { websiteBatch7 } from './categories/website-batch-7.mjs'
import { websiteBatch8 } from './categories/website-batch-8.mjs'
import { websiteBatch9 } from './categories/website-batch-9.mjs'
import { websiteBatch10 } from './categories/website-batch-10.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outArg = process.argv.indexOf('--out')
const outDir = outArg !== -1 ? process.argv[outArg + 1] : path.join(__dirname, '_pilot-output-website')

// Real product's generate/route.ts SEO section is MANDATORY, not optional —
// every public site needs a title/description/canonical/OG/Twitter/JSON-LD,
// and a relative canonical href literally crashes the real Vite build.
function slugDomain(brand) {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.com'
}

function titleCase(s) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

// design-palettes.ts stores HSL as space-separated channels ("h s% l%"), no
// hsl() wrapper — convert the primary token to a real hex for theme-color.
function hslChannelsToHex(channels) {
  const [h, s, l] = channels.trim().split(/\s+/).map((v) => parseFloat(v))
  const sN = s / 100, lN = l / 100
  const c = (1 - Math.abs(2 * lN - 1)) * sN
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lN - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function indexHtmlFor(def, pal) {
  const { spec } = def
  const domain = slugDomain(spec.brand)
  const canonical = `https://${domain}/`
  const title = `${spec.brand} — ${titleCase(spec.tagline)}`.slice(0, 60)
  const description = String(spec.description || spec.heroDescription).slice(0, 160)
  const themeColor = hslChannelsToHex(pal.tokens?.primary || '220 70% 50%')
  const heroImageTag = `{{wyber-image: editorial photograph capturing ${(spec.heroDescription || spec.tagline).toLowerCase()}, for ${spec.brand} | 16:9}}`
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: spec.brand,
    description,
    url: canonical,
  })

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escAttr(title)}</title>
    <meta name="description" content="${escAttr(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta name="theme-color" content="${themeColor}" />
    <meta property="og:title" content="${escAttr(title)}" />
    <meta property="og:description" content="${escAttr(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${heroImageTag}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escAttr(title)}" />
    <meta name="twitter:description" content="${escAttr(description)}" />
    <meta name="twitter:image" content="${heroImageTag}" />
    <script type="application/ld+json">${jsonLd}</script>
    ${GOOGLE_FONTS_LINKS}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
}

function robotsTxtFor(spec) {
  return `User-agent: *\nAllow: /\nSitemap: https://${slugDomain(spec.brand)}/sitemap.xml\n`
}

function sitemapXmlFor(spec) {
  const url = `https://${slugDomain(spec.brand)}/`
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${url}</loc></url>\n</urlset>\n`
}

async function buildOne(def) {
  const pal = getPaletteById(def.paletteId)
  if (!pal) throw new Error(`Palette id "${def.paletteId}" not found (${PALETTES.length} palettes loaded)`)

  const { appTsx } = buildMarketingLandingPage(def.spec)
  const indexCss = indexCssFor(pal, BASE_LAYER_CSS)

  const projectFiles = templateFilesToProjectFiles(
    {
      'src/App.tsx': appTsx,
      'src/index.css': indexCss,
      'index.html': indexHtmlFor(def, pal),
      'public/robots.txt': robotsTxtFor(def.spec),
      'public/sitemap.xml': sitemapXmlFor(def.spec),
    },
    def.name,
  )

  const dir = path.join(outDir, def.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase())
  await mkdir(dir, { recursive: true })
  for (const [filePath, file] of Object.entries(projectFiles)) {
    const dest = path.join(dir, filePath)
    await mkdir(path.dirname(dest), { recursive: true })
    await writeFile(dest, file.content, 'utf8')
  }

  console.log(`[OK] ${def.name}  palette: ${pal.id} (${pal.label}, ${pal.mode})  files: ${Object.keys(projectFiles).length}`)
  return { def, pal, projectFiles }
}

function getAdmin() {
  const env = {}
  for (const line of readFileSync(path.join(__dirname, '../../.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase URL/service key in .env.local')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function insertOne({ def, projectFiles }) {
  const admin = getAdmin()
  const filesForDb = {}
  for (const [p, f] of Object.entries(projectFiles)) filesForDb[p] = { path: f.path, content: f.content, language: f.language }

  const keywords = def.name.toLowerCase().split(/[\s&/,]+/).filter((w) => w.length > 2)
  keywords.push('website')

  const { data: existing } = await admin.from('prebuilt_apps').select('id').eq('name', def.name).limit(1)
  if (existing?.length) {
    const { error } = await admin.from('prebuilt_apps').update({ files: filesForDb, category: def.category, keywords, valid: true }).eq('id', existing[0].id)
    if (error) throw error
    console.log(`  [DB] updated existing row ${existing[0].id}`)
  } else {
    const { data, error } = await admin.from('prebuilt_apps').insert({
      name: def.name, category: def.category, description: def.spec.description || def.name,
      keywords, preview_color: '#1e3a5f', valid: true, files: filesForDb, use_count: 0,
    }).select('id').single()
    if (error) throw error
    console.log(`  [DB] inserted new row ${data.id}`)
  }
}

const defs = [...websiteBatch1, ...websiteBatch2, ...websiteBatch3, ...websiteBatch4, ...websiteBatch5, ...websiteBatch6, ...websiteBatch7, ...websiteBatch8, ...websiteBatch9, ...websiteBatch10]
const shouldInsert = process.argv.includes('--insert')
for (const def of defs) {
  const built = await buildOne(def)
  if (shouldInsert) await insertOne(built)
}
