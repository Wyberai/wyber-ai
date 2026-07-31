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
    construct: function () { return proxy; },
    // CRITICAL for namespace imports: \`import * as X from 'expo-foo'\` compiles
    // to \`X = __toESM(require(...))\` = Object.create(getPrototypeOf(stub)). By
    // returning the proxy as its own prototype, ANY property access on the
    // namespace object (X.setNotificationHandler, X.AndroidImportance, …)
    // resolves through the proxy to a callable no-op — instead of undefined,
    // which threw at module top-level and blanked the whole preview.
    getPrototypeOf: function () { return proxy; },
  });
  return proxy;
};
var _stub = makeStub();
module.exports = _stub;
// Named-export aliases so ESM destructuring (import { X } from 'module') works
// through the CJS-to-ESM interop layer without resolving to undefined.
module.exports.default = _stub;
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
  // Injected by the generator (RevenueCat paywall, maps, OTA) but with no WebView
  // equivalent — stub so they can't crash boot.
  // NOTE: react-native-reanimated is deliberately NOT here — a no-op stub made
  // its Animated.View eat all children (blank/frozen UI). It gets a real shim
  // (REANIMATED_SHIM_SOURCE) that renders children + gives working hooks instead.
  'expo-updates', 'react-native-purchases', 'react-native-maps',
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
// A real navigation controller shared via context so useNavigation().navigate()
// ACTUALLY switches screens. Previously useNavigation() returned disconnected
// no-ops, so multi-screen apps/games (a "New Game" button, custom tab bars,
// stack pushes) rendered the first screen then went dead on every tap.
var NavContext = React.createContext(null)
export function NavigationContainer(p){ return React.createElement(React.Fragment, null, p.children) }
export const NavigationIndependentTree = NavigationContainer
var NOOP_NAV = { navigate(){}, goBack(){}, push(){}, pop(){}, popToTop(){}, replace(){}, setOptions(){}, setParams(){}, reset(){}, dispatch(){}, addListener(){ return function(){} }, removeListener(){}, isFocused(){ return true }, canGoBack(){ return false }, getParent(){ return undefined }, getState(){ return { routes: [], index: 0 } } }
export function useNavigation(){ return React.useContext(NavContext) || NOOP_NAV }
export function useRoute(){ var c = React.useContext(NavContext); return (c && c.__route) || { params: {}, name: '', key: '' } }
export function useFocusEffect(cb){ React.useEffect(function(){ var c = typeof cb === 'function' ? cb() : undefined; return typeof c === 'function' ? c : undefined }, []) }
export function useIsFocused(){ return true }
export function useNavigationState(sel){ var c = React.useContext(NavContext); var s = c ? c.getState() : { routes: [], index: 0 }; return sel ? sel(s) : s }
export function useScrollToTop(){}
export function useLinkTo(){ var c = React.useContext(NavContext); return function(to){ if (c && to) c.navigate(String(typeof to === 'object' ? (to.screen || '') : to).replace(/^\\//, '')) } }
export function useLinkProps(){ return { onPress: function(){}, href: '#' } }
export const DefaultTheme = { dark: false, colors: { primary: '#0EA5E9', background: '#ffffff', card: '#ffffff', text: '#111111', border: '#e5e5e5', notification: '#0EA5E9' } }
export const DarkTheme = { dark: true, colors: { primary: '#0EA5E9', background: '#0A0A0B', card: '#111114', text: '#F5F5F7', border: '#2A2A2E', notification: '#0EA5E9' } }
export function createNavigationContainerRef(){ return { current: null, navigate(){}, isReady(){ return true }, addListener(){ return function(){} } } }
export const CommonActions = { navigate: function(n){ return { type: 'NAVIGATE', payload: (typeof n === 'object' ? n : { name: n }) } }, goBack: function(){ return { type: 'GO_BACK' } }, reset: function(){ return { type: 'RESET' } } }
export const StackActions = { push: function(name, params){ return { type: 'PUSH', payload: { name: name, params: params } } }, pop: function(){ return { type: 'POP' } }, popToTop: function(){ return { type: 'POP_TO_TOP' } }, replace: function(name, params){ return { type: 'REPLACE', payload: { name: name, params: params } } } }
export const TabActions = { jumpTo: function(name, params){ return { type: 'JUMP_TO', payload: { name: name, params: params } } } }
export const DrawerActions = { openDrawer: function(){ return { type: 'OPEN_DRAWER' } }, closeDrawer: function(){ return { type: 'CLOSE_DRAWER' } }, toggleDrawer: function(){ return { type: 'TOGGLE_DRAWER' } } }
export function useTheme(){ return DefaultTheme }
export function useNavigationContainerRef(){ return createNavigationContainerRef() }
class ScreenErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { failed: false, msg: '' } }
  static getDerivedStateFromError(e){ return { failed: true, msg: String((e && e.message) || e) } }
  componentDidCatch(e){ try { (window.parent||window).postMessage({ type:'wyber-preview-error', message: String((e&&e.message)||e), detail: (e&&e.stack)?String(e.stack).split('\\n').slice(0,3).join(' | '):'' }, '*') } catch(_){} }
  render(){
    if (this.state.failed) return React.createElement(View, { style: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0A0A0B' } },
      React.createElement(Text, { style: { color: '#F5F5F7', fontSize: 15, fontWeight: '600', marginBottom: 6 } }, 'This screen can’t render in preview'),
      React.createElement(Text, { style: { color: '#9A9AA5', fontSize: 12, textAlign: 'center' } }, this.state.msg))
    return this.props.children
  }
}
function makeNavigator(kind){
  return function(){
  function Navigator(props){
    var parent = React.useContext(NavContext)
    var screens = []
    // A Screen always has a \`name\`; a Group/Fragment wrapper doesn't but has
    // children to recurse into. Previously ANY node with .children (including
    // <Stack.Group>) was pushed as if it WERE a screen — producing a phantom
    // nameless entry and skipping the real screens grouped inside it.
    var walk = function(children){
      React.Children.toArray(children).forEach(function(c){
        if (!c || !c.props) return
        if (c.props.name && (c.props.component || c.props.children || c.props.getComponent)) screens.push(c.props)
        else if (c.props.children) walk(c.props.children)
      })
    }
    walk(props.children)
    var nameToIndex = function(name){ for (var i = 0; i < screens.length; i++){ if (screens[i].name === name) return i } return -1 }
    var initialIdx = Math.max(0, nameToIndex(props.initialRouteName))
    var st = React.useState(initialIdx); var idx = st[0], setIdx = st[1]
    var histRef = React.useRef([initialIdx])
    var paramsRef = React.useRef({})
    // setOptions (title/header changed from inside a screen) mutates a ref, so
    // a tick counter is needed to force the re-render React wouldn't otherwise
    // schedule from a plain ref mutation.
    var dynOptsRef = React.useRef({})
    var tickSt = React.useState(0); var bumpTick = function(){ tickSt[1](function(n){ return n + 1 }) }
    if (idx >= screens.length) idx = 0
    var cur = screens[idx] || {}

    var go = function(target, params){
      var name = (target && typeof target === 'object') ? target.name : target
      var pr = (target && typeof target === 'object') ? target.params : params
      var i = nameToIndex(name)
      if (i >= 0){ if (pr) paramsRef.current[name] = pr; histRef.current.push(i); setIdx(i) }
      else if (parent && parent.navigate) parent.navigate(name, pr)
    }
    var controller = {
      navigate: go, push: go, jumpTo: go,
      replace: function(name, params){ var nm = (name && typeof name === 'object') ? name.name : name; var i = nameToIndex(nm); if (i >= 0){ if (params) paramsRef.current[nm] = params; histRef.current[histRef.current.length - 1] = i; setIdx(i) } else if (parent && parent.navigate) parent.navigate(nm, params) },
      goBack: function(){ var h = histRef.current; if (h.length > 1){ h.pop(); setIdx(h[h.length - 1]) } else if (parent && parent.goBack) parent.goBack() },
      pop: function(){ var h = histRef.current; if (h.length > 1){ h.pop(); setIdx(h[h.length - 1]) } else if (parent && parent.goBack) parent.goBack() },
      popToTop: function(){ histRef.current = [initialIdx]; setIdx(initialIdx) },
      reset: function(){ histRef.current = [initialIdx]; setIdx(initialIdx) },
      setOptions: function(o){ if (o) { dynOptsRef.current[cur.name] = Object.assign({}, dynOptsRef.current[cur.name], o); bumpTick() } },
      setParams: function(p){ if (p) paramsRef.current[cur.name] = Object.assign({}, paramsRef.current[cur.name], p) },
      dispatch: function(){}, addListener: function(){ return function(){} }, removeListener: function(){},
      openDrawer: function(){}, closeDrawer: function(){}, toggleDrawer: function(){},
      isFocused: function(){ return true }, canGoBack: function(){ return histRef.current.length > 1 || !!parent },
      getParent: function(){ return parent || undefined },
      getState: function(){ return { routes: screens.map(function(s){ return { name: s.name, key: s.name } }), index: idx, type: kind } },
    }
    controller.__route = { params: paramsRef.current[cur.name] || cur.initialParams || {}, name: cur.name, key: cur.name }

    var body = null
    if (cur.component) body = React.createElement(cur.component, { navigation: controller, route: controller.__route })
    else if (cur.children) body = cur.children({ navigation: controller, route: controller.__route })

    // Header: react-navigation apps overwhelmingly rely on the AUTOMATIC header
    // (title + back chevron), not a hand-rolled back button in the screen body.
    // Rendering NOTHING here (the previous behaviour) meant every stack push had
    // no way back and no title/actions — looked like navigation "didn't work"
    // even though the controller above was already switching screens correctly.
    // screenOptions can be an object OR a function of {route, navigation}; a
    // screen's own \`options\` (same shapes) wins, then any live setOptions() call.
    var screenOptsBase = (props.screenOptions && typeof props.screenOptions === 'object') ? props.screenOptions : {}
    var screenOptsFn = typeof props.screenOptions === 'function' ? props.screenOptions({ route: controller.__route, navigation: controller }) : {}
    var curOptsRaw = typeof cur.options === 'function' ? cur.options({ route: controller.__route, navigation: controller }) : (cur.options || {})
    var opts = Object.assign({}, screenOptsBase, screenOptsFn, curOptsRaw, dynOptsRef.current[cur.name])
    var headerShown = opts.headerShown !== false
    var canGoBack = histRef.current.length > 1 || !!parent
    var tint = opts.headerTintColor || '#111111'
    var headerBg = (opts.headerStyle && opts.headerStyle.backgroundColor) || '#ffffff'
    var titleText = String(opts.title || cur.name || '')
    var titleNode = typeof opts.headerTitle === 'function'
      ? opts.headerTitle({ children: titleText, tintColor: tint })
      : React.createElement(Text, { numberOfLines: 1, style: { color: tint, fontSize: 17, fontWeight: '600' } }, String(opts.headerTitle || titleText))
    var headerLeft = typeof opts.headerLeft === 'function' ? opts.headerLeft({ tintColor: tint, canGoBack: canGoBack, onPress: controller.goBack }) : null
    var headerRight = typeof opts.headerRight === 'function' ? opts.headerRight({ tintColor: tint, canGoBack: canGoBack }) : null
    var header = headerShown ? React.createElement(View, { style: { minHeight: 44, flexDirection: 'row', alignItems: 'center', backgroundColor: headerBg, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 4 } },
      React.createElement(View, { style: { minWidth: 44, alignItems: 'flex-start', justifyContent: 'center' } },
        headerLeft || (canGoBack ? React.createElement(Pressable, { onPress: controller.goBack, style: { padding: 10 } },
          React.createElement(Text, { style: { color: tint, fontSize: 26, fontWeight: '300' } }, '‹')) : null)),
      React.createElement(View, { style: { flex: 1, alignItems: 'center', paddingVertical: 8 } }, titleNode),
      React.createElement(View, { style: { minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' } }, headerRight)) : null

    // Tab navigators get a working bottom bar; stack/drawer move via calls only.
    var showTabs = (kind === 'tab') && screens.length > 1
    // Resolve per-screen tabBar options: screenOptions (object or function called
    // with the screen's route) merged with per-screen options prop. This lets
    // tabBarIcon, tabBarLabel, tabBarActiveTintColor, and tabBarStyle flow through
    // from the generated app's navigator exactly as they would in a real build.
    function getTabOpts(s){
      var base = props.screenOptions
        ? (typeof props.screenOptions === 'function'
            ? (props.screenOptions({ route: { name: s.name, key: s.name, params: {} }, navigation: controller }) || {})
            : props.screenOptions)
        : {}
      var own = s.options
        ? (typeof s.options === 'function'
            ? (s.options({ route: { name: s.name, key: s.name, params: {} }, navigation: controller }) || {})
            : s.options)
        : {}
      return Object.assign({}, base, own)
    }
    var nav0opts = screens.length ? getTabOpts(screens[0]) : {}
    var activeTint = nav0opts.tabBarActiveTintColor || '#0EA5E9'
    var inactiveTint = nav0opts.tabBarInactiveTintColor || '#9AA0A6'
    var tabBarBg = (nav0opts.tabBarStyle && (nav0opts.tabBarStyle.backgroundColor || nav0opts.tabBarStyle.background)) || '#fafafa'
    var tabBorderCol = (nav0opts.tabBarStyle && nav0opts.tabBarStyle.borderTopColor) || '#e5e5e5'
    return React.createElement(NavContext.Provider, { value: controller },
      React.createElement(View, { style: { flex: 1, backgroundColor: '#ffffff' } },
        header,
        React.createElement(View, { style: { flex: 1 } }, React.createElement(ScreenErrorBoundary, { key: idx }, body)),
        showTabs ? React.createElement(View, { style: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: tabBorderCol, backgroundColor: tabBarBg } },
          screens.map(function(s, i){
            var isActive = i === idx
            var color = isActive ? activeTint : inactiveTint
            var tOpts = getTabOpts(s)
            var iconEl = tOpts.tabBarIcon ? tOpts.tabBarIcon({ focused: isActive, color: color, size: 22 }) : null
            var rawLabel = typeof tOpts.tabBarLabel === 'string' ? tOpts.tabBarLabel
              : (typeof tOpts.tabBarLabel === 'function' ? tOpts.tabBarLabel({ focused: isActive, color: color })
              : (tOpts.title || s.name || ('Tab ' + (i + 1))))
            return React.createElement(Pressable, { key: s.name || i, onPress: function(){ go(s.name) }, style: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' } },
              iconEl,
              React.createElement(Text, { numberOfLines: 1, style: { fontSize: 10, marginTop: iconEl ? 2 : 0, color: color, fontWeight: isActive ? '600' : '400' } }, rawLabel))
          })) : null))
  }
  function Screen(){ return null }
  function Group(p){ return React.createElement(React.Fragment, null, p.children) }
  return { Navigator: Navigator, Screen: Screen, Group: Group }
  }
}
export const createBottomTabNavigator = makeNavigator('tab')
export const createMaterialTopTabNavigator = makeNavigator('tab')
export const createMaterialBottomTabNavigator = makeNavigator('tab')
export const createNativeStackNavigator = makeNavigator('stack')
export const createStackNavigator = makeNavigator('stack')
export const createDrawerNavigator = makeNavigator('drawer')
export default { NavigationContainer: NavigationContainer, useNavigation: useNavigation, useRoute: useRoute, useFocusEffect: useFocusEffect, DefaultTheme: DefaultTheme, DarkTheme: DarkTheme, createBottomTabNavigator: createBottomTabNavigator, createNativeStackNavigator: createNativeStackNavigator, createStackNavigator: createStackNavigator, createDrawerNavigator: createDrawerNavigator }`

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
export const State = { UNDETERMINED: 0, FAILED: 1, BEGAN: 2, CANCELLED: 3, ACTIVE: 4, END: 5 }
export const Directions = { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 }

// The modern gesture API is a builder: Gesture.Tap().onStart(fn).onEnd(fn).
// A no-op previously DISCARDED those callbacks and GestureDetector ignored its
// gesture prop entirely — so every tap-to-act interaction (dice rolls, board
// cells, buttons) was dead while the UI still rendered. We now RECORD the
// handlers on the builder and let GestureDetector fire the tap lifecycle on a
// real press. Continuous gestures (pan/pinch) still can't be reproduced from a
// click, but the tap case that apps overwhelmingly rely on works.
var TAP_HANDLERS = ['onBegin','onStart','onActivate','onEnd','onFinalize']
function makeGesture(type){
  var g = { __gesture: true, type: type, handlers: {} }
  var proxy = new Proxy(g, {
    get: function(t, prop){
      if (prop in t) return t[prop]
      return function(){
        var arg = arguments[0]
        if (typeof prop === 'string' && prop.indexOf('on') === 0 && typeof arg === 'function') t.handlers[prop] = arg
        return proxy
      }
    }
  })
  return proxy
}
function composed(list){ return { __gesture: true, type: 'composed', list: list, handlers: {} } }
export var Gesture = new Proxy({
  Race: function(){ return composed([].slice.call(arguments)) },
  Simultaneous: function(){ return composed([].slice.call(arguments)) },
  Exclusive: function(){ return composed([].slice.call(arguments)) },
}, { get: function(t, prop){ if (prop in t) return t[prop]; return function(){ return makeGesture(String(prop).toLowerCase()) } } })

function collectHandlers(g){
  if (!g) return {}
  if (g.type === 'composed' && g.list){ var m = {}; g.list.forEach(function(s){ var h = collectHandlers(s); for (var k in h) m[k] = h[k] }); return m }
  return g.handlers || {}
}
export function GestureDetector(p){
  var h = collectHandlers(p.gesture)
  var fire = function(){
    var ev = { nativeEvent: {}, x: 0, y: 0, absoluteX: 0, absoluteY: 0, translationX: 0, translationY: 0, velocityX: 0, velocityY: 0, state: State.END }
    for (var i = 0; i < TAP_HANDLERS.length; i++){ var fn = h[TAP_HANDLERS[i]]; if (fn) { try { fn(ev, true) } catch(e){} } }
  }
  var hasTap = TAP_HANDLERS.some(function(k){ return typeof h[k] === 'function' })
  if (hasTap) return React.createElement(Pressable, { onPress: fire }, p.children)
  return React.createElement(React.Fragment, null, p.children)
}

// Legacy component-based handlers (onHandlerStateChange / onGestureEvent) —
// fire on press where a callback is present so tap-style handlers still work.
function legacyHandler(p){
  var cb = p.onHandlerStateChange || p.onGestureEvent
  if (cb) return React.createElement(Pressable, { onPress: function(){ try { cb({ nativeEvent: { state: State.END, oldState: State.ACTIVE, x: 0, y: 0, translationX: 0, translationY: 0 } }) } catch(e){} } }, p.children)
  return React.createElement(React.Fragment, null, p.children)
}
export const PanGestureHandler = legacyHandler
export const TapGestureHandler = legacyHandler
export const LongPressGestureHandler = legacyHandler
export const FlingGestureHandler = legacyHandler
export const PinchGestureHandler = function(p){ return React.createElement(React.Fragment, null, p.children) }
export const RotationGestureHandler = PinchGestureHandler
export const NativeViewGestureHandler = function(p){ return React.createElement(React.Fragment, null, p.children) }
export { ScrollView, FlatList, Pressable, TouchableOpacity, TouchableWithoutFeedback, TouchableHighlight }
export default { GestureHandlerRootView: GestureHandlerRootView, RectButton: RectButton, BaseButton: BaseButton, BorderlessButton: BorderlessButton, Swipeable: Swipeable, DrawerLayout: DrawerLayout, State: State, Directions: Directions, Gesture: Gesture, GestureDetector: GestureDetector, PanGestureHandler: PanGestureHandler, TapGestureHandler: TapGestureHandler, ScrollView: ScrollView, FlatList: FlatList, Pressable: Pressable, TouchableOpacity: TouchableOpacity }`

// react-native-reanimated can't run its worklets / native driver in a WebView,
// but a no-op stub was DESTRUCTIVE: <Animated.View> rendered the proxy as a
// component and returned the proxy → all children inside it vanished (blank /
// frozen screens), and useSharedValue / useAnimatedStyle returned junk that
// crashed on `.value`. This shim maps Animated.* to plain RN components (so
// children render) and gives every hook a sane, non-crashing value. Animations
// settle to their FINAL state instantly instead of tweening — inert in preview,
// fully real in a native build.
const REANIMATED_SHIM_SOURCE = `import React from 'react'
import { View, Text, ScrollView, Image, FlatList, Animated as RNAnimated, Easing as RNEasing } from 'react-native'
function passthrough(Comp){ return React.forwardRef(function(p, ref){ return React.createElement(Comp, Object.assign({}, p, { ref: ref }), p.children) }) }
var AView = passthrough(View), AText = passthrough(Text), AScrollView = passthrough(ScrollView), AImage = passthrough(Image), AFlatList = passthrough(FlatList)
export function createAnimatedComponent(Comp){ return passthrough(Comp) }
var Animated = { View: AView, Text: AText, ScrollView: AScrollView, Image: AImage, FlatList: AFlatList, createAnimatedComponent: createAnimatedComponent }
export function useSharedValue(init){ var r = React.useRef(null); if (r.current === null) r.current = { value: init }; return r.current }
export function useDerivedValue(fn){ var r = React.useRef({ value: undefined }); try { r.current.value = fn() } catch(e){}; return r.current }
export function useAnimatedStyle(fn){ try { return fn() || {} } catch(e){ return {} } }
export function useAnimatedProps(fn){ try { return fn() || {} } catch(e){ return {} } }
export function useAnimatedRef(){ return React.useRef(null) }
export function useAnimatedScrollHandler(){ return function(){} }
export function useAnimatedGestureHandler(){ return function(){} }
export function useAnimatedReaction(){}
export function useFrameCallback(){ return { setActive: function(){}, isActive: false } }
export function useReducedMotion(){ return false }
export const ReduceMotion = { System: 'system', Never: 'never', Always: 'always' }
function toValue(v){ return (v && typeof v === 'object' && 'value' in v) ? v.value : v }
export function withTiming(v){ return toValue(v) }
export function withSpring(v){ return toValue(v) }
export function withDecay(v){ return toValue(v) }
export function withDelay(_d, v){ return toValue(v) }
export function withSequence(){ var a = arguments; return a.length ? toValue(a[a.length-1]) : undefined }
export function withRepeat(v){ return toValue(v) }
export function cancelAnimation(){}
export function runOnJS(fn){ return function(){ if (typeof fn === 'function') return fn.apply(null, arguments) } }
export function runOnUI(fn){ return function(){ if (typeof fn === 'function') { try { return fn.apply(null, arguments) } catch(e){} } } }
export function measure(){ return { x: 0, y: 0, width: 0, height: 0, pageX: 0, pageY: 0 } }
export function scrollTo(){}
export function interpolate(x, inR, outR){
  if (!inR || !outR || inR.length < 2) return x
  var last = inR.length - 1
  if (x <= inR[0]) return outR[0]
  if (x >= inR[last]) return outR[last]
  for (var i = 1; i <= last; i++){ if (x <= inR[i]){ var t = (x - inR[i-1]) / (inR[i] - inR[i-1]); return outR[i-1] + t * (outR[i] - outR[i-1]) } }
  return outR[0]
}
export function interpolateColor(x, inR, outR){ return (outR && outR.length) ? outR[outR.length-1] : 'transparent' }
export var Extrapolate = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' }
export var Extrapolation = Extrapolate
export var Easing = RNEasing || { linear: function(t){ return t }, ease: function(t){ return t }, quad: function(t){ return t }, cubic: function(t){ return t }, bezier: function(){ return function(t){ return t } }, in: function(f){ return f || function(t){ return t } }, out: function(f){ return f || function(t){ return t } }, inOut: function(f){ return f || function(t){ return t } } }
var EMPTY = {}
export var FadeIn = EMPTY, FadeInDown = EMPTY, FadeInUp = EMPTY, FadeInLeft = EMPTY, FadeInRight = EMPTY, FadeOut = EMPTY, FadeOutDown = EMPTY, FadeOutUp = EMPTY, SlideInDown = EMPTY, SlideOutDown = EMPTY, SlideInUp = EMPTY, SlideOutUp = EMPTY, SlideInLeft = EMPTY, SlideInRight = EMPTY, SlideOutLeft = EMPTY, SlideOutRight = EMPTY, ZoomIn = EMPTY, ZoomOut = EMPTY, BounceIn = EMPTY, BounceOut = EMPTY, Layout = EMPTY, LinearTransition = EMPTY, FadingTransition = EMPTY
Animated.Value = RNAnimated ? RNAnimated.Value : function(){}
Animated.timing = RNAnimated ? RNAnimated.timing : function(){ return { start: function(cb){ if (cb) cb({ finished: true }) } } }
Animated.spring = RNAnimated ? RNAnimated.spring : Animated.timing
export default Animated`

// @expo/vector-icons (and react-native-vector-icons) are icon-FONT packages:
// esm.sh 500s on them and tries to serve the .ttf/.png glyph assets as JS
// modules ("MIME type image/png is not executable"), which crashed EVERY app
// that renders an icon — and the mobile system prompt mandates @expo/vector-icons
// for all generated apps, so real apps blanked while icon-less ones rendered.
// The shim renders each icon as a colour-accurate placeholder glyph (respecting
// size + color so active/inactive tab states still read correctly), mapping the
// most common icon names to a monochrome symbol and falling back to a dot. Every
// icon family (Ionicons, MaterialCommunityIcons, …) and the createIconSet
// factories map to the same component; default export covers subpath imports
// (`import Ionicons from '@expo/vector-icons/Ionicons'`).
const ICON_SHIM_SOURCE = `import React from 'react'
import { Text, Pressable } from 'react-native'
var MAP = { home:'⌂', house:'⌂', search:'⌕', settings:'⚙', gear:'⚙', cog:'⚙', add:'＋', plus:'＋', create:'＋', close:'✕', times:'✕', remove:'✕', check:'✓', checkmark:'✓', done:'✓', heart:'♥', favorite:'♥', like:'♥', bookmark:'⚑', star:'★', menu:'☰', list:'☰', filter:'≡', back:'‹', chevronleft:'‹', arrowback:'‹', forward:'›', chevronright:'›', arrowforward:'›', up:'↑', down:'↓', play:'▶', pause:'‖', person:'●', profile:'●', user:'●', account:'●', people:'●', calendar:'▦', chart:'▤', stats:'▤', analytics:'▤', bar:'▤', bell:'○', notification:'○', trash:'␡', delete:'␡', edit:'✎', pencil:'✎', mail:'✉', email:'✉', send:'➤', location:'◉', map:'◉', pin:'◉', navigate:'◉', time:'◴', clock:'◴', timer:'◴', lock:'▮', camera:'▣', image:'▧', cart:'◎', bag:'◎', wallet:'▭', card:'▭', chat:'▬', message:'▬', comment:'▬', info:'ⓘ', help:'?', warning:'⚠', flame:'▲', fire:'▲', water:'○', moon:'☽', sun:'☀', music:'♪', book:'□', flag:'⚑', gift:'▩', share:'➦', download:'↓', upload:'↑', refresh:'↻', sync:'↻', eye:'◉', grid:'▦', apps:'▦' }
function glyphFor(name){ var n = String(name||'').toLowerCase().replace(/[^a-z]/g,''); for (var k in MAP){ if (n.indexOf(k) !== -1) return MAP[k] } return '●' }
function Icon(props){
  var size = (props && props.size) || 24
  var color = (props && props.color) || '#4B5563'
  return React.createElement(Text, { allowFontScaling: false, style: { fontSize: size * 0.92, lineHeight: size, width: size, height: size, textAlign: 'center', color: color } }, glyphFor(props && props.name))
}
Icon.Button = function(p){ return React.createElement(Pressable, { onPress: p && p.onPress, style: p && p.style }, React.createElement(Icon, p), (p && p.children) ? React.createElement(Text, { style: { color: p.color, marginLeft: 8 } }, p.children) : null) }
Icon.getImageSource = function(){ return Promise.resolve(null) }
Icon.getImageSourceSync = function(){ return null }
Icon.loadFont = function(){ return Promise.resolve() }
Icon.hasIcon = function(){ return true }
Icon.font = {}
Icon.glyphMap = {}
export function createIconSet(){ return Icon }
export function createIconSetFromFontello(){ return Icon }
export function createIconSetFromIcoMoon(){ return Icon }
export function createMultiStyleIconSet(){ return Icon }
export var Ionicons = Icon, MaterialIcons = Icon, MaterialCommunityIcons = Icon, FontAwesome = Icon, FontAwesome5 = Icon, FontAwesome6 = Icon, Feather = Icon, AntDesign = Icon, Entypo = Icon, EvilIcons = Icon, Foundation = Icon, Octicons = Icon, SimpleLineIcons = Icon, Zocial = Icon, Fontisto = Icon
export default Icon`

// localStorage-backed AsyncStorage shim. Generated apps use AsyncStorage for
// session persistence; without a shim it tries esm.sh (slow / unreliable).
// This gives working read/write in preview — data survives the iframe session.
const ASYNC_STORAGE_SHIM_SOURCE = `
var _store = (function(){ try { return window.localStorage } catch(e) { return null } })()
function _k(k){ return '__rn_as__' + k }
var AsyncStorage = {
  getItem: function(k,cb){ var v=_store?_store.getItem(_k(k)):null; if(cb)cb(null,v); return Promise.resolve(v) },
  setItem: function(k,v,cb){ try{if(_store)_store.setItem(_k(k),String(v))}catch(e){}; if(cb)cb(null); return Promise.resolve() },
  removeItem: function(k,cb){ try{if(_store)_store.removeItem(_k(k))}catch(e){}; if(cb)cb(null); return Promise.resolve() },
  clear: function(cb){ try{if(_store){for(var i=_store.length-1;i>=0;i--){var k=_store.key(i);if(k&&k.indexOf('__rn_as__')===0)_store.removeItem(k)}}}catch(e){}; if(cb)cb(null); return Promise.resolve() },
  getAllKeys: function(cb){ var ks=[]; try{if(_store){for(var i=0;i<_store.length;i++){var k=_store.key(i);if(k&&k.indexOf('__rn_as__')===0)ks.push(k.slice(9))}}}catch(e){}; if(cb)cb(null,ks); return Promise.resolve(ks) },
  multiGet: function(keys,cb){ var p=keys.map(function(k){return[k,_store?_store.getItem('__rn_as__'+k):null]}); if(cb)cb(null,p); return Promise.resolve(p) },
  multiSet: function(pairs,cb){ pairs.forEach(function(p){try{if(_store)_store.setItem('__rn_as__'+p[0],String(p[1]))}catch(e){}}); if(cb)cb(null); return Promise.resolve() },
  multiRemove: function(keys,cb){ keys.forEach(function(k){try{if(_store)_store.removeItem('__rn_as__'+k)}catch(e){}}); if(cb)cb(null); return Promise.resolve() },
  flushGetRequests: function(){}, mergeItem: function(k,v,cb){ if(cb)cb(null); return Promise.resolve() }, multiMerge: function(pairs,cb){ if(cb)cb(null); return Promise.resolve() },
}
module.exports = AsyncStorage
module.exports.default = AsyncStorage
`

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
  'react-native-reanimated': REANIMATED_SHIM_SOURCE,
  '@expo/vector-icons': ICON_SHIM_SOURCE,
  'react-native-vector-icons': ICON_SHIM_SOURCE,
  '@react-native-async-storage/async-storage': ASYNC_STORAGE_SHIM_SOURCE,
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

export type BundleResult =
  | { ok: true; js: string }
  | { ok: false; error: string; kind: 'empty' | 'no-entry' | 'compile' | 'server' }

// Core bundler, shared by the POST API (in-app WebView / web editor) and the
// hosted phone-framed preview page (/m/[id]). Takes a file map ({ path: {content} }
// or { path: string }) and returns the compiled react-native-web ESM bundle, or a
// categorised failure the caller renders calmly. Never throws.
export async function bundleRnApp(files: Record<string, unknown> | null | undefined): Promise<BundleResult> {
  if (!files || Object.keys(files).length === 0) return { ok: false, error: 'No files', kind: 'empty' }
  try {
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
    if (!appEntry) return { ok: false, error: 'No App entry found', kind: 'no-entry' }

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
      // treeShaking:false prevents esbuild from reordering module initialization
      // for dead-code elimination — the reordering is what causes the
      // "Cannot access 'eS' before initialization" TDZ crash in circular-import
      // graphs (esbuild wraps circular ESM exports in a lazy var that gets
      // referenced before its __esm() initializer runs).
      treeShaking: false,
      ignoreAnnotations: true,
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
      // compile problem the client shows calmly — never a raw 500.
      const errs = (buildErr as { errors?: { text: string; location?: { file: string; line: number } }[] }).errors
      const msg = Array.isArray(errs) && errs.length
        ? errs.map(e => `${e.text}${e.location ? ` (${e.location.file}:${e.location.line})` : ''}`).join('\n')
        : String(buildErr)
      return { ok: false, error: msg, kind: 'compile' }
    }

    if (result.errors && result.errors.length > 0) {
      const msg = result.errors
        .map((e) => `${e.text}${e.location ? ` (${e.location.file}:${e.location.line})` : ''}`)
        .join('\n')
      return { ok: false, error: msg, kind: 'compile' }
    }

    const js = result.outputFiles?.[0]?.text ?? ''
    if (!js) return { ok: false, error: 'Bundler produced empty output', kind: 'compile' }
    return { ok: true, js }
  } catch (err) {
    return { ok: false, error: String(err), kind: 'server' }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { files?: Record<string, unknown> }
  const r = await bundleRnApp(body.files)
  if (!r.ok) {
    const status = r.kind === 'empty' || r.kind === 'no-entry' ? 400 : r.kind === 'compile' ? 422 : 500
    return NextResponse.json({ error: r.error, kind: r.kind }, { status })
  }
  // Return the raw bundle (client wraps it per-device via buildPreviewHtml)
  // AND a default-iOS html for any direct WebView consumer.
  return NextResponse.json({ js: r.js, html: buildPreviewHtml(r.js) })
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
    var detail = (err && err.stack) ? String(err.stack).split('\\n').slice(0,4).join(' | ') : ''
    var payload = { type: 'preview-error', message: String((err && err.message) || err), detail: detail }
    try { (window.parent || window).postMessage({ type: 'wyber-preview-error', message: payload.message, detail: detail }, '*') } catch(e){}
    try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload)) } catch(e){}
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
