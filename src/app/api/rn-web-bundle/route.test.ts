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
