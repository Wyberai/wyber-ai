import { fontsHrefFor, renderTokensCss } from '../build-spec/tokens'
import { API_TS, CSV_IMPORT_TSX, FORM_TSX } from './runtime-ui'
import { CSV_TS, DB_TS, LOGIC_TS } from './runtime-core'
import { ENTITY_PAGE_TSX, HISTORY_TSX, HOME_TSX, PRIVACY_TSX } from './runtime-pages'
import type { AppModel, AppSpec } from './types'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app'

const ICONS: [RegExp, string][] = [
  [/bill|invoice|payment|receipt|udhaar|khata/, 'Receipt'],
  [/appointment|booking|slot|session|class|visit|schedule/, 'CalendarDays'],
  [/member|client|patient|customer|lead|student|tenant|people|contact/, 'Users'],
  [/stock|item|product|inventory|order/, 'Package'],
  [/expense|spend|wallet|money|fee|price|plan/, 'Wallet'],
]
const iconFor = (label: string) => ICONS.find(([re]) => re.test(label.toLowerCase()))?.[1] ?? 'ListChecks'

export function renderSchema(spec: AppSpec, model: AppModel, currency: string): string {
  const app = {
    id: slug(model.appName), intent: spec.brief.intent, name: model.appName, tagline: model.tagline, homeIntro: model.homeIntro, currency,
    layout: { list: spec.layout.list, density: spec.layout.density, home: spec.layout.home },
    entities: model.entities, metrics: model.metrics,
  }
  return `// The shape of this app, as data. The screens in src/components read it.
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
  id: string; intent: string; name: string; tagline: string; homeIntro: string; currency: string
  layout: { list: 'table' | 'cards'; density: 'compact' | 'roomy'; home: 'metrics-first' | 'shortcuts-first' }
  entities: Entity[]; metrics: Metric[]
} = ${JSON.stringify(app, null, 2)}
`
}

/** A fixed page a pillar adds to the shell (for example the Replace-your-SaaS coverage page). It receives the same `api` as every screen. `file` is the path under src/ without an extension. */
export interface ExtraPage { id: string; label: string; icon: string; file: string; component: string }

export function renderAppTsx(model: AppModel, extra: ExtraPage[] = []): string {
  const nav = [
    { id: 'home', label: 'Home', icon: 'Home' },
    // a child entity (points at another entity, has no status or due date of its own) gets the plain list icon, so it never shares one with its parent
    ...model.entities.map(e => ({ id: e.id, label: e.label, icon: e.fields.some(f => f.type === 'ref') && !e.status && !e.due ? 'ListChecks' : iconFor(e.label + ' ' + e.singular) })),
    ...extra.map(x => ({ id: x.id, label: x.label, icon: x.icon })),
    { id: 'history', label: 'History', icon: 'History' },
    { id: 'privacy', label: 'Privacy', icon: 'ShieldCheck' },
  ]
  const icons = [...new Set([...nav.map(n => n.icon), 'Menu'])].sort()
  const navJs = nav.map(n => `  { id: ${JSON.stringify(n.id)}, label: ${JSON.stringify(n.label)}, icon: <${n.icon} size={18} aria-hidden="true" /> }`).join(',\n')
  return `import { useEffect, useRef, useState } from 'react'
import { ${icons.join(', ')} } from 'lucide-react'
import { BottomTabBar, Button, Dialog, Drawer, Input, SidebarNav } from './wyber-ui'
import { APP, type Row } from './schema'
import { create, load, logChange, remove, restore, save, update, wipe, type Store } from './lib/db'
import { entityOf, titleOf, withSample, withoutSample } from './lib/logic'
import type { Api } from './components/api'
import EntityPage from './components/EntityPage'
import HistoryPage from './components/HistoryPage'
import HomePage from './components/HomePage'
import PrivacyPage from './components/PrivacyPage'
${extra.map(x => 'import ' + x.component + " from './" + x.file + "'").join('\n')}

const NAV = [
${navJs},
]

export default function App() {
  const [store, setStore] = useState<Store>(() => load())
  const [view, setView] = useState('home')
  const [more, setMore] = useState(false)
  const [saved, setSaved] = useState(true)
  const [undo, setUndo] = useState<{ entity: string; rows: Row[]; text: string } | null>(null)
  const [bizName, setBizName] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setSaved(save(store)) }, [store])
  useEffect(() => {
    document.title = (store.settings.businessName ? store.settings.businessName + ' - ' : '') + APP.name
  }, [store.settings.businessName])

  const api: Api = {
    store,
    go: (v: string) => { setView(v); setMore(false); window.scrollTo(0, 0) },
    create: (entity, row) => {
      const e = entityOf(entity)
      if (!e) return
      setStore(s => { const made = create(s, entity, row); return logChange(made.store, 'Added ' + e.singular.toLowerCase() + ': ' + titleOf(e, made.row)) })
    },
    update: (entity, id, patch) => {
      const e = entityOf(entity)
      if (!e) return
      setStore(s => logChange(update(s, entity, id, patch), 'Changed ' + e.singular.toLowerCase() + ': ' + titleOf(e, { ...patch, id })))
    },
    remove: (entity, ids) => {
      const e = entityOf(entity)
      if (!e) return
      const gone = remove(store, entity, ids)
      if (gone.removed.length === 0) return
      const text = gone.removed.length === 1 ? 'Deleted ' + titleOf(e, gone.removed[0]) : 'Deleted ' + gone.removed.length + ' ' + e.label.toLowerCase()
      setStore(logChange(gone.store, text))
      setUndo({ entity, rows: gone.removed, text })
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setUndo(null), 10000)
    },
    importRows: (entity, rows) => {
      const e = entityOf(entity)
      if (!e) return
      setStore(s => {
        let cur = s
        for (const r of rows) cur = create(cur, entity, r).store
        return logChange(cur, 'Imported ' + rows.length + ' ' + (rows.length === 1 ? e.singular.toLowerCase() : e.label.toLowerCase()) + ' from CSV')
      })
    },
    loadSample: () => setStore(s => logChange(withSample(s), 'Loaded sample data (demo)')),
    removeSample: () => setStore(s => logChange(withoutSample(s), 'Removed sample data')),
  }

  const undoDelete = () => {
    if (!undo) return
    const u = undo
    setStore(s => logChange(restore(s, u.entity, u.rows), 'Restored: ' + u.text))
    setUndo(null)
  }

  const page = view === 'home' ? <HomePage api={api} />
    : view === 'history' ? <HistoryPage api={api} />
${extra.map(x => "    : view === '" + x.id + "' ? <" + x.component + ' api={api} />').join('\n')}
    : view === 'privacy' ? <PrivacyPage api={api} onWipe={() => { setStore(wipe()); setView('home') }} />
    : (() => { const e = entityOf(view); return e ? <EntityPage key={e.id} entity={e} api={api} /> : <HomePage api={api} /> })()

  const phoneTabs = [...NAV.slice(0, 4), { id: 'more', label: 'More', icon: <Menu size={18} aria-hidden="true" /> }]

  return (
    <div className="min-h-screen bg-muted/50 text-foreground lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2">Skip to content</a>
      <aside className="hidden border-r border-border bg-card lg:block lg:w-64 lg:shrink-0" data-noprint>
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="flex items-center gap-3 px-5 pb-4 pt-6">
            <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-base font-semibold text-primary-foreground">{(store.settings.businessName || APP.name).trim().charAt(0).toUpperCase()}</span>
            <p className="min-w-0 truncate font-display text-lg font-semibold text-foreground">{store.settings.businessName || APP.name}</p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-1">
            <SidebarNav items={NAV} active={view} onChange={api.go} className="border-0 bg-transparent" />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-8" data-noprint>
          <p className="font-display text-base font-semibold text-foreground lg:invisible">{store.settings.businessName || APP.name}</p>
          <p className="text-xs text-muted-foreground" role="status">
            Saved in this browser only{saved ? '' : ' (this browser is blocking storage, so changes will be lost when you close the page)'}
          </p>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:px-8 lg:pb-12">{page}</main>
      </div>

      <div className="lg:hidden" data-noprint>
        <BottomTabBar items={phoneTabs} active={NAV.slice(0, 4).some(n => n.id === view) ? view : 'more'} onChange={id => (id === 'more' ? setMore(true) : api.go(id))} />
      </div>
      <Drawer open={more} onClose={() => setMore(false)} title="Menu" side="left">
        <nav aria-label="All sections" className="flex flex-col gap-1">
          {NAV.map(n => (
            <button key={n.id} type="button" onClick={() => api.go(n.id)} className={'flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ' + (n.id === view ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent')}>
              {n.icon}{n.label}
            </button>
          ))}
        </nav>
      </Drawer>

      {undo ? (
        <div role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground lg:bottom-6" data-noprint>
          <span>{undo.text}</span>
          <Button size="sm" variant="outline" onClick={undoDelete}>Undo</Button>
        </div>
      ) : null}

      <Dialog open={!store.settings.setupDone} onClose={() => setStore(s => ({ ...s, settings: { ...s.settings, setupDone: true } }))} title={'Welcome to ' + APP.name}>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setStore(s => ({ ...s, settings: { businessName: bizName.trim(), setupDone: true } })) }}>
          <p className="text-sm text-muted-foreground">{APP.tagline.replace(/[.!?]+$/, '') + '.'} Everything you add stays in this browser. Add your business name to put it at the top, or skip it.</p>
          <div>
            <label htmlFor="biz-name" className="mb-1.5 block text-sm font-medium text-foreground">Business name (optional)</label>
            <Input id="biz-name" value={bizName} onChange={e => setBizName(e.target.value)} autoComplete="organization" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setStore(s => ({ ...s, settings: { ...s.settings, setupDone: true } }))}>Skip for now</Button>
            <Button type="submit">Save and start</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
`
}

export interface RenderedApp { files: Record<string, string> }

const PRINT_CSS = `@media print {
  [data-noprint], aside, nav { display: none !important; }
  body { background: #fff; color: #000; }
  main { padding: 0; max-width: none; }
}
`

export function renderApp(spec: AppSpec, model: AppModel, currency = '₹', extra: ExtraPage[] = []): RenderedApp {
  const title = model.appName + ': ' + model.tagline
  return {
    files: {
      'src/schema.ts': renderSchema(spec, model, currency),
      'src/App.tsx': renderAppTsx(model, extra),
      'src/lib/db.ts': DB_TS,
      'src/lib/csv.ts': CSV_TS,
      'src/lib/logic.ts': LOGIC_TS,
      'src/components/api.ts': API_TS,
      'src/components/FormDialog.tsx': FORM_TSX,
      'src/components/CsvImport.tsx': CSV_IMPORT_TSX,
      'src/components/EntityPage.tsx': ENTITY_PAGE_TSX,
      'src/components/HomePage.tsx': HOME_TSX,
      'src/components/HistoryPage.tsx': HISTORY_TSX,
      'src/components/PrivacyPage.tsx': PRIVACY_TSX,
      'src/index.css': renderTokensCss(spec.direction.id, ['en'], PRINT_CSS, spec.look),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title.replace(/</g, '&lt;')}</title>
    <meta name="description" content="${model.homeIntro.replace(/"/g, '&quot;')}" />
    <link href="${fontsHrefFor(spec.direction.id, ['en'], spec.look)}" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
      'src/build-spec.json': JSON.stringify({ spec, model }, null, 2),
    },
  }
}
