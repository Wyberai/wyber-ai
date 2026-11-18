import { describe, it, expect, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { creditCost } from './credits'
import {
  MOBILE_LAUNCH_READY_CONTRACT, MOBILE_MIN_TIER, checkMobileReady, floorMobileTier, isLaunchReadyMobile,
  mobileLaunchReadyCost, mobileLaunchReadyCostText, mobileReadyIssues, mobileReadySummary,
} from './mobile-ready'
import { SDK_54_VERSIONS, SDK_58_VERSIONS, activeMobileSdk, sdkPromptNotes, sdkVersions, snackSdkVersion } from './mobile-sdk'
import { buildStorePack, detectStoreFacts } from './mobile-store-pack'
import { runQaChecks } from './agents/qa-checks'

afterEach(() => { vi.unstubAllEnvs() })

describe('flag and price', () => {
  it('is off unless NEXT_PUBLIC_MOBILE_LAUNCH_READY is "true", and only for mobile', () => {
    expect(isLaunchReadyMobile('mobile')).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_MOBILE_LAUNCH_READY', 'true')
    expect(isLaunchReadyMobile('mobile')).toBe(true)
    for (const t of ['app', 'website', 'saas', undefined]) expect(isLaunchReadyMobile(t as string | undefined)).toBe(false)
  })
  it('floors at large and shows what credits.ts charges, with the ceiling', () => {
    expect(MOBILE_MIN_TIER).toBe('large')
    expect(floorMobileTier('small')).toBe('large')
    const { price, ceiling } = mobileLaunchReadyCost()
    expect(price).toBe(creditCost('mobile-build', 'fast', 'large'))
    expect(ceiling).toBe(creditCost('mobile-build', 'fast', 'xl'))
    expect(mobileLaunchReadyCostText()).toContain(String(price))
  })
})

describe('contract', () => {
  it('has twelve rules, forbids invented insights and requires a visible alternative to every swipe', () => {
    for (let i = 1; i <= 12; i++) expect(MOBILE_LAUNCH_READY_CONTRACT).toContain(`M${i} `)
    expect(MOBILE_LAUNCH_READY_CONTRACT).toMatch(/never show an "AI insight"/)
    expect(MOBILE_LAUNCH_READY_CONTRACT).toMatch(/every swipe action also has a visible button/)
    expect(MOBILE_LAUNCH_READY_CONTRACT).toMatch(/Delete my account/)
  })
  it('is wired into the generator behind the flag', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/api/generate/route.ts'), 'utf8')
    expect(src).toMatch(/isLaunchReadyMobile\(projectType\) \? MOBILE_LAUNCH_READY_CONTRACT/)
    expect(src).toMatch(/floorMobileTier\(rawBuildTier\)/)
    expect(src).toMatch(/buildMobileSystemPrompt\(\) \+ sdkPromptNotes\(\)/)
  })
})

describe('SDK versions', () => {
  it('stays on SDK 54 unless MOBILE_SDK_VERSION=58', () => {
    expect(activeMobileSdk()).toBe('54')
    expect(snackSdkVersion()).toBe('54.0.0')
    expect(sdkVersions()).toBe(SDK_54_VERSIONS)
    expect(sdkPromptNotes()).toBe('')
    vi.stubEnv('MOBILE_SDK_VERSION', '58')
    expect(activeMobileSdk()).toBe('58')
    expect(snackSdkVersion()).toBe('58.0.0')
    expect(sdkVersions()).toBe(SDK_58_VERSIONS)
    expect(sdkPromptNotes()).toMatch(/ReanimatedSwipeable/)
    expect(sdkPromptNotes()).toMatch(/expo-av does not exist/)
  })
  it('SDK 58 has no expo-av, has Reanimated 4 with worklets, and every key from SDK 54 that still exists keeps a version', () => {
    expect('expo-av' in SDK_58_VERSIONS).toBe(false)
    expect(SDK_58_VERSIONS['react-native-reanimated']).toMatch(/^4\./)
    expect(SDK_58_VERSIONS['react-native-worklets']).toBeTruthy()
    const dropped = Object.keys(SDK_54_VERSIONS).filter(k => !(k in SDK_58_VERSIONS))
    expect(dropped).toEqual(['expo-av'])
  })
})

const GOOD: Record<string, string> = {
  'lib/db.ts': `import AsyncStorage from '@react-native-async-storage/async-storage'; export async function list(){ try { return JSON.parse(await AsyncStorage.getItem('k') ?? '[]') } catch { return [] } }`,
  'lib/owner-details.ts': `export const OWNER = { name: '', privacyUrl: '' }`,
  'app.json': `{"expo":{"name":"X","slug":"x","icon":"./icon.png"}}`,
  'screens/Settings.tsx': `
    Saved on this phone only. Export my data. Delete my data. Delete my account. Privacy policy. sign in
    Load sample data (demo)
    <Pressable accessibilityRole="button" accessibilityLabel="a"/><Pressable accessibilityLabel="b"/><Pressable accessibilityLabel="c"/><Pressable accessibilityLabel="d"/><Pressable accessibilityLabel="e"/>
    <SafeAreaProvider/> skeleton Try again no items yet
  `,
}

describe('checkMobileReady', () => {
  it('passes an app that has everything', () => {
    const r = checkMobileReady(GOOD)
    expect(r.items.filter(i => !i.ok).map(i => i.id)).toEqual([])
    expect(mobileReadySummary(r)).toMatch(/Nothing missing/)
    expect(mobileReadySummary(r)).toMatch(/not run the app on a device/)
  })
  it('flags invented insights, fake sign-in, swipe-only actions and denied permissions without a path', () => {
    const r = checkMobileReady({
      'screens/Home.tsx': `<Text>✦ AI insight: you close more deals on Thursday</Text><Text>Rated 4.8 / 5</Text><Button title="Continue with Google"/>
        import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'; <Swipeable/> const { status } = await Camera.requestCameraPermissionsAsync()`,
    })
    const failed = r.items.filter(i => !i.ok).map(i => i.id)
    for (const id of ['db-module', 'no-fake-insights', 'no-fake-sso', 'swipe-alternative', 'permission-denied', 'export-delete', 'app-identity', 'owner-details']) expect(failed).toContain(id)
  })
  it('skips checks that do not apply', () => {
    const ids = checkMobileReady({ 'screens/Home.tsx': 'plain' }).items.map(i => i.id)
    for (const id of ['account-deletion', 'no-fake-sso', 'swipe-alternative', 'permission-denied']) expect(ids).not.toContain(id)
  })
  it('returns at most four launch items plus one design item', () => {
    const issues = mobileReadyIssues({ 'screens/Home.tsx': 'x 👋' })
    expect(issues.filter(i => !i.detail.startsWith('Design')).length).toBe(4)
  })
})

describe('qa-checks integration', () => {
  it('adds mobile items only for mobile and only when the flag is on', () => {
    const files = { 'App.tsx': 'export default function App(){return null}' }
    expect(runQaChecks(files, 'mobile').some(i => i.kind === 'launch-ready')).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_MOBILE_LAUNCH_READY', 'true')
    expect(runQaChecks(files, 'mobile').some(i => i.kind === 'launch-ready')).toBe(true)
    expect(runQaChecks(files, 'app').some(i => i.kind === 'launch-ready')).toBe(false)
  })
})

describe('store pack', () => {
  it('reads permissions, accounts, network and AI from the code', () => {
    const f = detectStoreFacts({
      'App.tsx': `import * as Location from 'expo-location'; import { useCameraPermissions } from 'expo-camera'; import { createClient } from '@supabase/supabase-js'; supabase.auth.signUp({}); fetch('https://api.openai.com/v1/x')`,
    }, 'Kirana')
    expect(f.permissions.location).toBe(true)
    expect(f.permissions.camera).toBe(true)
    expect(f.hasAccounts).toBe(true)
    expect(f.dataLeavesPhone).toBe(true)
    expect(f.usesAi).toBe(true)
    expect(f.permissions.contacts).toBe(false)
  })
  it('writes the base files, plus AI and account files only when they apply, and never claims compliance', () => {
    const plain = buildStorePack({ 'App.tsx': 'x' }, 'Plain')
    expect(Object.keys(plain).sort()).toEqual(['store/README.md', 'store/apple-privacy-and-age-rating.md', 'store/google-data-safety.md', 'store/listing.md', 'store/privacy-policy.md', 'store/release-checklist.md'])
    expect(plain['store/privacy-policy.md']).toMatch(/stores its data on your phone only/)
    const rich = buildStorePack({ 'App.tsx': `supabase.auth.signUp(); fetch('https://api.openai.com/v1'); import 'expo-location'` }, 'Rich')
    expect(Object.keys(rich)).toContain('store/ai-disclosure.md')
    expect(Object.keys(rich)).toContain('store/account-deletion.md')
    for (const text of Object.values(rich)) expect(text).not.toMatch(/GDPR compliant|SOC 2|fully compliant|is certified/i)
    expect(rich['store/release-checklist.md']).toMatch(/Android 16 \(API 36\)/)
    expect(rich['store/release-checklist.md']).toMatch(/Xcode 26/)
    expect(rich['store/README.md']).toMatch(/not legal advice/)
  })
  it('is added to the export zip for mobile projects', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/api/export/route.ts'), 'utf8')
    expect(src).toMatch(/buildStorePack\(files/)
  })
})
