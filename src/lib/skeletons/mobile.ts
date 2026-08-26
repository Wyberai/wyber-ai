export const MOBILE_SKELETON: Record<string, string> = {
  'theme.ts': `export const theme = {
  colors: {
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    accent: '#8B5CF6',
    background: '#09090B',
    surface: '#18181B',
    surfaceElevated: '#27272A',
    border: '#3F3F46',
    textPrimary: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    white: '#FFFFFF',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
  fontSize: { xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 32, display: 40 },
  fontWeight: { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const },
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  },
} as const`,

  'App.tsx': `import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import HomeScreen from './screens/HomeScreen'
import SearchScreen from './screens/SearchScreen'
import LibraryScreen from './screens/LibraryScreen'
import ProfileScreen from './screens/ProfileScreen'
import { theme } from './theme'

const Tab = createBottomTabNavigator()

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '⬛', Search: '🔍', Library: '📚', Profile: '👤' }
  return (
    <React.Fragment>
      {/* Replace with actual Expo vector icons */}
    </React.Fragment>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style="light" />
      <NavigationContainer theme={{ dark: true, colors: { primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.surface, text: theme.colors.textPrimary, border: theme.colors.border, notification: theme.colors.primary }, fonts: { regular: { fontFamily: 'System', fontWeight: '400' }, medium: { fontFamily: 'System', fontWeight: '500' }, bold: { fontFamily: 'System', fontWeight: '700' }, heavy: { fontFamily: 'System', fontWeight: '900' } } }}>
        <Tab.Navigator screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, paddingBottom: 8, paddingTop: 8, height: 64 },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarLabelStyle: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium, marginTop: 2 },
        }}>
          <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
          <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Discover' }} />
          <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'Library' }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}`,

  'screens/HomeScreen.tsx': `import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { theme } from '../theme'

const { width } = Dimensions.get('window')

const FEATURED = [
  { id: '1', title: 'Featured Item 1', subtitle: 'Category · 12 min', tag: 'New' },
  { id: '2', title: 'Featured Item 2', subtitle: 'Category · 8 min', tag: 'Popular' },
  { id: '3', title: 'Featured Item 3', subtitle: 'Category · 15 min', tag: 'Trending' },
]

const SECTIONS = [
  { id: 'rec', title: 'Recommended for You', items: ['Item A', 'Item B', 'Item C', 'Item D'] },
  { id: 'pop', title: 'Most Popular', items: ['Item E', 'Item F', 'Item G', 'Item H'] },
  { id: 'new', title: 'New This Week', items: ['Item I', 'Item J', 'Item K', 'Item L'] },
]

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>Alex 👋</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn}>
            <View style={styles.avatar}><Text style={styles.avatarText}>AJ</Text></View>
          </TouchableOpacity>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View>
            <Text style={styles.streakNumber}>7</Text>
            <Text style={styles.streakLabel}>Day streak</Text>
          </View>
          <View style={styles.streakRight}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakSubtext}>Keep it up!</Text>
          </View>
        </View>

        {/* Featured Carousel */}
        <Text style={styles.sectionTitle}>Today's Picks</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: theme.spacing.md, gap: 12 }}>
          {FEATURED.map(item => (
            <TouchableOpacity key={item.id} style={styles.featuredCard}>
              <View style={styles.featuredImage} />
              <View style={styles.featuredTag}><Text style={styles.featuredTagText}>{item.tag}</Text></View>
              <Text style={styles.featuredTitle}>{item.title}</Text>
              <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content Sections */}
        {SECTIONS.map(section => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: theme.spacing.md, gap: 10 }}>
              {section.items.map(item => (
                <TouchableOpacity key={item} style={styles.itemCard}>
                  <View style={styles.itemImage} />
                  <Text style={styles.itemTitle}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, paddingTop: 56, paddingBottom: 16 },
  greeting: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  name: { color: theme.colors.textPrimary, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold },
  avatarBtn: {},
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.colors.white, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold },
  streakCard: { marginHorizontal: theme.spacing.md, marginBottom: 20, backgroundColor: theme.colors.primary + '20', borderRadius: theme.radius.lg, padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.colors.primary + '40' },
  streakNumber: { color: theme.colors.primary, fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold },
  streakLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  streakRight: { alignItems: 'center' },
  streakEmoji: { fontSize: 28 },
  streakSubtext: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.md, marginBottom: 12 },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, paddingHorizontal: theme.spacing.md, marginBottom: 12 },
  seeAll: { color: theme.colors.primary, fontSize: theme.fontSize.sm },
  featuredCard: { width: width * 0.72, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
  featuredImage: { width: '100%', height: 140, backgroundColor: theme.colors.surfaceElevated },
  featuredTag: { position: 'absolute', top: 10, right: 10, backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  featuredTagText: { color: theme.colors.white, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold },
  featuredTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.semibold, padding: 12, paddingBottom: 4 },
  featuredSubtitle: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, paddingHorizontal: 12, paddingBottom: 12 },
  itemCard: { width: 130, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
  itemImage: { width: '100%', height: 90, backgroundColor: theme.colors.surfaceElevated },
  itemTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, padding: 8, paddingBottom: 10 },
})`,

  'screens/SearchScreen.tsx': `import { useState } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '../theme'

const CATEGORIES = ['All', 'Design', 'Development', 'Business', 'Marketing', 'Data', 'AI']
const TRENDING = ['React Native', 'TypeScript', 'UI Design', 'Machine Learning', 'Product Strategy']
const RESULTS = [
  { id: '1', title: 'Advanced React Patterns', cat: 'Development', rating: 4.8, duration: '4h 30m' },
  { id: '2', title: 'Design Systems at Scale', cat: 'Design', rating: 4.9, duration: '3h 15m' },
  { id: '3', title: 'Data-Driven Product', cat: 'Business', rating: 4.7, duration: '2h 45m' },
  { id: '4', title: 'AI for Developers', cat: 'AI', rating: 4.9, duration: '5h 20m' },
]

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const showResults = query.length > 0

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query} onChangeText={setQuery} placeholder="Search for anything..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}><Text style={styles.clearBtn}>✕</Text></TouchableOpacity>
          )}
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {!showResults ? (
          <View style={{ paddingBottom: 24 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: theme.spacing.md, gap: 8, paddingBottom: 4 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
                  style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}>
                  <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trending searches</Text>
              {TRENDING.map((t, i) => (
                <TouchableOpacity key={i} onPress={() => setQuery(t)} style={styles.trendingItem}>
                  <Text style={styles.trendingRank}>{i + 1}</Text>
                  <Text style={styles.trendingText}>{t}</Text>
                  <Text style={styles.trendingArrow}>↗</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: 24 }}>
            <Text style={styles.resultsLabel}>{RESULTS.length} results for "{query}"</Text>
            {RESULTS.map(r => (
              <TouchableOpacity key={r.id} style={styles.resultCard}>
                <View style={styles.resultImage} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle}>{r.title}</Text>
                  <Text style={styles.resultMeta}>{r.cat}</Text>
                  <View style={styles.resultFooter}>
                    <Text style={styles.resultRating}>★ {r.rating}</Text>
                    <Text style={styles.resultDuration}>{r.duration}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingTop: 56, paddingHorizontal: theme.spacing.md, paddingBottom: 16 },
  title: { color: theme.colors.textPrimary, fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.border, gap: 8 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: theme.colors.textPrimary, fontSize: theme.fontSize.base },
  clearBtn: { color: theme.colors.textMuted, fontSize: 12, padding: 2 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: theme.radius.full, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  categoryChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  categoryText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
  categoryTextActive: { color: theme.colors.white },
  section: { paddingHorizontal: theme.spacing.md, paddingTop: 20 },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, marginBottom: 12 },
  trendingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border + '50', gap: 12 },
  trendingRank: { color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, width: 20 },
  trendingText: { flex: 1, color: theme.colors.textPrimary, fontSize: theme.fontSize.base },
  trendingArrow: { color: theme.colors.textMuted, fontSize: 16 },
  resultsLabel: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 16 },
  resultCard: { flexDirection: 'row', gap: 12, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
  resultImage: { width: 72, height: 72, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceElevated, flexShrink: 0 },
  resultInfo: { flex: 1 },
  resultTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.semibold, marginBottom: 4 },
  resultMeta: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 8 },
  resultFooter: { flexDirection: 'row', gap: 12 },
  resultRating: { color: theme.colors.warning, fontSize: theme.fontSize.sm },
  resultDuration: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
})`,

  'screens/LibraryScreen.tsx': `import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '../theme'

const PROGRESS_ITEMS = [
  { id: '1', title: 'Current Course Title', progress: 0.65, remaining: '1h 20m left', streak: 5 },
  { id: '2', title: 'Another Learning Track', progress: 0.3, remaining: '3h 10m left', streak: 2 },
]
const SAVED = [
  { id: '3', title: 'Saved Item A', cat: 'Design' },
  { id: '4', title: 'Saved Item B', cat: 'Development' },
  { id: '5', title: 'Saved Item C', cat: 'Business' },
]
const HISTORY = [
  { id: '6', title: 'Completed Course 1', date: 'Aug 20', rating: 5 },
  { id: '7', title: 'Completed Course 2', date: 'Aug 15', rating: 4 },
]

export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Library</Text>
        <View style={styles.stats}>
          {[{ label: 'Completed', value: '12' }, { label: 'In Progress', value: '3' }, { label: 'Saved', value: '8' }].map(s => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          {PROGRESS_ITEMS.map(item => (
            <TouchableOpacity key={item.id} style={styles.progressCard}>
              <View style={styles.progressThumb} />
              <View style={styles.progressInfo}>
                <Text style={styles.progressTitle}>{item.title}</Text>
                <Text style={styles.progressRemaining}>{item.remaining}</Text>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: \`\${item.progress * 100}%\` }]} /></View>
                <Text style={styles.progressPct}>{Math.round(item.progress * 100)}% complete</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved for Later</Text>
          {SAVED.map(item => (
            <TouchableOpacity key={item.id} style={styles.savedCard}>
              <View style={styles.savedThumb} />
              <View style={styles.savedInfo}>
                <Text style={styles.savedTitle}>{item.title}</Text>
                <Text style={styles.savedCat}>{item.cat}</Text>
              </View>
              <Text style={styles.savedArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed</Text>
          {HISTORY.map(item => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.checkBadge}><Text style={styles.checkIcon}>✓</Text></View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>{item.title}</Text>
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>
              <Text style={styles.historyRating}>{'★'.repeat(item.rating)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingTop: 56, paddingHorizontal: theme.spacing.md, paddingBottom: 16 },
  title: { color: theme.colors.textPrimary, fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, marginBottom: 16 },
  stats: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 12, gap: 0 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: theme.colors.primary, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold },
  statLabel: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: 2 },
  section: { paddingHorizontal: theme.spacing.md, marginBottom: 20 },
  sectionTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, marginBottom: 12 },
  progressCard: { flexDirection: 'row', gap: 12, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
  progressThumb: { width: 60, height: 60, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceElevated, flexShrink: 0 },
  progressInfo: { flex: 1 },
  progressTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.semibold, marginBottom: 2 },
  progressRemaining: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 8 },
  progressBar: { height: 4, backgroundColor: theme.colors.surfaceElevated, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, backgroundColor: theme.colors.primary, borderRadius: 2 },
  progressPct: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
  savedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border + '40' },
  savedThumb: { width: 44, height: 44, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  savedInfo: { flex: 1 },
  savedTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.medium },
  savedCat: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  savedArrow: { color: theme.colors.textMuted, fontSize: 20 },
  historyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border + '40' },
  checkBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.success + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.success + '40' },
  checkIcon: { color: theme.colors.success, fontSize: 13, fontWeight: theme.fontWeight.bold },
  historyInfo: { flex: 1 },
  historyTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.medium },
  historyDate: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  historyRating: { color: theme.colors.warning, fontSize: 12 },
})`,

  'screens/ProfileScreen.tsx': `import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native'
import { theme } from '../theme'

const MENU_SECTIONS = [
  {
    title: 'Account', items: [
      { icon: '📧', label: 'Email', value: 'alex@example.com' },
      { icon: '🔐', label: 'Password', value: '••••••••' },
      { icon: '💳', label: 'Subscription', value: 'Pro Plan' },
    ],
  },
  {
    title: 'Preferences', items: [
      { icon: '🌙', label: 'Dark Mode', toggle: true, defaultOn: true },
      { icon: '🔔', label: 'Push Notifications', toggle: true, defaultOn: true },
      { icon: '🌍', label: 'Language', value: 'English' },
    ],
  },
  {
    title: 'Support', items: [
      { icon: '❓', label: 'Help Center', value: '' },
      { icon: '💬', label: 'Contact Support', value: '' },
      { icon: '⭐', label: 'Rate the App', value: '' },
    ],
  },
]

export default function ProfileScreen() {
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)

  const getToggleState = (label: string) => label === 'Dark Mode' ? darkMode : notifications
  const handleToggle = (label: string, val: boolean) => {
    if (label === 'Dark Mode') setDarkMode(val)
    else setNotifications(val)
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarLgText}>AJ</Text>
          </View>
          <Text style={styles.userName}>Alex Johnson</Text>
          <Text style={styles.userEmail}>alex@example.com</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planText}>✦ Pro Member</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[{ label: 'Streak', value: '7 days 🔥' }, { label: 'Completed', value: '12' }, { label: 'XP Earned', value: '2,450' }].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {MENU_SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuGroup}>
              {section.items.map((item, i) => (
                <TouchableOpacity key={item.label} style={[styles.menuItem, i < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={() => !item.toggle && Alert.alert(item.label)}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <View style={styles.menuRight}>
                    {item.toggle ? (
                      <Switch value={getToggleState(item.label)} onValueChange={val => handleToggle(item.label, val)}
                        trackColor={{ false: theme.colors.surfaceElevated, true: theme.colors.primary }}
                        thumbColor={theme.colors.white} />
                    ) : item.value ? (
                      <Text style={styles.menuValue}>{item.value}</Text>
                    ) : (
                      <Text style={styles.menuArrow}>›</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.signOutBtn} onPress={() => Alert.alert('Sign out', 'Are you sure you want to sign out?', [{ text: 'Cancel' }, { text: 'Sign out', style: 'destructive' }])}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { alignItems: 'center', paddingTop: 56, paddingBottom: 20, paddingHorizontal: theme.spacing.md },
  avatarLg: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarLgText: { color: theme.colors.white, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold },
  userName: { color: theme.colors.textPrimary, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, marginBottom: 4 },
  userEmail: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginBottom: 12 },
  planBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: theme.radius.full, backgroundColor: theme.colors.primary + '20', borderWidth: 1, borderColor: theme.colors.primary + '40' },
  planText: { color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
  statsRow: { flexDirection: 'row', paddingHorizontal: theme.spacing.md, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  statVal: { color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.bold },
  statLbl: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: 2 },
  section: { paddingHorizontal: theme.spacing.md, marginBottom: 16 },
  sectionTitle: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  menuGroup: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border + '60' },
  menuIcon: { fontSize: 18, width: 24 },
  menuLabel: { flex: 1, color: theme.colors.textPrimary, fontSize: theme.fontSize.base },
  menuRight: {},
  menuValue: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  menuArrow: { color: theme.colors.textMuted, fontSize: 20 },
  signOutBtn: { marginHorizontal: theme.spacing.md, marginTop: 8, paddingVertical: 14, borderRadius: theme.radius.md, backgroundColor: theme.colors.error + '15', borderWidth: 1, borderColor: theme.colors.error + '30', alignItems: 'center' },
  signOutText: { color: theme.colors.error, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.semibold },
})`,
}
