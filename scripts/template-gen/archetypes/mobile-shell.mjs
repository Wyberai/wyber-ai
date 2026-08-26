// mobile-shell archetype — a real Expo/React Native app matching
// buildMobileSystemPrompt()'s mandatory conventions (src/app/api/generate/
// route.ts): bottom-tab navigation only, StyleSheet.create() styling off a
// single theme.ts, an "intelligence-first" home screen layout (greeting →
// AI insight card → KPI row → action items → recent activity), a searchable
// primary-feature list screen with swipe-to-delete + offline-first sync, a
// Settings screen, haptic feedback, voice-input affordance, and a biometric
// resume-lock. expo-haptics / expo-local-authentication / expo-speech /
// @react-native-async-storage/async-storage / react-native-gesture-handler's
// Swipeable are all real-shimmed by src/app/api/rn-web-bundle/route.ts (see
// its NATIVE_NOOP_MODULES / GESTURE_SHIM_SOURCE / ASYNC_STORAGE_SHIM_SOURCE) —
// safe in both the in-app web preview and a real Expo build.
//
// config shape mirrors the SaaS one where it overlaps:
// { appName, tagline, navIcon, primaryFeatureLabel, primaryFeatureSingular,
//   greetingName, greetingInsight, insightCard, kpis:[{label,value,suffix?,delta?}] (3-4),
//   actionItems:[{title, detail, tone}] (2-4), activity:[{label,time}] (5),
//   primaryTable:{ columns:[label,label], filters:[..], rows:[{cells,status}] } }

function esc(s) { return String(s).replace(/'/g, "\\'") }

export function themeFileAlreadyBuiltElsewhere() { /* see lib/rn-theme.mjs */ }

// Offline-first data: reads local state instantly (AsyncStorage-backed, real
// web shim via ASYNC_STORAGE_SHIM_SOURCE), syncs in the background. Data
// never disappears — network/sync is additive only, per buildMobileSystemPrompt.
export function offlineSyncHookFile() {
  return `import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function useOfflineSync<T extends { id: string }>(storageKey: string, seed: T[]) {
  const [items, setItems] = useState<T[]>(seed)
  const [syncQueue, setSyncQueue] = useState<string[]>([])

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((v) => { if (v) setItems(JSON.parse(v)) })
  }, [storageKey])

  useEffect(() => {
    if (syncQueue.length === 0) return
    const t = setTimeout(() => setSyncQueue([]), 1200)
    return () => clearTimeout(t)
  }, [syncQueue])

  const removeItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id)
      AsyncStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
    setSyncQueue((q) => [...q, id])
  }

  return { items, removeItem, syncing: syncQueue.length > 0, syncCount: syncQueue.length }
}
`
}

export function componentsFile() {
  return `import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import * as Haptics from 'expo-haptics'
import * as Speech from 'expo-speech'
import { theme } from '../theme'

export function Card({ children, style }: { children?: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Badge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const map = {
    default: { bg: theme.accentLight, fg: theme.accent },
    success: { bg: theme.successBg, fg: theme.success },
    warning: { bg: theme.warningBg, fg: theme.warning },
    danger: { bg: theme.dangerBg, fg: theme.danger },
  } as const
  const c = map[tone]
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  )
}

export function StatCard({ label, value, suffix, delta }: { label: string; value: string | number; suffix?: string; delta?: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}{suffix || ''}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {typeof delta === 'number' && (
        <Text style={[styles.statDelta, { color: delta >= 0 ? theme.success : theme.danger }]}>
          {delta >= 0 ? '↑' : '↓'}{Math.abs(delta)}%
        </Text>
      )}
    </View>
  )
}

export function EmptyState({ icon, title, description }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={40} color={theme.textMuted} style={{ opacity: 0.4 }} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  )
}

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const [recording, setRecording] = useState(false)
  const handleMicPress = () => {
    setRecording(true)
    Speech.speak('Listening...')
    setTimeout(() => {
      setRecording(false)
      onChangeText(value + ' [voice input: describe what to search for and it will appear]')
    }, 2000)
  }
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={16} color={theme.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        style={styles.searchInput}
      />
      <TouchableOpacity onPress={handleMicPress} style={[styles.micButton, recording && { backgroundColor: theme.dangerBg }]}>
        <Ionicons name={recording ? 'stop-circle' : 'mic-outline'} size={18} color={recording ? theme.danger : theme.accent} />
      </TouchableOpacity>
    </View>
  )
}

export function ListItem({ title, subtitle, meta, status, statusTone, onDelete }: {
  title: string; subtitle: string; meta: string; status: string; statusTone: 'default' | 'success' | 'warning' | 'danger'; onDelete?: () => void
}) {
  const renderRightActions = () => (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete?.() }}
      style={styles.deleteAction}
    >
      <Ionicons name="trash-outline" size={20} color="#fff" />
    </TouchableOpacity>
  )
  const row = (
    <View style={styles.listItem}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{title.slice(0, 2).toUpperCase()}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.listItemTitle}>{title}</Text>
        <Text style={styles.listItemSubtitle}>{subtitle}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Badge label={status} tone={statusTone} />
        <Text style={styles.listItemMeta}>{meta}</Text>
      </View>
    </View>
  )
  if (!onDelete) return row
  return <Swipeable renderRightActions={renderRightActions}>{row}</Swipeable>
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 16, borderWidth: 1, borderColor: theme.border },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  statCard: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 16, width: 140, borderWidth: 1, borderColor: theme.border },
  statValue: { fontSize: 26, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  statDelta: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginTop: 12 },
  emptyDescription: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: theme.border },
  searchInput: { flex: 1, fontSize: 14, color: theme.text },
  micButton: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accentLight },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: theme.surface, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: theme.border, gap: 12 },
  deleteAction: { backgroundColor: theme.danger, justifyContent: 'center', alignItems: 'center', width: 72, borderRadius: 14, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: theme.onAccent },
  listItemTitle: { fontSize: 15, fontWeight: '600', color: theme.text },
  listItemSubtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  listItemMeta: { fontSize: 11, color: theme.textMuted },
})
`
}

export function homeScreenFile(config) {
  const kpiCards = config.kpis.map((k) =>
    `        <StatCard label="${k.label}" value={${typeof k.value === 'number' ? k.value : `'${k.value}'`}}${k.suffix ? ` suffix="${k.suffix}"` : ''}${typeof k.delta === 'number' ? ` delta={${k.delta}}` : ''} />`,
  ).join('\n')

  const actionItems = config.actionItems.map((a) => `
        <View style={[styles.actionCard, { borderLeftColor: theme.${a.tone} }]}>
          <Text style={styles.actionTitle}>${a.title}</Text>
          <Text style={styles.actionDetail}>${a.detail}</Text>
        </View>`).join('\n')

  const activityItems = config.activity.map((a) => `
        <View style={styles.activityRow}>
          <View style={styles.activityDot} />
          <Text style={styles.activityText}>${a.label}</Text>
          <Text style={styles.activityTime}>${a.time}</Text>
        </View>`).join('\n')

  return `import { ScrollView, View, Text, StyleSheet, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '../theme'
import { StatCard } from '../components/ui'

export default function HomeScreen() {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar backgroundColor={theme.bg} barStyle="${config.mode === 'dark' ? 'light-content' : 'dark-content'}" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>{greeting}, ${esc(config.greetingName.split(' ')[0])}.</Text>
        <Text style={styles.greetingSub}>${config.greetingInsight}</Text>

        <View style={styles.insightCard}>
          <Text style={styles.insightSpark}>✦</Text>
          <Text style={styles.insightText}>${config.insightCard}</Text>
        </View>

        <Text style={styles.sectionLabel}>OVERVIEW</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
${kpiCards}
        </ScrollView>

        <Text style={styles.sectionLabel}>NEEDS ATTENTION</Text>
        <View style={{ gap: 10 }}>${actionItems}
        </View>

        <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
        <View style={styles.card}>${activityItems}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  greeting: { fontSize: 28, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
  greetingSub: { fontSize: 14, color: theme.textSecondary, marginTop: 6, lineHeight: 20 },
  insightCard: { flexDirection: 'row', gap: 10, backgroundColor: theme.accentLight, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 1, borderColor: theme.accent + '33' },
  insightSpark: { fontSize: 16, color: theme.accent },
  insightText: { flex: 1, fontSize: 13, color: theme.text, lineHeight: 19 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 28, marginBottom: 12 },
  actionCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 14, borderLeftWidth: 4, borderWidth: 1, borderColor: theme.border },
  actionTitle: { fontSize: 14, fontWeight: '600', color: theme.text },
  actionDetail: { fontSize: 12, color: theme.textSecondary, marginTop: 3 },
  card: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 16, borderWidth: 1, borderColor: theme.border },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  activityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent },
  activityText: { flex: 1, fontSize: 13, color: theme.text },
  activityTime: { fontSize: 11, color: theme.textMuted },
})
`
}

function statusVariant(status) {
  const s = status.toLowerCase()
  if (s.includes('active') || s.includes('open') || s.includes('progress')) return 'default'
  if (s.includes('pending') || s.includes('review') || s.includes('waiting')) return 'warning'
  if (s.includes('closed') || s.includes('done') || s.includes('complete')) return 'success'
  return 'default'
}

export function primaryFeatureScreenFile(config) {
  const { primaryFeatureLabel, primaryFeatureSingular, primaryTable } = config
  const seedData = JSON.stringify(primaryTable.rows.map((r, i) => ({ ...r, id: String(i) })))

  return `import { useMemo, useState } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { theme } from '../theme'
import { SearchBar, ListItem, EmptyState } from '../components/ui'
import { useOfflineSync } from '../hooks/useOfflineSync'

const SEED = ${seedData}

function statusTone(status: string): 'default' | 'success' | 'warning' | 'danger' {
  const s = status.toLowerCase()
  if (s.includes('active') || s.includes('open') || s.includes('progress')) return 'default'
  if (s.includes('pending') || s.includes('review') || s.includes('waiting')) return 'warning'
  if (s.includes('closed') || s.includes('done') || s.includes('complete')) return 'success'
  return 'default'
}

export default function ${config.primaryFeaturePascal}Screen() {
  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const { items, removeItem, syncing, syncCount } = useOfflineSync('${config.primaryFeaturePascal.toLowerCase()}_rows', SEED)

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter((r) => r.cells.some((c: string) => c.toLowerCase().includes(q)))
  }, [query, items])

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 700)
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {syncing && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerText}>Syncing {syncCount} change{syncCount === 1 ? '' : 's'}...</Text>
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.title}>${esc(primaryFeatureLabel)}</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search ${esc(primaryFeatureLabel.toLowerCase())}..." />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        ListEmptyComponent={
          <EmptyState icon="search-outline" title="No ${esc(primaryFeatureLabel.toLowerCase())} match your search" description="Try a different search term." />
        }
        renderItem={({ item }) => (
          <ListItem
            title={item.cells[0]}
            subtitle={item.cells[1]}
            meta={item.cells[item.cells.length - 1]}
            status={item.status}
            statusTone={statusTone(item.status)}
            onDelete={() => removeItem(item.id)}
          />
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  syncBanner: { backgroundColor: theme.warningBg, paddingVertical: 6, alignItems: 'center' },
  syncBannerText: { fontSize: 11, fontWeight: '700', color: theme.warning },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
  count: { fontSize: 13, fontWeight: '700', color: theme.textMuted },
})
`
}

export function settingsScreenFile(config) {
  return `import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { theme } from '../theme'

const ROWS: { icon: keyof typeof Ionicons.glyphMap; label: string; detail: string }[] = [
  { icon: 'person-outline', label: 'Profile', detail: '${esc(config.greetingName)}' },
  { icon: 'notifications-outline', label: 'Notifications', detail: 'Push & email' },
  { icon: 'card-outline', label: 'Billing', detail: 'Manage plan' },
  { icon: 'people-outline', label: 'Team', detail: 'Manage members' },
  { icon: 'help-circle-outline', label: 'Help & Support', detail: 'Get in touch' },
]

export default function SettingsScreen() {
  const [biometrics, setBiometrics] = useState(true)
  const onRowPress = () => Haptics.selectionAsync()

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Settings</Text>
      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        <View style={styles.row}>
          <View style={styles.iconWrap}><Ionicons name="shield-checkmark-outline" size={18} color={theme.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Use biometrics</Text>
            <Text style={styles.rowDetail}>Unlock with Face ID or fingerprint</Text>
          </View>
          <Switch
            value={biometrics}
            onValueChange={(v) => { Haptics.selectionAsync(); setBiometrics(v) }}
            trackColor={{ true: theme.accent, false: theme.border }}
          />
        </View>
        {ROWS.map((r) => (
          <TouchableOpacity key={r.label} activeOpacity={0.7} style={styles.row} onPress={onRowPress}>
            <View style={styles.iconWrap}><Ionicons name={r.icon} size={18} color={theme.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowDetail}>{r.detail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, letterSpacing: -0.5, paddingHorizontal: 20, paddingTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: theme.surface, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  iconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: theme.accentLight, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '600', color: theme.text },
  rowDetail: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
})
`
}

// Biometric resume-lock: on app foreground after 5+ min backgrounded, prompt
// Face ID / fingerprint if the device supports it. Never a permanent block —
// unsupported hardware, no enrollment, or a cancelled prompt all just unlock,
// so the app is never stuck behind a lock screen it can't pass in a preview
// or simulator with no biometrics configured.
export function biometricGateFile() {
  return `import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, AppState, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as LocalAuthentication from 'expo-local-authentication'
import { theme } from '../theme'

const LOCK_AFTER_MS = 5 * 60 * 1000

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false)
  const backgroundedAt = useRef<number | null>(null)

  const tryUnlock = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      if (!hasHardware || !enrolled) { setLocked(false); return }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock to continue' })
      setLocked(!result.success)
    } catch {
      setLocked(false)
    }
  }

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAt.current = Date.now()
      } else if (state === 'active' && backgroundedAt.current) {
        const elapsed = Date.now() - backgroundedAt.current
        backgroundedAt.current = null
        if (elapsed >= LOCK_AFTER_MS) { setLocked(true); tryUnlock() }
      }
    })
    return () => sub.remove()
  }, [])

  if (!locked) return <>{children}</>

  return (
    <View style={styles.overlay}>
      <Ionicons name="lock-closed" size={36} color={theme.accent} />
      <Text style={styles.title}>Locked</Text>
      <Text style={styles.subtitle}>Unlock with Face ID or fingerprint to continue.</Text>
      <TouchableOpacity style={styles.button} onPress={tryUnlock}>
        <Text style={styles.buttonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  title: { fontSize: 20, fontWeight: '800', color: theme.text, marginTop: 8 },
  subtitle: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', lineHeight: 19 },
  button: { marginTop: 16, backgroundColor: theme.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { fontSize: 14, fontWeight: '700', color: theme.onAccent },
})
`
}

export function appFile(config) {
  return `import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { theme } from './theme'
import { BiometricGate } from './components/BiometricGate'
import HomeScreen from './screens/HomeScreen'
import ${config.primaryFeaturePascal}Screen from './screens/${config.primaryFeaturePascal}Screen'
import SettingsScreen from './screens/SettingsScreen'

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BiometricGate>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: theme.accent,
              tabBarInactiveTintColor: theme.textMuted,
              tabBarStyle: { backgroundColor: theme.bg, borderTopColor: theme.border, borderTopWidth: 1 },
              tabBarIcon: ({ color, size }) => {
                const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
                  Home: 'home', ${config.primaryFeaturePascal}: '${config.navIcon}', Settings: 'settings',
                }
                return <Ionicons name={(icons[route.name] || 'ellipse') as keyof typeof Ionicons.glyphMap} size={size} color={color} />
              },
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="${config.primaryFeaturePascal}" component={${config.primaryFeaturePascal}Screen} options={{ title: '${esc(config.primaryFeatureLabel)}' }} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
        </BiometricGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
`
}
