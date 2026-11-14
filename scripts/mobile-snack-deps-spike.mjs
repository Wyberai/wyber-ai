// Spike 2: do the libraries our generated mobile apps use render in the Snack web player on a newer SDK?
// Saves one small Snack per library (the same exp.host call our /api/snack route makes) for SDK 54 with our current pins and SDK 58 with
// the versions Expo bundles for it (https://unpkg.com/expo@58/bundledNativeModules.json, read on 14 Nov 2026), opens each in the embedded
// web player and looks for its marker text.
//   node scripts/mobile-snack-deps-spike.mjs [--chrome <path>]
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const args = process.argv.slice(2)
const ci = args.indexOf('--chrome')
const executablePath = [ci >= 0 ? args[ci + 1] : null, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && existsSync(p))
if (!executablePath) { console.error('No Chrome or Edge found'); process.exit(2) }

const PINS = {
  54: { sdk: '54.0.0', v: { 'react-native-screens': '~4.9.2', 'react-native-safe-area-context': '~4.14.0', 'react-native-gesture-handler': '~2.24.0', 'react-native-reanimated': '~3.17.4', '@react-native-async-storage/async-storage': '~2.1.2', '@react-navigation/native': '^7.0.0', '@react-navigation/bottom-tabs': '^7.0.0' } },
  58: { sdk: '58.0.0', v: { 'react-native-screens': '~4.30.1', 'react-native-safe-area-context': '~5.11.1', 'react-native-gesture-handler': '~3.3.0', 'react-native-reanimated': '4.7.1', 'react-native-worklets': '0.13.0', '@react-native-async-storage/async-storage': '2.2.0', '@react-navigation/native': '^7.0.0', '@react-navigation/bottom-tabs': '^7.0.0' } },
}

const TESTS = [
  { id: 'nav', mark: 'NAV-OK-1', need: ['@react-navigation/native', '@react-navigation/bottom-tabs', 'react-native-screens', 'react-native-safe-area-context'],
    code: `import * as React from 'react'; import { Text } from 'react-native'; import { NavigationContainer } from '@react-navigation/native'; import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; const Tab = createBottomTabNavigator(); const A = () => <Text>NAV-OK-1</Text>; export default function App() { return <NavigationContainer><Tab.Navigator><Tab.Screen name="A" component={A} /></Tab.Navigator></NavigationContainer> }` },
  { id: 'reanimated', mark: 'REA-OK-2', need: ['react-native-reanimated', 'react-native-worklets'],
    code: `import * as React from 'react'; import { Text, View } from 'react-native'; import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'; export default function App() { const o = useSharedValue(0); React.useEffect(() => { o.value = withTiming(1) }, []); const s = useAnimatedStyle(() => ({ opacity: o.value })); return <View><Animated.View style={s}><Text>REA-OK-2</Text></Animated.View></View> }` },
  { id: 'swipeable-old', mark: 'SWIPE-OK-3', need: ['react-native-gesture-handler'],
    code: `import * as React from 'react'; import { Text, View } from 'react-native'; import { GestureHandlerRootView } from 'react-native-gesture-handler'; import Swipeable from 'react-native-gesture-handler/Swipeable'; export default function App() { return <GestureHandlerRootView style={{ flex: 1 }}><Swipeable><View><Text>SWIPE-OK-3</Text></View></Swipeable></GestureHandlerRootView> }` },
  { id: 'swipeable-reanimated', mark: 'RSWIPE-OK-4', need: ['react-native-gesture-handler', 'react-native-reanimated', 'react-native-worklets'],
    code: `import * as React from 'react'; import { Text, View } from 'react-native'; import { GestureHandlerRootView } from 'react-native-gesture-handler'; import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'; export default function App() { return <GestureHandlerRootView style={{ flex: 1 }}><ReanimatedSwipeable><View><Text>RSWIPE-OK-4</Text></View></ReanimatedSwipeable></GestureHandlerRootView> }` },
  { id: 'storage', mark: 'STORE-OK-5', need: ['@react-native-async-storage/async-storage'],
    code: `import * as React from 'react'; import { Text } from 'react-native'; import AsyncStorage from '@react-native-async-storage/async-storage'; export default function App() { const [t, setT] = React.useState('wait'); React.useEffect(() => { (async () => { await AsyncStorage.setItem('k', 'STORE-OK-5'); setT((await AsyncStorage.getItem('k')) || 'empty') })() }, []); return <Text>{t}</Text> }` },
]

const sleep = ms => new Promise(r => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] })
const rows = []
try {
  for (const sdkKey of [54, 58]) {
    const { sdk, v } = PINS[sdkKey]
    for (const t of TESTS) {
      const deps = Object.fromEntries(t.need.map(n => [n, v[n]]).filter(([, x]) => x))
      let id = null; let note = ''
      try {
        const res = await fetch('https://exp.host/--/api/v2/snack/save', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manifest: { sdkVersion: sdk, name: 'spike', description: 'spike', dependencies: deps }, code: { 'App.tsx': { type: 'CODE', contents: t.code } }, dependencies: Object.fromEntries(Object.entries(deps).map(([k, x]) => [k, { version: x }])), isDraft: false }),
        })
        const j = await res.json().catch(() => ({})); id = j.id; if (!id) note = 'save failed: ' + JSON.stringify(j).slice(0, 120)
      } catch (e) { note = 'save error: ' + String(e.message).slice(0, 80) }
      let ok = false
      if (id) {
        const page = await browser.newPage(); await page.setViewport({ width: 420, height: 700 })
        try {
          await page.goto(`https://snack.expo.dev/embedded/${id}?platform=web&supportedPlatforms=web&preview=true&theme=dark`, { waitUntil: 'networkidle2', timeout: 60000 })
          for (let k = 0; k < 14 && !ok; k++) {
            await sleep(1500)
            for (const f of page.frames()) { try { const txt = await f.evaluate(() => document.body ? document.body.innerText : ''); if (txt.includes(t.mark)) { ok = true; break } if (!note && /error|cannot|unable|undefined is not/i.test(txt) && txt.length < 600) note = txt.replace(/\s+/g, ' ').slice(0, 140) } catch { /* detached */ } }
          }
        } catch (e) { note = String(e.message).slice(0, 80) }
        await page.close()
      }
      rows.push({ sdk: sdkKey, test: t.id, ok, note: ok ? '' : (note || 'no marker within 21 s') })
    }
  }
} finally { await browser.close() }
console.log('Snack web player, one library per Snack:')
for (const r of rows) console.log(`  SDK ${r.sdk}  ${r.test.padEnd(22)} ${r.ok ? 'renders' : 'FAILS'}${r.note ? '  ' + r.note : ''}`)
