import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Authoritative versions for Expo SDK 54 (compatible with Expo Go latest)
const SDK_VERSIONS: Record<string, string> = {
  // Navigation (v7 for SDK 54)
  '@react-navigation/native': '^7.0.0',
  '@react-navigation/native-stack': '^7.0.0',
  '@react-navigation/stack': '^7.0.0',
  '@react-navigation/bottom-tabs': '^7.0.0',
  '@react-navigation/drawer': '^7.0.0',
  '@react-navigation/material-top-tabs': '^7.0.0',
  // Icons
  '@expo/vector-icons': '~14.0.4',
  // React Native community
  'react-native-safe-area-context': '~4.14.0',
  'react-native-screens': '~4.9.2',
  'react-native-gesture-handler': '~2.24.0',
  'react-native-reanimated': '~3.17.4',
  'react-native-svg': '~15.11.2',
  'react-native-maps': '~1.20.1',
  'react-native-webview': '~13.13.4',
  '@react-native-async-storage/async-storage': '~2.1.2',
  '@react-native-community/slider': '~4.5.6',
  // Expo modules
  'expo-status-bar': '~2.2.3',
  'expo-constants': '~17.1.6',
  'expo-font': '~13.3.1',
  'expo-splash-screen': '~0.30.8',
  'expo-linear-gradient': '~14.1.4',
  'expo-blur': '~14.1.4',
  'expo-image': '~2.2.5',
  'expo-av': '~15.1.4',
  'expo-video': '~2.2.6',
  'expo-camera': '~16.1.6',
  'expo-location': '~18.1.5',
  'expo-haptics': '~14.1.4',
  'expo-clipboard': '~7.1.4',
  'expo-sharing': '~13.1.4',
  'expo-file-system': '~18.1.8',
}

// Packages that are built into React Native / Expo SDK — no declaration needed
const BUILTIN_PREFIXES = [
  'react',
  'react-native',  // react-native itself is built-in; sub-packages may not be
  'expo/',
]
const BUILTIN_EXACT = new Set([
  'react',
  'react-native',
  'expo',
])

function isBuiltin(pkg: string): boolean {
  if (BUILTIN_EXACT.has(pkg)) return true
  // react-native/* are built-in (e.g. react-native/Libraries/...)
  // but @react-native/* packages (e.g. @react-native-async-storage) are NOT
  if (pkg.startsWith('react-native/')) return true
  // expo/* sub-paths are built-in
  if (pkg.startsWith('expo/')) return true
  return false
}

function parseImports(code: string): string[] {
  const pkgs = new Set<string>()
  // Match: import ... from 'pkg' or import ... from "pkg"
  // Also: require('pkg') or require("pkg")
  const patterns = [
    /from\s+['"]([^'"./][^'"]*)['"]/g,
    /require\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g,
  ]
  for (const pattern of patterns) {
    let m: RegExpExecArray | null
    while ((m = pattern.exec(code)) !== null) {
      const raw = m[1]
      // Extract scope+name: '@scope/name' or 'name' (drop sub-paths like 'pkg/foo')
      const pkg = raw.startsWith('@')
        ? raw.split('/').slice(0, 2).join('/')
        : raw.split('/')[0]
      if (!isBuiltin(pkg)) pkgs.add(pkg)
    }
  }
  return Array.from(pkgs)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { files, name, description } = await req.json() as {
      files: Record<string, string>
      name?: string
      description?: string
    }

    // Web-scaffold files that the Expo/RN runtime can't handle. Filtering these
    // out prevents bad dependencies (vite, react-dom) from being auto-detected
    // and sent to the Snack API, which would cause "Can't resolve" errors in Expo.
    const WEB_ONLY = [
      /\.html$/i,
      /\.css$/i,
      /vite\.config\./i,
      /^main\.(tsx?|jsx?)$/i,   // Vite web entry (imports react-dom/client)
      /tailwind\.config\./i,
      /postcss\.config\./i,
    ]

    // Build the `code` map: { filename: { type: 'CODE', contents: string } }
    // Strip leading src/ — Snack expects bare filenames like App.tsx, screens/Home.tsx
    const code: Record<string, { type: 'CODE'; contents: string }> = {}
    let allCode = ''
    for (const [path, content] of Object.entries(files ?? {})) {
      if (!content) continue
      const snackPath = path.startsWith('src/') ? path.slice(4) : path
      // Skip package.json — deps are provided via manifest.dependencies (prevents
      // the generated package.json from overriding our curated SDK 54 versions)
      if (snackPath === 'package.json') continue
      // Skip web-only files — they cause unresolvable dependency errors in Expo
      if (WEB_ONLY.some(p => p.test(snackPath))) continue
      code[snackPath] = { type: 'CODE', contents: content }
      allCode += content + '\n'
    }

    if (!code['App.tsx'] && !code['App.js'] && !code['app/index.tsx']) {
      return NextResponse.json({ error: 'No App.tsx entry point found in files' }, { status: 400 })
    }

    // Parse all imports across all files, resolve to known SDK 54 versions
    const detectedPkgs = parseImports(allCode)
    const resolvedDeps: Record<string, string> = {}
    for (const pkg of detectedPkgs) {
      const version = SDK_VERSIONS[pkg]
      if (version) resolvedDeps[pkg] = version
      // Unknown packages: pass with '*' so Snack tries to resolve them
      else resolvedDeps[pkg] = '*'
    }

    // @react-navigation requires these peer deps — Snack won't auto-resolve them
    const NAV_PKGS = ['@react-navigation/native', '@react-navigation/native-stack', '@react-navigation/stack', '@react-navigation/bottom-tabs', '@react-navigation/drawer', '@react-navigation/material-top-tabs']
    if (detectedPkgs.some(p => NAV_PKGS.includes(p))) {
      if (!resolvedDeps['react-native-screens']) resolvedDeps['react-native-screens'] = SDK_VERSIONS['react-native-screens']
      if (!resolvedDeps['react-native-safe-area-context']) resolvedDeps['react-native-safe-area-context'] = SDK_VERSIONS['react-native-safe-area-context']
      if (!resolvedDeps['react-native-gesture-handler']) resolvedDeps['react-native-gesture-handler'] = SDK_VERSIONS['react-native-gesture-handler']
    }

    // Exact payload shape from snack-sdk Session.ts saveAsync():
    // manifest.dependencies: { pkg: versionString }
    // dependencies (top-level): { pkg: { version: versionString } }
    const payload = {
      manifest: {
        sdkVersion: '54.0.0',
        name: name || 'WyberAi Mobile App',
        description: description || 'Generated with WyberAi',
        dependencies: resolvedDeps,
      },
      code,
      dependencies: Object.fromEntries(
        Object.entries(resolvedDeps).map(([pkg, version]) => [pkg, { version }])
      ),
      isDraft: false,
    }

    const res = await fetch('https://exp.host/--/api/v2/snack/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json({ error: `Snack API error (${res.status}): ${text}` }, { status: 500 })
    }

    let data: { id?: string; errors?: { message: string }[] }
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: `Invalid JSON from Snack API: ${text.slice(0, 200)}` }, { status: 500 })
    }

    if (!data.id) {
      const msg = data.errors?.[0]?.message || 'No id returned'
      return NextResponse.json({ error: `Snack save failed: ${msg}` }, { status: 500 })
    }

    const snackId = data.id
    return NextResponse.json({
      snackId,
      // Full Snack editor — for "open in new tab / test on real phone"
      snackUrl: `https://snack.expo.dev/${snackId}`,
      // Embedded web-only player — supportedPlatforms=web removes all platform
      // tabs (iOS/Android/My Device), so no QR code and no sign-in ever appear inline.
      embedUrl: `https://snack.expo.dev/embedded/${snackId}?platform=web&supportedPlatforms=web&preview=true&theme=dark`,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
