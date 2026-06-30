import { NextRequest, after } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getTemplateReference } from '@/lib/template-reference'
import { MODEL_IDS, creditCost, tierAllowedForPlan, type ModelTier } from '@/lib/credits'
import { sendCreditLowEmail, sendFirstBuildEmail } from '@/lib/email'

export const maxDuration = 300

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
- Web/mobile app build: 10 credits | App edit: 3 credits
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
- Fonts: the platform preloads the BRAND fonts General Sans (display) + Switzer (body/UI), plus Playfair Display, Lora, JetBrains Mono. Default to --font-sans: 'Switzer' and --font-display: 'General Sans'; use Playfair Display as the display font only for editorial/luxury looks. Set --font-sans / --font-display in index.css. NEVER use @import in CSS — it breaks the build.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEO — MANDATORY (especially for websites / landing pages / marketing / blogs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every public-facing site MUST be search-engine-ready. Treat this as required, not optional.
1. <html lang="en"> and in index.html <head> include, filled with REAL content about THIS site:
   - <title> — unique, descriptive, ≤60 chars (e.g. "Raj Agro Global — Sona Masuri Rice Exporters")
   - <meta name="description"> — compelling, 140–160 chars
   - <link rel="canonical" href="..."> (use the site's intended URL or "/" if unknown)
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
- Hover AND focus-visible states on EVERY interactive element (focus-visible:ring-2 focus-visible:ring-ring). Smooth transition-colors. Tasteful entrance motion (animate-fade-in / framer-motion) — subtle, never gratuitous.
- Real depth: thin borders (border-border) + soft shadows, rounded via the --radius scale. Avoid heavy boxy outlines.
- Always include: empty states, loading skeletons (animate-pulse bg-muted rounded), and toasts for user actions.
- NO placeholder image boxes, EVER. For hero/feature visuals, use a tasteful CSS gradient or geometric SVG — primarily className="bg-[image:var(--gradient-hero)]" (the per-app brand gradient), layered with text and soft shadows. Use an uploaded asset if the user provided a matching one. Never a gray "image" rectangle, via.placeholder, or unsplash URL. (Real AI-generated photos are a publish-time feature, not needed in the build.)
- Charts (Recharts): theme them with tokens — tooltip contentStyle background hsl(var(--card)), border hsl(var(--border)), text hsl(var(--muted-foreground)); grid stroke hsl(var(--border)). Realistic curved data with dips, never flat lines.

COMPONENT PATTERNS (semantic — colors come from YOUR tokens):
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

RESPONSIVE:
- Sidebar collapses on mobile (hidden lg:flex). Stats grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4. Tables wrapped in overflow-x-auto. Modals max-w-lg w-full mx-4.

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
  // Insert: await supabase.from('items').insert({ user_id: user.id, ...fields })
  // Update: await supabase.from('items').update({ field: value }).eq('id', id)
  // Delete: await supabase.from('items').delete().eq('id', id)

useEffect pattern (re-run when user changes):
  useEffect(() => {
    if (!user) { setItems([]); return }
    setLoading(true)
    supabase.from('items').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [user])

── STEP 4: SQL block at the end ──
Output the SQL to run in Supabase at the VERY END as a comment:
/* SQL TO RUN IN SUPABASE DASHBOARD → SQL EDITOR:
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  created_at timestamptz default now()
);
alter table items enable row level security;
create policy "Users manage own items" on items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
*/

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
  // Sign up: const { data, error } = await supabase.auth.signUp({ email, password })
  // Sign in: const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  // Sign out: await supabase.auth.signOut()
  // Get current user: const { data: { user } } = await supabase.auth.getUser()

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
Output the SQL to run in Supabase at the VERY END as a comment block. Use this exact format:
/* SQL TO RUN IN SUPABASE DASHBOARD → SQL EDITOR:
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  created_at timestamptz default now()
);
alter table items enable row level security;
create policy "Users manage own items" on items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
*/

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
    const { data: prof } = await admin.from('profiles').select('credits').eq('id', userId).single()
    const current = prof?.credits ?? 0
    await admin.from('profiles')
      .update({ credits: current + amount, updated_at: new Date().toISOString() })
      .eq('id', userId)
    admin.from('credit_usage').insert({
      user_id: userId, amount: -amount, reason: `refund:${reason}`,
      credits_before: current, credits_after: current + amount,
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
HIGH = touches multiple files, OR changes auth/routing/state/data-model, OR a large refactor, OR "rebuild/overhaul everything".
LOW = a single-component tweak: styling, copy, colors, layout, or adding one small feature.
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
    const { prompt, fileContext, history, image, userId, projectId, knowledge, stage = 'full', stageFiles = [], projectType, selfHeal = false, assets = [], attachedText = [] } = body

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'API not configured' }), { status: 500 })
    }

    // ── Auth + credit pre-flight ──────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Determine action type for cost calculation
    const isNewBuild = !fileContext || fileContext.length < 200
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
    if (stage !== 'plan' && !selfHeal) {
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
          sendCreditLowEmail(email, after).catch(() => {})
        }
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

    const trimmedHistory = (history || [])
      .filter((m: { content: string }) => m.content && !m.content.startsWith('[Image:'))
      .slice(-10)
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.slice(0, 4000)
      }))

    type MessageContent = string | Array<{
      type: 'image';
      source: { type: 'base64'; media_type: ValidMime; data: string };
    } | { type: 'text'; text: string }>

    let userContent: MessageContent = userPrompt
    if (image?.base64 && isValidMime(image.mimeType)) {
      userContent = [
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
    const knowledgeContext = (knowledge && String(knowledge).trim()) ? `\n\n${knowledge}` : ''
    const templateRef = !hasExisting ? await getTemplateReference(prompt) : ''
    const outputRule = '\n\n━━━ CRITICAL OUTPUT RULES ━━━\n1. Do NOT write <thinking> blocks or planning preambles. Start with ONE short sentence (max 15 words) saying what you did, e.g. "Added navigation pane with 5 links." — then immediately output your changes. NEVER write paragraphs explaining your approach.\n2. NEW files: output a complete <file path="...">...</file> block.\n3. EDITING an existing file: do NOT re-output the whole file. Instead output a diff using this EXACT format:\n<edit path="src/components/Foo.tsx">\n<<<<<<< SEARCH\n(exact existing lines to find — copy them verbatim including indentation)\n=======\n(the replacement lines)\n>>>>>>> REPLACE\n</edit>\nYou may include multiple SEARCH/REPLACE sections inside one <edit>, and multiple <edit> blocks. The SEARCH text must match the current file EXACTLY (same whitespace) so it can be located. Keep SEARCH blocks small — just the lines that change plus a little surrounding context.\n4. If a request changes MANY places in one file (theme or color-scheme overhauls, big restyles), output the complete <file> block for that file instead of many small edits — full rewrite is more reliable there.\n5. Only touch files that actually change. Never re-output unchanged files.\n6. Every <file> and <edit> block must be fully closed. Never stop mid-block.\n7. EXISTING FILES ALREADY EXIST. The "Current files" / "EXISTING FILES" list shows files already in the project. NEVER output a <file> block to re-create a file that is already listed — even if its full contents are not shown to you, it still exists. To change it, use <edit> (or a full <file> rewrite only for a big restyle). Use a fresh <file> block ONLY for a genuinely new path. If App.tsx imports a file that appears in the list, that file exists — do not recreate it.\n8. TALK LIKE A HUMAN TEAMMATE. If the user message is a question, a confirmation, or an ambiguous reply ("done?", "ok", "is it working?", "connected", "what next?"), DO NOT regenerate code. Answer in 1-2 warm, plain sentences. Only emit <file>/<edit> blocks when there is a concrete, new change to make.\n8a. BUILD COMMANDS MUST BUILD NOW. If the user asks you to build, rebuild, recreate, redo, regenerate, retry, "do it", "all of them", overhaul, or fix the rendering — that is a concrete change. Emit the actual <file>/<edit> blocks IN THIS SAME RESPONSE. Do not ask another clarifying question first when the intent is already clear ("recreate" + "all of them" = build everything now).\n8b. NEVER PROMISE FUTURE WORK. You only act within this single response — you cannot continue in a later turn. NEVER say "sending it now", "rebuilding…", "one moment", "I\'ll regenerate", "coming up", or anything implying work will happen after this message. Either do the work now (emit the blocks in this message) or say plainly that you need a specific input. A promise with no <file>/<edit> blocks in the same message is a bug.\n9. ALWAYS CONFIRM + GUIDE. After making changes, end with one short friendly recap of WHAT you changed and ONE suggested next step — e.g. "Added the Settings page and wired it into the sidebar. The preview just updated — want dark-mode next?". When you make no code change, still close with a helpful next step. Keep it to 1-2 sentences.'
    
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
    } else {
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
    }
    if (!hasExisting && projectType !== 'mobile' && stage !== 'plan') {
      // Inject a complete, hand-tuned, domain-matched HSL token palette as a
      // concrete DESIGN BRIEF (not vague adjectives). Guarantees every fresh
      // build starts from a beautiful, accessible, distinct palette; freshness
      // comes from picking a different one each build. Yields to explicit user
      // colors/brand.
      const { pickPalette, renderDesignBrief } = await import('@/lib/design-palettes')
      perRequestParts.push(renderDesignBrief(pickPalette(prompt)))
    }

    if (stage === 'plan') {
      staticSystemPrompt = "You are a software architect. Given an app request, output ONLY a JSON array of the files needed to build it. Each item must be {\"path\":\"src/...\",\"purpose\":\"short feature description\"}. List shell files (src/index.css, src/App.tsx, src/components/Sidebar.tsx) FIRST, then one file per feature. Aim for 5-9 files. Output ONLY the raw JSON array starting with [ and ending with ]. No prose, no markdown, no code fences."
      stageMaxTokens = 2000
    } else {
      staticSystemPrompt = (projectType === 'mobile' ? buildMobileSystemPrompt() : buildSystemPrompt())
        + (projectType === 'mobile' ? '' : wyberDNA)
        + outputRule
      if (stage === 'scaffold') {
        const list = (stageFiles as string[]).join(', ')
        perRequestParts.push(`\n\n=== SCAFFOLD PASS ===\nBuild ONLY these files this pass: ${list}\nThese form the app shell. Build the layout, navigation, theme and routing so the app renders a working skeleton. For feature areas not in this list, render a lightweight placeholder ("Coming up next...") — they will be filled in later passes. Output each file as a complete <file> block.`)
      } else if (stage === 'fill') {
        const list = (stageFiles as string[]).join(', ')
        perRequestParts.push(`\n\n=== FILL PASS ===\nBuild ONLY these files this pass, as complete <file> blocks: ${list}\nThe app shell already exists. Do NOT re-output App.tsx, index.css, or any file not in this list. Just output the listed files, fully implemented.`)
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
    // If the stream produces no text at all, the build failed — refund.
    let emittedAny = false
    // Full assistant output, captured for the post-response memory distillation.
    let generatedText = ''

    const encoder = new TextEncoder()
    const finalMessages = [...trimmedHistory, { role: 'user' as const, content: userContent }]
    const systemBlocks: { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }[] = [{ type: 'text' as const, text: staticSystemPrompt, cache_control: { type: 'ephemeral' as const } }]
    if (supabaseStatus === 'ok') {
      systemBlocks.push({ type: 'text', text: '\n\n[SYSTEM FACT] Supabase IS connected to this project. If the user asks about Supabase connection status, confirm it is connected. Do NOT contradict this — it is a verified system state, not a guess.' })
    }

    try {
      // Probe the first stream so any auth/quota error throws here and falls
      // through to the Gemini fallback below (rather than dying mid-ReadableStream).
      const firstStream = await client.messages.stream({
        model,
        max_tokens: stageMaxTokens,
        system: systemBlocks,
        messages: finalMessages,
      })

      readable = new ReadableStream({
        async start(controller) {
          // Auto-continuation: if a pass stops because it hit max_tokens, the
          // output was cut off mid-file (App.tsx is emitted LAST, so it's the
          // usual casualty). Re-prompt with the partial text as an assistant
          // prefill and keep streaming into the SAME response, so the client
          // sees one seamless, complete output. Without this, truncated files
          // render broken and every retry truncates the same way ("false hope").
          const MAX_CONTINUATIONS = 4
          let assistantSoFar = ''
          let stream = firstStream
          try {
            for (let pass = 0; pass <= MAX_CONTINUATIONS; pass++) {
              for await (const event of stream) {
                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                  emittedAny = true
                  assistantSoFar += event.delta.text
                  controller.enqueue(encoder.encode(event.delta.text))
                }
              }

              const finalMsg = await stream.finalMessage()
              const u = finalMsg.usage as unknown as Record<string, number>
              console.log(`[generate cache] pass=${pass} stop=${finalMsg.stop_reason} creation=${u.cache_creation_input_tokens ?? 0} read=${u.cache_read_input_tokens ?? 0} input=${u.input_tokens}`)

              // Only continue when the model was cut off by the token ceiling.
              if (finalMsg.stop_reason !== 'max_tokens' || pass === MAX_CONTINUATIONS) break

              // Anthropic rejects an assistant prefill ending in whitespace.
              const prefill = assistantSoFar.replace(/\s+$/, '')
              if (!prefill) break
              console.log(`[generate] pass ${pass} hit max_tokens — continuing (prefill ${prefill.length} chars)`)
              stream = await client.messages.stream({
                model,
                max_tokens: stageMaxTokens,
                system: systemBlocks,
                messages: [...finalMessages, { role: 'assistant' as const, content: prefill }],
              })
            }
          } catch (err) { console.error('Stream error:', err) }
          finally {
            generatedText = assistantSoFar
            controller.close()
            // No text emitted → generation failed; give the credits back.
            if (!emittedAny) await settleRefund('empty-generation')
          }
        },
      })
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
                  if (text) { emittedAny = true; generatedText += text; controller.enqueue(encoder.encode(text)) }
                } catch { /* skip malformed SSE */ }
              }
            }
          } catch (err) { console.error('Gemini stream error:', err) }
          finally {
            controller.close()
            if (!emittedAny) await settleRefund('empty-generation')
          }
        },
      })
    }

    // After the build finishes streaming, distill the turn into durable project
    // memory. `after()` runs post-response (within maxDuration) so it adds ZERO
    // latency to the build. Skipped for plan/self-heal passes and empty outputs.
    after(async () => {
      if (!emittedAny || selfHeal || stage === 'plan' || !projectId) return
      await updateProjectMemory({
        projectId,
        userPrompt: prompt,
        generatedText,
        prevMemory: projectMemory,
        isNewBuild,
      })
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Model-Used': usedModel,
        'X-Credits-Used': String(selfHeal ? 0 : cost),
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
