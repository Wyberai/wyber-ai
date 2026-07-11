export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { buildPreviewHtml, REACT_VERSION, RNW_VERSION } from '@/lib/rnw-preview/shell'

// In-app mobile preview runtime (react-native-web). Bundles a generated RN app
// and returns the raw ESM bundle (`js`) — the client wraps it with per-device
// globals (platform + insets) so iOS/Android + device-model toggles re-render
// instantly with no re-bundle. Also returns a default `html` for any direct
// WebView consumer. The app renders INSIDE WyberAi — no Expo Go, no Snack.
//
// Hardening principles (we cannot render on-device from here, so failures must
// degrade gracefully):
//   1. Single React + single react-native-web. Every esm.sh dependency is told
//      `?external=react,react-dom,react-native-web` so it reuses the ONE copy
//      from the import map. Duplicate React is the #1 cause of RN-web blank
//      screens ("Invalid hook call") — this removes it.
//   2. Uniform aliasing. Every dependency gets `alias=react-native:
//      react-native-web` so nested libs (navigation, safe-area, svg, expo-*)
//      resolve their own `react-native` import to the web build.
//   3. Never show a raw error. A React error boundary + a DOM fallback card + a
//      blank-screen watchdog guarantee a calm "Preview unavailable" state
//      instead of a red stack, a white blank, or an esbuild dump.

const ESM = 'https://esm.sh'
// Shared query for every third-party dependency: reuse the singleton React +
// react-native-web, and rewrite any `react-native` import to the web build.
// Versions come from the shell so the import map and the bundle can't drift.
const DEP_QUERY = `external=react,react-dom,react-native-web&alias=react-native:react-native-web&deps=react@${REACT_VERSION},react-native-web@${RNW_VERSION}`

// Bare specifiers that resolve via the import map (the singletons). Everything
// else is routed to esm.sh with DEP_QUERY.
const SINGLETONS = new Set([
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-native',
  'react-native-web',
])

function esmUrl(spec: string): string {
  return `${ESM}/${spec}?${DEP_QUERY}`
}

// Native-only Expo/RN modules crash react-native-web AT IMPORT — they reach for
// native APIs that don't exist in a WebView, which took down the ENTIRE preview
// before React could mount ("Preview unavailable"). We resolve them to an inlined
// no-op proxy instead: any import / call / property access returns a chainable
// no-op, so the app boots and renders and the native feature is simply inert in
// the preview (and works in a real build). Not thenable, so `await`s resolve
// immediately rather than hanging.
const STUB_SOURCE = `
var makeStub = function () {
  var proxy;
  var fn = function () { return proxy; };
  proxy = new Proxy(fn, {
    get: function (t, prop) {
      if (prop === 'then') return undefined;
      if (prop === '__esModule') return true;
      if (prop === Symbol.toPrimitive) return function () { return 0; };
      if (prop === 'toString' || prop === 'valueOf') return function () { return ''; };
      return proxy;
    },
    apply: function () { return proxy; },
  });
  return proxy;
};
module.exports = makeStub();
`

// Explicit allowlist — ONLY modules that genuinely can't run in a WebView. Web-safe
// expo-* (status-bar, constants, linking, font, blur) are deliberately absent so
// their real behaviour is kept. (react-navigation + safe-area are handled
// separately below via an inlined shim, because they 404 through esm.sh.)
const NATIVE_STUBS = new Set([
  'expo-notifications', 'expo-device', 'expo-haptics', 'expo-location',
  'expo-sensors', 'expo-camera', 'expo-battery', 'expo-brightness',
  'expo-media-library', 'expo-contacts', 'expo-local-authentication',
  'expo-secure-store', 'expo-file-system', 'expo-av', 'expo-image-picker',
  'expo-barcode-scanner', 'expo-speech', 'expo-network', 'expo-cellular',
  // Injected by the generator (RevenueCat paywall, maps, OTA, animations) but
  // with no WebView equivalent — stub so they can't crash boot. reanimated is a
  // frequent RN-web trouble spot; the no-op keeps the screen rendering.
  'expo-updates', 'react-native-purchases', 'react-native-maps',
  'react-native-reanimated',
])

function isNativeStub(spec: string): boolean {
  if (NATIVE_STUBS.has(spec)) return true
  for (const m of NATIVE_STUBS) if (spec.startsWith(m + '/')) return true
  return false
}

// react-navigation does NOT resolve through esm.sh: its internal modules
// (TabsHost, TabsScreen, …) come back as bare 404s, so ANY navigation app died
// with "Preview unavailable". Rather than fight the CDN, we alias the whole
// navigation family (+ safe-area-context, which it depends on) to a tiny inlined
// shim. The shim renders the REAL screens the app defines and gives multi-screen
// navigators a working tab bar, so the preview shows the actual app. Gestures /
// deep-link routing are inert in-preview but the screens render — and everything
// stays real in a full native build. This is the single biggest source of blank
// mobile previews, so the shim is deliberately generous with the API surface it
// exports (every hook / factory react-navigation apps commonly import).
const NAV_SHIM_SOURCE = `import React from 'react'
import { View, Text, Pressable } from 'react-native'
export function NavigationContainer(p){ return React.createElement(React.Fragment, null, p.children) }
export const NavigationIndependentTree = NavigationContainer
export function useNavigation(){ return { navigate(){}, goBack(){}, push(){}, pop(){}, popToTop(){}, replace(){}, setOptions(){}, setParams(){}, reset(){}, dispatch(){}, addListener(){ return function(){} }, removeListener(){}, isFocused(){ return true }, canGoBack(){ return false }, getParent(){ return undefined }, getState(){ return { routes: [], index: 0 } } } }
export function useRoute(){ return { params: {}, name: '', key: '' } }
export function useFocusEffect(cb){ React.useEffect(function(){ var c = typeof cb === 'function' ? cb() : undefined; return typeof c === 'function' ? c : undefined }, []) }
export function useIsFocused(){ return true }
export function useNavigationState(sel){ var s = { routes: [], index: 0 }; return sel ? sel(s) : s }
export function useScrollToTop(){}
export function useLinkTo(){ return function(){} }
export function useLinkProps(){ return { onPress: function(){}, href: '#' } }
export const DefaultTheme = { dark: false, colors: { primary: '#0EA5E9', background: '#ffffff', card: '#ffffff', text: '#111111', border: '#e5e5e5', notification: '#0EA5E9' } }
export const DarkTheme = { dark: true, colors: { primary: '#0EA5E9', background: '#0A0A0B', card: '#111114', text: '#F5F5F7', border: '#2A2A2E', notification: '#0EA5E9' } }
export function createNavigationContainerRef(){ return { current: null, navigate(){}, isReady(){ return true }, addListener(){ return function(){} } } }
export const CommonActions = {}, StackActions = {}, TabActions = {}, DrawerActions = {}
export function useTheme(){ return DefaultTheme }
export function useNavigationContainerRef(){ return createNavigationContainerRef() }
function makeNavigator(){
  function Navigator(props){
    var screens = []
    var walk = function(children){
      React.Children.toArray(children).forEach(function(c){
        if (!c || !c.props) return
        if (c.props.component || c.props.children || c.props.getComponent) screens.push(c.props)
        else if (c.props.children) walk(c.props.children)
      })
    }
    walk(props.children)
    var st = React.useState(0); var idx = st[0], setIdx = st[1]
    if (idx >= screens.length) idx = 0
    var cur = screens[idx]
    var nav = useNavigation()
    var body = null
    if (cur) {
      if (cur.component) body = React.createElement(cur.component, { navigation: nav, route: { params: cur.initialParams || {}, name: cur.name, key: cur.name } })
      else if (cur.children) body = cur.children({ navigation: nav })
    }
    return React.createElement(View, { style: { flex: 1, backgroundColor: '#ffffff' } },
      React.createElement(View, { style: { flex: 1 } }, body),
      screens.length > 1 ? React.createElement(View, { style: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e5e5e5', backgroundColor: '#fafafa' } },
        screens.map(function(s, i){
          return React.createElement(Pressable, { key: s.name || i, onPress: function(){ setIdx(i) }, style: { flex: 1, paddingVertical: 10, alignItems: 'center' } },
            React.createElement(Text, { numberOfLines: 1, style: { fontSize: 12, color: (i === idx ? '#0EA5E9' : '#9AA0A6'), fontWeight: (i === idx ? '700' : '400') } }, s.name || ('Tab ' + (i + 1))))
        })) : null)
  }
  function Screen(){ return null }
  function Group(p){ return React.createElement(React.Fragment, null, p.children) }
  return { Navigator: Navigator, Screen: Screen, Group: Group }
}
export const createBottomTabNavigator = makeNavigator
export const createNativeStackNavigator = makeNavigator
export const createStackNavigator = makeNavigator
export const createDrawerNavigator = makeNavigator
export const createMaterialTopTabNavigator = makeNavigator
export const createMaterialBottomTabNavigator = makeNavigator
export default { NavigationContainer: NavigationContainer, useNavigation: useNavigation, useRoute: useRoute, useFocusEffect: useFocusEffect, DefaultTheme: DefaultTheme, DarkTheme: DarkTheme, createBottomTabNavigator: makeNavigator, createNativeStackNavigator: makeNavigator, createStackNavigator: makeNavigator, createDrawerNavigator: makeNavigator }`

// safe-area-context ships a web build, but it resolves erratically through
// esm.sh alongside the aliased react-native. Since navigation apps almost always
// pull it in, a zero-inset shim keeps them rendering.
const SAFE_AREA_SHIM_SOURCE = `import React from 'react'
import { View } from 'react-native'
var INS = (typeof window !== 'undefined' && window.__WYBER_INSETS__) || { top: 0, bottom: 0 }
var insets = { top: INS.top || 0, bottom: INS.bottom || 0, left: 0, right: 0 }
export function SafeAreaProvider(p){ return React.createElement(React.Fragment, null, p.children) }
export function SafeAreaView(p){
  var extra = { paddingTop: insets.top, paddingBottom: insets.bottom }
  var style = Array.isArray(p.style) ? [extra].concat(p.style) : [extra, p.style]
  return React.createElement(View, Object.assign({}, p, { style: style }), p.children)
}
export function useSafeAreaInsets(){ return insets }
export function useSafeAreaFrame(){ return { x: 0, y: 0, width: 390, height: 844 } }
export const SafeAreaInsetsContext = React.createContext(insets)
export const SafeAreaFrameContext = React.createContext({ x: 0, y: 0, width: 390, height: 844 })
export const SafeAreaConsumer = SafeAreaInsetsContext.Consumer
export const initialWindowMetrics = { insets: insets, frame: { x: 0, y: 0, width: 390, height: 844 } }
export const initialWindowSafeAreaInsets = insets
export function withSafeAreaInsets(C){ return C }
export default { SafeAreaProvider: SafeAreaProvider, SafeAreaView: SafeAreaView, useSafeAreaInsets: useSafeAreaInsets }`

// react-native-gesture-handler must be shimmed, NOT stubbed: apps wrap their
// whole tree in <GestureHandlerRootView> (and use RectButton/Swipeable), so a
// no-op stub renders nothing → blank screen. The shim renders containers as
// Views and the button family as the RN-web Pressable/Touchable so the UI stays
// interactive; gesture recognition itself is inert in-preview (fine — real
// builds keep the native lib).
const GESTURE_SHIM_SOURCE = `import React from 'react'
import { View, ScrollView, FlatList, Pressable, TouchableOpacity, TouchableWithoutFeedback, TouchableHighlight } from 'react-native'
export function GestureHandlerRootView(p){ return React.createElement(View, p, p.children) }
export const RectButton = function(p){ return React.createElement(Pressable, p, p.children) }
export const BaseButton = RectButton
export const BorderlessButton = RectButton
export function Swipeable(p){ return React.createElement(View, p, p.children) }
export function DrawerLayout(p){ return React.createElement(View, p, p.children) }
export const PanGestureHandler = function(p){ return React.createElement(React.Fragment, null, p.children) }
export const TapGestureHandler = PanGestureHandler
export const LongPressGestureHandler = PanGestureHandler
export const FlingGestureHandler = PanGestureHandler
export const PinchGestureHandler = PanGestureHandler
export const RotationGestureHandler = PanGestureHandler
export const NativeViewGestureHandler = PanGestureHandler
export const State = { UNDETERMINED: 0, FAILED: 1, BEGAN: 2, CANCELLED: 3, ACTIVE: 4, END: 5 }
export const Directions = { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 }
var chain = new Proxy(function(){ return chain }, { get: function(){ return chain }, apply: function(){ return chain } })
export const Gesture = new Proxy({}, { get: function(){ return function(){ return chain } } })
export function GestureDetector(p){ return React.createElement(React.Fragment, null, p.children) }
export { ScrollView, FlatList, Pressable, TouchableOpacity, TouchableWithoutFeedback, TouchableHighlight }
export default { GestureHandlerRootView: GestureHandlerRootView, RectButton: RectButton, BaseButton: BaseButton, Swipeable: Swipeable, State: State, Directions: Directions, Gesture: Gesture, GestureDetector: GestureDetector, ScrollView: ScrollView, FlatList: FlatList }`

// Specifier prefixes that resolve to an inlined nav/safe-area shim instead of
// esm.sh. Prefix match so subpaths (e.g. `@react-navigation/native/lib/...`)
// also route to the shim.
const SHIM_MODULES: Record<string, string> = {
  '@react-navigation/native': NAV_SHIM_SOURCE,
  '@react-navigation/bottom-tabs': NAV_SHIM_SOURCE,
  '@react-navigation/native-stack': NAV_SHIM_SOURCE,
  '@react-navigation/stack': NAV_SHIM_SOURCE,
  '@react-navigation/drawer': NAV_SHIM_SOURCE,
  '@react-navigation/material-top-tabs': NAV_SHIM_SOURCE,
  '@react-navigation/material-bottom-tabs': NAV_SHIM_SOURCE,
  'react-native-safe-area-context': SAFE_AREA_SHIM_SOURCE,
  'react-native-gesture-handler': GESTURE_SHIM_SOURCE,
}

function shimSourceFor(spec: string): string | null {
  if (SHIM_MODULES[spec]) return SHIM_MODULES[spec]
  for (const k of Object.keys(SHIM_MODULES)) if (spec.startsWith(k + '/')) return SHIM_MODULES[k]
  return null
}

function normalise(p: string): string {
  if (!p.startsWith('/')) p = '/' + p
  if (!p.match(/\.[a-z]+$/i)) p += '.tsx'
  return p
}

function resolveImport(from: string, to: string): string {
  const dir = from.substring(0, from.lastIndexOf('/'))
  const parts = (dir + '/' + to).split('/')
  const out: string[] = []
  for (const p of parts) {
    if (p === '..') out.pop()
    else if (p !== '.') out.push(p)
  }
  return out.join('/')
}

export async function POST(req: NextRequest) {
  try {
    const { files } = await req.json()
    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json({ error: 'No files', kind: 'empty' }, { status: 400 })
    }

    const fileMap: Record<string, string> = {}
    for (const [path, file] of Object.entries(files)) {
      const np = normalise(path)
      const content = (file as { content?: string })?.content ?? String(file)
      fileMap[np] = content
    }

    const appEntry =
      ['/App.tsx', '/App.jsx', '/App.js', '/src/App.tsx'].find((e) => fileMap[e]) ||
      Object.keys(fileMap).find((k) => /App\.(tsx|jsx|js)$/.test(k)) ||
      ''
    if (!appEntry) {
      return NextResponse.json({ error: 'No App entry found', kind: 'no-entry' }, { status: 400 })
    }

    // Virtual boot module: wrap the app in an error boundary, then register + run
    // through AppRegistry so react-native-web injects styles and mounts into #root.
    const BOOT = '/__wyber_rnw_boot.tsx'
    fileMap[BOOT] = BOOT_SOURCE(appEntry)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const esbuild = require('esbuild')

    let result: { errors?: { text: string; location?: { file: string; line: number } }[]; outputFiles?: { text: string }[] }
    try {
      result = await esbuild.build({
      entryPoints: [BOOT],
      bundle: true,
      format: 'esm',
      write: false,
      minify: false,
      jsx: 'automatic',
      jsxImportSource: 'react',
      loader: { '.tsx': 'tsx', '.ts': 'ts', '.jsx': 'jsx', '.js': 'js', '.json': 'json' },
      define: { 'process.env.NODE_ENV': '"development"', __DEV__: 'true' },
      plugins: [
        {
          name: 'virtual',
          setup(build: {
            onResolve: (o: { filter: RegExp }, cb: (a: { path: string; importer: string }) => unknown) => void
            onLoad: (o: { filter: RegExp; namespace: string }, cb: (a: { path: string }) => unknown) => void
          }) {
            build.onResolve({ filter: /.*/ }, (args) => {
              // Relative / absolute → resolve inside the virtual project.
              if (args.path.startsWith('.') || args.path.startsWith('/')) {
                const resolved = args.path.startsWith('/')
                  ? normalise(args.path)
                  : args.importer
                    ? resolveImport(args.importer, args.path)
                    : normalise(args.path)
                for (const s of ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']) {
                  if (fileMap[resolved + s]) return { path: resolved + s, namespace: 'virtual' }
                }
                // Missing local file — leave external so a bad import can't fail
                // the whole build; the error boundary handles it at runtime.
                return { path: resolved, external: true }
              }
              // Singletons resolve via the import map (bare specifier kept as-is).
              if (SINGLETONS.has(args.path)) return { path: args.path, external: true }
              // Native-only modules → inlined no-op stub so they can't crash boot.
              if (isNativeStub(args.path)) return { path: args.path, namespace: 'stub' }
              // react-navigation family + safe-area → inlined shim (esm.sh 404s on
              // react-navigation internals, so the real lib can never load here).
              if (shimSourceFor(args.path)) return { path: args.path, namespace: 'nav-shim' }
              // Every other dependency → esm.sh with shared React + RNW singletons.
              return { path: esmUrl(args.path), external: true }
            })
            build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
              const content = fileMap[args.path]
              if (!content) return { errors: [{ text: `Not found: ${args.path}` }] }
              const ext = args.path.split('.').pop()
              const loader = ext === 'ts' ? 'ts' : ext === 'js' || ext === 'jsx' ? 'jsx' : 'tsx'
              return { contents: content, loader }
            })
            // Native-only modules resolve here → an inlined no-op so a native
            // import can never crash the whole preview.
            build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: STUB_SOURCE, loader: 'js' }))
            // react-navigation / safe-area resolve here → the inlined shim that
            // renders the app's real screens with a working tab bar.
            build.onLoad({ filter: /.*/, namespace: 'nav-shim' }, (args) => ({
              contents: shimSourceFor(args.path) ?? '',
              loader: 'jsx',
            }))
          },
        },
      ],
      })
    } catch (buildErr) {
      // esbuild REJECTS on a build failure (it doesn't resolve with errors), so
      // a syntax error in the generated app lands here. Categorise it as a
      // compile problem (422) the client shows calmly — never a raw 500.
      const errs = (buildErr as { errors?: { text: string; location?: { file: string; line: number } }[] }).errors
      const msg = Array.isArray(errs) && errs.length
        ? errs.map(e => `${e.text}${e.location ? ` (${e.location.file}:${e.location.line})` : ''}`).join('\n')
        : String(buildErr)
      return NextResponse.json({ error: msg, kind: 'compile' }, { status: 422 })
    }

    if (result.errors && result.errors.length > 0) {
      const msg = result.errors
        .map((e) => `${e.text}${e.location ? ` (${e.location.file}:${e.location.line})` : ''}`)
        .join('\n')
      return NextResponse.json({ error: msg, kind: 'compile' }, { status: 422 })
    }

    const js = result.outputFiles?.[0]?.text ?? ''
    // Return the raw bundle (client wraps it per-device via buildPreviewHtml)
    // AND a default-iOS html for any direct WebView consumer.
    return NextResponse.json({ js, html: buildPreviewHtml(js) })
  } catch (err) {
    return NextResponse.json({ error: String(err), kind: 'server' }, { status: 500 })
  }
}

// The boot module. An error boundary catches render-time failures and shows a
// calm, on-brand fallback (rendered with RN primitives) instead of a red crash.
function BOOT_SOURCE(appEntry: string): string {
  return `import React from 'react'
import { AppRegistry, View, Text, Platform } from 'react-native'
import App from '${appEntry}'

// Honor the platform the user toggled (iOS/Android). react-native-web reports
// Platform.OS === 'web'; override it so the generated app's Platform.OS checks
// and Platform.select() render the chosen platform's styling/shadows/fonts.
// Platform.OS may be a non-writable getter in RNW, so defineProperty first,
// then fall back to assignment, then (worst case) still fix select() below.
(function(){
  try {
    var os = (typeof window !== 'undefined' && window.__WYBER_PLATFORM__) || 'ios'
    try { Object.defineProperty(Platform, 'OS', { value: os, configurable: true, writable: true }) }
    catch (e) { try { Platform.OS = os } catch (e2) {} }
    Platform.select = function(spec){
      if (!spec || typeof spec !== 'object') return undefined
      if (os in spec) return spec[os]
      if ('native' in spec) return spec.native
      return spec.default
    }
  } catch (e) {}
})()

class WyberBoundary extends React.Component {
  constructor(p){ super(p); this.state = { failed: false } }
  static getDerivedStateFromError(){ return { failed: true } }
  componentDidCatch(err){
    try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'preview-error', message: String((err && err.message) || err) })) } catch(e){}
  }
  render(){
    if (this.state.failed) {
      return React.createElement(View, { style: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0A0A0B' } },
        React.createElement(Text, { style: { color: '#F5F5F7', fontSize: 16, fontWeight: '600', marginBottom: 6 } }, 'Preview unavailable'),
        React.createElement(Text, { style: { color: '#9A9AA5', fontSize: 13, textAlign: 'center', lineHeight: 19 } }, 'This screen uses something we can’t render in the in-app preview yet. It will still work in a full build.')
      )
    }
    return this.props.children
  }
}

function Root(){ return React.createElement(WyberBoundary, null, React.createElement(App, null)) }
AppRegistry.registerComponent('WyberApp', () => Root)
AppRegistry.runApplication('WyberApp', { rootTag: document.getElementById('root') })`
}
