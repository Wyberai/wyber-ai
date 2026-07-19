import { describe, it, expect } from 'vitest'
import { POST } from './route'

function reqWith(files: Record<string, { content: string }>) {
  return new Request('http://localhost/api/rn-web-bundle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  }) as any
}

const APP = `import React from 'react'
import { View, Text, Platform } from 'react-native'
export default function App(){
  return <View><Text>{Platform.select({ ios: 'iOS', android: 'Android', default: 'web' })}</Text></View>
}`

describe('/api/rn-web-bundle', () => {
  it('returns {js} and {html} for a valid RN app', async () => {
    const res = await POST(reqWith({ 'App.tsx': { content: APP } }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.js).toBe('string')
    expect(body.js.length).toBeGreaterThan(0)
    expect(body.html).toContain('<div id="root">')
    // Platform.OS injection + insets globals must be present in the boot/shell.
    expect(body.js).toContain('__WYBER_PLATFORM__')
    expect(body.html).toContain('__WYBER_INSETS__')
  }, 30000)

  it('stubs native modules so a RevenueCat/maps import cannot blank the boot', async () => {
    const withNative = `import React from 'react'
import { View, Text } from 'react-native'
import Purchases from 'react-native-purchases'
import MapView from 'react-native-maps'
import * as Updates from 'expo-updates'
export default function App(){ return <View><Text>ok</Text></View> }`
    const res = await POST(reqWith({ 'App.tsx': { content: withNative } }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.js).toBe('string')
    expect(body.js.length).toBeGreaterThan(0)
  }, 30000)

  it('renders GestureHandlerRootView children (shim, not stub)', async () => {
    const withGesture = `import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { View, Text } from 'react-native'
export default function App(){ return <GestureHandlerRootView style={{flex:1}}><View><Text>hi</Text></View></GestureHandlerRootView> }`
    const res = await POST(reqWith({ 'App.tsx': { content: withGesture } }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.js.length).toBeGreaterThan(0)
  }, 30000)

  it('shims @expo/vector-icons (named + subpath) so icon apps do not blank', async () => {
    const withIcons = `import React from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
export default function App(){ return <View><Ionicons name="home" size={24} color="#fff" /><MaterialCommunityIcons name="chart-bar" size={24} color="#000" /></View> }`
    const res = await POST(reqWith({ 'App.tsx': { content: withIcons } }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.js.length).toBeGreaterThan(0)
    // The bundle must NOT reference esm.sh for the icon package (that 500s).
    expect(body.js).not.toContain('esm.sh/@expo/vector-icons')
  }, 30000)

  it('namespace import of a native stub works at module top-level (import * as X)', async () => {
    // This is the exact shape that blanked Life Tracker: `import * as X` from a
    // stubbed native module, then calling X.someMethod() at the top level. The
    // stub must resolve namespace property access to a callable, or the module
    // throws before React mounts.
    const nsApp = `import React from 'react'
import { View, Text } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true }) })
const chan = Notifications.AndroidImportance.MAX
export default function App(){ return <View><Text>{Device.isDevice ? 'dev' : 'no'}{String(chan)}</Text></View> }`
    const res = await POST(reqWith({ 'App.tsx': { content: nsApp } }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.js.length).toBeGreaterThan(0)
    // The stub must expose getPrototypeOf so __toESM namespaces stay callable.
    expect(body.js).toContain('getPrototypeOf')
  }, 30000)

  it('wires the modern Gesture API so GestureDetector taps fire (not dead)', async () => {
    // The exact shape that made the user's Snake & Ladders untappable:
    // Gesture.Tap().onEnd(fn) + <GestureDetector>. The shim must RECORD the
    // handler and route it through a Pressable, not discard it.
    const tapApp = `import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
export default function App(){
  const [n, setN] = useState(0)
  const tap = Gesture.Tap().onEnd(() => setN((p) => p + 1))
  return <GestureDetector gesture={tap}><View><Text>{n}</Text></View></GestureDetector>
}`
    const res = await POST(reqWith({ 'App.tsx': { content: tapApp } }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.js.length).toBeGreaterThan(0)
    // The handler-recording shim must be present (minify is off, so names survive).
    expect(body.js).toContain('collectHandlers')
  }, 30000)

  it('shims react-native-reanimated (renders children + working hooks), not a no-op stub', async () => {
    // A no-op stub made <Animated.View> eat its children and useSharedValue/
    // useAnimatedStyle return junk → blank/frozen. The shim renders children and
    // gives hooks sane values.
    const animApp = `import React from 'react'
import { View, Text } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
export default function App(){
  const s = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }))
  return <Animated.View style={style}><Text>inside</Text></Animated.View>
}`
    const res = await POST(reqWith({ 'App.tsx': { content: animApp } }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.js.length).toBeGreaterThan(0)
    // reanimated must resolve to the inlined shim, NOT esm.sh and NOT the no-op stub.
    expect(body.js).not.toContain('esm.sh/react-native-reanimated')
    // The shim's passthrough wrapper is a stable marker of the real shim.
    expect(body.js).toContain('passthrough')
  }, 30000)

  it('returns kind:compile (422) for a syntax error, not a 500', async () => {
    const broken = `import React from 'react'
export default function App(){ return <View> unclosed `
    const res = await POST(reqWith({ 'App.tsx': { content: broken } }))
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.kind).toBe('compile')
  }, 30000)

  it('returns kind:empty for no files', async () => {
    const res = await POST(reqWith({}))
    expect(res.status).toBe(400)
    expect((await res.json()).kind).toBe('empty')
  })
})
