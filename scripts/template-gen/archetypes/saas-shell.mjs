// saas-shell archetype — the reusable product suite every real WyberAi SaaS
// build ships (src/app/api/generate/route.ts BUILD ORDER / FILE STRUCTURE /
// MULTI-PAGE MODE, read in full before writing this): Shell + Sidebar +
// Header + CommandPalette, AuthContext + ToastContext, useHashRoute routing
// (never react-router-dom — throws inside the published srcDoc iframe),
// Login, Dashboard, the primary feature page, Analytics, Notifications,
// Settings. One category's "primary feature" page (records-table, kanban,
// etc.) plugs into this same shell rather than shipping alone — this is the
// piece the first pilot skipped entirely.
//
// config shape:
// {
//   appName, tagline,
//   navIcon: string,                 // lucide icon name for the primary feature nav item
//   primaryFeatureLabel: string,     // sidebar label, e.g. "Matters"
//   primaryFeatureSingular: string,  // e.g. "Matter" — used in button/dialog copy
//   greetingName: string,
//   greetingInsight: string,         // e.g. "You've closed 4 matters this month — 80% to target."
//   kpis: [{ label, value, suffix?, delta, spark: number[] }]   // 4
//   activity: [{ label, time, tone }]                            // tone: 'default'|'outline'|'solid'
//   primaryTable: { columns: string[], rows: [{ cells, status }], filters: string[] }
//   analyticsKpis: [{ label, value, suffix?, delta }]            // 4
//   rankedTable: { label: string, rows: [{ name, value }] }
//   notifications: [{ title, description, time, unread, tone }]
// }

function esc(s) { return String(s).replace(/'/g, "\\'") }

// ── verbatim from src/app/api/generate/route.ts's ROUTING & AUTH STATE block ──
export function useHashRouteFile() {
  return `import { useEffect, useState } from 'react'

function normalize(hash) {
  const h = hash.replace(/^#/, '') || '/dashboard'
  return h.startsWith('/') ? h : '/' + h
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => normalize(window.location.hash))
  useEffect(() => {
    const onHashChange = () => setRoute(normalize(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    const poll = setInterval(() => {
      const current = normalize(window.location.hash)
      setRoute(r => (r === current ? r : current))
    }, 120)
    return () => { window.removeEventListener('hashchange', onHashChange); clearInterval(poll) }
  }, [])
  return route
}

export function navigate(path) {
  window.location.hash = path.startsWith('/') ? path : '/' + path
}
`
}

export function contextsFiles() {
  const auth = `import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('wyber-demo-user')
    return saved ? JSON.parse(saved) : null
  })
  const isAuthenticated = !!user

  const login = (email) => {
    const u = { name: email.split('@')[0].replace(/[._]/g, ' '), email, plan: 'Growth' }
    localStorage.setItem('wyber-demo-user', JSON.stringify(u))
    setUser(u)
  }
  const logout = () => {
    localStorage.removeItem('wyber-demo-user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
`

  const toast = `import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, tone = 'default') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, message, tone }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-xl">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
`
  return { 'src/contexts/AuthContext.tsx': auth, 'src/contexts/ToastContext.tsx': toast }
}

// MULTI-TENANCY — NON-NEGOTIABLE per buildSaasSystemPrompt: every SaaS is
// workspace-first. OrgContext + WorkspaceSwitcher + role-based UI (owner/
// admin/member/viewer), mocked via localStorage since no backend is wired.
export function orgContextFile(config) {
  return `import { createContext, useContext, useState } from 'react'

const OrgContext = createContext(null)

const ROLES = ['owner', 'admin', 'member', 'viewer']

export function OrgProvider({ children }) {
  const [org, setOrg] = useState(() => {
    const saved = localStorage.getItem('wyber-demo-org')
    return saved ? JSON.parse(saved) : { id: '1', name: '${esc(config.appName)}', slug: '${config.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}', plan: 'pro' }
  })
  const [role, setRole] = useState(() => localStorage.getItem('wyber-demo-role') || 'owner')

  const switchOrg = (next) => {
    setOrg(next)
    localStorage.setItem('wyber-demo-org', JSON.stringify(next))
  }
  const switchRole = (next) => {
    if (!ROLES.includes(next)) return
    setRole(next)
    localStorage.setItem('wyber-demo-role', next)
  }

  const canEdit = role === 'owner' || role === 'admin' || role === 'member'
  const canAdmin = role === 'owner' || role === 'admin'
  const isViewer = role === 'viewer'

  return (
    <OrgContext.Provider value={{ org, role, canEdit, canAdmin, isViewer, switchOrg, switchRole }}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  return useContext(OrgContext)
}
`
}

export function workspaceSwitcherFile(config) {
  return `import { useState } from 'react'
import { ChevronsUpDown, Check, Plus } from 'lucide-react'
import { useOrg } from '../../contexts/OrgContext'

const MOCK_ORGS = [
  { id: '1', name: '${esc(config.appName)}', slug: '${config.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}', plan: 'pro' },
  { id: '2', name: 'Personal', slug: 'personal', plan: 'free' },
]

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false)
  const { org, switchOrg } = useOrg()

  return (
    <div className="relative px-3 pt-3">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-accent">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
          {(org?.name || '?').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-foreground">{org?.name}</p>
          <p className="font-mono text-[10px] capitalize text-muted-foreground">{org?.plan} plan</p>
        </div>
        <ChevronsUpDown size={14} className="shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="p-1">
            {MOCK_ORGS.map(o => (
              <button
                key={o.id}
                onClick={() => { switchOrg(o); setOpen(false) }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-[11px] font-bold">{o.name.slice(0, 2).toUpperCase()}</div>
                <span className="flex-1 font-medium text-foreground">{o.name}</span>
                {o.id === org?.id && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>
          <div className="border-t border-border p-1">
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Plus size={14} /><span>Create workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
`
}

export function sidebarFile(config) {
  return `import { useState } from 'react'
import { LayoutDashboard, ${config.navIcon}, BarChart3, Bell, Settings as SettingsIcon, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useOrg } from '../../contexts/OrgContext'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

const NAV = [
  { href: '#/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '#/${config.primaryFeatureRoute}', label: '${esc(config.primaryFeatureLabel)}', icon: ${config.navIcon} },
  { href: '#/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '#/notifications', label: 'Notifications', icon: Bell },
]

const ROLE_LABEL = { owner: 'Owner', admin: 'Admin', member: 'Member', viewer: 'Viewer' }

export function Sidebar({ route }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const { role } = useOrg()

  return (
    <aside className={(collapsed ? 'w-[72px]' : 'w-64') + ' shrink-0 border-r border-border bg-card transition-[width] duration-300 flex flex-col h-screen sticky top-0'}>
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-display text-sm font-bold">
          ${config.appName.charAt(0)}
        </div>
        {!collapsed && <span className="font-display text-sm font-semibold tracking-tight text-foreground">${config.appName}</span>}
      </div>

      ${config.archetype === 'webapp' ? '' : "{!collapsed && <WorkspaceSwitcher />}"}

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{!collapsed && 'Workspace'}</div>
        <div className="flex flex-col gap-0.5">
          {NAV.map(item => {
            const active = route.startsWith(item.href.slice(1))
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                className={
                  'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ' +
                  (active
                    ? 'bg-[image:var(--gradient-active)] text-primary border border-primary/20 shadow-[var(--shadow-glow)]'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground')
                }
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </a>
            )
          })}
        </div>

        <div className="mt-6 mb-2 px-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{!collapsed && 'Account'}</div>
        <a
          href="#/settings"
          className={
            'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ' +
            (route.startsWith('/settings')
              ? 'bg-[image:var(--gradient-active)] text-primary border border-primary/20 shadow-[var(--shadow-glow)]'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground')
          }
        >
          <SettingsIcon size={17} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </a>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {(user?.name || 'You').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{user?.name || 'Guest'}</div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">{ROLE_LABEL[role] || 'Member'}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="mt-1 flex w-full items-center justify-center rounded-lg py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
`
}

export function headerFile(config) {
  return `import { useEffect, useState } from 'react'
import { Search, Bell, Sparkles, Check, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

function useSyncStatus() {
  const [status, setStatus] = useState('idle')
  useEffect(() => {
    const t = setInterval(() => {
      setStatus('saving')
      setTimeout(() => setStatus('saved'), 600)
      setTimeout(() => setStatus('idle'), 3200)
    }, 45000)
    return () => clearInterval(t)
  }, [])
  return status
}

export function Header({ title, onOpenCommandPalette, onOpenCopilot }) {
  const { logout } = useAuth()
  const syncStatus = useSyncStatus()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h1>
        {syncStatus !== 'idle' && (
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
            {syncStatus === 'saving' ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} className="text-success" />}
            {syncStatus === 'saving' ? 'Saving...' : 'Synced just now'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search ${config.appName}...</span>
          <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </button>
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
        >
          <Sparkles size={14} className="text-primary" />
          <span className="hidden sm:inline">Ask AI</span>
          <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘J</kbd>
        </button>
        <a href="#/notifications" className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </a>
        <button onClick={logout} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          Sign out
        </button>
      </div>
    </header>
  )
}
`
}

export function shellFile() {
  return `import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Shell({ route, title, onOpenCommandPalette, onOpenCopilot, children }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar route={route} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header title={title} onOpenCommandPalette={onOpenCommandPalette} onOpenCopilot={onOpenCopilot} />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
`
}

export function appFile(config) {
  return `import { useEffect, useState } from 'react'
import { useHashRoute, navigate } from './hooks/useHashRoute'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { OrgProvider } from './contexts/OrgContext'
import { Shell } from './components/layout/Shell'
import { CommandPalette } from './components/CommandPalette'
import { CopilotPalette } from './components/CopilotPalette'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import Onboarding from './pages/auth/Onboarding'
import Dashboard from './pages/Dashboard'
import ${config.primaryFeaturePascal} from './pages/${config.primaryFeaturePascal}'
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'
import Settings from './pages/settings/Settings'

const TITLES = {
  '/dashboard': 'Dashboard',
  '/${config.primaryFeatureRoute}': '${config.primaryFeatureLabel.replace(/'/g, "\\'")}',
  '/analytics': 'Analytics',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
}

function AppShell() {
  const route = useHashRoute()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [copilotOpen, setCopilotOpen] = useState(false)

  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#/"]')
      if (!a) return
      e.preventDefault()
      navigate(a.getAttribute('href').slice(1))
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') { e.preventDefault(); setCopilotOpen(true) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const base = '/' + route.split('/')[1]

  if (base === '/onboarding') return <Onboarding />

  const title = TITLES[base] || '${config.appName.replace(/'/g, "\\'")}'

  let page = <Dashboard />
  if (base === '/${config.primaryFeatureRoute}') page = <${config.primaryFeaturePascal} />
  else if (base === '/analytics') page = <Analytics />
  else if (base === '/notifications') page = <Notifications />
  else if (base === '/settings') page = <Settings />

  return (
    <>
      <Shell route={route} title={title} onOpenCommandPalette={() => setPaletteOpen(true)} onOpenCopilot={() => setCopilotOpen(true)}>
        {page}
      </Shell>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <CopilotPalette open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </>
  )
}

function AuthGate() {
  const route = useHashRoute()
  const base = '/' + route.split('/')[1]
  if (base === '/signup') return <Signup />
  if (base === '/forgot-password') return <ForgotPassword />
  return <Login />
}

function Root() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <AppShell /> : <AuthGate />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <OrgProvider>
          <Root />
        </OrgProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
`
}

// AI Copilot panel — Cmd+J, mandatory for every SaaS build per real spec.
// Distinct from CommandPalette (Cmd+K, pure navigation): this simulates a
// natural-language query over the app's own data with scripted, specific
// responses grounded in the app's real content (not generic chat filler).
export function copilotPaletteFile(config) {
  const nlResponses = JSON.stringify({
    [config.primaryFeatureLabel.toLowerCase()]: `You have ${config.kpis[0]?.value ?? 'several'} ${config.primaryFeatureLabel.toLowerCase()} tracked right now — ${config.greetingInsight}`,
    revenue: config.analyticsKpis?.find((k) => /revenue|value/i.test(k.label))
      ? `${config.analyticsKpis.find((k) => /revenue|value/i.test(k.label)).label}: ${config.analyticsKpis.find((k) => /revenue|value/i.test(k.label)).value}${config.analyticsKpis.find((k) => /revenue|value/i.test(k.label)).suffix || ''}.`
      : 'Check the Analytics page for the latest revenue breakdown.',
    activity: config.activity?.[0] ? `Most recent: ${config.activity[0].label} (${config.activity[0].time}).` : 'No recent activity yet.',
  })

  return `import { useEffect, useRef, useState } from 'react'
import { Search, Sparkles, Loader2 } from 'lucide-react'
import { navigate } from '../hooks/useHashRoute'

const NL_RESPONSES = ${nlResponses}

const COMMANDS = [
  { id: 'new', label: 'New ${esc(config.primaryFeatureSingular || config.primaryFeatureLabel)}', group: 'Create', action: () => navigate('/${config.primaryFeatureRoute}') },
  { id: 'go-dash', label: 'Go to Dashboard', group: 'Navigate', action: () => navigate('/dashboard') },
  { id: 'go-analytics', label: 'Go to Analytics', group: 'Navigate', action: () => navigate('/analytics') },
  { id: 'go-settings', label: 'Go to Settings', group: 'Navigate', action: () => navigate('/settings') },
]

export function CopilotPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => { if (open) { setQuery(''); setAiResult(null); setSelected(0); setTimeout(() => inputRef.current && inputRef.current.focus(), 50) } }, [open])
  if (!open) return null

  const isNL = query.length > 8 && !query.startsWith('/')
  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))

  const handleEnter = () => {
    if (isNL) {
      setAiLoading(true)
      setTimeout(() => {
        const key = Object.keys(NL_RESPONSES).find(k => query.toLowerCase().includes(k))
        setAiResult(key ? NL_RESPONSES[key] : "No results for that yet — try asking about ${esc(config.primaryFeatureLabel.toLowerCase())}, revenue, or recent activity.")
        setAiLoading(false)
      }, 800)
    } else if (filtered[selected]) {
      filtered[selected].action(); onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Sparkles size={16} className="shrink-0 text-primary" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'ArrowDown') setSelected(s => Math.min(s + 1, filtered.length - 1)); if (e.key === 'ArrowUp') setSelected(s => Math.max(s - 1, 0)); if (e.key === 'Enter') handleEnter(); if (e.key === 'Escape') onClose() }}
            placeholder={isNL ? 'Ask anything about your data...' : 'Search commands...'}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        {aiLoading && <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" />Searching your data...</div>}
        {aiResult && <div className="border-b border-border bg-primary/5 px-4 py-3 text-sm text-foreground">{aiResult}</div>}
        {!isNL && (
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => { cmd.action(); onClose() }}
                className={'flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ' + (selected === i ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50')}
              >
                {cmd.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 font-mono text-[10px] text-muted-foreground">
          <span>↑↓ navigate</span><span>↵ select</span><span>Try: "${esc(config.primaryFeatureLabel.toLowerCase())}" or "revenue"</span>
        </div>
      </div>
    </div>
  )
}
`
}

// Web App signature patterns — 2026 MANDATORY per buildSystemPrompt: every
// web app is keyboard-first, and every record-showing page needs inline
// click-to-edit. Only wired into WebApp-category templates (config.archetype
// === 'webapp'); harmless to also ship for SaaS since nothing imports them.
export function useKeyboardFile() {
  return `import { useEffect } from 'react'

export function useKeyboard(handlers) {
  useEffect(() => {
    const down = (e) => {
      const meta = e.metaKey || e.ctrlKey
      const key = (meta ? 'cmd+' : '') + (e.shiftKey ? 'shift+' : '') + e.key.toLowerCase()
      if (handlers[key]) { e.preventDefault(); handlers[key]() }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [handlers])
}
`
}

export function inlineEditFile() {
  return `import { useEffect, useRef, useState } from 'react'
import { cn } from '../wyber-ui'

export function InlineEdit({ value, onSave, className }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [flash, setFlash] = useState(false)
  const ref = useRef(null)
  useEffect(() => { if (editing) ref.current && ref.current.focus() }, [editing])

  const save = () => {
    setEditing(false)
    if (draft !== value) { onSave(draft); setFlash(true); setTimeout(() => setFlash(false), 800) }
  }

  if (!editing) return (
    <span
      onClick={() => setEditing(true)}
      className={cn('cursor-text rounded px-1 -mx-1 transition-colors hover:bg-accent/50', flash && 'bg-success/10', className)}
    >
      {value}
    </span>
  )
  return (
    <input
      ref={ref}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
      className={cn('bg-transparent border-b border-primary outline-none w-full', className)}
    />
  )
}
`
}

export function commandPaletteFile(config) {
  return `import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Dialog } from '../wyber-ui'
import { navigate } from '../hooks/useHashRoute'

const COMMANDS = [
  { id: 'go-dash', label: 'Go to Dashboard', group: 'Navigate', action: () => navigate('/dashboard') },
  { id: 'go-feature', label: 'Go to ${esc(config.primaryFeatureLabel)}', group: 'Navigate', action: () => navigate('/${config.primaryFeatureRoute}') },
  { id: 'go-analytics', label: 'Go to Analytics', group: 'Navigate', action: () => navigate('/analytics') },
  { id: 'go-settings', label: 'Go to Settings', group: 'Navigate', action: () => navigate('/settings') },
]

export function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { if (open) { setQuery(''); setTimeout(() => inputRef.current && inputRef.current.focus(), 50) } }, [open])

  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg p-0 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <Search size={16} className="shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && filtered[0]) { filtered[0].action(); onClose() } if (e.key === 'Escape') onClose() }}
          placeholder="Search commands..."
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
      </div>
      <div className="max-h-72 overflow-y-auto py-1">
        {filtered.map(cmd => (
          <button
            key={cmd.id}
            onClick={() => { cmd.action(); onClose() }}
            className="flex w-full items-center px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {cmd.label}
          </button>
        ))}
      </div>
    </Dialog>
  )
}
`
}
