// Launch-ready mobile apps: the contract, the price floor, a source check and the store pack. Off unless NEXT_PUBLIC_MOBILE_LAUNCH_READY=true.
// The existing mobile prompt already has a strong first-build block (four states, destructive confirms, brand moment, app identity,
// account deletion, accessibility). This adds what was missing: nothing fake (no invented "AI insights"), real data paths, store readiness,
// and no forced patterns. Reads source only; the preview checks use the web render, since Expo Go cannot be automated.

import { creditCost, type BuildSizeTier } from './credits'
import { scanSlopSource } from './unslop'

export const MOBILE_MIN_TIER: BuildSizeTier = 'large'
const TIER_ORDER: BuildSizeTier[] = ['small', 'medium', 'large', 'xl']

export function mobileLaunchReadyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MOBILE_LAUNCH_READY === 'true'
}
export function isLaunchReadyMobile(projectType?: string | null): boolean {
  return mobileLaunchReadyEnabled() && projectType === 'mobile'
}
export function floorMobileTier(tier: BuildSizeTier): BuildSizeTier {
  return TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(MOBILE_MIN_TIER) ? MOBILE_MIN_TIER : tier
}
export function mobileLaunchReadyCost(): { price: number; ceiling: number } {
  return { price: creditCost('mobile-build', 'fast', MOBILE_MIN_TIER), ceiling: creditCost('mobile-build', 'fast', 'xl') }
}
export function mobileLaunchReadyCostText(): string {
  const { price, ceiling } = mobileLaunchReadyCost()
  return `${price} credits (up to ${ceiling} only if the build turns out unusually large; you will see a receipt)`
}

export const MOBILE_LAUNCH_READY_CONTRACT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAUNCH-READY CONTRACT — MOBILE APPS (OVERRIDES EARLIER RULES WHERE THEY CONFLICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The owner may take this app to the Play Store and the App Store. Build a real app, not a demo, and be exact about what is real. Every item is checked after the build; missing items are sent back to you. When output space is short, drop decoration before you drop any item here. This block overrides "swipe-to-reveal on EVERY list item", "an AI insight on every screen", "multi-million dollar" mandates and the sample-data rules where they conflict.

M1 NOTHING FAKE: never show an "AI insight", prediction, score, streak, rating, review count or "x people are using this" that is not computed from the app's own real data. An insight card appears only when it reads real state (for example "3 invoices are overdue" from the invoice list); otherwise leave it out. No fake sync, no fake loading to look busy.
M2 FIRST RUN: the app starts empty for a real user, with a welcome that states the one thing it does, and one clearly labelled "Load sample data (demo)" action that adds removable demo rows. Never show invented records as the user's own.
M3 DATA: put all reads and writes in one module, lib/db.ts, over AsyncStorage (try/catch, schema version) so the owner can swap in a real backend later. Say plainly in Settings: "Saved on this phone only." Provide "Export my data" (share a JSON file) and "Delete my data" (typed confirmation). If the owner connected a database use it and say so.
M4 NAVIGATION: bottom tabs for 3 to 5 sections and a stack for details. Use platform patterns: iOS large titles and back swipe, Android back button behaviour, safe-area insets on every screen, edge-to-edge friendly layouts (content never hides under system bars).
M5 SWIPE ACTIONS ONLY WHERE THEY HELP: swipe-to-reveal only on lists where delete or archive is common, and every swipe action also has a visible button or a long-press menu (people with motor limits cannot swipe).
M6 ACCOUNTS AND DELETION: if the app has accounts, an in-app "Delete my account" (typed confirmation) must exist, plus a privacy-policy link in Settings. Sign in with a real provider only when it is configured; no fake Google or Apple buttons.
M7 PERMISSIONS: ask for a permission (camera, photos, location, notifications) only at the moment the feature needs it, after one sentence on why, and handle "denied" with a plain explanation and a button to open settings. Declare only the permissions the app uses.
M8 NOTIFICATIONS: schedule only local reminders the user turned on; each notification opens the exact record it is about. No push promises without a configured service.
M9 OFFLINE AND ERRORS: every data screen has loading, empty, error (with Try again) and populated states; the app works fully offline for local data; network failures never lose what the user typed.
M10 ACCESS: every Pressable has accessibilityRole and accessibilityLabel, touch targets at least 44x44, text containers have no fixed heights so larger system text never clips, contrast passes in light and dark, respect reduce-motion.
M11 STORE READINESS: set name, slug, icon, splash, adaptive icon and primary color in app.json; a Settings screen with About (version), Privacy policy and Terms links built from lib/owner-details.ts (leave empty where unknown); no placeholder text anywhere. Declare what data is collected in lib/owner-details.ts so the store forms can be filled truthfully.
M12 DEFINITION OF DONE (confirm silently before the "Built:" line): empty first run with labelled demo data; lib/db.ts with honest storage wording; export and delete data; account deletion if accounts; permissions asked in context with a denied path; every swipe has a visible alternative; four states on data screens; accessibility labels; app identity in app.json; no invented insights or claims.
`

type FileVal = { content?: string } | string | undefined
const contentOf = (v: FileVal): string => (typeof v === 'string' ? v : (v?.content ?? ''))

export interface MobileItem { id: string; label: string; ok: boolean; fix: string }
export interface MobileResult { total: number; passed: number; items: MobileItem[] }

interface Check { id: string; label: string; fix: string; applies?: (code: string) => boolean; test: (code: string) => boolean }

const CHECKS: Check[] = [
  { id: 'db-module', label: 'Data saved through a db module',
    fix: 'Create lib/db.ts with list/get/create/update/remove over AsyncStorage (try/catch, schema version) and use it for every entity.',
    test: c => /AsyncStorage/.test(c) && /\/\/ FILE [^\n]*lib\/db\./i.test(c) },
  { id: 'honest-storage', label: 'Says data is saved on this phone only',
    fix: 'Add "Saved on this phone only." to Settings.',
    test: c => /saved (on|in) this (phone|device)|stored (on|in) this (phone|device)|this phone only/i.test(c) },
  { id: 'demo-labelled', label: 'Starts empty, with labelled sample data on request',
    fix: 'Start with no records and add a "Load sample data (demo)" action that adds removable demo rows.',
    test: c => /load (the )?(sample|demo) data|demo data/i.test(c) },
  { id: 'no-fake-insights', label: 'No invented AI insights or fake numbers',
    fix: 'Remove hard-coded "AI insight", prediction, streak, rating and user-count text; show an insight only when it is computed from real data.',
    test: c => !/(AI insight|ai-powered insight|✦ )/i.test(c) && !/(\d{2,}[,.]?\d* (people|users) (are|have)|rated \d(\.\d)?\s?\/\s?5)/i.test(c) },
  { id: 'export-delete', label: 'Export and delete my data',
    fix: 'Add "Export my data" (share a JSON file) and "Delete my data" (typed confirmation) to Settings.',
    test: c => /export (all )?my data|export data/i.test(c) && /delete (all )?(my )?data/i.test(c) },
  { id: 'account-deletion', label: 'In-app account deletion when there are accounts',
    fix: 'Add "Delete my account" with a typed confirmation and a privacy-policy link in Settings.',
    applies: c => /sign ?in|sign ?up|login|createUser|signInWith/i.test(c),
    test: c => /delete my account|delete account/i.test(c) && /privacy/i.test(c) },
  { id: 'no-fake-sso', label: 'No Google or Apple button without real sign-in',
    fix: 'Remove "Continue with Google/Apple" unless real sign-in is configured.',
    applies: c => /continue with (google|apple)|sign in with (google|apple)/i.test(c),
    test: c => /expo-auth-session|signInWithOAuth|expo-apple-authentication|GoogleSignin/.test(c) },
  { id: 'swipe-alternative', label: 'Every swipe action has a visible alternative',
    fix: 'Wherever a swipe-to-reveal action exists, add a visible button or long-press menu for the same action.',
    applies: c => /Swipeable/.test(c),
    test: c => /onLongPress|accessibilityActions|actionSheet|ActionSheet|<Pressable[^>]*(delete|archive|remove)/i.test(c) },
  { id: 'permission-denied', label: 'Permissions asked in context with a denied path',
    fix: 'Before asking for a permission say why in one sentence, and when denied show an explanation with a button that calls Linking.openSettings().',
    applies: c => /requestPermissionsAsync|requestForegroundPermissionsAsync|requestCameraPermissionsAsync|useCameraPermissions/.test(c),
    test: c => /openSettings/.test(c) },
  { id: 'state-coverage', label: 'Loading, empty and error states',
    fix: 'Give every data screen skeleton loading, an empty state with an action, and an error state with Try again.',
    test: c => /(skeleton|Skeleton)/.test(c) && /(try again|retry)/i.test(c) && /(empty|no .* yet)/i.test(c) },
  { id: 'a11y', label: 'Accessibility roles and labels',
    fix: 'Add accessibilityRole and accessibilityLabel to every Pressable and icon button.',
    test: c => (c.match(/accessibilityLabel/g) ?? []).length >= 5 && /accessibilityRole/.test(c) },
  { id: 'safe-area', label: 'Safe-area handling',
    fix: 'Wrap screens in SafeAreaProvider/useSafeAreaInsets so content never hides under system bars.',
    test: c => /SafeAreaProvider|useSafeAreaInsets|SafeAreaView/.test(c) },
  { id: 'app-identity', label: 'App identity in app.json',
    fix: 'Write app.json with name, slug, icon, splash, adaptive icon and primaryColor.',
    test: c => /\/\/ FILE [^\n]*app\.json/.test(c) && /"slug"/.test(c) && /"icon"/.test(c) },
  { id: 'owner-details', label: 'Owner details file for the store forms',
    fix: 'Create lib/owner-details.ts with name, contact email, privacy-policy URL and the list of data the app collects (empty strings where unknown).',
    test: c => /\/\/ FILE [^\n]*owner-details/i.test(c) },
  { id: 'no-invented-claims', label: 'No invented certifications or counts',
    fix: 'Remove certification, ranking and user-count claims the owner did not state.',
    test: c => !/(soc ?2|iso ?27001|gdpr[- ]compliant|hipaa|#1 app|trusted by \d|\b\d{1,3},\d{3}\+ (users|downloads))/i.test(c) },
]

export function checkMobileReady(files: Record<string, FileVal>): MobileResult {
  const code = Object.entries(files || {})
    .filter(([p]) => /\.(tsx?|jsx?|json)$/.test(p) && !/package-lock|node_modules/.test(p))
    .map(([p, v]) => `// FILE ${p}\n${contentOf(v)}`)
    .join('\n')
  const items: MobileItem[] = []
  for (const c of CHECKS) {
    if (c.applies && !c.applies(code)) continue
    items.push({ id: c.id, label: c.label, ok: c.test(code), fix: c.fix })
  }
  return { total: items.length, passed: items.filter(i => i.ok).length, items }
}

export function mobileReadySummary(r: MobileResult): string {
  const missing = r.items.filter(i => !i.ok)
  if (missing.length === 0) return `Launch-ready check: all ${r.total} items are present in the code. This reads the source; it does not run the app on a device.`
  return `Launch-ready check: ${r.passed} of ${r.total} items present. Adding: ${missing.map(m => m.label.toLowerCase()).join('; ')}.`
}

export function mobileReadyIssues(files: Record<string, FileVal>): { kind: 'launch-ready'; detail: string; fixPrompt: string }[] {
  const mine = checkMobileReady(files).items.filter(i => !i.ok).slice(0, 4).map(i => ({
    kind: 'launch-ready' as const, detail: i.label,
    fixPrompt: `LAUNCH-READY item missing: ${i.label}. ${i.fix} Change only what is needed and keep everything else working.`,
  }))
  const slop = scanSlopSource(files).issues
    .filter(i => !['hype', 'greeting', 'sparkline-cards', 'transition-all', 'odd-spacing', 'hue-gradient', 'glow', 'blobs', 'grain-glass', 'uppercase-labels'].includes(i.id) || i.id === 'emoji')
    .slice(0, 1)
    .map(i => ({ kind: 'launch-ready' as const, detail: `Design: ${i.label}`, fixPrompt: `DESIGN CRAFT item: ${i.label} (${i.count} found, for example "${i.sample.replace(/"/g, "'")}"). ${i.fix}` }))
  return [...mine, ...slop]
}
