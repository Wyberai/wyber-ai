import type { AppModel } from '../app-spec/types'

const ICONS: [RegExp, string][] = [
  [/bill|invoice|payment|receipt|udhaar|khata/, 'Receipt'],
  [/appointment|booking|slot|session|class|visit|schedule|shift/, 'CalendarDays'],
  [/member|client|patient|customer|lead|student|tenant|people|contact|guest|candidate/, 'Users'],
  [/stock|item|product|inventory|order|shipment|asset|parcel/, 'Package'],
  [/expense|spend|wallet|money|fee|price|budget/, 'Wallet'],
  [/project|task|job|ticket|case|issue/, 'ClipboardList'],
]
const iconFor = (label: string) => ICONS.find(([re]) => re.test(label.toLowerCase()))?.[1] ?? 'ListChecks'

/**
 * The product shell: a hash-routed app (#/app/<screen>) with the sidebar, the phone tab bar, the demo-mode line, role and plan-limit
 * enforcement around the fixed app-spec screens, and the SaaS screens (team, billing, setup, settings, owner overview).
 * Everything the screens need from the model arrives through src/schema.ts and src/plans.ts; this file only wires them together.
 */
export function renderProductApp(app: AppModel, opts: { tools?: boolean } = {}): string {
  const entityNav = app.entities.map(e => ({
    id: e.id, label: e.label,
    icon: e.fields.some(f => f.type === 'ref') && !e.status && !e.due ? 'ListChecks' : iconFor(e.label + ' ' + e.singular),
  }))
  const icons = [...new Set([...entityNav.map(n => n.icon), 'Home', 'History', 'UserPlus', 'CreditCard', 'Plug', 'Settings', 'LayoutDashboard', 'Menu', 'LogOut'])].sort()
  const entityNavJs = entityNav.map(n => `  { id: ${JSON.stringify(n.id)}, label: ${JSON.stringify(n.label)}, icon: <${n.icon} size={18} aria-hidden="true" /> }`).join(',\n')
  void opts
  return `import { useEffect, useRef, useState } from 'react'
import { ${icons.join(', ')} } from 'lucide-react'
import { Badge, BottomTabBar, Button, Dialog, Drawer, ProgressBar, SidebarNav } from '../wyber-ui'
import { APP, type Row } from '../schema'
import { create, load, logChange, remove, restore, save, update, wipe, type Store } from '../lib/db'
import { entityOf, titleOf, withSample, withoutSample } from '../lib/logic'
import { LIMIT_ENTITY, RECORD_NOUN, planById } from '../plans'
import {
  can, composeMail, currentPlanId, emptyState, fetchStatus, fetchSubscription, isConnected, limitFor, loadState, productName, roleNote, saveState, usageOf, wipeState,
  type Mail, type SaasState, type StatusResult, type SubscriptionResult,
} from '../lib/saas'
import type { Api } from '../components/api'
import EntityPage from '../components/EntityPage'
import HistoryPage from '../components/HistoryPage'
import HomePage from '../components/HomePage'
import AuthPage from '../saas/AuthPage'
import BillingPage from '../saas/BillingPage'
import Checklist from '../saas/Checklist'
import SettingsPage from '../saas/SettingsPage'
import SetupPage from '../saas/SetupPage'
import TeamPage from '../saas/TeamPage'
import AdminPage from '../saas/AdminPage'
import { EmailPreview } from '../saas/parts'

const ENTITY_NAV = [
${entityNavJs},
]

const routeOf = (): string => {
  const m = /^#\\/app\\/?([a-z0-9-]*)/.exec(window.location.hash)
  return m && m[1] ? m[1] : 'home'
}

type Notice = { title: string; text: string; plans: boolean }

export default function ProductApp() {
  const [store, setStore] = useState<Store>(() => load())
  const [saas, setSaas] = useState<SaasState>(() => loadState())
  const [view, setView] = useState<string>(routeOf)
  const [more, setMore] = useState(false)
  const [saved, setSaved] = useState(true)
  const [undo, setUndo] = useState<{ entity: string; rows: Row[]; text: string } | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [welcome, setWelcome] = useState<Mail | null>(null)
  const [status, setStatus] = useState<StatusResult | null>(null)
  const [sub, setSub] = useState<SubscriptionResult | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wsId = saas.workspace ? saas.workspace.id : ''

  useEffect(() => { setSaved(save(store)) }, [store])
  useEffect(() => { saveState(saas) }, [saas])
  useEffect(() => {
    const onHash = () => { setView(routeOf()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => { let live = true; fetchStatus().then(s => { if (live) setStatus(s) }); return () => { live = false } }, [])
  const refreshSub = () => { if (wsId) fetchSubscription(wsId).then(setSub) }
  useEffect(() => { refreshSub() }, [wsId])
  useEffect(() => {
    document.title = (saas.workspace ? saas.workspace.name + ' - ' : '') + productName()
  }, [saas.workspace])

  const planId = currentPlanId(sub)
  const plan = planById(planId)
  const usage = usageOf(store, saas.members)
  const role = saas.role
  const go = (v: string) => { window.location.hash = v === 'home' ? '#/app' : '#/app/' + v; setMore(false) }
  const deny = (action: 'create' | 'update' | 'delete') => {
    setNotice({ title: 'Not allowed for your role', text: (role === 'viewer' ? 'Viewers cannot ' : 'Members cannot ') + (action === 'create' ? 'add' : action === 'update' ? 'change' : 'delete') + ' records. ' + roleNote(role) + ' Ask the owner or an admin.', plans: false })
  }
  const atLimit = (extra: number): boolean => {
    const r = limitFor(planId, 'records', usage.records + extra - 1)
    if (r.ok) return false
    setNotice({ title: 'Plan limit reached', text: r.message, plans: true })
    return true
  }

  const api: Api = {
    store, go,
    create: (entity, row) => {
      const e = entityOf(entity)
      if (!e) return
      if (!can(role, 'create')) return deny('create')
      if (entity === LIMIT_ENTITY && atLimit(1)) return
      setStore(s => { const made = create(s, entity, row); return logChange(made.store, 'Added ' + e.singular.toLowerCase() + ': ' + titleOf(e, made.row)) })
    },
    update: (entity, id, patch) => {
      const e = entityOf(entity)
      if (!e) return
      if (!can(role, 'update')) return deny('update')
      setStore(s => logChange(update(s, entity, id, patch), 'Changed ' + e.singular.toLowerCase() + ': ' + titleOf(e, { ...patch, id })))
    },
    remove: (entity, ids) => {
      const e = entityOf(entity)
      if (!e) return
      if (!can(role, 'delete')) return deny('delete')
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
      if (!can(role, 'create')) return deny('create')
      if (entity === LIMIT_ENTITY && rows.length > 0 && atLimit(rows.length)) return
      setStore(s => {
        let cur = s
        for (const r of rows) cur = create(cur, entity, r).store
        return logChange(cur, 'Imported ' + rows.length + ' ' + (rows.length === 1 ? e.singular.toLowerCase() : e.label.toLowerCase()) + ' from CSV')
      })
    },
    loadSample: () => {
      if (!can(role, 'create')) return deny('create')
      const added = (entityOf(LIMIT_ENTITY)?.sample.length) || 0
      if (added > 0 && atLimit(added)) return
      setStore(s => logChange(withSample(s), 'Loaded sample data (demo)'))
    },
    removeSample: () => { if (!can(role, 'delete')) return deny('delete'); setStore(s => logChange(withoutSample(s), 'Removed sample data')) },
  }

  const undoDelete = () => {
    if (!undo) return
    const u = undo
    setStore(s => logChange(restore(s, u.entity, u.rows), 'Restored: ' + u.text))
    setUndo(null)
  }

  const onSaas = (next: SaasState, firstTime?: boolean) => {
    setSaas(next)
    if (firstTime && next.workspace && next.account) {
      setStore(s => ({ ...s, settings: { businessName: next.workspace ? next.workspace.name : '', setupDone: true } }))
      setWelcome(composeMail('welcome', next.account.email, next.workspace.name, window.location.origin + '/#/app'))
      window.location.hash = '#/app'
    }
  }
  const deleteAccount = () => {
    setStore(wipe()); wipeState(); setSaas(emptyState()); setSub(null); window.location.hash = '#/app'
  }

  if (!saas.account || !saas.signedIn) return <AuthPage state={saas} onState={onSaas} />

  const manage = can(role, 'manage')
  const NAV = [
    { id: 'home', label: 'Home', icon: <Home size={18} aria-hidden="true" /> },
    ...ENTITY_NAV,
    { id: 'history', label: 'History', icon: <History size={18} aria-hidden="true" /> },
    { id: 'team', label: 'Team', icon: <UserPlus size={18} aria-hidden="true" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={18} aria-hidden="true" /> },
    ...(manage ? [{ id: 'setup', label: 'Setup', icon: <Plug size={18} aria-hidden="true" /> }, { id: 'admin', label: 'Overview', icon: <LayoutDashboard size={18} aria-hidden="true" /> }] : []),
    { id: 'settings', label: 'Settings', icon: <Settings size={18} aria-hidden="true" /> },
  ]
  const liveMoney = isConnected(status, 'payments') && isConnected(status, 'database')
  const ws = saas.workspace

  const page = view === 'home' ? (
    <div className="space-y-8">
      <Checklist state={saas} store={store} go={go} onDismiss={() => setSaas(s => ({ ...s, checklistDismissed: true }))} onRemoveSample={api.removeSample} />
      <HomePage api={api} />
    </div>
  )
    : view === 'history' ? <HistoryPage api={api} />
    : view === 'team' ? <TeamPage state={saas} onState={setSaas} planId={planId} status={status} onLimit={text => setNotice({ title: 'Plan limit reached', text, plans: true })} />
    : view === 'billing' ? <BillingPage state={saas} planId={planId} sub={sub} onRefresh={refreshSub} status={status} usage={usage} />
    : view === 'setup' && manage ? <SetupPage status={status} onStatus={setStatus} />
    : view === 'admin' && manage ? <AdminPage state={saas} sub={sub} planId={planId} />
    : view === 'settings' ? <SettingsPage state={saas} store={store} onDelete={deleteAccount} go={go} />
    : (() => { const e = entityOf(view); return e ? <EntityPage key={e.id} entity={e} api={api} /> : <HomePage api={api} /> })()

  const phoneTabs = [...NAV.slice(0, 4), { id: 'more', label: 'More', icon: <Menu size={18} aria-hidden="true" /> }]
  const limit = plan.limits.records

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <a href="#/app" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus() }} className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2">Skip to content</a>
      <aside className="hidden border-r border-border bg-card lg:block lg:w-64 lg:shrink-0" data-noprint>
        <div className="sticky top-0 flex h-screen flex-col">
          <p className="px-5 pb-1 pt-6 font-display text-lg font-semibold text-foreground">{productName()}</p>
          <p className="truncate px-5 pb-3 text-xs text-muted-foreground">{ws ? ws.name : ''}</p>
          <div className="min-h-0 flex-1 overflow-auto px-1">
            <SidebarNav items={NAV} active={view} onChange={go} className="border-0 bg-transparent" />
          </div>
          <div className="space-y-2 border-t border-border p-4 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-2"><span className="truncate">{saas.account.email}</span><Badge variant="outline">{role}</Badge></div>
            <div>
              <div className="mb-1 flex justify-between"><span>{plan.name}</span><span>{usage.records + (limit === null ? '' : ' of ' + limit) + ' ' + RECORD_NOUN.many}</span></div>
              <ProgressBar value={usage.records} max={limit === null ? Math.max(usage.records, 1) * 4 : limit} />
            </div>
            <button type="button" onClick={() => setSaas(s => ({ ...s, signedIn: false }))} className="inline-flex items-center gap-2 text-muted-foreground underline underline-offset-4 hover:text-foreground"><LogOut size={14} aria-hidden="true" />Sign out</button>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border px-4 py-3 md:px-8" data-noprint>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-base font-semibold text-foreground lg:invisible">{productName()}</p>
            <p className="text-xs text-muted-foreground" role="status">
              {liveMoney ? 'Payments and subscription storage are connected. Your records stay in this browser.' : 'Demo mode: nothing is charged, sent or stored on a server.'}
              {saved ? '' : ' This browser is blocking storage, so changes will be lost when you close the page.'}
            </p>
          </div>
        </header>
        {role !== 'owner' && roleNote(role) ? <p className="border-b border-border bg-muted px-4 py-2 text-xs text-muted-foreground md:px-8" role="status" data-noprint>{'You are viewing as ' + role + ' (demo). ' + roleNote(role)}</p> : null}
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 outline-none md:px-8 lg:pb-12">{page}</main>
        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground md:px-8 lg:pb-4" data-noprint>
          <a className="underline underline-offset-4" href="#/terms">Terms</a> · <a className="underline underline-offset-4" href="#/privacy">Privacy policy</a> · <a className="underline underline-offset-4" href="#/">Product site</a>
        </footer>
      </div>

      <div className="lg:hidden" data-noprint>
        <BottomTabBar items={phoneTabs} active={NAV.slice(0, 4).some(n => n.id === view) ? view : 'more'} onChange={id => (id === 'more' ? setMore(true) : go(id))} />
      </div>
      <Drawer open={more} onClose={() => setMore(false)} title="Menu" side="left">
        <nav aria-label="All sections" className="flex flex-col gap-1">
          {NAV.map(n => (
            <button key={n.id} type="button" onClick={() => go(n.id)} className={'flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ' + (n.id === view ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent')}>
              {n.icon}{n.label}
            </button>
          ))}
          <button type="button" onClick={() => { setMore(false); setSaas(s => ({ ...s, signedIn: false })) }} className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-left text-sm text-muted-foreground hover:bg-accent"><LogOut size={18} aria-hidden="true" />Sign out</button>
        </nav>
      </Drawer>

      {undo ? (
        <div role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground lg:bottom-6" data-noprint>
          <span>{undo.text}</span>
          <Button size="sm" variant="outline" onClick={undoDelete}>Undo</Button>
        </div>
      ) : null}

      <Dialog open={Boolean(notice)} onClose={() => setNotice(null)} title={notice ? notice.title : ''}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{notice ? notice.text : ''}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setNotice(null)}>Close</Button>
            {notice && notice.plans ? <Button onClick={() => { setNotice(null); go('billing') }}>See plans</Button> : null}
          </div>
        </div>
      </Dialog>

      <Dialog open={Boolean(welcome)} onClose={() => setWelcome(null)} title="Welcome email (preview)">
        {welcome && ws ? (
          <div className="space-y-4">
            <EmailPreview mail={welcome} kind="welcome" workspace={ws.id} workspaceName={ws.name} link={window.location.origin + '/#/app'} status={status} />
            <div className="flex justify-end"><Button onClick={() => setWelcome(null)}>Continue</Button></div>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
`
}
