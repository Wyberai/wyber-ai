// Builds a full SaaS product (shell + auth + dashboard + primary feature +
// analytics + notifications + settings), assembled from the saas-shell /
// saas-pages / primary-feature archetypes, real design-palettes.ts tokens,
// and the real templateFilesToProjectFiles() scaffold injector — the same
// function build-from-template.ts uses. Writes output locally for
// inspection; --insert additionally upserts into prebuilt_apps.
// Usage: node scripts/template-gen/build.mjs [--insert] [--out DIR]

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

import { lawFirm } from './categories/law-firm.mjs'
import { wealthAdvisory } from './categories/wealth-advisory.mjs'
import { architectureStudio } from './categories/architecture-studio.mjs'
import { luxuryRealEstate } from './categories/luxury-real-estate.mjs'
import { conciergeClinic } from './categories/concierge-clinic.mjs'
import { boutiqueHospitality } from './categories/boutique-hospitality.mjs'
import { creativeAgency } from './categories/creative-agency.mjs'
import { privateEquity } from './categories/private-equity.mjs'
import { sustainabilityFoundation } from './categories/sustainability-foundation.mjs'
import { artGallery } from './categories/art-gallery.mjs'
import { batchSaas2 } from './categories/batch-saas-2.mjs'
import { batchSaas3 } from './categories/batch-saas-3.mjs'
import { batchWebapp1 } from './categories/batch-webapp-1.mjs'
import { batchSaas4 } from './categories/batch-saas-4.mjs'
import { batchWebapp2 } from './categories/batch-webapp-2.mjs'
import { batchSaas5 } from './categories/batch-saas-5.mjs'
import { batchSaas6 } from './categories/batch-saas-6.mjs'
import { batchWebapp3 } from './categories/batch-webapp-3.mjs'
import { batchSaas7 } from './categories/batch-saas-7.mjs'
import { batchWebapp4 } from './categories/batch-webapp-4.mjs'
import { batchSaas8 } from './categories/batch-saas-8.mjs'
import { batchWebapp5 } from './categories/batch-webapp-5.mjs'
import { batchSaas9 } from './categories/batch-saas-9.mjs'
import { batchWebapp6 } from './categories/batch-webapp-6.mjs'
import { batchSaas10 } from './categories/batch-saas-10.mjs'
import { batchWebapp7 } from './categories/batch-webapp-7.mjs'
import { batchWebapp8 } from './categories/batch-webapp-8.mjs'
import { batchWebapp9 } from './categories/batch-webapp-9.mjs'
import { batchWebapp10 } from './categories/batch-webapp-10.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outArg = process.argv.indexOf('--out')
const outDir = outArg !== -1 ? process.argv[outArg + 1] : path.join(__dirname, '_pilot-output')

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
  // WebApp-category defs are a genuinely different product archetype per
  // buildSystemPrompt (keyboard-first, single-tenant task tool — NO org
  // hierarchy, NO billing) vs SaaS (buildSaasSystemPrompt — multi-tenant
  // platform with orgs/roles/billing/onboarding). Both still share the
  // Shell/Sidebar/Header/CommandPalette/Dashboard/Analytics/Notifications
  // scaffold — only the archetype-specific pieces branch.
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
  console.log(`  ${Object.keys(projectFiles).length} files: ${Object.keys(projectFiles).join(', ')}`)
  console.log(`  written to: ${dir}`)
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
  keywords.push(def.category.toLowerCase())

  const { data: existing } = await admin.from('prebuilt_apps').select('id').eq('name', def.name).limit(1)
  if (existing?.length) {
    const { error } = await admin.from('prebuilt_apps').update({ files: filesForDb, category: def.category, keywords, valid: true }).eq('id', existing[0].id)
    if (error) throw error
    console.log(`  [DB] updated existing row ${existing[0].id}`)
  } else {
    const { data, error } = await admin.from('prebuilt_apps').insert({
      name: def.name, category: def.category, description: def.config.description || def.name,
      keywords, preview_color: '#1e3a5f', valid: true, files: filesForDb, use_count: 0,
    }).select('id').single()
    if (error) throw error
    console.log(`  [DB] inserted new row ${data.id}`)
  }
}

const defs = [
  lawFirm, wealthAdvisory, architectureStudio, luxuryRealEstate, conciergeClinic,
  boutiqueHospitality, creativeAgency, privateEquity, sustainabilityFoundation, artGallery,
  ...batchSaas2, ...batchSaas3, ...batchWebapp1, ...batchSaas4, ...batchWebapp2, ...batchSaas5, ...batchSaas6, ...batchWebapp3, ...batchSaas7, ...batchWebapp4, ...batchSaas8,
  ...batchWebapp5, ...batchSaas9, ...batchWebapp6, ...batchSaas10, ...batchWebapp7, ...batchWebapp8, ...batchWebapp9, ...batchWebapp10,
]
const shouldInsert = process.argv.includes('--insert')
for (const def of defs) {
  const built = await buildOne(def)
  if (shouldInsert) await insertOne(built)
}
