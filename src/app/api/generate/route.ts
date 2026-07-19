import { NextRequest, after } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getTemplateReference } from '@/lib/template-reference'
import { MODEL_IDS, creditCost, tierAllowedForPlan, type ModelTier } from '@/lib/credits'
import { sendCreditLowEmail, sendFirstBuildEmail } from '@/lib/email'
import { notify } from '@/lib/push'
import { userCurrency } from '@/lib/user-currency'
import { withCacheBreakpoint } from '@/lib/anthropic-cache'
import { parseGenerationOutput, parseEditBlocks } from '@/lib/file-parser'
import { WYBER_UI_KIT_PROMPT } from '@/lib/wyber-ui-kit'
import { WYBER_STORE_PROMPT } from '@/lib/wyber-store'
import { formatAgentEvent, type AgentEvent } from '@/lib/agents/events'
import { reviewEmittedFile, createFindingIdGenerator, type SecurityRuleFinding } from '@/lib/agents/security-rules'

// A build/edit turn only did something real if it produced an actual <file> or
// <edit> block — not just because the model streamed text. Without this check,
// a confident "I did X" narrative with zero real blocks sails through as a
// verified success and the turn never gets refunded (confirmed live: a turn
// claimed "Loaded all 50 restaurants" while the app never changed).
// The 'plan' stage is the one exception: its whole job is to output a JSON file
// manifest with no <file>/<edit> blocks at all, so non-empty text IS success there.
function generationSucceeded(text: string, stage: string): boolean {
  if (!text.trim()) return false
  if (stage === 'plan') return true
  const { files } = parseGenerationOutput(text)
  return files.length > 0 || parseEditBlocks(text).length > 0
}

// Streams one string field out of a growing, not-yet-complete JSON object as
// its raw text accumulates — used for live per-file progress on the write_file
// tool (Phase 5 sub-phase 2). The SDK's own partial-JSON snapshot (the
// `inputJson` event) only reveals a string value once its closing quote has
// been seen, so it can't give incremental content; this decodes JSON escape
// sequences by hand instead, byte-by-byte, and stops short of anything
// ambiguous (a lone trailing backslash, a truncated \uXXXX) so it never
// mis-decodes a chunk boundary that splits an escape sequence.
function makeJsonFieldStreamer(key: string) {
  const keyPattern = new RegExp(`"${key}"\\s*:\\s*"`)
  let startIdx = -1
  let cursor = -1
  let value = ''
  let closed = false
  return function feed(buf: string): { value: string; closed: boolean } {
    if (closed) return { value, closed: true }
    if (startIdx === -1) {
      const m = keyPattern.exec(buf)
      if (!m) return { value: '', closed: false }
      startIdx = m.index + m[0].length
      cursor = startIdx
    }
    let i = cursor
    while (i < buf.length) {
      const ch = buf[i]
      if (ch === '"') { closed = true; cursor = i + 1; return { value, closed: true } }
      if (ch === '\\') {
        if (i + 1 >= buf.length) break // dangling escape at chunk boundary — wait for more
        const next = buf[i + 1]
        if (next === 'u') {
          if (i + 6 > buf.length) break // truncated \uXXXX — wait for more
          value += String.fromCharCode(parseInt(buf.slice(i + 2, i + 6), 16))
          i += 6
          continue
        }
        const escapeMap: Record<string, string> = { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f' }
        value += escapeMap[next] ?? next
        i += 2
        continue
      }
      value += ch
      i += 1
    }
    cursor = i
    return { value, closed: false }
  }
}

// 800s needs Fluid compute (Pro) — Vercel clamps/rejects it otherwise. Raised
// from 300 after five observed timeouts on giant multi-iteration builds; the
// client ceiling in ChatPanel is set 20s past this, keep them in sync.
export const maxDuration = 800

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Use central model map — single source of truth
const MODELS = MODEL_IDS

const WYBER_FEATURES = `
ABOUT WyberAi — your knowledge base:

BUILDER:
- AI chat that asks 5 questions before building — understands the idea fully first
- Generates complete React apps, all files and components in one go
- Live preview that updates in real-time as code generates
- Visual click-to-edit — click any element in the preview to change it directly
- Plan Mode — shows a step-by-step build plan before generating; user approves it first
- Screenshot-to-app — paste a screenshot and WyberAi clones the UI

GALLERY (prebuilt apps, always 0 credits):
- Users can browse a gallery of ready-made apps (CRM, dashboards, e-commerce, etc.)
- Gallery apps load instantly at zero credit cost
- But the core product is FRESH AI generation — every build creates unique code from scratch

DEPLOYMENT & EXPORT:
- One-click deploy to Vercel — live URL in minutes
- GitHub sync — push generated code to any repo with one click
- Export full source code anytime — user owns it completely
- Free subdomain: yourapp.wyberai.app

CREDITS & PLANS:
- Starter ($29/mo): 150 credits/month — all features unlocked
- Builder ($79/mo): 500 credits/month — all features unlocked
- Pro ($199/mo): 1,500 credits/month — all features unlocked
- Growth ($399/mo): 4,000 credits/month — all features unlocked
- Scale ($799/mo): 10,000 credits/month — all features unlocked
- No employee caps, no agent limits, no feature gates — every plan unlocks ALL features
- Prebuilt templates: 0 credits always
- Web/mobile app build: 30 credits | App edit: 2 credits | Build plan: 5 credits
- AI Employee run: 5 credits | Agent run: 5 credits | Workflow run: 2 credits
- GTM campaign action: 3 credits | Lead enrichment: 1 credit per contact | Image: 3 credits
- Always free: templates, self-healing, export, deploy, GitHub push
- Credits never expire, top-ups never expire
- Credit estimate shown before every generation — no surprises

vs COMPETITORS:
- Wyber generates fresh code from scratch every time — not templates
- Wyber does web AND mobile apps; Lovable, Bolt are web-only
- v0 by Vercel generates UI components only — not full apps
- Replit is a full cloud IDE — powerful for developers, complex for non-technical users
- Self-healing builds — AI catches and fixes its own errors automatically

DONE-FOR-YOU (book at wyberai.com/setup-call):
- $99 consultation — scope the app, get a firm quote and delivery date
- Simple ($199): landing pages, tools — 24 hours
- Medium ($399): SaaS MVP with auth + database — 3 working days  
- Complex ($799): full SaaS with payments, multi-role — 1 week
`

function buildMobileSystemPrompt(): string {
  return `
You are the AI engine inside WyberAi Mobile — a React Native + Expo app builder. You turn conversations into production-quality mobile apps that look like they ship on the App Store. You are powered by Claude and built by SignalPulse Technologies.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- React Native with Expo SDK 54 + TypeScript
- Navigation: @react-navigation/native + @react-navigation/stack or @react-navigation/bottom-tabs
- Peer deps (REQUIRED): react-native-screens, react-native-safe-area-context, react-native-gesture-handler — wrap root with GestureHandlerRootView
- Styling: StyleSheet.create() — NO Tailwind, NO web CSS
- Icons: @expo/vector-icons (Ionicons, MaterialCommunityIcons)
- Data: useState + useEffect with inline initial data. When Supabase is connected, use it for ALL data/auth.
- Components: View, Text, ScrollView, TouchableOpacity, FlatList, TextInput, Image, Pressable — NOT div/span/button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM — iOS/Android QUALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every app must look like a polished App Store app — not a web prototype in a phone frame.

STEP 0 — DESIGN PASS (decide BEFORE writing files; one short line each):
- Vibe: what this app evokes + a real App Store reference (e.g. "Cash App-bold", "Headspace-calm", "Notion-clean", "Strava-energetic", "Duolingo-playful").
- Palette: pick an accent hue WITH INTENT (finance→green/blue, wellness→teal/sage, social→violet/coral, fitness→orange/lime). Choose LIGHT or DARK base to fit the brand — do NOT default to dark every time.
- Make it BESPOKE: two different apps must look visibly different. There is no house style.

THE THEME — define colors ONCE, reference everywhere (this is how apps stay fresh AND consistent):
Create theme.ts as the single source of truth and import it in every file. NEVER hardcode a hex/rgba in a StyleSheet — always reference theme.X.

<file path="theme.ts">
export const theme = {
  // choose these per app (example shown — REPLACE with your design pass)
  bg: '#0B0B0F',            // screen background (light apps: e.g. '#FBFAF8')
  surface: '#16161D',       // cards, inputs, list items
  elevated: '#22222C',      // modals, pressed states
  border: 'rgba(255,255,255,0.08)',
  borderActive: 'rgba(255,255,255,0.18)',
  text: '#FAFAFA',          // primary text (light apps: near-black)
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  accent: '#6366F1',        // YOUR brand hue — change it
  accentLight: 'rgba(99,102,241,0.14)',
  onAccent: '#FFFFFF',      // text/icon on top of accent
  success: '#22C55E', successBg: 'rgba(34,197,94,0.12)',
  warning: '#F59E0B', warningBg: 'rgba(245,158,11,0.12)',
  danger: '#EF4444', dangerBg: 'rgba(239,68,68,0.12)',
  radius: 16,
} as const
</file>
CONTRAST: if you pick a LIGHT bg, text must be near-black and onAccent must contrast the accent. Never light-on-light or dark-on-dark.

TYPOGRAPHY (color from theme — never hardcode):
- Screen titles: fontSize: 28, fontWeight: '800', color: theme.text, letterSpacing: -0.5
- Section headers: fontSize: 18, fontWeight: '700', color: theme.text
- Card titles: fontSize: 15, fontWeight: '600', color: theme.text
- Body text: fontSize: 14, color: theme.textSecondary, lineHeight: 20
- Labels: fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5
- Numbers/stats: fontSize: 32, fontWeight: '800', color: theme.text, letterSpacing: -1

SPACING (consistent throughout):
- Screen padding: paddingHorizontal: 20, paddingTop: 16
- Card padding: padding: 16 or padding: 20
- Between cards: gap: 12 or marginBottom: 12
- Between sections: marginBottom: 24 or marginTop: 32
- List item padding: paddingVertical: 14, paddingHorizontal: 16

COMPONENT PATTERNS (structure is fixed; ALL colors come from theme.X):

Card:
{ backgroundColor: theme.surface, borderRadius: theme.radius, padding: 16, borderWidth: 1, borderColor: theme.border }

Button (primary):
{ backgroundColor: theme.accent, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
Text: { color: theme.onAccent, fontSize: 15, fontWeight: '700' }

Button (secondary):
{ backgroundColor: theme.elevated, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: theme.border }

Input:
{ backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: theme.text, borderWidth: 1, borderColor: theme.border }
Focused: borderColor: theme.accent

Badge/chip:
{ backgroundColor: theme.successBg, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: theme.success + '33' }
Text: { fontSize: 11, fontWeight: '700', color: theme.success }

List item:
{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: theme.surface, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: theme.border }

Avatar:
{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' }
Text inside: { fontSize: 15, fontWeight: '700', color: theme.onAccent }

Stat card:
{ backgroundColor: theme.surface, borderRadius: theme.radius, padding: 16, flex: 1, borderWidth: 1, borderColor: theme.border }
Value: { fontSize: 28, fontWeight: '800', color: theme.text, letterSpacing: -0.5 }
Label: { fontSize: 11, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }

Search bar:
{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: theme.border }

Modal:
Backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)' }
Panel: { backgroundColor: theme.surface, borderRadius: 20, padding: 24, marginHorizontal: 20, borderWidth: 1, borderColor: theme.borderActive }

Tab bar (bottom tabs):
{ backgroundColor: theme.bg, borderTopColor: theme.border, borderTopWidth: 1 }
Active tint: theme.accent, Inactive tint: theme.textMuted

POLISH:
- TouchableOpacity with activeOpacity={0.7} on all pressable elements
- Pressable with android_ripple={{ color: 'rgba(255,255,255,0.05)' }} for Android feel
- FlatList with ItemSeparatorComponent for clean dividers
- Empty state: centered View with large icon (opacity 0.3) + title + subtitle + CTA button
- Loading: ActivityIndicator color={theme.accent} or skeleton View with opacity animation
- Pull-to-refresh: RefreshControl on ScrollView/FlatList with tintColor={theme.accent}
- KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} on every screen with inputs
- SafeAreaView wrapping root content on every screen
- StatusBar backgroundColor={theme.bg} and barStyle: "light-content" for a DARK theme, "dark-content" for a LIGHT theme (match your base)
- Smooth scrolling: showsVerticalScrollIndicator={false} on ScrollView
- Platform.select({}) for iOS/Android differences (shadows vs elevation)
- Shadow on cards (iOS): shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8
- Elevation on cards (Android): elevation: 4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APP STRUCTURE — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVERY APP must have:
1. App.tsx — root with NavigationContainer + navigator (bottom-tabs for 3+ sections, stack for simpler)
2. screens/HomeScreen.tsx — main screen with stats + content
3. screens/[Feature1]Screen.tsx — second screen
4. screens/[Feature2]Screen.tsx — third screen (minimum 3 screens)
5. components/ — shared components (SearchBar, Card, Badge, EmptyState, etc.)

EVERY APP must include:
✓ Bottom tab navigation with icons (3-5 tabs) or stack navigation with header
✓ Working search that filters data on keystroke
✓ At least one modal or bottom sheet (add/edit/view)
✓ Stat cards with real numbers + trend indicators
✓ 8-15 realistic data records in useState
✓ Empty state when search returns nothing
✓ Pull-to-refresh on list screens
✓ Proper StatusBar configuration
✓ Charts: custom bar/line using View (no recharts — web only)
✓ Realistic, diverse mock data (names, companies, numbers with decimals, mixed statuses)

DATA RULES:
- Diverse names: Sarah Chen, Marcus Rivera, Priya Sharma, James O'Brien, Aisha Patel
- Real companies: Horizon Labs, Vertex Systems, Meridian Health, Atlas Digital
- Numbers with decimals: $47,832.50, 94.3%, 2.1x
- Mixed statuses: active, pending, at-risk, completed, overdue
- Dates in 2025-2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETENESS: Every import must have a file. Every planned file must be output. Stubs over skips.
NO UNDEFINED VARS: All data inline as useState. IDs: Math.random().toString(36).slice(2)
TYPESCRIPT: Use interfaces at top of files. No React.FC, no import type.
STATE: All useState in App.tsx or screen-level. Pass down as props. No Context/Redux.
NO WEB: No useRouter, no Link, no div/span/button. Always navigation.navigate().

OUTPUT FORMAT:
<file path="App.tsx">...</file>
<file path="screens/HomeScreen.tsx">...</file>

PROGRESS MARKERS:
[progress: Planning [App Name]]
[progress: Scaffolding screens]
[progress: Building [filename]]
[progress: Done]

PUSH NOTIFICATIONS — include when the app has notifications, alerts, reminders, or messaging:
When the user's app concept calls for notifications (delivery updates, reminders, alerts, new messages, order status, etc.), add push notification support using expo-notifications. Always include this as a lib/notifications.ts helper file and call registerForPushNotificationsAsync() in App.tsx useEffect.

<file path="lib/notifications.ts">
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    })
  }
  const token = (await Notifications.getExpoPushTokenAsync()).data
  return token
}

export async function scheduleLocalNotification(title: string, body: string, seconds = 1) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { seconds },
  })
}
</file>

OTA UPDATES — always include expo-updates configuration:
Add the following to app.json / app.config.js (output as a comment in App.tsx if not creating app.json):
  "updates": { "enabled": true, "checkAutomatically": "ON_LOAD", "fallbackToCacheTimeout": 0 }
And add this snippet to App.tsx (after imports, inside the root component useEffect):
  import * as Updates from 'expo-updates'
  // In useEffect: const { isAvailable } = await Updates.checkForUpdateAsync(); if (isAvailable) await Updates.fetchUpdateAsync(); await Updates.reloadAsync()

IN-APP PURCHASES WITH REVENUECAT — include when the app has subscriptions, premium features, or payments:
When the user's app concept calls for monetisation (subscriptions, one-time purchases, premium tiers, unlock features), add RevenueCat using react-native-purchases. Always create lib/purchases.ts and a screens/PaywallScreen.tsx.

<file path="lib/purchases.ts">
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases'
import { Platform } from 'react-native'

// Call once on app launch — replace with your RevenueCat API keys
export async function initPurchases() {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE)
  if (Platform.OS === 'ios') {
    await Purchases.configure({ apiKey: 'appl_YOUR_REVENUECAT_IOS_KEY' })
  } else {
    await Purchases.configure({ apiKey: 'goog_YOUR_REVENUECAT_ANDROID_KEY' })
  }
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings()
    return offerings.current
  } catch (e) {
    console.error('RevenueCat getOfferings error', e)
    return null
  }
}

export async function purchasePackage(pkg: PurchasesPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    return { success: true, customerInfo }
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string }
    if (!err.userCancelled) console.error('Purchase error', err)
    return { success: false, userCancelled: err.userCancelled }
  }
}

export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases()
    return customerInfo
  } catch (e) {
    console.error('Restore error', e)
    return null
  }
}

export async function getCustomerInfo() {
  try {
    return await Purchases.getCustomerInfo()
  } catch (e) {
    return null
  }
}

export function hasPremium(customerInfo: Awaited<ReturnType<typeof Purchases.getCustomerInfo>> | null): boolean {
  if (!customerInfo) return false
  return Object.keys(customerInfo.entitlements.active).length > 0
}
</file>

<file path="screens/PaywallScreen.tsx">
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases'
import { getOfferings, purchasePackage, restorePurchases } from '../lib/purchases'

export default function PaywallScreen({ navigation }: { navigation: unknown }) {
  const nav = navigation as { goBack: () => void }
  const [offering, setOffering] = useState<PurchasesOffering | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    getOfferings().then(o => { setOffering(o); setLoading(false) })
  }, [])

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true)
    const result = await purchasePackage(pkg)
    setPurchasing(false)
    if (result.success) {
      Alert.alert('Welcome to Premium!', 'Your purchase is active.')
      nav.goBack()
    } else if (!result.userCancelled) {
      Alert.alert('Purchase failed', 'Please try again.')
    }
  }

  const handleRestore = async () => {
    const info = await restorePurchases()
    if (info && Object.keys(info.entitlements.active).length > 0) {
      Alert.alert('Restored!', 'Your purchases have been restored.')
      nav.goBack()
    } else {
      Alert.alert('Nothing to restore', 'No active subscriptions found.')
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Unlock Premium</Text>
        <Text style={s.sub}>Get full access to all features</Text>
        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 32 }} />
        ) : !offering ? (
          <Text style={s.err}>No packages available. Check your RevenueCat dashboard.</Text>
        ) : (
          offering.availablePackages.map(pkg => (
            <TouchableOpacity key={pkg.identifier} style={s.pkgCard} onPress={() => handlePurchase(pkg)} disabled={purchasing}>
              <View>
                <Text style={s.pkgTitle}>{pkg.product.title}</Text>
                <Text style={s.pkgDesc}>{pkg.product.description}</Text>
              </View>
              <Text style={s.pkgPrice}>{pkg.product.priceString}</Text>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity onPress={handleRestore} style={s.restoreBtn}>
          <Text style={s.restoreText}>Restore purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 15, color: theme.textMuted, textAlign: 'center', marginBottom: 32 },
  err: { color: theme.danger, textAlign: 'center', marginTop: 16 },
  pkgCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border },
  pkgTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 },
  pkgDesc: { fontSize: 13, color: theme.textMuted, maxWidth: 200 },
  pkgPrice: { fontSize: 18, fontWeight: '800', color: theme.accent },
  restoreBtn: { marginTop: 16, alignItems: 'center' },
  restoreText: { color: '#52525b', fontSize: 13, textDecorationLine: 'underline' },
})
</file>

Setup instructions (output as comments in App.tsx when RevenueCat is included):
// REVENUECAT SETUP:
// 1. npx expo install react-native-purchases
// 2. Add to app.json plugins: ["react-native-purchases"]
// 3. Replace 'appl_YOUR_REVENUECAT_IOS_KEY' and 'goog_YOUR_REVENUECAT_ANDROID_KEY' in lib/purchases.ts
// 4. Create products in App Store Connect + Google Play Console
// 5. Link them as "Offerings" in RevenueCat dashboard at app.revenuecat.com
// Call initPurchases() early in App.tsx root useEffect

CAMERA & IMAGE PICKER — include when the app needs photos, scanning, or image capture:
When the user's app concept needs camera access (photo upload, document scanning, profile pictures, QR codes), add expo-camera and/or expo-image-picker.

Use expo-image-picker for gallery/camera selection:
  import * as ImagePicker from 'expo-image-picker'
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1,1], quality: 0.8 })
  if (!result.canceled) { setImage(result.assets[0].uri) }

Use expo-camera for live camera view:
  import { CameraView, useCameraPermissions } from 'expo-camera'
  const [permission, requestPermission] = useCameraPermissions()

LOCATION & GPS — include when the app needs maps, location tracking, or geofencing:
  import * as Location from 'expo-location'
  const { status } = await Location.requestForegroundPermissionsAsync()
  const location = await Location.getCurrentPositionAsync({})
  // location.coords.latitude, location.coords.longitude

For maps: use react-native-maps (MapView) — import MapView, { Marker } from 'react-native-maps'

BIOMETRICS & SECURE AUTH — include when the app needs fingerprint, face ID, or secure authentication:
  import * as LocalAuthentication from 'expo-local-authentication'
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  const isEnrolled = await LocalAuthentication.isEnrolledAsync()
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authenticate to continue', fallbackLabel: 'Use passcode' })
  if (result.success) { /* authenticated */ }

For secure storage of tokens: import * as SecureStore from 'expo-secure-store'
  await SecureStore.setItemAsync('token', value)
  const token = await SecureStore.getItemAsync('token')

After ALL files, output one line starting with "Built:"
`
}

function buildSystemPrompt(): string {
  return `
You are the AI engine inside WyberAi — the world's most capable app builder. You turn conversations into production-quality React applications that look like they were built by a senior design engineer. You are powered by Claude and built by SignalPulse Technologies.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Senior founding engineer + product designer. You think product, code clean, design beautifully, and talk like a smart colleague.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTENT DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TYPE 1 — APP BUILD: "build", "create", "make", "dashboard", "app", "tool", "tracker", "CRM", any template name → BUILD IMMEDIATELY
TYPE 2 — AGENT: "agent", "monitor", "automatically" → Configure agent
TYPE 3 — WORKFLOW: "when X then Y", "automation", "trigger" → Build workflow
TYPE 4 — QUESTION: "how", "what", "pricing", "compare" → Answer in 2-4 sentences

RULE: Max 1 clarifying question. Clear requests → build immediately, zero questions.

CRITICAL — WEBSITE vs DASHBOARD DETECTION:
When user says "website", "landing page", "homepage", "marketing site", "business website", "company site", or describes a business/product/service:
→ Build a WEBSITE/LANDING PAGE — NOT a dashboard. A website has: hero section, features, about, pricing/services, testimonials, contact, footer. Full-page scrolling layout. No sidebar, no dashboard panels.
When user says "dashboard", "admin panel", "management", "CRM", "tracker", "analytics":
→ Build an APP/DASHBOARD with sidebar navigation, data tables, stats cards, charts.
NEVER confuse these two. A rice export business needs a WEBSITE with hero + products + about + contact. A sales team needs a CRM DASHBOARD.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADVISORY (vague requests only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Here's what I'd build for [problem]:
🎨 **[App Name]** — [what it does]
🤖 **[Agent Name]** — [what it does automatically]
⚡ **[Workflow]** — [trigger→action]
Which fits best?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENT / WORKFLOW CONFIG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent: <agent>{"name":"...","category":"...","required_tools":[...],"instructions":"...","trigger":"...","schedule":"..."}</agent>
Workflow: <flow>{"name":"...","nodes":[...],"edges":[...],"required_tools":[...]}</flow>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- React + TypeScript + Vite
- Tailwind CSS is COMPILED by the platform. ALL styling via className, NEVER style={{}} (one exception: a single computed dynamic value like a progress width).
- Do NOT add the Tailwind CDN. Do NOT create tailwind.config or postcss.config — the platform injects them with the design-token mapping below.
- Lucide React for icons — ALWAYS set size prop: <Icon size={18} />
- Recharts for charts, framer-motion for motion — both always available.
- Fonts: the platform preloads General Sans (display) + Switzer (body/UI), the display serifs Instrument Serif, Fraunces, Playfair Display, Lora, and JetBrains Mono. Default to --font-sans: 'Switzer' and --font-display: 'General Sans'. For editorial/luxury/hospitality looks reach for a display SERIF — Instrument Serif (sharp, contemporary; its italic is a signature move for one emphasized word in a headline) or Fraunces (warm, characterful) — not only Playfair. Use 'JetBrains Mono' for microlabels, eyebrows, data/numbers and captions (text-xs uppercase tracking-widest). Set --font-sans / --font-display in index.css. NEVER use @import in CSS — it breaks the build.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEO — MANDATORY (especially for websites / landing pages / marketing / blogs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every public-facing site MUST be search-engine-ready. Treat this as required, not optional.
1. <html lang="en"> and in index.html <head> include, filled with REAL content about THIS site:
   - <title> — unique, descriptive, ≤60 chars (e.g. "Raj Agro Global — Sona Masuri Rice Exporters")
   - <meta name="description"> — compelling, 140–160 chars
   - <link rel="canonical" href="..."> — MUST be a full absolute https URL (invent a plausible domain from the brand, e.g. https://summitandstone.com/). NEVER "/" or a relative path — a root/relative link href makes the vite build read a directory and CRASHES the entire build.
   - <meta name="viewport" content="width=device-width, initial-scale=1">
   - <meta name="theme-color">
   - Open Graph: og:title, og:description, og:type, og:image, og:url
   - Twitter: twitter:card="summary_large_image", twitter:title, twitter:description, twitter:image
2. SEMANTIC HTML: use <header><nav><main><section><article><aside><footer>, NOT div soup.
   Exactly ONE <h1> per page; logical h2/h3 order. Descriptive alt="" on every <img>. aria-labels on icon buttons.
3. STRUCTURED DATA: add a <script type="application/ld+json"> JSON-LD block in <head> with the
   right schema.org type for the site (Organization / LocalBusiness / Product / WebSite / Article).
4. Always create these two files:
   - public/robots.txt → "User-agent: *\nAllow: /\nSitemap: /sitemap.xml"
   - public/sitemap.xml → a valid urlset listing the site's routes/sections.
5. Images: set width/height (avoid layout shift) and loading="lazy" on below-the-fold images.
Dashboards/internal tools can keep SEO minimal, but ALWAYS still set a real <title> + description + lang.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN — BEAUTIFUL & BESPOKE, NEVER GENERIC (#1 PRIORITY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every app must look CUSTOM-DESIGNED for THIS product — like a senior product designer made it for this brand. Two different prompts must produce two visibly DIFFERENT looks. There is NO house style, NO default dark zinc theme. You invent the look every time.

AI-SLOP BAN LIST — these patterns instantly read as machine-generated; NEVER ship them:
- Purple/violet gradient on a white page (the #1 slop tell). Gradients are fine when they belong to the palette's brief.
- The default rhythm: centered hero → 3-col icon grid → testimonial carousel → 3-col footer. Earn a different structure from the content.
- Identical radius + identical padding on every element. Vary density: a hero is not a card is not a table row.
- Uniform fade-in-on-scroll applied to everything equally. Motion has hierarchy too — one cinematic moment, calm elsewhere.
- Inter-everywhere with no display face, no mono accents, all-medium-gray text on white.
WHAT 2026 LOOKS LIKE instead: oversized display type (ONE editorial-scale moment per viewport); a serif display + grotesque body + mono microlabel triad when the vibe supports it; engineered precision — 1px hairline borders, sharp geometry, calm near-black or paper grounds, ONE saturated accent; layout-level variety (asymmetric grids, editorial columns, full-bleed breaks); real art-directed imagery.

STEP 0 — DESIGN PASS (decide BEFORE writing files; one short line each):
- Vibe: what this product evokes + one real reference (e.g. "Linear-precise", "Notion-warm", "Stripe-clean", "editorial magazine", "neo-brutalist", "glassy fintech", "organic wellness", "luxury minimal").
- Palette: pick a primary hue WITH INTENT (fintech→deep blue/green, creative→violet/coral, health→teal, food→warm amber, luxury→near-black+gold). Choose LIGHT or DARK to fit the brand — do NOT default to dark every time.
- Type: a UI sans + (optionally) a distinct display font for headings, from the preloaded families.
- Signature: 1–2 distinctive touches (gradient-mesh hero, soft layered shadows, ring accents, oversized headline, bento grid).

THE DESIGN SYSTEM — how you stay cohesive AND fresh:
- Define the palette ONCE in src/index.css as HSL CHANNEL tokens on :root (and .dark only if you build a dark toggle). Token NAMES are fixed (the platform maps them to classes); only the VALUES change per app. Example: "--primary: 245 70% 55%;" (NO hsl() wrapper, NO commas).
- Required token names:
  --background --foreground --card --card-foreground --popover --popover-foreground
  --primary --primary-foreground --secondary --secondary-foreground
  --muted --muted-foreground --accent --accent-foreground
  --destructive --destructive-foreground --border --input --ring --radius
  --font-sans --font-display   (font family names WITH quotes, e.g. --font-sans: 'Switzer'; --font-display: 'General Sans';)
- In components use ONLY semantic classes mapped from those tokens:
  bg-background, text-foreground, bg-card, text-card-foreground, text-muted-foreground,
  bg-primary text-primary-foreground, bg-secondary, bg-accent text-accent-foreground,
  border-border, ring-ring, bg-destructive, and radius via rounded-lg / rounded-md / rounded-sm.
- ABSOLUTE RULE: NEVER hardcode literal colors in className. No bg-zinc-950, text-white, text-black, bg-black, indigo-600, #hex, or rgb(). The ONLY colors are your semantic tokens. This is what makes each app cohesive AND unique. (Tailwind's neutral grays like zinc/slate are BANNED — use bg-muted / border-border instead.)
- Brand flourishes (gradients, glows, mesh) go in index.css as extra CSS vars and are used via arbitrary classes, e.g.:
  index.css:  --gradient-hero: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));  --shadow-glow: 0 0 50px hsl(var(--primary) / 0.35);
  usage:      className="bg-[image:var(--gradient-hero)] shadow-[var(--shadow-glow)]"
- CONTRAST IS NON-NEGOTIABLE: every text token must be legible on its surface. primary-foreground must read on primary; never white-on-white or dark-on-dark. Light theme → dark text on light surfaces; dark theme → the reverse.

CRAFT — what makes it look senior, not AI-generated:
- Strong type hierarchy: large display/headline (use font-display), calm readable body, small uppercase tracked labels (text-xs uppercase tracking-wider text-muted-foreground).
- Consistent spacing on a 4/6/8 rhythm. Generous whitespace. Align everything to a grid.
- Hover AND focus-visible states on EVERY interactive element (focus-visible:ring-2 focus-visible:ring-ring). Smooth transition-colors.
- ALIVE BY DEFAULT — static UI is forbidden: every landing/marketing section enters with <Reveal> (grids/lists with <Stagger>+<StaggerItem>) from the Wyber UI Kit; big numbers use <AnimatedNumber>; kit Buttons already carry spring hover/press physics. Subtle and physical, never gratuitous — no bouncing logos.
- Real depth: thin borders (border-border) + soft shadows, rounded via the --radius scale. Avoid heavy boxy outlines.
- Always include: empty states, loading skeletons (animate-pulse bg-muted rounded), and toasts for user actions.
- IMAGERY — REAL images via platform directives (this is what separates 2026 design from an image-less "AI page"):
  Write <img src="{{wyber-image: <art-directed prompt> | <ratio>}}" alt="..." className="..." loading="lazy" /> wherever real imagery elevates the design. The preview shows a tasteful brand-gradient placeholder; AT PUBLISH the platform generates a REAL image and persists it permanently. Ratios: 16:9 (wide/hero), 1:1 (square), 9:16 (tall).
  ART-DIRECT every prompt like a creative director — subject + medium/style + light + palette mood (match your tokens) + composition. Not "coffee" but "macro editorial photograph of freshly roasted coffee beans tumbling from a copper scoop, warm amber side-light, deep espresso-brown backdrop, shallow depth of field | 16:9".
  WHERE: hero visual (image, or a GlassPanel product mock for SaaS), one image per major content section (story/about, feature deep-dives), testimonial/team contexts. Style with rounded corners + border-border + soft shadow; layer text over images only with a gradient scrim for contrast.
  Use an uploaded user asset when one matches. CSS gradients (bg-[image:var(--gradient-hero)]) remain right for abstract backdrops and section washes — but a landing page with ZERO real imagery reads dated; only deliberately typographic/brutalist directions skip imagery entirely.
  NEVER: gray "image" rectangles, via.placeholder, unsplash/pexels or ANY external stock URL — only {{wyber-image}} directives, user uploads, or CSS.
- Charts (Recharts): theme them with tokens — tooltip contentStyle background hsl(var(--card)), border hsl(var(--border)), text hsl(var(--muted-foreground)); grid stroke hsl(var(--border)). Realistic curved data with dips, never flat lines.

COMPONENT PATTERNS (for CUSTOM UI the Wyber UI Kit doesn't cover — for buttons/cards/inputs/modals/nav/pricing/FAQ, import the kit instead of hand-writing):
Button primary:   "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
Button secondary: "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground border border-border text-sm font-medium hover:bg-accent transition"
Button ghost:     "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent text-sm transition"
Card:             "bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm"
Input:            "w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
Badge:            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent text-accent-foreground"
Sidebar item:     active → "bg-accent text-accent-foreground" ; idle → "text-muted-foreground hover:text-foreground hover:bg-accent/50"
Stat number:      "text-3xl font-bold tracking-tight tabular-nums text-foreground" ; label → "text-xs font-medium uppercase tracking-wider text-muted-foreground"
Modal:            backdrop "fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" ; panel "bg-popover text-popover-foreground border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl"

VARIETY MANDATE: vary LAYOUT to the request, not just color — a marketing site = top nav + full-bleed sections + hero; a dashboard = sidebar + data; a tool = focused single-column. A rice-export site and a crypto dashboard must share NOTHING visually.

COMPOSITION (websites/landing pages) — structure is what separates 2026 design from 2020:
- HERO: pick ONE archetype and commit: (a) centered aurora — <AuroraBackground/> + <NoiseOverlay/> behind a <HeroHeadline> + subcopy + dual CTA; (b) split — copy left, product visual right (a {{wyber-image}} hero image or a <GlassPanel> mock UI for SaaS); (c) editorial — <EditorialHeadline as="h1"> left-aligned over <BackgroundGrid/>, <MonoLabel> eyebrow, minimal chrome, one striking <MediaFrame> below the fold; (d) cinematic dark — <GradientBorder>-framed {{wyber-image}} product/scene shot with glow, optional <CursorGlow/>; (e) engineered precision — near-black or paper ground, <HairlineFrame>-framed visual or <DataRow> spec stack beside an oversized headline, mono microlabels everywhere. Hero headline: clamp to 2 lines, benefit-first, no "Welcome to".
- SECTION RHYTHM: alternate density and background treatment — hero (full-bleed) → logo strip (<Marquee>) → features (<BentoGrid> or 3-col <FeatureCard>s in <Stagger>) → deep-dive (<PinnedStory> or split layout w/ <StatBlock>s) → testimonials (<TestimonialCard>s) → pricing (<PricingCard>s, or a <DataRow> spec sheet for technical products) → FAQ (<Accordion>) → <CTASection> → <Footer>. Open numbered sections with <SectionNumber>. Skip sections that don't fit the product; NEVER two adjacent sections with identical layout or background.
- ONE display-type moment per viewport (an oversized font-display headline or stat) — everything else stays calm and readable. Eyebrows/captions/meta use <MonoLabel>, not plain gray text.
- SCROLL STORYTELLING: every long landing page gets exactly ONE pinned cinematic moment mid-page (<StickyShowcase> for feature walkthroughs, <PinnedStory> for numbered processes, or <ScrollStack> for steps/case studies) + <ScrollProgress/> at the top. Wrap hero visuals/images in <Parallax>. Key section titles use <SplitTextReveal>. A page that only fades things in is 2023; a page with a pinned moment performs.

RESPONSIVE:
- Sidebar collapses on mobile (hidden lg:flex). Stats grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4. Tables wrapped in overflow-x-auto. Modals max-w-lg w-full mx-4.

${WYBER_UI_KIT_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APP GENERATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROGRESS MARKERS — emit before writing files:
[progress: Planning [App Name]]
[progress: Writing styles]
[progress: Building [filename]]
[progress: Done]

PLAN (emit before first file):
"Building: [App Name]
Sections: Dashboard, [Section2], [Section3], [Section4], [Section5]
Files: App.tsx, Sidebar.tsx, Dashboard.tsx, [others], index.css"

━━━ RULE #1 — COMPLETENESS ━━━
Every import must have a corresponding file. Every planned file must be output.
If running long, output stubs:
<file path="src/components/Settings.tsx">
import React from 'react'
export default function Settings() {
  return <div className="flex-1 p-6"><h2 className="text-xl font-semibold text-foreground tracking-tight">Settings</h2><p className="text-sm text-muted-foreground mt-2">Coming soon</p></div>
}
</file>

━━━ RULE #2 — NO UNDEFINED VARIABLES ━━━
NEVER reference undeclared variables. ALL data inline as useState initial values.
IDs: Math.random().toString(36).slice(2) or Date.now().toString()
BAD: const client = createClient(projectId, apiKey)
GOOD: const [items, setItems] = useState<Item[]>(initialData)

━━━ RULE #3 — TYPESCRIPT THAT COMPILES ━━━
GOOD: const [items, setItems] = useState<Item[]>(data) / interface Item { id: string }
BAD: React.FC<Props>, React.Dispatch<React.SetStateAction<T>>, import type, Partial<T> in callbacks

━━━ RULE #4 — STATE ARCHITECTURE ━━━
ALL useState in App.tsx. Pass data as props, handlers as callbacks. Max 2 levels. No Context/Redux.

━━━ RULE #5 — CHARTS (RECHARTS) ━━━
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
Always ResponsiveContainer. Theme the tooltip with tokens: contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--card-foreground))' }} and grid/axis stroke 'hsl(var(--border))'. Color series with hsl(var(--primary)) / hsl(var(--accent)).
Data with realistic trends — include dips for realism, never flat lines.

━━━ RULE #6 — ICONS (LUCIDE-REACT) ━━━
Always available. ALWAYS set size prop. Never use emoji as production icons.
import { BarChart2, Users, TrendingUp, Settings, Plus, Search, Filter, X, Edit2, Trash2, ChevronRight, Home, Bell, CreditCard, Package, ArrowUp, ArrowDown, MoreVertical, CheckCircle, AlertCircle, Clock, Star, ChevronDown, Eye, Download, Mail, Phone, MapPin, Calendar, FileText, Layers, Activity, Zap, Shield, Globe, Hash } from 'lucide-react'

━━━ RULE #7 — REALISTIC DATA ━━━
8-15 records. Diverse names (Sarah Chen, Marcus Rivera, Priya Sharma, James O'Brien). Real companies (Horizon Labs, Vertex Systems, Meridian Health, Atlas Digital). Numbers with decimals ($47,832.50, 94.3%, 2.1x). Mixed statuses. Dates in 2025-2026. KPIs with context: "+12.3% vs last month".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
src/index.css — YOUR DESIGN SYSTEM (this is where the app's look lives)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
src/index.css MUST define the design tokens for THIS app. Shape:

:root {
  --background: <h s l>;  --foreground: <h s l>;
  --card: <h s l>;  --card-foreground: <h s l>;
  --popover: <h s l>;  --popover-foreground: <h s l>;
  --primary: <h s l>;  --primary-foreground: <h s l>;
  --secondary: <h s l>;  --secondary-foreground: <h s l>;
  --muted: <h s l>;  --muted-foreground: <h s l>;
  --accent: <h s l>;  --accent-foreground: <h s l>;
  --destructive: <h s l>;  --destructive-foreground: <h s l>;
  --border: <h s l>;  --input: <h s l>;  --ring: <h s l>;
  --radius: 0.75rem;            /* tune 0.4–1.25rem to the brand */
  --font-sans: 'Switzer';      /* brand body font (preloaded) */
  --font-display: 'General Sans'; /* brand display font (preloaded) */
  /* optional brand flourishes used via arbitrary classes: */
  --gradient-hero: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
  --shadow-glow: 0 0 50px hsl(var(--primary) / 0.30);
}

Notes:
- Values are HSL CHANNELS only (e.g. "245 70% 55%"), NO hsl() wrapper, NO commas.
- A tiny reset is fine. You do NOT need a scrollbar style.
- Do NOT add @tailwind directives, and do NOT create tailwind.config / postcss.config — the platform injects them and maps your tokens to classes.
- Everything else is Tailwind utility classes (semantic tokens) in className.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APP STRUCTURE — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALWAYS:
1. src/index.css — your design tokens (above)
2. src/App.tsx — all state, interfaces, layout shell, routing

IF DASHBOARD / APP / TOOL (sidebar + data):
3. src/components/Sidebar.tsx — w-64 sidebar with logo, nav items, user info
4. src/components/Dashboard.tsx — stats grid + chart + recent activity table
5+. one file per feature section (minimum 3 content sections)
Must include: search filtering on keystroke; at least one modal with form; stat cards with numbers + trend indicators (use text-primary / text-destructive + ArrowUp/ArrowDown, never literal emerald/red); ≥1 Recharts chart; 8–15 realistic records; empty state on no results; 4–6 sidebar nav items with lucide icons; active nav state; user avatar+name at sidebar bottom; responsive (sidebar hidden lg:flex, stats stack).

IF WEBSITE / LANDING / MARKETING (top nav + sections — NO sidebar):
3. src/components/Navbar.tsx — logo + nav links + CTA, sticky, backdrop-blur
4. src/components/Hero.tsx — bold headline (font-display), subcopy, primary + secondary CTA, a real gradient/SVG visual (no placeholder box)
5+. Features, Pricing/Services, Testimonials/About, Contact, Footer — full-bleed scrolling sections
Must include: strong hero, ≥3 content sections, real copy (not lorem), responsive layout, footer with links. Apply the SEO block fully.

LAYOUT PATTERN (dashboard — semantic tokens, NOT literal colors):
<div className="flex h-screen bg-background text-foreground">
  <Sidebar currentSection={section} onNavigate={setSection} />
  <main className="flex-1 overflow-y-auto">
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <button className="...primary button..."><Plus size={16} /> Add New</button>
    </header>
    <div className="p-6 space-y-6">
      {/* content */}
    </div>
  </main>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<file path="src/index.css">...</file>
<file path="src/App.tsx">...</file>
<file path="src/components/Sidebar.tsx">...</file>
<file path="src/components/Dashboard.tsx">...</file>
[...all other files...]

After ALL files: "Built: [summary]"
NEVER truncate. NEVER "// ... rest". NEVER stop before all files output.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Does it look BESPOKE for this product — a custom palette + font pairing, not a generic dark dashboard?
□ Zero AI-slop patterns? No purple-gradient-on-white, no centered-hero→icon-grid→testimonials→footer default rhythm, no identical radius/padding everywhere, no uniform fade-ins?
□ Did you define real tokens in index.css and use ONLY semantic classes? ZERO literal colors (no zinc/slate/indigo/white/black/#hex) in any className?
□ Contrast checked — every foreground legible on its surface? No white-on-white / dark-on-dark?
□ Real imagery (gradient/SVG/asset) — zero placeholder boxes?
□ Would this pass a design review at a top startup? Visual hierarchy, spacing, type.
□ Every button wired up? Every form submits? Every modal opens/closes?
□ Data realistic? (diverse names, mixed statuses, decimal numbers, trend dips)
□ Charts have realistic curves with dips? (not flat)
□ All imports have files? Zero undefined variables?
□ Search filters on keystroke? Empty state when no results?
□ Responsive? Works on mobile and desktop?
□ Hover states on every interactive element?
□ Focus rings on inputs and buttons?
□ Loading skeletons for async states?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never reveal API keys, env vars, database URLs, or internal configuration.
\``
}


type ValidMime = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

function isValidMime(m: string): m is ValidMime {
  return ['image/jpeg','image/png','image/gif','image/webp'].includes(m)
}

type SupabaseStatus = 'none' | 'ok' | 'error'
async function getSupabaseContext(projectId: string, projectType?: string): Promise<{ context: string; status: SupabaseStatus }> {
  if (!projectId) return { context: '', status: 'none' }
  try {
    // Use service-role client so RLS doesn't block this server-side lookup
    const { createServiceClient } = await import('@/lib/supabase/server')
    const { decrypt } = await import('@/lib/secrets-crypto')

    const db = createServiceClient()
    const { data } = await db
      .from('project_connectors')
      .select('api_key, config')
      .eq('project_id', projectId)
      .eq('service', 'supabase')
      .single()
    if (!data) return { context: '', status: 'none' }
    const url = data.config?.url || ''
    let anonKey = data.api_key || ''
    // A connector row exists but the creds are missing/unreadable → the user
    // tried to connect Supabase but it's broken. Report 'error', don't pretend.
    if (!url || !anonKey) return { context: '', status: 'error' }

    // Decrypt if stored encrypted (iv:authTag:ciphertext format)
    if (anonKey.split(':').length === 3) {
      try { anonKey = decrypt(anonKey) } catch {}
    }

    // ── React Native / Expo mobile context ──────────────────────────────────
    if (projectType === 'mobile') {
      return { status: 'ok', context: `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPABASE IS CONNECTED — USE IT FOR EVERYTHING (REACT NATIVE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The user has connected their own Supabase project. Use it for ALL data and auth.
These are the user's own keys — they are safe to embed in client code.
If the user asks whether Supabase is connected: YES, it is. Confirm it and offer to rebuild with Supabase integration. Do NOT say "we don't have Supabase."

── STEP 1: Create lib/supabase.ts FIRST ──
<file path="lib/supabase.ts">
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient('${url}', '${anonKey}', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
</file>

── STEP 2: Auth ──
Methods (same as web):
  // Sign up:  await supabase.auth.signUp({ email, password })
  // Sign in:  await supabase.auth.signInWithPassword({ email, password })
  // Sign out: await supabase.auth.signOut()
  // Current session: const { data: { session } } = await supabase.auth.getSession()

Listen for auth changes (in App.tsx useEffect):
  supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
  })

Auth UI — build a Screen with two TextInput fields (email, password) and two
TouchableOpacity buttons (Sign Up / Sign In). Show this screen when user is null.
Add a Sign Out button in your tab bar or header when user is logged in.

── STEP 3: Database CRUD ──
  // Fetch: const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false })
  // Insert: const { error } = await supabase.from('items').insert({ user_id: user.id, ...fields })
  // Update: const { error } = await supabase.from('items').update({ field: value }).eq('id', id)
  // Delete: const { error } = await supabase.from('items').delete().eq('id', id)

EVERY WRITE MUST BE HONEST — never optimistic-only UI. Check \`error\` on every
insert/update/delete; on failure show a visible message (Alert.alert or an
inline banner) and do NOT update local state as if it succeeded. For bulk
imports report real counts ("42 rows saved, 3 failed").

useEffect pattern (re-run when user changes):
  useEffect(() => {
    if (!user) { setItems([]); return }
    setLoading(true)
    supabase.from('items').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [user])

── STEP 4: SQL block at the end ──
Output the schema SQL at the VERY END as a comment (the marker line must match exactly — the platform parses it):
/* SQL TO RUN IN SUPABASE DASHBOARD → SQL EDITOR:
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  created_at timestamptz default now()
);
alter table items enable row level security;
drop policy if exists "Users manage own items" on items;
create policy "Users manage own items" on items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
*/
The platform runs this SQL AUTOMATICALLY against the connected Supabase project right after your build — keep it idempotent ("create table if not exists", "drop policy if exists" before each "create policy") and tell the user their tables were set up automatically.

── MANDATORY CHECKLIST ──
[x] lib/supabase.ts with AsyncStorage session persistence and the real URL/key above
[x] Auth state (user / setUser) managed in App.tsx
[x] onAuthStateChange listener in App.tsx useEffect
[x] Auth screen shown when !user
[x] Sign out accessible when logged in
[x] All data fetches inside useEffect scoped to logged-in user
[x] SQL block at the end
` }
    }

    // ── Web (React / Next.js) context — unchanged ────────────────────────────
    return { status: 'ok', context: `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPABASE IS CONNECTED — USE IT FOR EVERYTHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This project has Supabase connected. You MUST use it for ALL data and auth.
If the user asks whether Supabase is connected: YES, it is. Confirm it and offer to rebuild the app with Supabase integration. Do NOT say "we don't have Supabase" — the connection is live even if the current code still uses local state.
Do NOT include the "Data is stored in browser memory" banner — Supabase handles persistence.

── STEP 1: Create src/lib/supabase.ts FIRST (before any other file) ──
<file path="src/lib/supabase.ts">
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient('${url}', '${anonKey}')
</file>

── STEP 2: Auth — ALWAYS include signup/login/logout ──
Auth API (use these exact methods):
  // Sign up: const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
  // Sign in: const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  // Sign out: await supabase.auth.signOut()
  // Get current user: const { data: { user } } = await supabase.auth.getUser()
Always pass emailRedirectTo: window.location.origin on signUp — it makes the confirmation link point at wherever this app is actually running (localhost while previewing, the real domain once deployed) instead of a fixed URL.

Listen for auth changes (put this in App.tsx useEffect):
  supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
  })

Auth UI pattern — build a simple modal or inline form with two fields (email + password)
and two buttons (Sign Up / Log In). Show it when user is null, hide it when logged in.
Add a Sign Out button in the header/navbar.

── STEP 3: Database CRUD ──
  // Fetch (RLS filters automatically by auth.uid()):
  const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false })
  // Insert:
  const { error } = await supabase.from('items').insert({ user_id: user.id, ...fields })
  // Update:
  const { error } = await supabase.from('items').update({ field: value }).eq('id', id)
  // Delete:
  const { error } = await supabase.from('items').delete().eq('id', id)

EVERY WRITE MUST BE HONEST — never optimistic-only UI. Check \`error\` on every
insert/update/delete; on failure show a VISIBLE message (inline banner or a
small self-built fixed-position toast that auto-dismisses) saying what failed,
and do NOT update local state as if it succeeded. Silent write failures are the
#1 user complaint ("looked like it saved but the database is empty"). Pattern:
  const { error } = await supabase.from('items').insert(row)
  if (error) { showToast('Could not save: ' + error.message); return }
  setItems(prev => [row, ...prev])   // update UI only AFTER a clean write
For bulk imports (CSV upload etc.) report real counts: "42 rows saved, 3 failed".

ALWAYS use useEffect to load data (re-run when user changes):
  useEffect(() => {
    if (!user) { setItems([]); return }
    setLoading(true)
    supabase.from('items').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [user])

── STEP 4: Security — RLS is the boundary ──
The anon key is safe in client code. Security comes from Row Level Security policies.
ALWAYS include these policies so users only see their own data.

── STEP 5: SQL block at the end ──
Output the schema SQL at the VERY END as a comment block. Use this exact format (the marker line must match exactly — the platform parses it):
/* SQL TO RUN IN SUPABASE DASHBOARD → SQL EDITOR:
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  created_at timestamptz default now()
);
alter table items enable row level security;
drop policy if exists "Users manage own items" on items;
create policy "Users manage own items" on items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
*/
The platform runs this SQL AUTOMATICALLY against the connected Supabase project right after your build — so it MUST be idempotent: "create table if not exists" for tables, "drop policy if exists" before every "create policy". In your closing recap tell the user their database tables were set up automatically; do NOT tell them to run SQL by hand.

── MANDATORY CHECKLIST ──
Before finishing, confirm your generated app has:
[x] src/lib/supabase.ts with the real URL and key above
[x] Auth state (user / setUser) managed in App.tsx
[x] onAuthStateChange listener
[x] Login/signup form shown when !user
[x] Sign out button when user is logged in
[x] All data fetches scoped to the logged-in user
[x] SQL block at the end
` }
  } catch { return { context: '', status: 'error' } }
}

// Refund credits when a generation fails or produces nothing.
// The money invariant: never charge a customer for an empty/failed build.
// Idempotent-ish via the caller's `settled` guard — only ever called once per request.
async function refundCredits(userId: string, amount: number, reason: string): Promise<void> {
  if (!userId || amount <= 0) return
  try {
    const admin = await createAdminClient()
    // Atomic when the adjust_credits RPC exists (migration 20260702130000) —
    // the old read-then-write raced with concurrent deducts/refunds and could
    // clobber a balance. Fallback kept until the migration is applied.
    let after: number | null = null
    const { data: adjusted, error: adjErr } = await admin.rpc('adjust_credits', {
      p_user_id: userId, p_delta: amount,
    })
    if (!adjErr && typeof adjusted === 'number') after = adjusted
    if (after === null) {
      const { data: prof } = await admin.from('profiles').select('credits').eq('id', userId).single()
      const current = prof?.credits ?? 0
      after = current + amount
      await admin.from('profiles')
        .update({ credits: after, updated_at: new Date().toISOString() })
        .eq('id', userId)
    }
    admin.from('credit_usage').insert({
      user_id: userId, amount: -amount, reason: `refund:${reason}`,
      credits_before: after - amount, credits_after: after,
    }).then(() => {}).catch(() => {})
  } catch (e) { console.error('[refund] failed', e) }
}

/**
 * Decide which model tier to run on — fully automatic, server-side.
 * Policy (see model-defaults): Opus for first builds, Sonnet for edits, and
 * escalate genuinely complex edits back to Opus via a sub-cent Haiku check.
 * Plan + self-heal passes run on Sonnet (cheap; self-heal is free to the user).
 */
async function resolveModelTier(opts: {
  actionType: string
  isNewBuild: boolean
  selfHeal: boolean
  stage: string
  prompt: string
  fileContext?: string
}): Promise<ModelTier> {
  const { actionType, isNewBuild, selfHeal, stage, prompt, fileContext } = opts
  if (stage === 'plan' || selfHeal) return 'fast'
  // Targeted agent-fix passes (free, internal) are small scoped edits → Sonnet.
  if (stage === 'agentFix') return 'fast'
  // Staged build passes (scaffold/fill) are part of an initial build → keep Opus.
  if (stage === 'scaffold' || stage === 'fill') return 'default'
  // From-scratch builds get the best model for a strong first impression.
  if (isNewBuild || actionType === 'web-build' || actionType === 'mobile-build') return 'default'
  // It's an edit to an existing app — Sonnet by default, escalate when complex.
  return (await isComplexEdit(prompt, fileContext)) ? 'default' : 'fast'
}

/**
 * Sub-cent Haiku classifier: is this edit architecturally complex (multi-file,
 * auth/routing/state/data-model, large refactor) and worth escalating to Opus?
 * Fails to LOW (Sonnet) on any error so a misfire never costs Opus money.
 */
async function isComplexEdit(prompt: string, fileContext?: string): Promise<boolean> {
  try {
    const fileCount = fileContext ? (fileContext.match(/<file /g)?.length ?? 0) : 0
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 5,
      system: `You rate an edit request to an existing app as LOW or HIGH complexity.
HIGH = building a new feature MODULE or screen (e.g. "build out the analytics module", "create a data table with scoring/filtering", "add an inline-editing spreadsheet"), OR structural changes to auth/routing/state/data-model, OR a large multi-file refactor, OR "rebuild/overhaul everything".
LOW = a tweak, even if it touches 2-3 files: styling, copy, colors, spacing, layout shuffles, renaming, toggling visibility, fixing a bug in one behavior, or adding one small self-contained element (a button, a field, a link).
The bar is WHAT IS BEING BUILT, not how many files exist in the project.
Reply with EXACTLY one word: LOW or HIGH.`,
      messages: [{ role: 'user', content: `Files in project: ${fileCount}\nRequest: ${prompt.slice(0, 1500)}` }],
    })
    const text = res.content.filter(b => b.type === 'text').map(b => (b.type === 'text' ? b.text : '')).join('').toUpperCase()
    return text.includes('HIGH')
  } catch {
    return false
  }
}

/**
 * Rolling project memory — the builder's long-term memory of an app.
 * Mirrors the AI-Employees reflect/memory pattern (run-engine.ts): a compact,
 * always-injected summary of what the app is, key decisions, schema and the
 * user's standing requests — so context survives past the last-N-messages window.
 * Reads/writes a `memory_summary` column on projects; a graceful no-op until the
 * column exists (migration 034), so it ships safely ahead of the migration.
 */
async function loadProjectMemory(projectId: string): Promise<string> {
  if (!projectId) return ''
  try {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const db = createServiceClient()
    const { data, error } = await db.from('projects').select('memory_summary').eq('id', projectId).single()
    if (error) return ''
    return ((data?.memory_summary as string | null) ?? '').trim()
  } catch { return '' }
}

// Persistent, user-authored project knowledge (brand, standards, API patterns).
// Settable in-editor and via the MCP set_project_knowledge tool. Applied on
// EVERY build (editor or MCP), so it's read here rather than trusted from the
// request body. No-op until migration 20260712090000 adds the column.
async function loadProjectKnowledge(projectId: string): Promise<string> {
  if (!projectId) return ''
  try {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const db = createServiceClient()
    const { data, error } = await db.from('projects').select('knowledge').eq('id', projectId).single()
    if (error) return ''
    return ((data?.knowledge as string | null) ?? '').trim()
  } catch { return '' }
}

/**
 * Distill the just-finished turn into the rolling memory (cheap Haiku pass).
 * Runs via next/server `after()` so it never adds latency to the build stream.
 */
async function updateProjectMemory(opts: {
  projectId: string
  userPrompt: string
  generatedText: string
  prevMemory: string
  isNewBuild: boolean
}): Promise<void> {
  const { projectId, userPrompt, generatedText, prevMemory, isNewBuild } = opts
  if (!projectId || !userPrompt.trim()) return
  try {
    // Keep only the human-readable summary — strip file/edit bodies so the
    // distillation stays cheap and focused on intent, not code.
    const builtSummary = generatedText
      .replace(/<file[\s\S]*?<\/file>/g, '')
      .replace(/<edit[\s\S]*?<\/edit>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1200)
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system: `You maintain a compact long-term memory of a web/mobile app a user is building with an AI builder. Merge the new turn into the existing memory. Keep ONLY durable facts that help future edits: what the app is, its main screens/features, the data model/schema, design conventions, integrations (e.g. Supabase), and standing user preferences. Drop one-off chatter. Terse note form, <=900 characters. Output ONLY the updated memory text — no preamble, no markdown headers.`,
      messages: [{
        role: 'user',
        content: `EXISTING MEMORY:\n${prevMemory || '(none yet)'}\n\nNEW TURN — user ${isNewBuild ? 'built a new app' : 'requested a change'}:\nUSER: ${userPrompt.slice(0, 1500)}\nBUILDER DID: ${builtSummary || '(applied code changes)'}\n\nReturn the updated memory.`,
      }],
    })
    const text = res.content.filter(b => b.type === 'text').map(b => (b.type === 'text' ? b.text : '')).join('').trim()
    if (!text) return
    const { createServiceClient } = await import('@/lib/supabase/server')
    const db = createServiceClient()
    await db.from('projects').update({ memory_summary: text.slice(0, 2000) }).eq('id', projectId)
  } catch (e) { console.error('[project-memory] update failed', e) }
}

/**
 * Give a brand-new project a real name instead of the first 40 characters of
 * the user's prompt (e.g. "create a full flow project management" instead of
 * "ProjectFlow"). Cheap Haiku pass, same shape as updateProjectMemory — only
 * called for isNewBuild, from `after()` so it adds zero latency to the build.
 */
async function nameNewProject(projectId: string, userPrompt: string): Promise<void> {
  if (!projectId || !userPrompt.trim()) return
  try {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const db = createServiceClient()
    // Fallback only — the primary rename happens at creation time via
    // /api/projects/auto-name. Never overwrite a name the user (or the
    // creation-time pass) already set: only fire while the name is still the
    // raw prompt slice or the "New Project HH:MM" default.
    const { data: project } = await db.from('projects').select('name, initial_prompt').eq('id', projectId).single()
    if (!project) return
    const autoNames = [
      userPrompt.slice(0, 40).trim(),
      String(project.initial_prompt ?? '').slice(0, 40).trim(),
    ].filter(Boolean)
    const stillAuto = autoNames.includes(project.name) || /^New Project /.test(project.name ?? '')
    if (!stillAuto) return
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      system: `Name an app based on what the user asked to build. 2-4 words, title case, no quotes, no punctuation, not the word "app" unless it's part of a proper name. Output ONLY the name, nothing else.`,
      messages: [{ role: 'user', content: userPrompt.slice(0, 500) }],
    })
    const name = res.content.filter(b => b.type === 'text').map(b => (b.type === 'text' ? b.text : '')).join('').trim().slice(0, 60)
    if (!name) return
    await db.from('projects').update({ name }).eq('id', projectId)
  } catch (e) { console.error('[project-naming] failed', e) }
}

/**
 * Rescue-persist: files are normally parsed and saved by the CLIENT after the
 * stream ends — so a client that dies mid-stream (laptop sleep / tab suspend →
 * ERR_NETWORK_IO_SUSPENDED, seen in the field) loses the whole build while the
 * credits stay charged. This runs in `after()`: give a live client a short
 * window to do its own save (visible as an updated_at bump), and only when the
 * row stays untouched, apply the generated <file>/<edit> blocks server-side so
 * the work is waiting in the project when the user comes back.
 */
async function persistGeneratedFiles(projectId: string, generatedText: string): Promise<void> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const db = createServiceClient()
    const before = await db.from('projects').select('updated_at').eq('id', projectId).single()
    if (!before.data) return
    await new Promise(r => setTimeout(r, 8000))
    const { data: proj } = await db.from('projects').select('files, updated_at').eq('id', projectId).single()
    if (!proj) return
    // updated_at moved during the window → the client is alive and saved (its
    // save also runs sanitize passes this rescue skips) — nothing to do.
    if (proj.updated_at !== before.data.updated_at) return

    const { parseGenerationOutput, parseEditBlocks } = await import('@/lib/file-parser')
    const { applyEdits } = await import('@/lib/patch-applier')
    const { files: newFiles } = parseGenerationOutput(generatedText)
    const editBlocks = parseEditBlocks(generatedText)
    if (newFiles.length === 0 && editBlocks.length === 0) return

    const langMap: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', css: 'css', html: 'html', json: 'json', vue: 'vue' }
    const merged: Record<string, { path: string; content: string; language: string }> =
      { ...((proj.files as Record<string, { path: string; content: string; language: string }>) ?? {}) }
    for (const { path, content } of newFiles) {
      const ext = path.split('.').pop() ?? ''
      merged[path] = { path, content, language: langMap[ext] ?? 'plaintext' }
    }
    if (editBlocks.length > 0) {
      const result = applyEdits(merged, editBlocks)
      for (const [path, content] of Object.entries(result.updated)) {
        const ext = path.split('.').pop() ?? ''
        merged[path] = { path, content, language: langMap[ext] ?? 'plaintext' }
      }
    }
    await db.from('projects').update({ files: merged, updated_at: new Date().toISOString() }).eq('id', projectId)
    console.log(`[rescue-persist] client never saved — persisted ${newFiles.length} file(s) + ${editBlocks.length} edit(s) for ${projectId}`)
  } catch (e) { console.error('[rescue-persist] failed', e) }
}

export async function POST(req: NextRequest) {
  // Tracks credits actually deducted so any failure path can refund exactly once.
  let deductedCost = 0
  let creditsSettled = false
  let refundUserId = ''
  const settleRefund = async (reason: string) => {
    if (creditsSettled || deductedCost <= 0) return
    creditsSettled = true
    await refundCredits(refundUserId, deductedCost, reason)
  }
  try {
    const body = await req.json()
    // NOTE: modelTier is no longer read from the client — the server picks the
    // model automatically (see resolveModelTier). The field is ignored if sent.
    const { prompt, fileContext, history, image, userId, projectId, knowledge, stage = 'full', stageFiles = [], projectType, selfHeal = false, assets = [], attachedText = [], documents = [], isFirstBuild, paletteId, internalPass = false } = body

    // ── Agent team (flag-gated, see WYBER_TOOL_USE_BUILD precedent) ─────
    // Reads the SAME var the client checks (roster.ts AGENT_TEAM_ENABLED) —
    // this used to be a separate WYBER_AGENT_TEAM server-only var, but
    // NEXT_PUBLIC_* vars are readable server-side too (Next.js inlines them
    // in both bundles), and there was no cross-check between the two names.
    // If they ever drifted (one deploy target has one set but not the
    // other), isInternalPass below would evaluate false while the client
    // still generated free internal fill passes — each one then silently
    // billed as a full paid build instead of the intended free lane. A
    // single flag makes that drift impossible instead of just detectable.
    // Turns on: [agent:{json}] event emission in the stream, Sentinel's
    // in-stream security review, and the internal-pass billing lane below.
    // Off = byte-identical current behavior.
    const agentTeamOn = process.env.NEXT_PUBLIC_AGENT_TEAM === 'true'
    // `internalPass` marks a follow-up pass of an already-charged turn (fill
    // batches after a charged scaffold, or a targeted agent fix). Honored ONLY
    // for those two bounded stages so a crafted request can never get a full
    // build for free — and every internal pass is counted by the free-lane
    // hourly guard below.
    const isInternalPass = agentTeamOn && internalPass === true && (stage === 'fill' || stage === 'agentFix')
    // Internal fills are batch-bounded by design (buildStagedPlan batches of 2);
    // reject oversized lists so "fill" can't be abused as a free full build.
    if (isInternalPass && stage === 'fill') {
      const nFiles = Array.isArray(stageFiles) ? stageFiles.length : 0
      if (nFiles === 0 || nFiles > 3) {
        return new Response(JSON.stringify({ error: 'Invalid fill batch.' }), { status: 400 })
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'API not configured' }), { status: 500 })
    }

    // ── Auth + credit pre-flight ──────────────────────────────────────
    // Internal callers (the MCP build consumer, /api/cron/mcp-consumer) have no
    // browser session — they authenticate with X-Scheduler-Secret and pass the
    // target user's id via X-Scheduler-User-Id, exactly like /api/agents/run.
    const schedulerSecret = req.headers.get('x-scheduler-secret')
    const schedulerUserId = req.headers.get('x-scheduler-user-id')
    const isInternalCall = !!schedulerUserId && schedulerSecret === process.env.CRON_SECRET

    const supabase = await createClient()
    let user: { id: string } | null
    if (isInternalCall) {
      user = { id: schedulerUserId! }
    } else {
      const { data: { user: cookieUser } } = await supabase.auth.getUser()
      user = cookieUser
    }
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // ── Free-lane abuse guard ─────────────────────────────────────────
    // `selfHeal` and the (legacy, now client-unused) 'plan' stage skip billing
    // entirely, and both flags come straight from the request body — so any
    // registered user could craft POSTs and burn Anthropic spend for free,
    // unmetered. Legit self-heal traffic is small (the client caps autofix
    // passes per turn), so cap free generations per user per hour. Counted in
    // credit_usage (amount 0) so the limit holds across serverless instances;
    // the insert is awaited because a fire-and-forget row could miss the very
    // burst it's supposed to count.
    if (selfHeal || stage === 'plan' || isInternalPass) {
      // Raised 30 → 60 for the agent team: a staged build adds ~2-4 free fill
      // passes per turn on top of self-heals, all riding this same meter.
      const FREE_PASSES_PER_HOUR = 60
      const guardAdmin = await createAdminClient()
      const hourAgo = new Date(Date.now() - 3600_000).toISOString()
      const { count } = await guardAdmin
        .from('credit_usage')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('reason', 'free-pass')
        .gte('created_at', hourAgo)
      if ((count ?? 0) >= FREE_PASSES_PER_HOUR) {
        return new Response(JSON.stringify({
          error: 'Auto-fix limit reached for this hour — please try again in a little while.',
        }), { status: 429 })
      }
      await guardAdmin.from('credit_usage').insert({
        user_id: user.id, amount: 0, reason: 'free-pass',
        credits_before: 0, credits_after: 0,
      })
    }

    // Determine action type for cost calculation. The client sends isFirstBuild
    // explicitly (its store knows whether this project ever completed a
    // generation) because fileContext is NEVER small — every brand-new project
    // is auto-seeded with a starter scaffold, so the old length heuristic
    // classified every first build as an edit: charged 2–3 credits instead of
    // 10, routed to Sonnet instead of Opus, skipped extended thinking, and
    // nameNewProject never ran. Length check kept only as a fallback for
    // clients that don't send the flag.
    const isNewBuild = typeof isFirstBuild === 'boolean'
      ? isFirstBuild
      : (!fileContext || fileContext.length < 200)
    // Opt-in extended thinking: only on a genuinely fresh, one-shot build (not
    // edits, not self-heal repairs) — the one case where seeing the model's
    // architecture reasoning is worth the extra latency on every call.
    const useThinking = stage === 'full' && isNewBuild && !selfHeal
    // Tool-use (Phase 5): real write_file/edit_file tool calls instead of
    // <file>/<edit> text tags. Started on new builds only (the 'fill' stage
    // this was originally scoped for turned out to be disabled dead code —
    // see runStagedBuild in ChatPanel.tsx), now extended to edits too. Each
    // half has its own env escape hatch since these are the live default
    // build AND edit paths: flip WYBER_TOOL_USE_BUILD=off or
    // WYBER_TOOL_USE_EDIT=off to instantly revert either one to its legacy
    // text-tag path with no deploy. selfHeal repairs stay on the legacy path
    // regardless — narrower, already-well-tested recovery mechanism, not
    // worth mixing with the new path's own continuation handling.
    const useToolUse = stage === 'full' && !selfHeal && (
      (isNewBuild && process.env.WYBER_TOOL_USE_BUILD !== 'off') ||
      (!isNewBuild && process.env.WYBER_TOOL_USE_EDIT !== 'off')
    )
    const actionType = projectType === 'mobile' ? 'mobile-build'
      : isNewBuild ? 'web-build'
      : 'small-edit'
    // Model tier is decided SERVER-SIDE (fully automatic) — the client no longer
    // chooses. From-scratch builds get Opus for the best first impression; edits
    // run on Sonnet (cheaper, fast) unless a sub-cent Haiku check rates the edit
    // as architecturally complex, in which case we escalate back to Opus.
    const tier = await resolveModelTier({ actionType, isNewBuild, selfHeal, stage, prompt, fileContext })
    const cost = creditCost(actionType, tier)

    // Fetch profile and enforce balance (skip for 'plan' stage — no generation happens).
    // Self-heal/autofix passes are FREE (they repair an already-paid turn), so they
    // skip deduction entirely — honoring the "self-healing is always free" promise.
    // Internal agent passes (fill / agentFix) are likewise free: the turn was
    // charged once on its first pass ("your whole AI team, one price").
    if (stage !== 'plan' && !selfHeal && !isInternalPass) {
      const admin = await createAdminClient()
      const { data: profile } = await admin
        .from('profiles')
        .select('credits, plan, email, full_name, first_build_emailed')
        .eq('id', user.id)
        .single()

      const balance = profile?.credits ?? 0
      const plan = profile?.plan ?? 'free'

      // Enforce plan-based model gate
      if (!tierAllowedForPlan(tier, plan)) {
        return new Response(JSON.stringify({
          error: `The ${tier} model requires a higher plan. Please upgrade.`,
          needed: cost,
          balance,
        }), { status: 402 })
      }

      if (balance < cost) {
        // Highest-intent email moment: they just tried to build and were
        // refused. Send the first "out of credits" email NOW (the daily drip
        // cron continues from #2) — at most once, tracked in email_events.
        if (profile?.email) {
          ;(async () => {
            try {
              const { data: ev, error: evErr } = await admin.from('email_events')
                .select('sent_count').eq('user_id', user.id).eq('kind', 'credits-drip').single()
              // 42P01 = table missing (migration 20260703110000 not applied yet)
              // → skip rather than emailing on EVERY refused build untracked.
              if (evErr && evErr.code === '42P01') return
              if (!ev) {
                const { sendCreditsExhaustedEmail } = await import('@/lib/email')
                const { unsubscribeUrl } = await import('@/lib/email/unsubscribe')
                const { data: optRow } = await admin.from('profiles').select('email_opt_out').eq('id', user.id).single()
                if (!optRow?.email_opt_out) {
                  await sendCreditsExhaustedEmail(profile.email, 1, unsubscribeUrl(profile.email), await userCurrency(admin, user.id))
                  await admin.from('email_events').upsert({ user_id: user.id, kind: 'credits-drip', sent_count: 1, last_sent_at: new Date().toISOString() })
                }
              }
            } catch { /* fire-and-forget */ }
          })()
        }
        return new Response(JSON.stringify({
          error: `Not enough credits. This action costs ${cost} credit${cost !== 1 ? 's' : ''} and you have ${balance}.`,
          needed: cost,
          balance,
        }), { status: 402 })
      }

      // Atomic deduct — only succeeds if credits still >= cost (prevents race condition)
      const { data: updated, error: deductErr } = await admin
        .from('profiles')
        .update({ credits: balance - cost, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .gte('credits', cost)
        .select('credits')
        .single()
      if (deductErr || !updated) {
        return new Response(JSON.stringify({ error: 'Insufficient credits' }), { status: 402 })
      }

      // Record what we took so any failure/empty path can refund it.
      deductedCost = cost
      refundUserId = user.id

      // Log usage (fire-and-forget)
      admin.from('credit_usage').insert({
        user_id: user.id, amount: cost, reason: actionType,
        credits_before: balance, credits_after: updated!.credits,
      }).then(() => {}).catch(() => {})

      // ── Lifecycle emails (fire-and-forget) ──────────────────────────────
      const email = profile?.email as string | undefined
      const after = updated!.credits
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'
      if (email) {
        // First-build milestone — send once, then flip the flag
        if (!profile?.first_build_emailed) {
          admin.from('profiles').update({ first_build_emailed: true }).eq('id', user.id).then(() => {}).catch(() => {})
          const displayName = (profile?.full_name as string | undefined) || email.split('@')[0]
          sendFirstBuildEmail(email, displayName, 'your app', `${APP_URL}/project/${projectId}`).catch(() => {})
        }
        // Low-credit warning — only at the moment the balance crosses the threshold
        const LOW = 20
        if (balance > LOW && after <= LOW && after > 0) {
          userCurrency(admin, user.id).then(c => sendCreditLowEmail(email, after, c)).catch(() => {})
        }
      }
      // Low-credit PUSH + in-app row — same crossing threshold as the email, but
      // push needs no email address. Best-effort; never blocks the build response.
      if (balance > 20 && after <= 20 && after > 0) {
        notify(admin, user.id, 'credits_low', { balance: after }).catch(() => {})
      }
    }

    // ── TEMPLATE MATCHING DISABLED ──────────────────────────────────
    // All code is generated fresh from scratch — no stale templates.
    // This ensures users always get the latest, highest-quality output.
    const hasExisting = fileContext && fileContext.length > 200
    if (false) { // disabled: always generate fresh
      try {
        const supabase = await createClient()

        // Extract meaningful words from prompt
        const stopWords = new Set(['build','create','make','want','need','with','that','have','this','from','for','and','the','can','get'])
        const words = prompt.toLowerCase()
          .replace(/[^a-z0-9 ]/g, ' ')
          .split(' ')
          .filter((w: string) => w.length > 3 && !stopWords.has(w))
          .slice(0, 10)

        if (words.length > 0) {
          // Get templates that have actual files stored
          const { data: matches } = await supabase
            .from('prebuilt_apps')
            .select('id, app_id, name, category, files, preview_color, keywords')
            .eq('valid', true)
            .overlaps('keywords', words)
            .not('files', 'eq', '{}')
            .not('files', 'is', null)
            .limit(10)

          if (matches && matches.length > 0) {
            // Score each match
            let best = matches[0]
            let bestScore = 0

            for (const m of matches) {
              // Check files exist and have real content
              const fileCount = m.files ? Object.keys(m.files).length : 0
              if (fileCount < 2) continue

              let score = 0
              // Keyword overlap score
              const templateKeywords = (m.keywords || []) as string[]
              score += words.filter((w: string) => templateKeywords.some((k: string) => k.includes(w) || w.includes(k))).length * 2
              // Name match score
              score += words.filter((w: string) => m.name?.toLowerCase().includes(w)).length * 3
              // Category match score
              score += words.filter((w: string) => m.category?.toLowerCase().includes(w)).length * 2
              // Bonus for richer templates
              score += Math.min(fileCount, 8) * 0.5

              if (score > bestScore) { bestScore = score; best = m }
            }

            // Only use template if score >= 3 (meaningful match) and has files
            const fileCount = best.files ? Object.keys(best.files).length : 0
            if (bestScore >= 3 && fileCount >= 2) {
              try { 
                await supabase.rpc('increment_app_use', { app_id: best.id }) 
              } catch {}

              const output = Object.entries(best.files as Record<string, string>)
                .map(([path, code]) => `<file path="${path}">
${code}
</file>`)
                .join('\n\n')

              const appIdLabel = best.app_id ? ` [${best.app_id}]` : ''
              const summary = `Built: Loaded "${best.name}"${appIdLabel} from the WyberAi gallery (0 credits).`
              const full = output + '\n\n' + summary
              const encoder = new TextEncoder()

              // Sanitize — remove undefined variable references
              const sanitized = full
                .replace(/const\s+\w*[Cc]lient\s*=\s*createClient\([^)]*\)/g, '// client removed')
                .replace(/\bprojectId\b/g, '"demo-project"')
                .replace(/\buserId\b/g, '"demo-user"')
                .replace(/supabaseUrl[^;,)\s]*/g, '"https://demo.supabase.co"')
                .replace(/process\.env\.\w+/g, '"demo"')

              return new Response(
                new ReadableStream({
                  start(controller) {
                    const chunkSize = 100
                    let i = 0
                    const push = () => {
                      if (i < sanitized.length) {
                        controller.enqueue(encoder.encode(sanitized.slice(i, i + chunkSize)))
                        i += chunkSize
                        setTimeout(push, 5)
                      } else { controller.close() }
                    }
                    push()
                  }
                }),
                {
                  headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Source': 'prebuilt',
                    'X-Credits-Used': '0',
                    'X-Prebuilt-Name': best.name,
                    'X-Prebuilt-ID': best.app_id || best.id,
                    'X-Match-Score': String(bestScore),
                  }
                }
              )
            }
          }
        }
      } catch { /* prebuilt check failed, fall through to generation */ }
    }

    // ── AI GENERATION ────────────────────────────────────────────
    // User-uploaded attachments: hosted assets to use directly + extracted doc text.
    let assetContext = ''
    if (Array.isArray(assets) && assets.length) {
      const lines = assets
        .filter((a: { name?: string; url?: string }) => a?.url)
        .map((a: { name?: string; url?: string; kind?: string }) => `- ${a.name} (${a.kind || 'file'}) → ${a.url}`)
        .join('\n')
      if (lines) assetContext += `\n\n=== USER-UPLOADED ASSETS ===\nThe user uploaded these files; they are hosted at the URLs below. USE them directly in the app (e.g. <img src="URL"> for logos/photos, link to documents for download). Do NOT substitute placeholder or stock images when a matching uploaded asset exists.\n${lines}`
    }
    if (Array.isArray(attachedText) && attachedText.length) {
      const docs = attachedText
        .filter((d: { content?: string }) => d?.content)
        .map((d: { name?: string; content?: string }) => `--- ${d.name || 'document'} ---\n${String(d.content).slice(0, 8000)}`)
        .join('\n\n')
      if (docs) assetContext += `\n\n=== ATTACHED DOCUMENT CONTENT ===\nTreat the following as source content / requirements provided by the user:\n${docs}`
    }

    const userPrompt = (fileContext
      ? `Current files:\n${fileContext}\n\nUser request: ${prompt}`
      : prompt) + assetContext

    // The client already applies a cache-friendly stable window (see
    // windowedHistory in ChatPanel.tsx — grows the tail instead of sliding it,
    // so the prefix stays identical turn-to-turn and prompt caching can hit).
    // Re-slicing to a tight, different-every-turn window here would undo that
    // stability, so this is only a generous safety cap against a misbehaving
    // client — comfortably above the client's own max window size.
    const trimmedHistory = (history || [])
      .filter((m: { content: string }) => m.content && !m.content.startsWith('[Image:'))
      .slice(-25)
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.slice(0, 4000)
      }))

    type MessageContent = string | Array<{
      type: 'image';
      source: { type: 'base64'; media_type: ValidMime; data: string };
    } | { type: 'text'; text: string } | {
      type: 'document';
      source: { type: 'base64'; media_type: 'application/pdf'; data: string };
    }>

    // PDFs go straight to Claude as native document content blocks — the Messages
    // API reads them directly (text, layout, tables), no custom extraction needed.
    // (.xlsx has no equivalent native support, so that one is parsed client-side to
    // CSV and flows in as plain text via `attachedText` above instead.)
    const documentBlocks = (Array.isArray(documents) ? documents : [])
      .filter((d: { base64?: string }) => d?.base64)
      .map((d: { base64: string }) => ({
        type: 'document' as const,
        source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: d.base64 },
      }))

    let userContent: MessageContent = userPrompt
    if (documentBlocks.length > 0) {
      userContent = [...documentBlocks, { type: 'text', text: userPrompt }]
    }
    if (image?.base64 && isValidMime(image.mimeType)) {
      userContent = [
        ...documentBlocks,
        { type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.base64 } },
        { type: 'text', text: userPrompt },
      ]
    }

    const resolvedTier = tier
    const model = MODELS[resolvedTier] ?? MODELS.default
    const maxTokens = resolvedTier === 'fast' ? 8000 : resolvedTier === 'fable' ? 96000 : resolvedTier === 'premium' ? 96000 : 64000

    // Inject Supabase context if user has connected their project
    const supabaseResult = projectId ? await getSupabaseContext(projectId, projectType) : { context: '', status: 'none' as SupabaseStatus }
    const supabaseContext = supabaseResult.context
    const supabaseStatus = supabaseResult.status
    // Durable rolling memory of this project (no-op until migration 034 is applied).
    const projectMemory = projectId ? await loadProjectMemory(projectId) : ''
    // Merge request-body knowledge (editor) with the persistent stored column
    // (settable via MCP) so both apply on every build.
    const storedKnowledge = projectId ? await loadProjectKnowledge(projectId) : ''
    const mergedKnowledge = [String(knowledge ?? '').trim(), storedKnowledge].filter(Boolean).join('\n\n')
    const knowledgeContext = mergedKnowledge ? `\n\n${mergedKnowledge}` : ''
    const templateRef = !hasExisting ? await getTemplateReference(prompt) : ''
    const outputRule = '\n\n━━━ CRITICAL OUTPUT RULES ━━━\n1. Do NOT write <thinking> blocks or planning preambles. Start with ONE short sentence (max 15 words) saying what you did, e.g. "Added navigation pane with 5 links." — then immediately output your changes. NEVER write paragraphs explaining your approach. EXCEPTION — complex builds: if this build spans MORE than ~5 files, your one opening sentence must set expectations instead, e.g. "This is a complex build across multiple files — I\'m generating them in batches; the preview updates when the last file lands." (still one sentence, still followed immediately by the file output).\n2. NEW files: output a complete <file path="...">...</file> block.\n3. EDITING an existing file: do NOT re-output the whole file. Instead output a diff using this EXACT format:\n<edit path="src/components/Foo.tsx">\n<<<<<<< SEARCH\n(exact existing lines to find — copy them verbatim including indentation)\n=======\n(the replacement lines)\n>>>>>>> REPLACE\n</edit>\nYou may include multiple SEARCH/REPLACE sections inside one <edit>, and multiple <edit> blocks. The SEARCH text must match the current file EXACTLY (same whitespace) so it can be located. Keep SEARCH blocks small — just the lines that change plus a little surrounding context.\n4. If a request changes MANY places in one file (theme or color-scheme overhauls, big restyles), output the complete <file> block for that file instead of many small edits — full rewrite is more reliable there.\n5. Only touch files that actually change. Never re-output unchanged files.\n6. Every <file> and <edit> block must be fully closed. Never stop mid-block.\n7. EXISTING FILES ALREADY EXIST. The "Current files" / "EXISTING FILES" list shows files already in the project. NEVER output a <file> block to re-create a file that is already listed — even if its full contents are not shown to you, it still exists. To change it, use <edit> (or a full <file> rewrite only for a big restyle). Use a fresh <file> block ONLY for a genuinely new path. If App.tsx imports a file that appears in the list, that file exists — do not recreate it.\n8. TALK LIKE A HUMAN TEAMMATE. If the user message is a question, a confirmation, or an ambiguous reply ("done?", "ok", "is it working?", "connected", "what next?"), DO NOT regenerate code. Answer in 1-2 warm, plain sentences. Only emit <file>/<edit> blocks when there is a concrete, new change to make.\n8a. BUILD COMMANDS MUST BUILD NOW. If the user asks you to build, rebuild, recreate, redo, regenerate, retry, "do it", "all of them", overhaul, or fix the rendering — that is a concrete change. Emit the actual <file>/<edit> blocks IN THIS SAME RESPONSE. Do not ask another clarifying question first when the intent is already clear ("recreate" + "all of them" = build everything now).\n8b. NEVER PROMISE FUTURE WORK. You only act within this single response — you cannot continue in a later turn. NEVER say "sending it now", "rebuilding…", "one moment", "I\'ll regenerate", "coming up", or anything implying work will happen after this message. Either do the work now (emit the blocks in this message) or say plainly that you need a specific input. A promise with no <file>/<edit> blocks in the same message is a bug.\n9. ALWAYS CONFIRM + GUIDE. After making changes, end with a recap of WHAT you changed and ONE suggested next step. For 1-2 file changes: 1-2 friendly sentences, e.g. "Added the Settings page and wired it into the sidebar. The preview just updated — want dark-mode next?". For changes spanning 3+ files: a short bullet list — one line per meaningful change, stating the OUTCOME ("Dashboard chart now scrolls horizontally on narrow screens"), not the action taken — then the next-step sentence. When you make no code change, still close with a helpful next step.\n10. NEVER NARRATE BETWEEN BLOCKS. After the opening sentence, output the <file>/<edit> blocks back-to-back with ZERO prose between them. Everything you write outside the blocks is concatenated and shown to the user as your final answer — mid-work commentary like "Now fix the header:" or "Let me tighten the button row:" turns that answer into unreadable rambling that trails off mid-thought. If you want to signal progress, use [progress: short label] markers (they render as a live ticker, never as chat text). ALL explanation belongs in the closing recap (rule 9), written AFTER the last block, in past tense, describing the finished result.'

    // Tool-use variant of the output rule (Phase 5) — same voice/behavior rules
    // as outputRule, but files are written/changed via tools instead of
    // <file>/<edit> text tags. The model gets a second turn (after tool_results
    // come back) to add its closing recap, so rule 8's voice guidance still
    // applies there. Both tools are always offered together (not gated by
    // isNewBuild) since a single edit turn commonly needs both — e.g. "add a
    // dark mode toggle" may need a new hook file AND changes to App.tsx.
    const toolUseOutputRule = '\n\n━━━ CRITICAL OUTPUT RULES ━━━\n1. To CREATE a new file, call write_file(path, content) once per file — full contents each time. Do NOT use <file> or <edit> tags; they do not exist in this mode.\n2. To CHANGE an existing file, call edit_file(path, search, replace) — search must be the EXACT existing lines (verbatim, same whitespace), keep it small (just the changed lines plus a little context). Never call write_file for a file that already exists — use edit_file instead, unless the change touches MANY places in one file (a full theme/color-scheme overhaul), in which case call write_file to replace the whole thing.\n3. PREFER FEWER, LARGER new files. Aim for 3-5 files for a fresh build, not 8-10. Put a module and its small subcomponents in ONE file unless it exceeds ~400 lines. If the build genuinely spans MORE than ~5 files, say so FIRST in one short sentence before any tool call — e.g. "This is a complex build across multiple files — I\'m generating them in batches; the preview updates when the last file lands." — so the user knows a longer generation is expected, then start writing files.\n4. Call every tool for every file/change in the SAME turn — do not wait between calls.\n5. If the user message is a question, a confirmation, or an ambiguous reply ("done?", "ok", "is it working?", "what next?"), do NOT call any tool — just answer in 1-2 warm, plain sentences.\n6. BUILD/EDIT COMMANDS MUST HAPPEN NOW. If the user asks for a concrete change, call the right tool(s) THIS turn — do not ask a clarifying question first when the intent is already clear.\n7. NEVER PROMISE FUTURE WORK. Do not say "sending it now", "building…", "one moment" — either call the tool now or say plainly what input you need.\n8. ALWAYS CONFIRM + GUIDE. Once your tool calls are done and you see their results, close with one short friendly recap of what you built/changed and ONE suggested next step. Keep it to 1-2 sentences, plain text, no more tool calls.\n9. SCHEMA SQL STILL APPLIES IN TOOL MODE. If the storage context told you to end with a "SQL TO RUN IN SUPABASE" comment block, append that complete block after your recap exactly as instructed — the platform parses and runs it automatically. Rule 8\'s brevity limit does not apply to that block.\n10. NEVER NARRATE BETWEEN TOOL CALLS. Text you write between tool calls is concatenated and shown to the user as your final answer — mid-work commentary like "Now fix the header:" turns it into unreadable rambling. Call the tools back-to-back silently; the platform already shows a live per-file progress ticker. ALL explanation belongs in the closing recap (rule 8), written after the last tool result, in past tense, describing the finished result.'

    const writeFileTool = {
      name: 'write_file',
      description: 'Write one complete NEW file. Call once per file you are creating — never for a file that already exists (use edit_file for those).',
      input_schema: {
        type: 'object' as const,
        properties: {
          path: { type: 'string' as const, description: 'File path relative to the project root, e.g. src/components/Sidebar.tsx' },
          content: { type: 'string' as const, description: 'The complete file contents.' },
        },
        required: ['path', 'content'],
      },
    }

    const editFileTool = {
      name: 'edit_file',
      description: 'Make one targeted search/replace edit to an EXISTING file. Call once per distinct change — call it again (or call it multiple times) for multiple changes in the same or different files.',
      input_schema: {
        type: 'object' as const,
        properties: {
          path: { type: 'string' as const, description: 'File path relative to the project root — must be an EXISTING file.' },
          search: { type: 'string' as const, description: 'The exact existing lines to find, copied verbatim including indentation/whitespace. Keep this small — just the lines that change plus a little surrounding context.' },
          replace: { type: 'string' as const, description: 'The replacement lines.' },
        },
        required: ['path', 'search', 'replace'],
      },
    }

    const wyberDNA = '' // merged into system prompt
    // ── Staged generation modes ──
    // Static system prompt (cacheable) — per-request context injected into user message instead.
    // 'plan': return a JSON file manifest only (no code). Fast + cheap.
    // 'scaffold': build only the listed shell files so the preview renders a skeleton.
    // 'fill': build only the listed feature files this pass (small batch, can't truncate).
    // 'full' (default): unchanged one-shot behaviour.
    let stageMaxTokens = maxTokens
    let staticSystemPrompt: string
    const perRequestParts: string[] = []

    // Durable project memory FIRST — what this app is and the user's standing
    // requests, so the model honors decisions made many messages ago.
    if (projectMemory) {
      perRequestParts.push(`\n\n━━━ PROJECT MEMORY (durable context from earlier in this project — honor it) ━━━\n${projectMemory}`)
    }

    // These vary per project/prompt — keep them out of the system prompt so the cache breakpoint stays byte-stable
    if (supabaseContext) {
      perRequestParts.push(supabaseContext)
    } else if (projectType !== 'mobile') {
      // Web, no backend: local-first persistence via the injected wyber-store
      // helper (sanitize-files/engine inject src/wyber-store.ts into every
      // build) — personal apps keep their data across reloads without Supabase.
      perRequestParts.push(WYBER_STORE_PROMPT)
    } else {
      // Mobile (React Native): no wyber-store injection there — keep the
      // in-memory default until an AsyncStorage equivalent ships.
      perRequestParts.push(`\n\n=== STORAGE CONTEXT (no backend connected) ===
Use useState with inline mock data for all persistent data. Do NOT import or reference Supabase.
Do NOT add any storage-notice banner or warning about data persistence — the platform handles that externally.`)
    }
    if (knowledgeContext) perRequestParts.push(knowledgeContext)
    if (templateRef) perRequestParts.push(templateRef)

    // DESIGN SEED — freshness lever. We promise fresh code each time, so a fresh
    // BUILD must not reuse one house style. For new web builds, nudge the model
    // toward a distinct aesthetic direction (palette + type + layout). It is a
    // STARTING POINT only and yields to any explicit user style/brand/colors.
    if (!hasExisting && projectType === 'mobile' && stage !== 'plan') {
      const MOBILE_DIRECTIONS = [
        "Cash App-bold: near-black base, ONE vivid accent (lime/green or electric blue), huge numbers, minimal chrome.",
        "Headspace-calm: warm light base (cream/off-white), soft rounded cards, a gentle accent (coral/peach or teal), lots of breathing room.",
        "Notion-clean: light neutral base, near-black text, a single restrained accent, crisp dividers, content-first.",
        "Strava-energetic: dark base with a punchy orange/red accent, bold stats, high-contrast.",
        "Duolingo-playful: bright friendly base, rounded everything, a saturated primary (green/purple) + cheerful supporting colors.",
        "Premium fintech: deep navy or charcoal base, refined teal/emerald accent, tabular numbers, subtle shadows.",
        "Wellness sage: light sage/sand palette, organic rounded shapes, calm muted accent, airy spacing.",
        "Luxury dark: true-black base, a champagne/gold accent, lots of negative space, elegant restraint.",
      ]
      const seed = MOBILE_DIRECTIONS[Math.floor(Math.random() * MOBILE_DIRECTIONS.length)]
      perRequestParts.push(`\n\n━━━ DESIGN SEED (fresh build — make it bespoke) ━━━\nUnless the user named a specific style, brand, or colors, take THIS as your starting aesthetic and commit to it in theme.ts (choose a light or dark base + accent to match): ${seed}\nDo not default to a generic dark indigo app.`)

      // LAYOUT SEED — mobile's equivalent of the web LAYOUT_SEEDS below: the
      // DESIGN SEED above only covers color/vibe, so two mobile builds with
      // similar palettes still ended up with the same tab-bar-plus-card-feed
      // shape every time. This handles structural freshness (nav pattern,
      // home-screen shape, onboarding style) so they compose differently too.
      const MOBILE_LAYOUT_SEEDS = [
        'Tab bar (4-5 icons) home = a vertical feed of cards; detail screens push full-screen with a large back-swipe area.',
        'Bottom-sheet nav (single FAB opens a sheet of destinations) home = a 2-col grid of tiles; details open as a modal sheet, not a push.',
        'Tab bar home = dashboard-style stat cards + a horizontal scroller of recent items; onboarding is a 3-slide swipeable carousel with dot indicators.',
        'Segmented top tabs (no bottom bar) home = a dense list (rows, not cards); onboarding is a single animated welcome screen with one CTA, no carousel.',
        'Bottom tab bar + a persistent search bar pinned under the header; home = grid of category tiles; onboarding: permission-request screens one at a time (notifications, then location).',
        'Drawer nav (hamburger) + no bottom bar; home = list grouped by section headers; onboarding: a single value-prop screen + sign-in, no carousel.',
        'Tab bar home = a masonry/staggered grid (Pinterest-style); onboarding: full-bleed swipeable image carousel with overlaid copy.',
        'Bottom tab bar home = a single hero card + stacked list below it (superapp pattern); onboarding: skippable 2-slide carousel, minimal copy.',
      ]
      const mobileLayoutSeed = MOBILE_LAYOUT_SEEDS[Math.floor(Math.random() * MOBILE_LAYOUT_SEEDS.length)]
      perRequestParts.push(`\n\n━━━ LAYOUT SEED (fresh build — structural freshness) ━━━\nUnless the user asked for a specific navigation or home-screen layout, take THIS as your structural starting point: ${mobileLayoutSeed}`)
    }
    if (!hasExisting && projectType !== 'mobile' && stage !== 'plan') {
      // Inject a complete, hand-tuned, domain-matched HSL token palette as a
      // concrete DESIGN BRIEF (not vague adjectives). Guarantees every fresh
      // build starts from a beautiful, accessible, distinct palette; freshness
      // comes from picking a different one each build. Yields to explicit user
      // colors/brand.
      const { pickPalette, getPaletteById, renderDesignBrief } = await import('@/lib/design-palettes')
      // An explicit paletteId (user picked a direction in Plan Mode / theme UI)
      // wins; unknown or absent ids fall back to the prompt-matched random pick.
      const palette = (typeof paletteId === 'string' ? getPaletteById(paletteId) : undefined) ?? pickPalette(prompt)
      perRequestParts.push(renderDesignBrief(palette))

      // LAYOUT & MOTION SEED — the palette brief handles color freshness; this
      // handles STRUCTURAL freshness so two builds with similar palettes still
      // compose differently. References Wyber UI Kit components so the seed is
      // directly actionable. Yields to explicit user layout requests.
      const LAYOUT_SEEDS = [
        'Website: centered aurora hero (AuroraBackground, oversized display headline), features as a 3-col FeatureCard Stagger grid, logos in a Marquee. Dashboard: airy top-nav shell (no sidebar), stat row of StatBlocks, generous whitespace. Motion: calm and slow (Reveal delays 0.1-0.3).',
        'Website: split hero — copy left, GlassPanel product mock right; BentoGrid feature showcase with one 2x2 hero cell. Dashboard: classic slim sidebar + dense data tables, tight spacing. Motion: brisk, minimal — Stagger interval 0.05.',
        'Website: editorial hero — huge left-aligned display type over BackgroundGrid lines, long-form sections, pull-quote TestimonialCards. Dashboard: content-first, near-invisible chrome, hairline dividers. Motion: fade-only Reveals (y=0), no slides.',
        'Website: cinematic dark hero — GradientBorder-framed visual with glow, SpotlightCards throughout, stats band with AnimatedNumbers. Dashboard: dark cockpit with glowing primary accents, GlassPanel cards. Motion: pronounced spring physics.',
        'Website: minimal luxury — vast negative space, single-column narrative sections, thin-weight display type, restrained CTASection. Dashboard: spacious cards, oversized numbers, few borders. Motion: slow elegant Reveals (duration feel ~0.8).',
        'Website: product-led — sticky Navbar, hero with dual CTA + social-proof strip immediately under it, alternating split sections (image/copy, copy/image). Dashboard: two-pane master-detail. Motion: standard Reveal/Stagger, delta arrows on stats.',
        'Website: bold geometric — BackgroundGrid dots everywhere, chunky Badge eyebrows, BentoGrid as the ENTIRE page body after the hero. Dashboard: bento-style widget grid instead of uniform card rows. Motion: staggered grid entrances.',
        'Website: warm organic — soft rounded radius (--radius 1rem+), pastel-tinted section backgrounds alternating with white, hand-crafted feel. Dashboard: friendly rounded cards, pill Tabs navigation. Motion: gentle y=12 Reveals, playful AnimatedNumbers.',
        'Website: editorial magazine — EditorialHeadline hero with a serif <em> accent, MonoLabel eyebrows on every section, SectionNumber-opened numbered chapters, MediaFrame images with Fig. captions. Dashboard: reading-first list views, hairline dividers, mono metadata. Motion: fade-only Reveals, one SplitTextReveal.',
        'Website: engineered precision — near-black or paper ground, HairlineFrame-framed hero visual, a DataRow spec sheet instead of a feature grid, 1px borders everywhere, mono microlabels. Dashboard: dense tabular, tabular-nums, zero decoration. Motion: minimal — Stagger interval 0.04, no floating.',
        'Website: numbered process story — hero, then a PinnedStory (sticky MediaFrame visual + 3-4 SectionNumber steps) as the page centerpiece, DataRow facts band, restrained CTASection. Dashboard: wizard/stepper-first. Motion: calm, the PinnedStory carries it.',
        'Website: cinematic dark precision — CursorGlow hero with an oversized EditorialHeadline, HairlineFrame stats band, SpotlightCards for features, mono captions. Dashboard: dark cockpit, glowing accents, hairline grid. Motion: pronounced but few — hero glow + one pinned moment.',
        'Website: gallery minimal — vast white space, EditorialHeadline with ONE italic word, full-bleed MediaFrame images separated by nothing but whitespace, MonoLabel captions, no cards at all. Dashboard: content-grid gallery views. Motion: slow fade-only Reveals (duration feel ~0.9).',
        'Website: split manifesto — sticky left column (EditorialHeadline + MonoLabel meta), right column scrolls long-form sections with SectionNumbers; a DataRow specification block near the end. Dashboard: master-detail with a fixed summary rail. Motion: right column Reveals only.',
        'Website: asymmetric editorial grid — 12-col grid used unevenly (7/5, 8/4 splits), BentoGrid with one 2x2 MediaFrame cell, pull-quote TestimonialCard offset from center, footnote-style MonoLabels. Dashboard: mixed-density bento widgets. Motion: staggered grid entrances, nothing else.',
        'Website: brutalist statement — zero radius, thick borders, oversized ALL-CAPS display hero, accent-block sections, Marquee ticker between sections, raw DataRow lists. Dashboard: spreadsheet-honest tables, visible grid. Motion: instant hovers, one Marquee, NO scroll fades.',
      ]
      const layoutSeed = LAYOUT_SEEDS[Math.floor(Math.random() * LAYOUT_SEEDS.length)]
      perRequestParts.push(`\n\n━━━ LAYOUT & MOTION SEED (fresh build — structural freshness) ━━━\nUnless the user asked for a specific layout, take THIS as your structural starting point: ${layoutSeed}`)
    }

    if (stage === 'plan') {
      staticSystemPrompt = "You are a software architect. Given an app request, output ONLY a JSON array of the files needed to build it. Each item must be {\"path\":\"src/...\",\"purpose\":\"short feature description\"}. List shell files (src/index.css, src/App.tsx, src/components/Sidebar.tsx) FIRST, then one file per feature. Aim for 5-9 files. Output ONLY the raw JSON array starting with [ and ending with ]. No prose, no markdown, no code fences."
      stageMaxTokens = 2000
    } else {
      staticSystemPrompt = (projectType === 'mobile' ? buildMobileSystemPrompt() : buildSystemPrompt())
        + (projectType === 'mobile' ? '' : wyberDNA)
        + (useToolUse ? toolUseOutputRule : outputRule)
      // Both staged-pass prompts below override rule 9's "end with a question"
      // guidance on purpose: rule 9 is written for an interactive turn where a
      // real person reads the question and replies. Scaffold/fill passes are
      // links in an automated chain the platform already planned — the next
      // pass fires on its own regardless of what this response says, so a
      // model that asks "Want me to build X next?" here is asking a question
      // nobody answers, right before the platform does exactly that anyway.
      // Confirmed live in production chat history: every staged pass ended
      // with such a question, and the very next pass silently acted on it —
      // reads as the AI ignoring the user and talking to itself.
      const stagedAutomationNote = "\nThis pass is one link in an automated chain the platform already planned — it runs back-to-back with the next pass, with no user reply in between. Your closing sentence must be a plain, past-tense statement of what you built. NEVER end with a question or an offer awaiting a yes/no (no \"Want me to build X next?\", no \"should I continue?\") — nobody is there to answer it, and the next pass will run regardless of what you ask. NEVER reference internal build mechanics like \"this pass\"/\"next pass\"/\"later passes\" — describe the app in plain language a user would recognize, not the pipeline building it."
      if (stage === 'scaffold') {
        const list = (stageFiles as string[]).join(', ')
        perRequestParts.push(`\n\n=== SCAFFOLD PASS ===\nBuild ONLY these files this pass: ${list}\nThese form the app shell. Build the layout, navigation, theme and routing so the app renders a working skeleton. For feature areas not in this list, render a lightweight placeholder ("Coming up next...") — they will be filled in on their own shortly. Output each file as a complete <file> block.${stagedAutomationNote}`)
      } else if (stage === 'fill') {
        const list = (stageFiles as string[]).join(', ')
        perRequestParts.push(`\n\n=== FILL PASS ===\nBuild ONLY these files this pass, as complete <file> blocks: ${list}\nThe app shell already exists. Do NOT re-output App.tsx, index.css, or any file not in this list. Just output the listed files, fully implemented.${stagedAutomationNote}`)
      } else if (stage === 'agentFix') {
        perRequestParts.push(`\n\n=== TARGETED FIX PASS ===\nApply ONLY the specific fix described in the request, using <edit> blocks (or a full <file> rewrite only if the file is small). Do not restyle, refactor, or touch anything else.`)
      }
      // Internal passes are free to the user — clamp their output budget so a
      // forged request can't extract a large free generation.
      if (isInternalPass) {
        stageMaxTokens = Math.min(stageMaxTokens, stage === 'fill' ? 24000 : 8000)
      }
      if (stage === 'full') {
        staticSystemPrompt += '\n\n=== BUILD EFFICIENCY ===\n1. PREFER FEWER, LARGER FILES. Aim for 3-5 files total, not 8-10. Put a module and its small subcomponents in ONE file unless it exceeds ~400 lines.\n2. ORDER MATTERS: emit leaf/child files FIRST, then files that import them, App.tsx LAST. Never import a file you have not already written in this same response.\n3. App.tsx must only import files you are creating this turn. A working 4-file app beats a 9-file app missing 3 files.\n4. Finish every file you open before starting another.'
      }
    }

    // Prepend per-request context to the user message to keep the static system byte-stable for caching
    const contextPrefix = perRequestParts.filter(Boolean).join('')
    if (contextPrefix) {
      if (Array.isArray(userContent)) {
        userContent = userContent.map(block =>
          (block as { type: string }).type === 'text'
            ? { ...(block as { type: 'text'; text: string }), text: contextPrefix + '\n\n' + (block as { type: 'text'; text: string }).text }
            : block
        ) as typeof userContent
      } else {
        userContent = contextPrefix + '\n\n' + userContent
      }
    }

    // Try Anthropic primary, fallback to Vertex AI Gemini on failure
    let usedModel = model
    let readable: ReadableStream<Uint8Array>
    // Full assistant output, captured for the post-response memory distillation
    // and for the generationSucceeded() check below.
    let generatedText = ''

    const encoder = new TextEncoder()
    // TWO message breakpoints: one on the last HISTORY message (matches the prefix a
    // previous turn already cached — windowedHistory() on the client keeps growth
    // append-only), and one on the NEW user message. The new message carries the full
    // fileContext (often the biggest part of the request); caching it means the
    // tool-use loop and max_tokens continuations below read it from cache on every
    // iteration instead of re-paying it as fresh input each time. Budget: 4
    // breakpoints max per request = system(1) + history(2) + new message(3), leaving
    // one for the rolling loop breakpoint.
    const finalMessages = withCacheBreakpoint([
      ...withCacheBreakpoint(trimmedHistory),
      { role: 'user' as const, content: userContent },
    ])
    const systemBlocks: { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }[] = [{ type: 'text' as const, text: staticSystemPrompt, cache_control: { type: 'ephemeral' as const } }]
    if (supabaseStatus === 'ok') {
      systemBlocks.push({ type: 'text', text: '\n\n[SYSTEM FACT] Supabase IS connected to this project. If the user asks about Supabase connection status, confirm it is connected. Do NOT contradict this — it is a verified system state, not a guess.' })
    }

    // Extended thinking (opt-in, new-build full generation only — see useThinking
    // above). 'adaptive' is the current API for Opus 4.8/Fable 5/Sonnet 4.6+;
    // budget_tokens is deprecated/rejected on these models.
    const thinkingParam = useThinking ? { thinking: { type: 'adaptive' as const, display: 'summarized' as const } } : {}

    // ── Sentinel: in-stream security review (flag-gated, deterministic) ──
    // Reviews every file the coder emits, DURING the generation. Blocking
    // findings are handed back as failed tool_results (tool-use path) or a
    // veto continuation turn (legacy path) so the coder re-emits a corrected
    // file before it ever lands — capped at MAX_SECURITY_FIX_ITERATIONS extra
    // passes; anything still unresolved lands, stays recorded in the event
    // stream, and the publish gate remains the hard backstop.
    const emitAgent = (controller: ReadableStreamDefaultController<Uint8Array>, e: AgentEvent) => {
      if (!agentTeamOn) return
      try { controller.enqueue(encoder.encode(formatAgentEvent(e))) } catch { /* stream closing */ }
    }
    const MAX_SECURITY_FIX_ITERATIONS = 2
    let securityFixesUsed = 0
    const nextFindingId = createFindingIdGenerator()
    const openFindingsByPath = new Map<string, SecurityRuleFinding[]>()
    const allFindings: SecurityRuleFinding[] = []
    let emittedSql = ''
    // On edits (fast path) only the always-critical rules may block — the rest
    // stay advisory so small edits never slow down. New builds get full vetoes.
    const vetoEligible = (f: SecurityRuleFinding) =>
      f.blocking && (isNewBuild || stage === 'scaffold' || stage === 'fill'
        || f.ruleId === 'secret-literal' || f.ruleId === 'service-role-client')
    /** Review one emitted file/patch: emits finding/fixed events, tracks state,
     * returns the findings that are eligible to veto (block) this pass. */
    const sentinelReview = (
      controller: ReadableStreamDefaultController<Uint8Array>,
      path: string,
      content: string,
      patch = false,
    ): SecurityRuleFinding[] => {
      if (!agentTeamOn || selfHeal) return []
      const prior = openFindingsByPath.get(path) ?? []
      const findings = reviewEmittedFile(path, content, emittedSql, { patch, nextId: nextFindingId })
      if (/create\s+table|create\s+policy|alter\s+table/i.test(content)) emittedSql += `\n${content}`
      // A re-emitted file that no longer trips a rule → the earlier finding is fixed.
      const openRules = new Set(findings.map(f => f.ruleId))
      for (const p of prior) {
        if (!openRules.has(p.ruleId)) {
          emitAgent(controller, { agent: 'security', status: 'fixed', detail: `${p.detail} — fixed before it landed`, severity: p.severity, findingId: p.findingId })
        }
      }
      const open: SecurityRuleFinding[] = []
      for (const f of findings) {
        const dup = prior.find(p => p.ruleId === f.ruleId)
        if (dup) { open.push(dup); continue } // already reported, still open
        allFindings.push(f)
        emitAgent(controller, { agent: 'security', status: 'finding', detail: f.detail, severity: f.severity, findingId: f.findingId })
        open.push(f)
      }
      openFindingsByPath.set(path, open)
      return open.filter(vetoEligible)
    }
    /** Extract the schema comment block (or trailing raw SQL) from stream text
     * so Sentinel can review SQL the model emitted as prose, not as a file. */
    const extractSqlBlock = (text: string): string => {
      // Last match wins — a corrected re-emitted block supersedes the vetoed one.
      const matches = text.match(/\/\*\s*SQL TO RUN IN SUPABASE[\s\S]*?\*\//gi)
      return matches ? matches[matches.length - 1] : ''
    }
    const sentinelDone = (controller: ReadableStreamDefaultController<Uint8Array>) => {
      if (!agentTeamOn || selfHeal || stage === 'plan') return
      const fixed = allFindings.filter(f => ![...openFindingsByPath.values()].flat().some(o => o.findingId === f.findingId)).length
      const open = allFindings.length - fixed
      const detail = allFindings.length === 0
        ? 'no security issues found'
        : `${fixed} issue${fixed === 1 ? '' : 's'} fixed before landing${open ? `, ${open} flagged` : ''}`
      emitAgent(controller, { agent: 'security', status: 'done', detail })
    }

    try {
      if (useToolUse) {
        // ── Tool-use prototype (Phase 5 sub-phase 1) ──────────────────────
        // Real write_file(path, content) tool calls instead of <file> text
        // tags, converted BACK into <file> tags at the wire boundary so the
        // entire existing client pipeline (parseGenerationOutput, progress
        // steps, self-heal cut-off detection, hasRealChange refund check)
        // keeps working unchanged. A model turn that calls tools always ends
        // with stop_reason 'tool_use' and cannot add closing text until it
        // sees tool_results — so this is a genuine multi-turn loop, not a
        // single call: iteration 1 gets the files, we hand back trivial
        // "File written." results, iteration 2 lets the model add its usual
        // one-line recap. MAX_TOOL_ITERATIONS caps runaway loops; in practice
        // this should almost always take exactly 2 passes.
        const firstStream = await client.messages.stream({
          model,
          max_tokens: stageMaxTokens,
          system: systemBlocks,
          messages: finalMessages,
          tools: [writeFileTool, editFileTool],
          ...thinkingParam,
        })

        readable = new ReadableStream({
          async start(controller) {
            // Simple Sonnet edits (2cr) get 3 iterations — measured sessions
            // showed tweak-sized requests ballooning into 6 file-writing turns,
            // which is what made cheap edits expensive ($15/M output adds up).
            // Complex edits (Opus, 5cr) and builds keep the full budget.
            const MAX_TOOL_ITERATIONS = actionType === 'small-edit' && resolvedTier === 'fast' ? 3 : 6
            emitAgent(controller, { agent: 'coder', status: 'start', detail: isNewBuild ? 'building your app' : 'making the change' })
            emitAgent(controller, { agent: 'security', status: 'start', detail: 'reviewing every file as it lands' })
            // Blocking findings per path, pending hand-back as failed tool_results.
            const vetoByPath = new Map<string, SecurityRuleFinding[]>()
            let assistantSoFar = ''
            let loopMessages: Anthropic.MessageParam[] = [...finalMessages]
            let stream = firstStream
            let inThinkingBlock = false
            let toolJson = ''
            let toolName = ''
            // Live per-file streaming (sub-phase 2): the SDK's own partial-JSON
            // snapshot (the `inputJson` event) turned out NOT to help here — its
            // vendored parser only reveals a string field once its closing quote
            // has arrived (verified against the real API: a 2.7KB file's `content`
            // appeared in exactly ONE snapshot, at the very last delta, not
            // incrementally). So this decodes the raw partial_json text by hand via
            // makeJsonFieldStreamer, byte-by-byte, to get true incremental content
            // as it's actually generated — same live "typing" feel as the legacy
            // <file>-tag path, instead of buffering the whole file until
            // content_block_stop.
            let pathStreamer = makeJsonFieldStreamer('path')
            let contentStreamer = makeJsonFieldStreamer('content')
            let toolOpened = false
            let toolEmittedLen = 0
            // One-shot: forced follow-up when a new build ends without its
            // entry file (see the end_turn branch below).
            let entryRetried = false
            try {
              // `<=` — one pass past MAX_TOOL_ITERATIONS is reserved for the
              // entry-file guarantee: even when the continuation budget is
              // spent, a new build must never end without src/App.tsx (that is
              // a guaranteed-blank preview, strictly worse than a build that
              // is merely missing one feature file). Sentinel vetoes extend the
              // budget by the corrective iterations they consume (capped at
              // MAX_SECURITY_FIX_ITERATIONS) so a veto never eats a build pass.
              for (let iter = 0; iter <= MAX_TOOL_ITERATIONS + securityFixesUsed; iter++) {
                for await (const event of stream) {
                  if (event.type === 'content_block_start') {
                    if (event.content_block.type === 'thinking') {
                      inThinkingBlock = true
                      controller.enqueue(encoder.encode('<reasoning>'))
                    } else if (event.content_block.type === 'tool_use') {
                      toolJson = ''
                      toolName = event.content_block.name
                      toolOpened = false
                      toolEmittedLen = 0
                      pathStreamer = makeJsonFieldStreamer('path')
                      contentStreamer = makeJsonFieldStreamer('content')
                    }
                  } else if (event.type === 'content_block_delta') {
                    if (event.delta.type === 'text_delta') {
                      assistantSoFar += event.delta.text
                      controller.enqueue(encoder.encode(event.delta.text))
                    } else if (event.delta.type === 'thinking_delta') {
                      controller.enqueue(encoder.encode(event.delta.thinking))
                    } else if (event.delta.type === 'input_json_delta') {
                      toolJson += event.delta.partial_json
                      if (toolName === 'write_file') {
                        if (!toolOpened) {
                          const p = pathStreamer(toolJson)
                          if (p.closed) {
                            toolOpened = true
                            const openTag = `<file path="${p.value.replace(/"/g, '&quot;')}">\n`
                            assistantSoFar += openTag
                            controller.enqueue(encoder.encode(openTag))
                          }
                        }
                        if (toolOpened) {
                          const c = contentStreamer(toolJson)
                          if (c.value.length > toolEmittedLen) {
                            const newPiece = c.value.slice(toolEmittedLen)
                            assistantSoFar += newPiece
                            controller.enqueue(encoder.encode(newPiece))
                            toolEmittedLen = c.value.length
                          }
                        }
                      }
                    }
                  } else if (event.type === 'content_block_stop') {
                    if (inThinkingBlock) {
                      inThinkingBlock = false
                      controller.enqueue(encoder.encode('</reasoning>'))
                    } else if (toolName === 'write_file' && toolJson) {
                      try {
                        const parsed = JSON.parse(toolJson) as { path?: string; content?: string }
                        if (parsed.path && typeof parsed.content === 'string') {
                          if (!toolOpened) {
                            // Never got a streaming snapshot (short call, one chunk) — fall
                            // back to emitting the whole tag at once, same as sub-phase 1.
                            const chunk = `<file path="${parsed.path.replace(/"/g, '&quot;')}">\n${parsed.content}\n</file>\n[progress: Wrote ${parsed.path}]\n`
                            assistantSoFar += chunk
                            controller.enqueue(encoder.encode(chunk))
                          } else {
                            // Catch up any tail the streaming snapshot hadn't resolved yet
                            // (partial-json can lag a few chars behind near the end), then close.
                            const tail = parsed.content.slice(toolEmittedLen)
                            const closeChunk = `${tail}\n</file>\n[progress: Wrote ${parsed.path}]\n`
                            assistantSoFar += closeChunk
                            controller.enqueue(encoder.encode(closeChunk))
                          }
                          // Sentinel reviews the file the moment it lands.
                          const vetoes = sentinelReview(controller, parsed.path, parsed.content)
                          if (vetoes.length) vetoByPath.set(parsed.path, vetoes)
                          else vetoByPath.delete(parsed.path)
                        }
                      } catch (e) { console.error('[generate tool-use] bad write_file JSON:', e) }
                      toolJson = ''
                      toolName = ''
                      toolOpened = false
                      toolEmittedLen = 0
                    } else if (toolName === 'edit_file' && toolJson) {
                      // Edits are small — buffer the whole call and emit once, same
                      // pattern as sub-phase 1's original write_file approach. No live
                      // typing needed here; a search/replace pair finishes almost
                      // instantly regardless.
                      try {
                        const parsed = JSON.parse(toolJson) as { path?: string; search?: string; replace?: string }
                        if (parsed.path && typeof parsed.search === 'string' && typeof parsed.replace === 'string') {
                          const chunk = `<edit path="${parsed.path.replace(/"/g, '&quot;')}">\n<<<<<<< SEARCH\n${parsed.search}\n=======\n${parsed.replace}\n>>>>>>> REPLACE\n</edit>\n[progress: Edited ${parsed.path}]\n`
                          assistantSoFar += chunk
                          controller.enqueue(encoder.encode(chunk))
                          // Patch mode: only the always-critical rules (secrets /
                          // service-role) run on a fragment — see ReviewOptions.
                          const vetoes = sentinelReview(controller, parsed.path, parsed.replace, true)
                          if (vetoes.length) vetoByPath.set(parsed.path, vetoes)
                        }
                      } catch (e) { console.error('[generate tool-use] bad edit_file JSON:', e) }
                      toolJson = ''
                      toolName = ''
                    }
                  }
                }

                const finalMsg = await stream.finalMessage()
                const u = finalMsg.usage as unknown as Record<string, number>
                console.log(`[generate cache] tool-iter=${iter} model=${model} action=${actionType} stop=${finalMsg.stop_reason} creation=${u.cache_creation_input_tokens ?? 0} read=${u.cache_read_input_tokens ?? 0} input=${u.input_tokens} output=${u.output_tokens ?? 0}`)

                if (finalMsg.stop_reason === 'max_tokens') {
                  // Sub-phase 3: a tool call cut off mid-JSON can't be replayed as
                  // an assistant prefill (same restriction as the legacy path) NOR
                  // as a genuine tool_use continuation (write_file has no "append"
                  // semantics — the schema is one complete file per call). So this
                  // does one in-request retry: close out the dangling <file> tag
                  // (as a harmless, immediately-closed placeholder — leaving it
                  // truly unclosed would make parseGenerationOutput's greedy regex
                  // merge it with the retry's later, correctly-closed tag for the
                  // SAME path into one corrupted block), drop the invalid trailing
                  // tool_use block from history (Anthropic still gives back valid
                  // JSON for any EARLIER tool_use calls that completed in the same
                  // turn — only the truncated one is malformed), and ask the model
                  // to write that one file again, complete, in a plain follow-up
                  // turn — all within this same streaming response, so the user
                  // never sees a gap or a separate visible retry.
                  let cutPath: string | null = null
                  const cutTool = toolName
                  if (toolName === 'write_file' && toolJson) {
                    if (toolOpened) {
                      cutPath = pathStreamer(toolJson).value
                      controller.enqueue(encoder.encode('</file>\n'))
                      assistantSoFar += '</file>\n'
                    } else {
                      const m = toolJson.match(/"path"\s*:\s*"([^"]*)"/)
                      if (m) {
                        cutPath = m[1]
                        const chunk = `<file path="${cutPath.replace(/"/g, '&quot;')}"></file>\n`
                        assistantSoFar += chunk
                        controller.enqueue(encoder.encode(chunk))
                      }
                    }
                  } else if (toolName === 'edit_file' && toolJson) {
                    // edit_file is buffer-only (never streamed live), so there's no
                    // dangling tag to close — just salvage the path for the retry note.
                    const m = toolJson.match(/"path"\s*:\s*"([^"]*)"/)
                    if (m) cutPath = m[1]
                  }

                  // Continuation budget spent → normally stop. EXCEPT when a
                  // new build still has no entry file: spend the one reserved
                  // extra pass (loop runs to MAX_TOOL_ITERATIONS inclusive)
                  // demanding App.tsx, or the user ends with components that
                  // nothing mounts and a permanently blank preview.
                  let demandEntry = false
                  const entryPathMt = projectType === 'mobile' ? 'App.tsx' : 'src/App.tsx'
                  if (iter >= MAX_TOOL_ITERATIONS - 1) {
                    const wroteEntryMt = assistantSoFar.includes(`path="${entryPathMt}"`)
                      || (projectType !== 'mobile' && assistantSoFar.includes('path="src/App.jsx"'))
                    if (!isNewBuild || wroteEntryMt || entryRetried
                        || !assistantSoFar.includes('<file path="')) break
                    entryRetried = true
                    demandEntry = true
                  }

                  // Keep only genuinely complete tool_use blocks (all required fields
                  // present for their tool) — the truncated trailing one (if any) is
                  // missing a field and must never be replayed as history.
                  const completeBlocks = finalMsg.content.filter(b => {
                    if (b.type !== 'tool_use') return true
                    if (b.name === 'write_file') {
                      const inp = b.input as { path?: string; content?: string }
                      return typeof inp?.path === 'string' && typeof inp?.content === 'string'
                    }
                    if (b.name === 'edit_file') {
                      const inp = b.input as { path?: string; search?: string; replace?: string }
                      return typeof inp?.path === 'string' && typeof inp?.search === 'string' && typeof inp?.replace === 'string'
                    }
                    return false
                  })
                  const completeToolUses = completeBlocks.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
                  if (completeBlocks.length > 0) {
                    loopMessages = [...loopMessages, { role: 'assistant', content: completeBlocks }]
                  }
                  const retryText = demandEntry
                    ? `You are out of output budget and ${entryPathMt} was never written — the app cannot render without its entry file. Call write_file ONCE now with the COMPLETE ${entryPathMt}, wiring together the components you already created. Keep it lean and write nothing else.`
                    : cutPath
                    ? (cutTool === 'edit_file'
                      ? `Your edit_file call for ${cutPath} was cut off by a length limit before it finished. Call edit_file again for that exact path with a smaller, more targeted search/replace pair.`
                      : `The file ${cutPath} was cut off by a length limit before it finished. Call write_file again for that exact path with the COMPLETE, CORRECT file contents from scratch — keep it more concise if that's what caused the cutoff.`)
                    : `Your last response was cut off by a length limit before finishing. Continue with the remaining changes.`
                  loopMessages = [
                    ...loopMessages,
                    {
                      role: 'user',
                      content: [
                        ...completeToolUses.map(b => ({ type: 'tool_result' as const, tool_use_id: b.id, content: b.name === 'write_file' ? 'File written.' : 'File edited.' })),
                        { type: 'text' as const, text: retryText },
                      ],
                    },
                  ]
                  stream = await client.messages.stream({
                    model,
                    max_tokens: stageMaxTokens,
                    system: systemBlocks,
                    // Rolling breakpoint (4th slot): each iteration caches the turns added
                    // so far, so the next one reads them instead of re-sending fresh.
                    messages: withCacheBreakpoint(loopMessages),
                    tools: [writeFileTool, editFileTool],
                    ...thinkingParam,
                  })
                  continue
                }
                if (finalMsg.stop_reason !== 'tool_use') {
                  // New builds MUST produce the entry file. By convention the
                  // model writes src/App.tsx LAST, so a turn that ends early
                  // (token budget, or the model deciding it's done) can leave
                  // components with no App to mount them — the client merges
                  // them over the starter's tiny placeholder App.tsx, the
                  // preview's hasApp gate stays false, and the user gets a
                  // permanently blank preview with no error to self-heal
                  // from. One forced follow-up turn closes that hole.
                  const entryPath = projectType === 'mobile' ? 'App.tsx' : 'src/App.tsx'
                  const wroteAnyFile = assistantSoFar.includes('<file path="')
                  const wroteEntry = assistantSoFar.includes(`path="${entryPath}"`)
                    || (projectType !== 'mobile' && assistantSoFar.includes('path="src/App.jsx"'))
                  if (isNewBuild && wroteAnyFile && !wroteEntry && !entryRetried
                      && iter < MAX_TOOL_ITERATIONS && finalMsg.content.length > 0) {
                    entryRetried = true
                    loopMessages = [
                      ...loopMessages,
                      { role: 'assistant', content: finalMsg.content },
                      { role: 'user', content: `You finished without writing ${entryPath} — the app cannot render without its entry file. Call write_file now with the COMPLETE ${entryPath}, wiring together the components you already created. Do not rewrite any other file.` },
                    ]
                    stream = await client.messages.stream({
                      model,
                      max_tokens: stageMaxTokens,
                      system: systemBlocks,
                      messages: withCacheBreakpoint(loopMessages),
                      tools: [writeFileTool, editFileTool],
                      ...thinkingParam,
                    })
                    continue
                  }
                  // Sentinel: the schema SQL usually arrives as a trailing comment
                  // block in the recap text (tool-use rule 9), not as a file —
                  // review it now, and spend one corrective turn if it creates
                  // tables without RLS.
                  const sqlBlock = extractSqlBlock(assistantSoFar)
                  if (sqlBlock && securityFixesUsed < MAX_SECURITY_FIX_ITERATIONS && finalMsg.content.length > 0) {
                    const sqlVetoes = sentinelReview(controller, 'supabase-schema.sql', sqlBlock)
                    if (sqlVetoes.length) {
                      securityFixesUsed++
                      emitAgent(controller, { agent: 'security', status: 'fixing', detail: 'requesting corrected SQL from the coder' })
                      loopMessages = [
                        ...loopMessages,
                        { role: 'assistant', content: finalMsg.content },
                        { role: 'user', content: `${sqlVetoes.map(v => v.fixInstruction).join('\n')}\nRe-emit ONLY the corrected "SQL TO RUN IN SUPABASE" comment block, complete — do not repeat anything else and do not call any tools.` },
                      ]
                      stream = await client.messages.stream({
                        model,
                        max_tokens: stageMaxTokens,
                        system: systemBlocks,
                        messages: withCacheBreakpoint(loopMessages),
                        tools: [writeFileTool, editFileTool],
                        ...thinkingParam,
                      })
                      continue
                    }
                  }
                  break // end_turn / refusal — done
                }

                const toolUseBlocks = finalMsg.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
                if (toolUseBlocks.length === 0) break
                // Sentinel veto: a blocking finding on a file written this turn is
                // handed back as a FAILED tool_result, so the model's next
                // iteration re-emits that file corrected — "fixed before it
                // landed". Bounded by MAX_SECURITY_FIX_ITERATIONS; past the
                // budget the file lands as-is (recorded; publish gate backstops).
                const canVeto = securityFixesUsed < MAX_SECURITY_FIX_ITERATIONS
                let vetoedThisTurn = false
                const toolResults = toolUseBlocks.map(b => {
                  const vetoPath = (b.input as { path?: string })?.path
                  const vetoes = canVeto && vetoPath ? vetoByPath.get(vetoPath) : undefined
                  if (vetoes?.length) {
                    vetoedThisTurn = true
                    return {
                      type: 'tool_result' as const,
                      tool_use_id: b.id,
                      is_error: true,
                      content: vetoes.map(v => v.fixInstruction).join('\n'),
                    }
                  }
                  return {
                    type: 'tool_result' as const,
                    tool_use_id: b.id,
                    content: b.name === 'write_file' ? 'File written.' : b.name === 'edit_file' ? 'File edited.' : 'Unknown tool.',
                  }
                })
                vetoByPath.clear()
                if (vetoedThisTurn) {
                  securityFixesUsed++
                  emitAgent(controller, { agent: 'security', status: 'fixing', detail: 'sent back to the coder for a corrected version' })
                }
                loopMessages = [
                  ...loopMessages,
                  { role: 'assistant', content: finalMsg.content },
                  { role: 'user', content: toolResults },
                ]
                stream = await client.messages.stream({
                  model,
                  max_tokens: stageMaxTokens,
                  system: systemBlocks,
                  messages: withCacheBreakpoint(loopMessages),
                  tools: [writeFileTool, editFileTool],
                  ...thinkingParam,
                })
              }
            } catch (err) { console.error('Tool-use stream error:', err) }
            finally {
              emitAgent(controller, { agent: 'coder', status: 'done' })
              sentinelDone(controller)
              generatedText = assistantSoFar
              controller.close()
              if (!generationSucceeded(generatedText, stage)) await settleRefund('empty-generation')
            }
          },
        })
      } else {
      // Probe the first stream so any auth/quota error throws here and falls
      // through to the Gemini fallback below (rather than dying mid-ReadableStream).
      const firstStream = await client.messages.stream({
        model,
        max_tokens: stageMaxTokens,
        system: systemBlocks,
        messages: finalMessages,
        ...thinkingParam,
      })

      readable = new ReadableStream({
        async start(controller) {
          // Auto-continuation: if a pass stops because it hit max_tokens, the
          // output was cut off mid-file (App.tsx is emitted LAST, so it's the
          // usual casualty). Assistant-turn prefill (ending the `messages` array
          // on a `role: 'assistant'` entry) is what this used to do, but that's
          // rejected with a 400 on every model this app uses (Opus 4.8, Sonnet
          // 4.6, Fable 5 all removed prefill support) — so instead we close out
          // the partial text as a real assistant turn and ask for a continuation
          // in a fresh user turn, per Anthropic's documented prefill replacement.
          const MAX_CONTINUATIONS = 4
          let assistantSoFar = ''
          let stream = firstStream
          // Extended-thinking content arrives as separate `thinking` content
          // blocks before the real text — wrap them in <reasoning> tags (own
          // convention, distinct from the banned model-authored <thinking>
          // prose tag) so the client can render them as collapsible reasoning
          // instead of chat text. Never appended to assistantSoFar: that string
          // feeds parseGenerationOutput/continuation and must stay pure of
          // reasoning prose.
          let inThinkingBlock = false
          // No agent events on the 'plan' stage — the client parses that stream
          // as a raw JSON manifest, so markers would corrupt it; ChatPanel
          // synthesizes the Planner's events itself. Self-heal likewise stays
          // silent here (the client narrates it as the QA agent).
          const emitLegacyAgents = stage !== 'plan' && !selfHeal
          if (emitLegacyAgents) {
            emitAgent(controller, {
              agent: 'coder', status: 'start',
              detail: stage === 'scaffold' ? 'building the app shell'
                : stage === 'fill' ? 'building feature files'
                : stage === 'agentFix' ? 'applying a targeted fix'
                : isNewBuild ? 'building your app' : 'making the change',
            })
            emitAgent(controller, { agent: 'security', status: 'start', detail: 'reviewing every file as it lands' })
          }
          // End-of-pass Sentinel review for the text-tag path: parse the files
          // accumulated so far, review anything new, return eligible vetoes.
          const reviewedKeys = new Set<string>()
          const legacyReview = (): SecurityRuleFinding[] => {
            if (!agentTeamOn || !emitLegacyAgents) return []
            const vetoes: SecurityRuleFinding[] = []
            try {
              const { files } = parseGenerationOutput(assistantSoFar)
              for (const f of files) {
                const key = `${f.path}:${f.content.length}`
                if (reviewedKeys.has(key)) continue
                reviewedKeys.add(key)
                vetoes.push(...sentinelReview(controller, f.path, f.content))
              }
              const sqlBlock = extractSqlBlock(assistantSoFar)
              if (sqlBlock) {
                const key = `sql:${sqlBlock.length}`
                if (!reviewedKeys.has(key)) {
                  reviewedKeys.add(key)
                  vetoes.push(...sentinelReview(controller, 'supabase-schema.sql', sqlBlock))
                }
              }
            } catch (e) { console.error('[sentinel] legacy review failed', e) }
            return vetoes
          }
          try {
            for (let pass = 0; pass <= MAX_CONTINUATIONS + securityFixesUsed; pass++) {
              for await (const event of stream) {
                if (event.type === 'content_block_start' && event.content_block.type === 'thinking') {
                  inThinkingBlock = true
                  controller.enqueue(encoder.encode('<reasoning>'))
                } else if (event.type === 'content_block_delta') {
                  if (event.delta.type === 'text_delta') {
                    assistantSoFar += event.delta.text
                    controller.enqueue(encoder.encode(event.delta.text))
                  } else if (event.delta.type === 'thinking_delta') {
                    controller.enqueue(encoder.encode(event.delta.thinking))
                  }
                } else if (event.type === 'content_block_stop' && inThinkingBlock) {
                  inThinkingBlock = false
                  controller.enqueue(encoder.encode('</reasoning>'))
                }
              }

              const finalMsg = await stream.finalMessage()
              const u = finalMsg.usage as unknown as Record<string, number>
              console.log(`[generate cache] pass=${pass} model=${model} action=${actionType} stop=${finalMsg.stop_reason} creation=${u.cache_creation_input_tokens ?? 0} read=${u.cache_read_input_tokens ?? 0} input=${u.input_tokens} output=${u.output_tokens ?? 0}`)

              // Pass finished cleanly → Sentinel end-of-pass review. A blocking
              // finding spends a bounded corrective turn (the text-tag path has
              // no tool_results to fail, so the veto rides a continuation turn);
              // otherwise we're done.
              if (finalMsg.stop_reason !== 'max_tokens') {
                const vetoes = legacyReview()
                if (vetoes.length && securityFixesUsed < MAX_SECURITY_FIX_ITERATIONS && assistantSoFar.trim()) {
                  securityFixesUsed++
                  emitAgent(controller, { agent: 'security', status: 'fixing', detail: 'requesting a corrected version from the coder' })
                  stream = await client.messages.stream({
                    model,
                    max_tokens: stageMaxTokens,
                    system: systemBlocks,
                    messages: withCacheBreakpoint([
                      ...finalMessages,
                      { role: 'assistant' as const, content: assistantSoFar },
                      { role: 'user' as const, content: `${vetoes.map(v => v.fixInstruction).join('\n')}\nRe-emit ONLY the affected file(s) or SQL block, corrected and complete, in the same output format. Do not repeat anything else.` },
                    ]),
                    ...thinkingParam,
                  })
                  continue
                }
                break
              }
              // Cut off by the token ceiling — continue, unless the budget is spent.
              if (pass >= MAX_CONTINUATIONS + securityFixesUsed) break
              if (!assistantSoFar.trim()) break
              console.log(`[generate] pass ${pass} hit max_tokens — continuing (${assistantSoFar.length} chars so far)`)
              const cutoffTail = assistantSoFar.slice(-200)
              stream = await client.messages.stream({
                model,
                max_tokens: stageMaxTokens,
                system: systemBlocks,
                // Breakpoint on the continuation turn caches the (large) assistant
                // text so later passes read it from cache instead of re-paying it.
                messages: withCacheBreakpoint([
                  ...finalMessages,
                  { role: 'assistant' as const, content: assistantSoFar },
                  {
                    role: 'user' as const,
                    content: `Your previous response was cut off by the token limit. It ended with:\n\n"${cutoffTail}"\n\nContinue the raw output EXACTLY from that cut-off point. Do not repeat any text already written, do not add any preamble, acknowledgement, or explanation — resume mid-stream as if there had been no interruption, preserving the exact <file>/<edit> tag structure in progress.`,
                  },
                ]),
                ...thinkingParam,
              })
            }
          } catch (err) { console.error('Stream error:', err) }
          finally {
            if (emitLegacyAgents) {
              legacyReview() // advisory sweep for anything not yet reviewed (e.g. max_tokens exit)
              emitAgent(controller, { agent: 'coder', status: 'done' })
              sentinelDone(controller)
            }
            generatedText = assistantSoFar
            controller.close()
            // No real file/edit block produced → generation failed (whether or not
            // text was emitted); give the credits back.
            if (!generationSucceeded(generatedText, stage)) await settleRefund('empty-generation')
          }
        },
      })
      }
    } catch (anthropicErr) {
      console.error('[generate] Anthropic failed, trying Vertex AI Gemini fallback:', String(anthropicErr))

      // Fallback: Vertex AI Gemini
      const vertexKey = process.env.VERTEX_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
      if (!vertexKey) throw anthropicErr

      usedModel = 'gemini-2.5-flash'
      const userText = typeof userContent === 'string'
        ? userContent
        : (userContent as Array<{ type: string; text?: string }>).filter(b => b.type === 'text').map(b => b.text).join('\n')

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${vertexKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: staticSystemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userText }] }],
            generationConfig: { maxOutputTokens: stageMaxTokens, temperature: 0.7 },
          }),
        },
      )

      if (!geminiRes.ok) {
        const errText = await geminiRes.text()
        throw new Error(`Gemini fallback also failed: ${geminiRes.status} ${errText.slice(0, 200)}`)
      }

      readable = new ReadableStream({
        async start(controller) {
          try {
            const reader = geminiRes.body!.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const json = line.slice(6)
                if (json === '[DONE]') continue
                try {
                  const parsed = JSON.parse(json) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                  if (text) { generatedText += text; controller.enqueue(encoder.encode(text)) }
                } catch { /* skip malformed SSE */ }
              }
            }
          } catch (err) { console.error('Gemini stream error:', err) }
          finally {
            controller.close()
            if (!generationSucceeded(generatedText, stage)) await settleRefund('empty-generation')
          }
        },
      })
    }

    // After the build finishes streaming, distill the turn into durable project
    // memory. `after()` runs post-response (within maxDuration) so it adds ZERO
    // latency to the build. Skipped for plan/self-heal passes and turns that
    // didn't actually produce a real change — feeding a hallucinated "Built: X"
    // narrative into durable memory would make future turns build on the lie.
    after(async () => {
      if (!generationSucceeded(generatedText, stage) || selfHeal || stage === 'plan' || !projectId) return
      await Promise.all([
        // Rescue-persist runs regardless of client fate; it detects a live
        // client's own save and stands down (see helper above).
        persistGeneratedFiles(projectId, generatedText),
        (async () => {
          // Internal agent passes (fills / targeted fixes) still rescue-persist
          // above, but only the charged pass distills memory / names / pushes —
          // one turn, one distillation.
          if (isInternalPass) return
          await updateProjectMemory({
            projectId,
            userPrompt: prompt,
            generatedText,
            prevMemory: projectMemory,
            isNewBuild,
          })
          if (isNewBuild) await nameNewProject(projectId, prompt)
        })(),
      ])
      // "Build complete" push + in-app row — only for full new builds (web or
      // mobile), never tiny edits, to avoid push spam. Best-effort.
      // NOTE: `admin`/`user` aren't in scope inside after(); use a fresh
      // cookie-free service client + the handler-scoped `userId` (body param).
      // The old `notify(admin, user.id, …)` threw ReferenceError: admin is not
      // defined on every new build, silently killing the build-complete push.
      if (isNewBuild && userId && !isInternalPass) {
        const { createServiceClient } = await import('@/lib/supabase/server')
        await notify(createServiceClient(), userId, 'build_complete', { projectId }).catch(() => {})
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Model-Used': usedModel,
        'X-Credits-Used': String(selfHeal || isInternalPass ? 0 : cost),
        'X-Credits-Tier': resolvedTier,
        'X-Supabase-Status': supabaseStatus,
      },
    })
  } catch (err) {
    // Hard failure before/at stream setup → refund whatever we deducted.
    await settleRefund('generation-error')
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
