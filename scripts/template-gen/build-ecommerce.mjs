// Builds the 88 new Ecommerce/WebApp-Ecommerce templates (ecommerce-batch-1..8)
// using the exact same saas-shell/saas-pages/primary-feature archetype and
// templateFilesToProjectFiles() scaffold as build.mjs — kept as a separate
// entry point so this run doesn't have to regenerate the ~90 pre-existing
// SaaS/WebApp defs every time. Writes output locally for inspection;
// --insert additionally upserts into prebuilt_apps.
// Usage: node scripts/template-gen/build-ecommerce.mjs [--insert] [--out DIR]

import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

import { getPaletteById, PALETTES } from '../../src/lib/design-palettes.ts'
import { GOOGLE_FONTS_LINKS, BASE_LAYER_CSS } from '../../src/lib/design-system.ts'
import { templateFilesToProjectFiles } from '../../src/lib/template-to-project.ts'
import { indexCssFor } from './lib/render-tokens.mjs'

import { useHashRouteFile, contextsFiles, sidebarFile, headerFile, shellFile, commandPaletteFile, copilotPaletteFile, appFile, orgContextFile, workspaceSwitcherFile, useKeyboardFile, inlineEditFile } from './archetypes/saas-shell.mjs'
import { loginFile, signupFile, forgotPasswordFile, onboardingFile, dashboardFile, analyticsFile, notificationsFile, settingsFile } from './archetypes/saas-pages.mjs'
import { primaryFeatureFile } from './archetypes/primary-feature.mjs'

import { ecommerceBatch1 } from './categories/ecommerce-batch-1.mjs'
import { ecommerceBatch2 } from './categories/ecommerce-batch-2.mjs'
import { ecommerceBatch3 } from './categories/ecommerce-batch-3.mjs'
import { ecommerceBatch4 } from './categories/ecommerce-batch-4.mjs'
import { ecommerceBatch5 } from './categories/ecommerce-batch-5.mjs'
import { ecommerceBatch6 } from './categories/ecommerce-batch-6.mjs'
import { ecommerceBatch7 } from './categories/ecommerce-batch-7.mjs'
import { ecommerceBatch8 } from './categories/ecommerce-batch-8.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outArg = process.argv.indexOf('--out')
const outDir = outArg !== -1 ? process.argv[outArg + 1] : path.join(__dirname, '_pilot-output-ecommerce')

function indexHtmlFor(name) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
    ${GOOGLE_FONTS_LINKS}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
}

function buildSaasAppFiles(def) {
  const archetype = (def.category || '').startsWith('WebApp-') ? 'webapp' : 'saas'
  const c = { ...def.config, archetype }
  const files = {
    'src/hooks/useHashRoute.ts': useHashRouteFile(),
    ...contextsFiles(),
    'src/contexts/OrgContext.tsx': orgContextFile(c),
    'src/components/layout/Sidebar.tsx': sidebarFile(c),
    'src/components/layout/Header.tsx': headerFile(c),
    'src/components/layout/Shell.tsx': shellFile(),
    'src/components/layout/WorkspaceSwitcher.tsx': workspaceSwitcherFile(c),
    'src/components/CommandPalette.tsx': commandPaletteFile(c),
    'src/components/CopilotPalette.tsx': copilotPaletteFile(c),
    'src/pages/auth/Login.tsx': loginFile(c),
    'src/pages/auth/Signup.tsx': signupFile(c),
    'src/pages/auth/ForgotPassword.tsx': forgotPasswordFile(c),
    'src/pages/auth/Onboarding.tsx': onboardingFile(c),
    'src/pages/Dashboard.tsx': dashboardFile(c),
    [`src/pages/${c.primaryFeaturePascal}.tsx`]: primaryFeatureFile(c),
    'src/pages/Analytics.tsx': analyticsFile(c),
    'src/pages/Notifications.tsx': notificationsFile(c),
    'src/pages/settings/Settings.tsx': settingsFile(c),
    'src/App.tsx': appFile(c),
  }
  if (archetype === 'webapp') {
    files['src/hooks/useKeyboard.ts'] = useKeyboardFile()
    files['src/components/InlineEdit.tsx'] = inlineEditFile()
  }
  return files
}

async function buildOne(def) {
  const pal = getPaletteById(def.paletteId)
  if (!pal) throw new Error(`Palette id "${def.paletteId}" not found (${PALETTES.length} palettes loaded)`)

  const appFiles = buildSaasAppFiles(def)
  const indexCss = indexCssFor(pal, BASE_LAYER_CSS)

  const projectFiles = templateFilesToProjectFiles(
    { ...appFiles, 'src/index.css': indexCss, 'index.html': indexHtmlFor(def.name) },
    def.name,
  )

  const dir = path.join(outDir, def.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase())
  await mkdir(dir, { recursive: true })
  for (const [filePath, file] of Object.entries(projectFiles)) {
    const dest = path.join(dir, filePath)
    await mkdir(path.dirname(dest), { recursive: true })
    await writeFile(dest, file.content, 'utf8')
  }

  console.log(`[OK] ${def.name}`)
  console.log(`  palette: ${pal.id} (${pal.label}, ${pal.mode})`)
  console.log(`  ${Object.keys(projectFiles).length} files`)
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

// Representative swatch hex per palette id (matches each palette's actual
// primary/accent color family from design-palettes.ts) — so the gallery grid
// shows genuinely distinct colors per template instead of one flat navy for
// all 88, matching how the pre-existing bare-'Ecommerce' rows vary color.
const PALETTE_SWATCH = {
  'fintech-emerald-dark': '#10b981', 'fintech-blue-light': '#2563eb', 'wellness-sage-light': '#87a878',
  'wellness-teal-dark': '#0d9488', 'creative-violet-dark': '#8b5cf6', 'creative-coral-light': '#fb7185',
  'saas-indigo-dark': '#6366f1', 'saas-indigo-light': '#6366f1', 'luxury-gold-dark': '#b8860b',
  'editorial-ink-light': '#b45309', 'food-amber-light': '#f59e0b', 'playful-citrus-light': '#f97316',
  'paper-oxblood-light': '#7f1d1d', 'midnight-press-dark': '#d97706', 'precision-sky-dark': '#0ea5e9',
  'precision-ember-dark': '#ea580c', 'precision-acid-dark': '#a3e635', 'mono-dev-dark': '#e5e5e5',
  'crema-fraunces-light': '#a16207', 'clay-sand-light': '#b5651d', 'gallery-red-light': '#dc2626',
  'brutalist-light': '#eab308', 'forest-market-light': '#166534', 'ledger-ivory-light': '#065f46',
  'counsel-navy-light': '#1e3a5f', 'moss-archive-light': '#4d7c4d', 'track-red-light': '#dc2626',
  'open-air-light': '#0891b2', 'supper-club-dark': '#e11d48', 'cobalt-pop-light': '#2563eb',
}

async function insertOne({ def, projectFiles }) {
  const admin = getAdmin()
  const filesForDb = {}
  for (const [p, f] of Object.entries(projectFiles)) filesForDb[p] = { path: f.path, content: f.content, language: f.language }

  const keywords = def.name.toLowerCase().split(/[\s&/,—-]+/).filter((w) => w.length > 2)
  keywords.push(def.category.toLowerCase())
  const previewColor = PALETTE_SWATCH[def.paletteId] || '#1e3a5f'

  const { data: existing } = await admin.from('prebuilt_apps').select('id').eq('name', def.name).limit(1)
  if (existing?.length) {
    const { error } = await admin.from('prebuilt_apps').update({ files: filesForDb, category: def.category, keywords, preview_color: previewColor, valid: true }).eq('id', existing[0].id)
    if (error) throw error
    console.log(`  [DB] updated existing row ${existing[0].id}`)
  } else {
    const { data, error } = await admin.from('prebuilt_apps').insert({
      name: def.name, category: def.category, description: def.config.description || def.config.tagline || def.name,
      keywords, preview_color: previewColor, valid: true, files: filesForDb, use_count: 0,
    }).select('id').single()
    if (error) throw error
    console.log(`  [DB] inserted new row ${data.id}`)
  }
}

const defs = [
  ...ecommerceBatch1, ...ecommerceBatch2, ...ecommerceBatch3, ...ecommerceBatch4,
  ...ecommerceBatch5, ...ecommerceBatch6, ...ecommerceBatch7, ...ecommerceBatch8,
]

console.log(`Building ${defs.length} Ecommerce templates...`)
const shouldInsert = process.argv.includes('--insert')
const built = []
for (const def of defs) {
  const b = await buildOne(def)
  built.push(b)
  if (shouldInsert) await insertOne(b)
}
console.log(`\nDone. Built ${built.length} templates${shouldInsert ? ' and inserted into prebuilt_apps' : ' (local only — pass --insert to write to DB)'}.`)
