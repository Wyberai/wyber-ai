import { getMobileDirectionById, type MobileDirection } from '../mobile-directions'
import type { AppEntity, AppModel } from '../app-spec/types'
import { MOBILE_KIT_SOURCE } from './kit'
import { API_TS, DB_TS, LOGIC_TS, PRESENT_TS } from './runtime-core'
import { DETAIL_TSX, FORM_TSX, HOME_TSX, LIST_TSX, ROW_ITEM_TSX, SETTINGS_TSX, SETUP_TSX } from './runtime-screens'
import type { MobileSpec } from './plan'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app'

type IconName = 'receipt' | 'calendar' | 'people' | 'box' | 'wallet' | 'list'
const ICONS: [RegExp, IconName][] = [
  [/bill|invoice|payment|receipt|udhaar|khata/, 'receipt'],
  [/appointment|booking|slot|session|class|visit|schedule/, 'calendar'],
  [/member|client|patient|customer|lead|student|tenant|people|contact/, 'people'],
  [/stock|item|product|inventory|order/, 'box'],
  [/expense|spend|wallet|money|fee|price|plan/, 'wallet'],
]
const isChild = (e: AppEntity) => e.fields.some(f => f.type === 'ref') && !e.status && !e.due
const iconFor = (e: AppEntity): IconName => (isChild(e) ? 'list' : ICONS.find(([re]) => re.test((e.label + ' ' + e.singular).toLowerCase()))?.[1] ?? 'list')

/** "28/700, tracking -0.4" style strings from the mobile directions, as numbers. */
export function parseTypeSpec(s: string): { size: number; weight: string; tracking: number; lineHeight?: number; upper: boolean; tabular: boolean } {
  const size = Number(/^\s*(\d+(?:\.\d+)?)/.exec(s)?.[1] ?? 16)
  const weight = /\/(\d{3})/.exec(s)?.[1] ?? '400'
  const tracking = Number(/tracking\s+(-?\d+(?:\.\d+)?)/.exec(s)?.[1] ?? 0)
  const lh = /line-height\s+(\d+)/.exec(s)?.[1]
  return { size, weight, tracking, lineHeight: lh ? Number(lh) : undefined, upper: /uppercase/.test(s), tabular: /tabular/.test(s) }
}

export function renderTheme(d: MobileDirection): string {
  const t = d.theme
  const title = parseTypeSpec(d.type.title)
  const num = parseTypeSpec(d.type.number)
  const body = parseTypeSpec(d.type.body)
  const label = parseTypeSpec(d.type.label)
  const lh = (size: number, k: number) => Math.round(size * k)
  const captionSize = Math.max(12, body.size - 2)
  const font = d.type.serif ? "Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' })" : 'undefined'
  return `// Design tokens for the "${d.name}" direction. Every screen reads these; no colour or size is written anywhere else.
${d.type.serif ? "import { Platform, type TextStyle } from 'react-native'" : "import type { TextStyle } from 'react-native'"}

export const theme = {
  mode: '${d.mode}' as 'light' | 'dark',
  bg: '${t.bg}',
  surface: '${t.surface}',
  elevated: '${t.elevated}',
  border: '${t.border}',
  text: '${t.text}',
  textSecondary: '${t.textSecondary}',
  textMuted: '${t.textMuted}',
  accent: '${t.accent}',
  onAccent: '${t.onAccent}',
  success: '${t.success}',
  warning: '${t.warning}',
  danger: '${t.danger}',
  radius: ${t.radius},
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }

/** The platform serif where the direction asks for one (titles and reading text); undefined means the system font. */
export const serifFamily: string | undefined = ${font}

type Size = TextStyle & { fontSize: number }
export const type: { title: Size; number: Size; body: Size; caption: Size; label: Size } = {
  title: { fontSize: ${title.size}, fontWeight: '${title.weight}', letterSpacing: ${title.tracking}, lineHeight: ${lh(title.size, 1.2)}${/uppercase/.test(d.type.title) ? ", textTransform: 'uppercase'" : ''} },
  number: { fontSize: ${num.size}, fontWeight: '${num.weight}', letterSpacing: ${num.tracking}, lineHeight: ${lh(num.size, 1.15)}, fontVariant: ['tabular-nums'] },
  body: { fontSize: ${body.size}, fontWeight: '${body.weight}', lineHeight: ${body.lineHeight ?? lh(body.size, 1.45)} },
  caption: { fontSize: ${captionSize}, fontWeight: '400', lineHeight: ${lh(captionSize, 1.4)} },
  label: { fontSize: ${label.size}, fontWeight: '${label.weight}', letterSpacing: ${label.tracking}, lineHeight: ${lh(label.size, 1.4)}${label.upper ? ", textTransform: 'uppercase'" : ''} },
}
`
}

export function renderSchema(spec: MobileSpec, model: AppModel, currency: string): string {
  const app = {
    id: slug(model.appName), name: model.appName, tagline: model.tagline, homeIntro: model.homeIntro, currency, version: '1.0.0',
    layout: spec.layout, entities: model.entities, metrics: model.metrics,
  }
  const icons = Object.fromEntries(model.entities.map(e => [e.id, iconFor(e)]))
  return `// The shape of this app, as data. The screens in screens/ read it.
import type { IconName } from './components/ui'

export type FieldType = 'text' | 'longtext' | 'number' | 'money' | 'date' | 'phone' | 'select' | 'ref' | 'checkbox'
export interface Field { id: string; label: string; type: FieldType; options?: string[]; ref?: string; required?: boolean; list?: boolean }
export interface Computed { id: string; label: string; kind: 'sumChild'; entity: string; field: string; ref: string }
export interface Entity {
  id: string; label: string; singular: string; title: string; blurb: string; fields: Field[]; computed?: Computed[]
  status?: string; due?: string; amount?: string; contact?: string; finalStatuses?: string[]
  sample: Record<string, string | number | boolean>[]
}
export interface Metric {
  id: string; label: string; kind: 'count' | 'sum' | 'countWhere' | 'sumWhere'; entity: string; field?: string
  where?: { field: string; op: 'eq' | 'neq' | 'overdue'; value?: string }; money?: boolean
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any> & { id: string; demo?: boolean }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Draft = Record<string, any>

export const APP: {
  id: string; name: string; tagline: string; homeIntro: string; currency: string; version: string
  layout: { structure: 'tabs-feed' | 'tool-first' | 'tabs-dashboard' | 'cards-swipe' | 'split-list' | 'sheet-nav'; rows: 'plain' | 'cards'; density: 'compact' | 'roomy'; add: 'fab' | 'header'; titles: 'large' | 'compact' }
  entities: Entity[]; metrics: Metric[]
} = ${JSON.stringify(app, null, 2)}

export const ENTITY_ICONS: Record<string, IconName> = ${JSON.stringify(icons)}
`
}

/** Tabs for the bottom bar: Home, up to three main sections, Settings. A menu-sheet app has no bar. */
export function tabsFor(spec: MobileSpec, model: AppModel): { id: string; label: string; icon: string }[] {
  if (spec.layout.structure === 'sheet-nav') return []
  const main = model.entities.filter(e => !isChild(e)).slice(0, 3)
  return [
    { id: 'home', label: 'Home', icon: 'home' },
    ...main.map(e => ({ id: e.id, label: e.label, icon: iconFor(e) })),
    { id: 'settings', label: 'Settings', icon: 'shield' },
  ]
}

export function renderAppTsx(spec: MobileSpec, model: AppModel): string {
  const tabs = tabsFor(spec, model)
  const tabsJs = tabs.map(t => `  { id: ${JSON.stringify(t.id)}, label: ${JSON.stringify(t.label)}, icon: ${JSON.stringify(t.icon)} as TabItem['icon'] }`).join(',\n')
  return `import React, { useEffect, useRef, useState } from 'react'
import { BackHandler, StatusBar, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { APP, type Row } from './schema'
import { theme } from './theme'
import { create, emptyStore, loadStore, remove, restore, saveStore, update, wipeStore, type Store } from './lib/db'
import { entityOf, titleOf, withSample, withoutSample } from './lib/logic'
import type { Api, Route } from './lib/api'
import { EmptyState, Header, Screen, Skeleton, TabBar, UndoBar, type TabItem } from './components/ui'
import Setup from './screens/Setup'
import Home from './screens/Home'
import EntityList from './screens/EntityList'
import Detail from './screens/Detail'
import Form from './screens/Form'
import Settings from './screens/Settings'

const TABS: TabItem[] = [
${tabsJs}
]

type Removed = { entity: string; rows: Row[] }[]

function Root() {
  const [store, setStore] = useState<Store>(emptyStore())
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [saved, setSaved] = useState(true)
  const [tab, setTab] = useState('home')
  const [stack, setStack] = useState<Route[]>([])
  const [undo, setUndo] = useState<{ message: string; removed: Removed } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const latest = useRef(store)
  const timers = useRef<{ undo?: ReturnType<typeof setTimeout>; toast?: ReturnType<typeof setTimeout> }>({})

  const commit = (next: Store) => { latest.current = next; setStore(next) }
  const open = () => {
    setStatus('loading')
    loadStore().then(s => { commit(s); setStatus('ready') }).catch(() => setStatus('error'))
  }
  useEffect(open, [])
  useEffect(() => {
    if (status === 'ready') saveStore(store).then(setSaved)
  }, [store, status])

  const pop = () => setStack(s => s.slice(0, -1))
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length) { pop(); return true }
      if (TABS.length && tab !== 'home') { setTab('home'); return true }
      return false
    })
    return () => sub.remove()
  }, [stack.length, tab])

  const notify = (message: string) => {
    setToast(message)
    if (timers.current.toast) clearTimeout(timers.current.toast)
    timers.current.toast = setTimeout(() => setToast(null), 3500)
  }

  const api: Api = {
    store, tab, tabs: TABS.map(t => t.id), saved,
    go: t => { setTab(t); setStack([]) },
    push: r => setStack(s => [...s, r]),
    pop,
    create: (entity, row) => {
      if (!entityOf(entity)) return undefined
      const made = create(latest.current, entity, row)
      commit(made.store)
      return made.row
    },
    update: (entity, id, patch) => commit(update(latest.current, entity, id, patch)),
    remove: (entity, id) => {
      const e = entityOf(entity)
      const gone = remove(latest.current, entity, [id])
      if (!e || gone.removed.length === 0) return
      const first = gone.removed[0].rows[0]
      commit(gone.store)
      setUndo({ message: 'Deleted ' + (titleOf(e, first) || e.singular.toLowerCase()), removed: gone.removed })
      if (timers.current.undo) clearTimeout(timers.current.undo)
      timers.current.undo = setTimeout(() => setUndo(null), 8000)
    },
    loadSample: () => commit(withSample(latest.current)),
    removeSample: () => commit(withoutSample(latest.current)),
    setBusinessName: name => commit({ ...latest.current, settings: { ...latest.current.settings, businessName: name } }),
    finishSetup: (name, withDemo) => {
      const base: Store = { ...latest.current, settings: { businessName: name.trim(), setupDone: true } }
      commit(withDemo ? withSample(base) : base)
    },
    wipe: async () => {
      commit(await wipeStore())
      setStack([])
      setTab('home')
      setUndo(null)
    },
    notify,
  }

  const undoDelete = () => {
    if (!undo) return
    commit(restore(latest.current, undo.removed))
    setUndo(null)
  }

  let screen: React.ReactNode
  const top = stack[stack.length - 1]
  if (status === 'loading') {
    screen = <Screen><Header title={APP.name} /><Skeleton rows={6} /></Screen>
  } else if (status === 'error') {
    screen = <Screen><EmptyState title="Could not open your saved data" body="Your records are still on this phone. Check that the phone has free storage, then try again." actionLabel="Try again" onAction={open} /></Screen>
  } else if (!store.settings.setupDone) {
    screen = <Setup api={api} />
  } else if (top && top.kind === 'detail') {
    const e = entityOf(top.entity)
    screen = e ? <Detail key={top.id} api={api} entity={e} id={top.id} /> : null
  } else if (top && top.kind === 'form') {
    const e = entityOf(top.entity)
    screen = e ? <Form key={top.entity + (top.id || 'new')} api={api} entity={e} id={top.id} preset={top.preset} /> : null
  } else if (top && top.kind === 'settings') {
    screen = <Settings api={api} pushed />
  } else if (top && top.kind === 'list') {
    const e = entityOf(top.entity)
    screen = e ? <EntityList key={top.entity + (top.overdue ? 'o' : '')} api={api} entity={e} overdue={top.overdue} pushed /> : null
  } else if (tab === 'settings') {
    screen = <Settings api={api} pushed={false} />
  } else if (tab !== 'home' && entityOf(tab)) {
    screen = <EntityList key={tab} api={api} entity={entityOf(tab)!} pushed={false} />
  } else {
    screen = <Home api={api} />
  }

  const showBar = status === 'ready' && store.settings.setupDone && TABS.length > 0 && !top
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <View style={{ flex: 1 }}>
        {screen}
        {undo ? <UndoBar message={undo.message} onAction={undoDelete} onDismiss={() => setUndo(null)} />
          : toast ? <UndoBar message={toast} onDismiss={() => setToast(null)} /> : null}
      </View>
      {showBar ? <TabBar items={TABS} active={TABS.some(t => t.id === tab) ? tab : 'home'} onChange={api.go} /> : null}
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  )
}
`
}

export function renderOwnerDetails(model: AppModel, facts: { name?: string; email?: string }): string {
  const labels = model.entities.map(e => e.label.toLowerCase()).join(', ')
  const lines = [
    'This app keeps what you type in: ' + labels + '.',
    'It is saved on this phone only. There is no account, no server and no analytics.',
    ...(model.entities.some(e => e.contact) ? ['Phone numbers are used only to open a WhatsApp message when you tap Remind. The message is written on your phone and you send it yourself.'] : []),
  ]
  return `// Facts for the store forms and the Settings screen. Empty strings mean "not given": the app hides what is empty.
export const OWNER = {
  name: ${JSON.stringify(facts.name ?? '')},
  email: ${JSON.stringify(facts.email ?? '')},
  privacyUrl: '',
  termsUrl: '',
  dataCollected: ${JSON.stringify(lines, null, 2)} as string[],
}
`
}

export function renderAppJson(spec: MobileSpec, model: AppModel): string {
  const d = getMobileDirectionById(spec.direction.id)
  if (!d) throw new Error('unknown mobile direction ' + spec.direction.id)
  return JSON.stringify({
    expo: {
      name: model.appName,
      slug: slug(model.appName),
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: d.mode,
      primaryColor: d.theme.accent,
      splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: d.theme.bg },
      android: { adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: d.theme.bg } },
      ios: { supportsTablet: false },
    },
  }, null, 2) + '\n'
}

export interface RenderedMobileApp { files: Record<string, string> }

export function renderMobileApp(spec: MobileSpec, model: AppModel, currency = '₹', facts: { name?: string; email?: string } = {}): RenderedMobileApp {
  const d = getMobileDirectionById(spec.direction.id)
  if (!d) throw new Error('unknown mobile direction ' + spec.direction.id)
  return {
    files: {
      'app.json': renderAppJson(spec, model),
      'theme.ts': renderTheme(d),
      'schema.ts': renderSchema(spec, model, currency),
      'lib/db.ts': DB_TS,
      'lib/logic.ts': LOGIC_TS,
      'lib/present.ts': PRESENT_TS,
      'lib/api.ts': API_TS,
      'lib/owner-details.ts': renderOwnerDetails(model, facts),
      'components/ui.tsx': MOBILE_KIT_SOURCE,
      'components/RowItem.tsx': ROW_ITEM_TSX,
      'screens/Setup.tsx': SETUP_TSX,
      'screens/Home.tsx': HOME_TSX,
      'screens/EntityList.tsx': LIST_TSX,
      'screens/Detail.tsx': DETAIL_TSX,
      'screens/Form.tsx': FORM_TSX,
      'screens/Settings.tsx': SETTINGS_TSX,
      'App.tsx': renderAppTsx(spec, model),
      'build-spec.json': JSON.stringify({ spec, model }, null, 2),
    },
  }
}
