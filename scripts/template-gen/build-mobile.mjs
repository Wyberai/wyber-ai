// Builds Expo/React Native mobile templates from mobile-shell + rn-theme.
// Bottom-tab app: Home (intelligence-first layout) + primary feature list +
// Settings. Usage: node scripts/template-gen/build-mobile.mjs [--insert] [--out DIR]

import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

import { getPaletteById, PALETTES } from '../../src/lib/design-palettes.ts'
import { buildThemeTs } from './lib/rn-theme.mjs'
import { componentsFile, homeScreenFile, primaryFeatureScreenFile, settingsScreenFile, appFile, offlineSyncHookFile, biometricGateFile } from './archetypes/mobile-shell.mjs'

import { mobileBatch1 } from './categories/mobile-batch-1.mjs'
import { mobileBatch2 } from './categories/mobile-batch-2.mjs'
import { mobileBatch3 } from './categories/mobile-batch-3.mjs'
import { mobileBatch4 } from './categories/mobile-batch-4.mjs'
import { mobileBatch5 } from './categories/mobile-batch-5.mjs'
import { mobileBatch6 } from './categories/mobile-batch-6.mjs'
import { mobileBatch7 } from './categories/mobile-batch-7.mjs'
import { mobileBatch8 } from './categories/mobile-batch-8.mjs'
import { mobileBatch9 } from './categories/mobile-batch-9.mjs'
import { mobileBatch10 } from './categories/mobile-batch-10.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outArg = process.argv.indexOf('--out')
const outDir = outArg !== -1 ? process.argv[outArg + 1] : path.join(__dirname, '_pilot-output-mobile')

// package.json for a real Expo RN project — required peer deps per the mobile
// system prompt (react-native-screens, safe-area-context, gesture-handler,
// react-navigation, expo-vector-icons).
function packageJsonFor(name) {
  return JSON.stringify({
    name: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'wyber-mobile-app',
    version: '1.0.0',
    main: 'node_modules/expo/AppEntry.js',
    scripts: { start: 'expo start', android: 'expo start --android', ios: 'expo start --ios', web: 'expo start --web' },
    dependencies: {
      expo: '~54.0.0', react: '18.3.1', 'react-native': '0.76.5',
      '@react-navigation/native': '^6.1.18', '@react-navigation/bottom-tabs': '^6.6.1',
      'react-native-screens': '~4.4.0', 'react-native-safe-area-context': '4.14.0',
      'react-native-gesture-handler': '~2.20.2', '@expo/vector-icons': '^14.0.4',
      'expo-haptics': '~14.0.0', 'expo-local-authentication': '~15.0.0', 'expo-speech': '~13.0.0',
      '@react-native-async-storage/async-storage': '1.23.1',
    },
  }, null, 2)
}

async function buildOne(def) {
  const pal = getPaletteById(def.paletteId)
  if (!pal) throw new Error(`Palette id "${def.paletteId}" not found (${PALETTES.length} palettes loaded)`)

  const config = { ...def.config, mode: pal.mode }
  const files = {
    'theme.ts': buildThemeTs(pal),
    'components/ui.tsx': componentsFile(),
    'components/BiometricGate.tsx': biometricGateFile(),
    'hooks/useOfflineSync.ts': offlineSyncHookFile(),
    'screens/HomeScreen.tsx': homeScreenFile(config),
    [`screens/${config.primaryFeaturePascal}Screen.tsx`]: primaryFeatureScreenFile(config),
    'screens/SettingsScreen.tsx': settingsScreenFile(config),
    'App.tsx': appFile(config),
    'package.json': packageJsonFor(def.name),
    'app.json': JSON.stringify({ expo: { name: def.name, slug: def.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), version: '1.0.0', orientation: 'portrait', userInterfaceStyle: pal.mode === 'dark' ? 'dark' : 'light' } }, null, 2),
  }

  const dir = path.join(outDir, def.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase())
  await mkdir(dir, { recursive: true })
  for (const [filePath, content] of Object.entries(files)) {
    const dest = path.join(dir, filePath)
    await mkdir(path.dirname(dest), { recursive: true })
    await writeFile(dest, content, 'utf8')
  }

  console.log(`[OK] ${def.name}  palette: ${pal.id} (${pal.label}, ${pal.mode})  files: ${Object.keys(files).length}`)
  return { def, pal, files }
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

async function insertOne({ def, files }) {
  const admin = getAdmin()
  const filesForDb = {}
  for (const [p, content] of Object.entries(files)) {
    const ext = p.split('.').pop()
    const lang = { ts: 'typescript', tsx: 'typescript', json: 'json' }[ext] || 'plaintext'
    filesForDb[p] = { path: p, content, language: lang }
  }

  const keywords = def.name.toLowerCase().split(/[\s&/,]+/).filter((w) => w.length > 2)
  keywords.push('mobile', 'react-native')

  const dbName = `${def.name} (Mobile)`
  const { data: existing } = await admin.from('prebuilt_apps').select('id').eq('name', dbName).limit(1)
  if (existing?.length) {
    const { error } = await admin.from('prebuilt_apps').update({ files: filesForDb, category: def.category, keywords, valid: true }).eq('id', existing[0].id)
    if (error) throw error
    console.log(`  [DB] updated existing row ${existing[0].id}`)
  } else {
    const { data, error } = await admin.from('prebuilt_apps').insert({
      name: dbName, category: def.category, description: def.config.description || def.name,
      keywords, preview_color: '#1e3a5f', valid: true, files: filesForDb, use_count: 0,
    }).select('id').single()
    if (error) throw error
    console.log(`  [DB] inserted new row ${data.id}`)
  }
}

const defs = [...mobileBatch1, ...mobileBatch2, ...mobileBatch3, ...mobileBatch4, ...mobileBatch5, ...mobileBatch6, ...mobileBatch7, ...mobileBatch8, ...mobileBatch9, ...mobileBatch10]
const shouldInsert = process.argv.includes('--insert')
for (const def of defs) {
  const built = await buildOne(def)
  if (shouldInsert) await insertOne(built)
}
