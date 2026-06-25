import { NextRequest } from 'next/server'
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

GALLERY (500+ prebuilt templates, always 0 credits):
- CRM, sales pipeline, contact management
- Admin dashboards, analytics, KPI reporting
- E-commerce, product catalog, shopping cart
- Landing pages, SaaS pages, waitlists, coming soon pages
- Kanban boards, project management, sprint tracking
- Invoicing, billing, estimates
- Booking systems, calendars, scheduling
- HR dashboards, employee management, recruiting
- Real estate listings, property management
- Restaurant POS, menu builder, ordering
- Banking dashboard, budgeting, transactions
- Portfolio, personal site, resume
- Chat apps, messaging UIs
- And 500+ more — load instantly at zero credit cost

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
- Wyber covers 6 products (web, mobile, agents, workflows, AI employees, GTM engine) vs competitors covering 1-2
- Lovable, Bolt, v0 build web apps only — no AI Employees, no workflows
- v0 by Vercel generates UI components only — not full apps
- Replit is a full cloud IDE — powerful for developers, complex for non-technical users

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

COLOR PALETTE (dark mode always):
- bg: '#09090b' (screen background)
- surface: '#18181b' (cards, inputs, list items)
- elevated: '#27272a' (modals, popovers, pressed states)
- border: 'rgba(255,255,255,0.08)'
- borderActive: 'rgba(255,255,255,0.16)'
- text: '#fafafa' (primary text)
- textSecondary: '#a1a1aa' (secondary text)
- textMuted: '#71717a' (labels, placeholders)
- accent: '#6366f1' (indigo — primary actions)
- accentLight: 'rgba(99,102,241,0.12)' (accent backgrounds)
- success: '#22c55e', successBg: 'rgba(34,197,94,0.1)'
- warning: '#f59e0b', warningBg: 'rgba(245,158,11,0.1)'
- danger: '#ef4444', dangerBg: 'rgba(239,68,68,0.1)'
- blue: '#0EA5E9'

TYPOGRAPHY:
- Screen titles: fontSize: 28, fontWeight: '800', color: '#fafafa', letterSpacing: -0.5
- Section headers: fontSize: 18, fontWeight: '700', color: '#fafafa'
- Card titles: fontSize: 15, fontWeight: '600', color: '#fafafa'
- Body text: fontSize: 14, color: '#a1a1aa', lineHeight: 20
- Labels: fontSize: 12, fontWeight: '600', color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.5
- Numbers/stats: fontSize: 32, fontWeight: '800', color: '#fafafa', letterSpacing: -1

SPACING (consistent throughout):
- Screen padding: paddingHorizontal: 20, paddingTop: 16
- Card padding: padding: 16 or padding: 20
- Between cards: gap: 12 or marginBottom: 12
- Between sections: marginBottom: 24 or marginTop: 32
- List item padding: paddingVertical: 14, paddingHorizontal: 16

COMPONENT PATTERNS (use these exact patterns):

Card:
{ backgroundColor: '#18181b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }

Button (primary):
{ backgroundColor: '#6366f1', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
Text: { color: '#fff', fontSize: 15, fontWeight: '700' }

Button (secondary):
{ backgroundColor: '#27272a', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }

Input:
{ backgroundColor: '#18181b', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: '#fafafa', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }
Focused: borderColor: '#6366f1'

Badge/chip:
{ backgroundColor: 'rgba(34,197,94,0.1)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' }
Text: { fontSize: 11, fontWeight: '700', color: '#22c55e' }

List item:
{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#18181b', borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }

Avatar:
{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }
Text inside: { fontSize: 15, fontWeight: '700', color: '#fff' }

Stat card:
{ backgroundColor: '#18181b', borderRadius: 16, padding: 16, flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }
Value: { fontSize: 28, fontWeight: '800', color: '#fafafa', letterSpacing: -0.5 }
Label: { fontSize: 11, fontWeight: '600', color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.5 }

Search bar:
{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }

Modal:
Backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)' }
Panel: { backgroundColor: '#18181b', borderRadius: 20, padding: 24, marginHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }

Tab bar (bottom tabs):
{ backgroundColor: '#09090b', borderTopColor: 'rgba(255,255,255,0.06)', borderTopWidth: 1 }
Active tint: '#6366f1', Inactive tint: '#71717a'

POLISH:
- TouchableOpacity with activeOpacity={0.7} on all pressable elements
- Pressable with android_ripple={{ color: 'rgba(255,255,255,0.05)' }} for Android feel
- FlatList with ItemSeparatorComponent for clean dividers
- Empty state: centered View with large icon (opacity 0.3) + title + subtitle + CTA button
- Loading: ActivityIndicator color="#6366f1" or skeleton View with opacity animation
- Pull-to-refresh: RefreshControl on ScrollView/FlatList with tintColor="#6366f1"
- KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} on every screen with inputs
- SafeAreaView wrapping root content on every screen
- StatusBar barStyle="light-content" backgroundColor="#09090b"
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
          <ActivityIndicator color="#0EA5E9" style={{ marginTop: 32 }} />
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
  root: { flex: 1, backgroundColor: '#09090b' },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#f4f4f5', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 15, color: '#71717a', textAlign: 'center', marginBottom: 32 },
  err: { color: '#ef4444', textAlign: 'center', marginTop: 16 },
  pkgCard: { backgroundColor: '#18181b', borderRadius: 14, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pkgTitle: { fontSize: 16, fontWeight: '700', color: '#f4f4f5', marginBottom: 4 },
  pkgDesc: { fontSize: 13, color: '#71717a', maxWidth: 200 },
  pkgPrice: { fontSize: 18, fontWeight: '800', color: '#0EA5E9' },
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
- Tailwind CSS via CDN — ALL styling via className, NEVER style={{}}
- index.html MUST include: <script src="https://cdn.tailwindcss.com"></script>
- Lucide React for icons — ALWAYS set size prop: <Icon size={18} />
- Recharts for charts — always available
- Font: Inter (Tailwind system default)
- NEVER use @import in CSS. No Google Fonts @import. Breaks the build.

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
DESIGN QUALITY — shadcn/ui LEVEL (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every app you build must look like it was designed by a professional. This is the #1 priority.

COLOR SYSTEM (dark mode always):
- Background: bg-zinc-950 (page), bg-zinc-900 (cards/sidebar), bg-zinc-800 (elevated/inputs)
- Borders: border-zinc-800, hover:border-zinc-700
- Text: text-zinc-100 (primary), text-zinc-400 (secondary), text-zinc-500 (muted/labels)
- Accent: indigo-600 primary, indigo-500 hover. emerald-500 success, amber-500 warning, red-500 danger

SPACING & LAYOUT:
- Cards: p-5 or p-6, gap-4 between elements
- Sections: space-y-6, content area p-6
- Sidebar: w-64, px-3 py-4 for items
- Consistent: 16px (gap-4) between cards, 24px (p-6) page padding

TYPOGRAPHY:
- Headings: text-xl font-semibold tracking-tight (page titles), text-sm font-medium (card titles)
- Body: text-sm text-zinc-400
- Labels: text-xs font-medium text-zinc-500 uppercase tracking-wider
- Numbers: text-2xl font-bold tracking-tight (stats), tabular-nums for data

COMPONENTS — write these inline with Tailwind (shadcn-style):
Button (primary): className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
Button (secondary): className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg border border-zinc-700 transition-colors"
Button (ghost): className="inline-flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-sm rounded-lg transition-colors"
Button (danger): className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition-colors"
Card: className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm"
Input: className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
Select: className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
Badge (green): className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
Badge (amber): className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"
Badge (red): className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
Table header: className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3"
Table cell: className="px-4 py-3 text-sm text-zinc-400"
Table row hover: className="hover:bg-zinc-800/50 transition-colors"
Modal backdrop: className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
Modal panel: className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg shadow-2xl"
Stat card: className="bg-zinc-900 border border-zinc-800 rounded-xl p-5" with number in text-2xl font-bold and label in text-xs font-medium text-zinc-500 uppercase tracking-wider
Sidebar nav item: className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
Sidebar nav active: className="flex items-center gap-3 px-3 py-2 text-sm text-indigo-400 bg-indigo-500/10 rounded-lg font-medium"
Search bar: className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-400" with Search icon inside
Empty state: centered div with icon (opacity-30), text-sm font-medium text-zinc-400 title, text-xs text-zinc-500 subtitle

POLISH DETAILS:
- Transitions on all interactive elements: transition-colors or transition-all duration-150
- Focus rings: focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950
- Hover states on EVERY clickable element — no dead hovers
- Dividers: border-t border-zinc-800
- Rounded corners: rounded-xl on cards/modals, rounded-lg on buttons/inputs, rounded-full on badges/avatars
- Avatar circles: w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white
- Trend indicators: text-emerald-400 with ArrowUp icon for positive, text-red-400 with ArrowDown for negative
- Loading: animate-pulse on skeleton blocks (div className="h-4 bg-zinc-800 rounded animate-pulse")
- Empty search: show centered message with Search icon + "No results for '[query]'" + "Try a different search term"
- Scrollbar: use scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent (or hide with overflow-y-auto)

RESPONSIVE:
- Sidebar collapses on mobile: hidden lg:flex
- Stats grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
- Tables: overflow-x-auto wrapper
- Modals: max-w-lg w-full mx-4

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
  return <div className="flex-1 p-6"><h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Settings</h2><p className="text-sm text-zinc-500 mt-2">Coming soon</p></div>
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
Always ResponsiveContainer. Dark tooltip: contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12, color: '#a1a1aa' }}
Data with realistic trends — include dips for realism, never flat lines.

━━━ RULE #6 — ICONS (LUCIDE-REACT) ━━━
Always available. ALWAYS set size prop. Never use emoji as production icons.
import { BarChart2, Users, TrendingUp, Settings, Plus, Search, Filter, X, Edit2, Trash2, ChevronRight, Home, Bell, CreditCard, Package, ArrowUp, ArrowDown, MoreVertical, CheckCircle, AlertCircle, Clock, Star, ChevronDown, Eye, Download, Mail, Phone, MapPin, Calendar, FileText, Layers, Activity, Zap, Shield, Globe, Hash } from 'lucide-react'

━━━ RULE #7 — REALISTIC DATA ━━━
8-15 records. Diverse names (Sarah Chen, Marcus Rivera, Priya Sharma, James O'Brien). Real companies (Horizon Labs, Vertex Systems, Meridian Health, Atlas Digital). Numbers with decimals ($47,832.50, 94.3%, 2.1x). Mixed statuses. Dates in 2025-2026. KPIs with context: "+12.3% vs last month".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
src/index.css — MINIMAL (Tailwind handles everything)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
src/index.css should contain ONLY:
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; }
body { background: #09090b; color: #fafafa; font-family: 'Inter', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

That's it. Everything else is Tailwind utility classes in className.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APP STRUCTURE — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EVERY APP must have:
1. src/index.css — minimal reset (above)
2. src/App.tsx — all state, interfaces, layout shell, section routing
3. src/components/Sidebar.tsx — w-64 sidebar with logo, nav items, user info
4. src/components/Dashboard.tsx — stats grid + chart + recent activity table
5. src/components/[Feature1].tsx — second section
6. src/components/[Feature2].tsx — third section (minimum 3 content sections)

EVERY APP must include:
✓ Working search filtering on keystroke
✓ At least one modal (add/edit/view) with form
✓ Stats cards with numbers + trend indicators (↑12.3% in emerald, ↓2.1% in red)
✓ At least one Recharts chart
✓ 8-15 realistic data records
✓ Empty state when search returns nothing
✓ 4-6 sidebar nav items with lucide icons
✓ Active state on current nav item
✓ User avatar + name at sidebar bottom
✓ Responsive: sidebar hidden on mobile, stats stack on small screens

LAYOUT PATTERN:
<div className="flex h-screen bg-zinc-950">
  <Sidebar currentSection={section} onNavigate={setSection} />
  <main className="flex-1 overflow-y-auto">
    <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
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
□ Would this pass a design review at a top startup? Visual hierarchy, spacing, color.
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
    const { prompt, fileContext, history, image, modelTier = 'default', userId, projectId, knowledge, stage = 'full', stageFiles = [], projectType, selfHeal = false, assets = [], attachedText = [] } = body

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
    const tier = (modelTier as ModelTier) in MODEL_IDS ? (modelTier as ModelTier) : 'default'
    const isNewBuild = !fileContext || fileContext.length < 200
    const actionType = projectType === 'mobile' ? 'mobile-build'
      : isNewBuild ? 'web-build'
      : 'small-edit'
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

    const resolvedTier = (modelTier as ModelTier) in MODEL_IDS ? (modelTier as ModelTier) : 'default' as ModelTier
    const model = MODELS[resolvedTier] ?? MODELS.default
    const maxTokens = resolvedTier === 'fast' ? 8000 : resolvedTier === 'fable' ? 96000 : resolvedTier === 'premium' ? 96000 : 64000

    // Inject Supabase context if user has connected their project
    const supabaseResult = projectId ? await getSupabaseContext(projectId, projectType) : { context: '', status: 'none' as SupabaseStatus }
    const supabaseContext = supabaseResult.context
    const supabaseStatus = supabaseResult.status
    const knowledgeContext = (knowledge && String(knowledge).trim()) ? `\n\n${knowledge}` : ''
    const templateRef = !hasExisting ? await getTemplateReference(prompt) : ''
    const outputRule = '\n\n━━━ CRITICAL OUTPUT RULES ━━━\n1. Do NOT write <thinking> blocks or planning preambles. Start with ONE short sentence (max 15 words) saying what you did, e.g. "Added navigation pane with 5 links." — then immediately output your changes. NEVER write paragraphs explaining your approach.\n2. NEW files: output a complete <file path="...">...</file> block.\n3. EDITING an existing file: do NOT re-output the whole file. Instead output a diff using this EXACT format:\n<edit path="src/components/Foo.tsx">\n<<<<<<< SEARCH\n(exact existing lines to find — copy them verbatim including indentation)\n=======\n(the replacement lines)\n>>>>>>> REPLACE\n</edit>\nYou may include multiple SEARCH/REPLACE sections inside one <edit>, and multiple <edit> blocks. The SEARCH text must match the current file EXACTLY (same whitespace) so it can be located. Keep SEARCH blocks small — just the lines that change plus a little surrounding context.\n4. If a request changes MANY places in one file (theme or color-scheme overhauls, big restyles), output the complete <file> block for that file instead of many small edits — full rewrite is more reliable there.\n5. Only touch files that actually change. Never re-output unchanged files.\n6. Every <file> and <edit> block must be fully closed. Never stop mid-block.\n7. EXISTING FILES ALREADY EXIST. The "Current files" / "EXISTING FILES" list shows files already in the project. NEVER output a <file> block to re-create a file that is already listed — even if its full contents are not shown to you, it still exists. To change it, use <edit> (or a full <file> rewrite only for a big restyle). Use a fresh <file> block ONLY for a genuinely new path. If App.tsx imports a file that appears in the list, that file exists — do not recreate it.\n8. TALK LIKE A HUMAN TEAMMATE. If the user message is a question, a confirmation, or an ambiguous reply ("done?", "ok", "is it working?", "connected", "what next?"), DO NOT regenerate code. Answer in 1-2 warm, plain sentences. Only emit <file>/<edit> blocks when there is a concrete, new change to make.\n9. ALWAYS CONFIRM + GUIDE. After making changes, end with one short friendly recap of WHAT you changed and ONE suggested next step — e.g. "Added the Settings page and wired it into the sidebar. The preview just updated — want dark-mode next?". When you make no code change, still close with a helpful next step. Keep it to 1-2 sentences.'
    
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

    // These vary per project/prompt — keep them out of the system prompt so the cache breakpoint stays byte-stable
    if (supabaseContext) {
      perRequestParts.push(supabaseContext)
    } else {
      // No database connected — ask AI to include a storage notice in data-heavy apps
      perRequestParts.push(`\n\n=== STORAGE CONTEXT (no backend connected) ===
Use useState with inline mock data for all persistent data. Do NOT import or reference Supabase.
IMPORTANT: If this app creates, edits, lists, or manages any records, users, items, tasks, or other user data, include a dismissable notice banner as the VERY FIRST child inside the root return() of App.tsx:

const [_storageNotice, _setStorageNotice] = useState(true)
...
{_storageNotice && (
  <div className="fixed top-0 left-0 right-0 z-50 bg-amber-900/95 text-amber-100 px-4 py-2 text-xs flex items-center justify-between gap-3 backdrop-blur-sm">
    <span>⚠ Data is stored in browser memory only — resets on page refresh. Connect a database to save permanently.</span>
    <button onClick={()=>_setStorageNotice(false)} className="text-amber-100 hover:text-white text-lg font-bold leading-none">×</button>
  </div>
)}

Do NOT add this banner for: pure landing pages, portfolios, dashboards displaying only static data, or any app where the user has no ability to create or edit records. Only add it when the app actively manages user-created or user-edited data.`)
    }
    if (knowledgeContext) perRequestParts.push(knowledgeContext)
    if (templateRef) perRequestParts.push(templateRef)

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

    const encoder = new TextEncoder()
    const finalMessages = [...trimmedHistory, { role: 'user' as const, content: userContent }]
    const systemBlocks = [{ type: 'text' as const, text: staticSystemPrompt, cache_control: { type: 'ephemeral' as const } }]

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
                  if (text) { emittedAny = true; controller.enqueue(encoder.encode(text)) }
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
