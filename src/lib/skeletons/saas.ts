export const SAAS_SKELETON: Record<string, string> = {
  'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
:root {
  --background: 220 16% 4%;
  --foreground: 220 8% 96%;
  --card: 220 14% 7%;
  --card-foreground: 220 8% 96%;
  --primary: 240 80% 62%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 12% 10%;
  --secondary-foreground: 220 8% 96%;
  --muted: 220 12% 10%;
  --muted-foreground: 220 8% 50%;
  --accent: 280 70% 55%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 75% 55%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 10% 14%;
  --input: 220 14% 7%;
  --ring: 240 80% 62%;
  --radius: 0.75rem;
  --popover: 220 14% 7%;
  --popover-foreground: 220 8% 96%;
  --gradient-active: linear-gradient(135deg, hsl(var(--primary)/0.4), hsl(var(--accent)/0.2));
  --shadow-glow: 0 0 20px hsl(var(--primary)/0.3);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.shimmer { background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground)/0.15) 50%, hsl(var(--muted)) 75%); background-size: 200% 100%; animation: shimmer-sweep 1.8s ease-in-out infinite; border-radius: var(--radius); }
@keyframes shimmer-sweep { from { background-position: 200% 0; } to { background-position: -200% 0; } }`,

  'src/hooks/useHashRoute.ts': `import { useState, useEffect } from 'react'

export function useHashRoute(): string {
  const getHash = () => window.location.hash.replace(/^#/, '') || '/login'
  const [route, setRoute] = useState(getHash)
  useEffect(() => {
    const onHashChange = () => setRoute(getHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return route
}`,

  'src/lib/utils.ts': `export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value)
}
export function formatNumber(value: number): string {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M'
  if (value >= 1_000) return (value / 1_000).toFixed(1) + 'k'
  return value.toString()
}
export function formatRelativeTime(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return \`\${minutes}m ago\`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return \`\${hours}h ago\`
  return \`\${Math.floor(hours / 24)}d ago\`
}`,

  'src/lib/mockData.ts': `export const MOCK_USERS = [
  { id: '1', name: 'Aria Chen', email: 'aria@acme.com', plan: 'Pro', status: 'active', joined: '2026-01-15', revenue: 29 },
  { id: '2', name: 'Marcus Lee', email: 'marcus@globex.io', plan: 'Enterprise', status: 'active', joined: '2026-02-03', revenue: 299 },
  { id: '3', name: 'Priya Patel', email: 'priya@initech.co', plan: 'Free', status: 'inactive', joined: '2026-03-22', revenue: 0 },
  { id: '4', name: 'James Wright', email: 'james@massive.com', plan: 'Pro', status: 'active', joined: '2026-04-10', revenue: 29 },
  { id: '5', name: 'Sofia Martinez', email: 'sofia@soylent.net', plan: 'Pro', status: 'trial', joined: '2026-08-01', revenue: 0 },
]

export const MOCK_STATS = {
  mrr: 48200, mrrGrowth: 12.4,
  activeUsers: 1284, activeGrowth: 8.2,
  churnRate: 2.1, churnDelta: -0.3,
  nps: 72, npsDelta: 5,
}

export const MOCK_CHART_DATA = [
  { month: 'Mar', mrr: 32000 }, { month: 'Apr', mrr: 36000 }, { month: 'May', mrr: 38500 },
  { month: 'Jun', mrr: 41000 }, { month: 'Jul', mrr: 43800 }, { month: 'Aug', mrr: 48200 },
]`,

  'src/contexts/AuthContext.tsx': `import { createContext, useContext, useState } from 'react'

interface User { id: string; name: string; email: string; avatar: string; plan: string; role: 'admin' | 'member' }
interface AuthCtx { user: User | null; login: (email: string, password: string) => Promise<boolean>; logout: () => void; isLoading: boolean }

const AuthContext = createContext<AuthCtx | null>(null)

const MOCK_USER: User = { id: '1', name: 'Alex Johnson', email: 'alex@company.com', avatar: 'AJ', plan: 'Pro', role: 'admin' }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, _password: string): Promise<boolean> => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setIsLoading(false)
    if (email) { setUser(MOCK_USER); return true }
    return false
  }

  const logout = () => { setUser(null); window.location.hash = '/login' }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}`,

  'src/contexts/ToastContext.tsx': `import { createContext, useContext, useState, useCallback } from 'react'

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info' }
interface ToastCtx { showToast: (message: string, type?: Toast['type']) => void }

const ToastContext = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={\`px-4 py-3 rounded-xl border text-sm font-medium shadow-lg pointer-events-auto \${t.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : t.type === 'error' ? 'bg-destructive/15 border-destructive/30 text-red-400' : 'bg-card border-border text-foreground'}\`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}`,

  'src/components/layout/Sidebar.tsx': `import { LayoutDashboard, Users, BarChart2, Settings, Zap, Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/notifications', label: 'Notifications', icon: Bell },
]

export default function Sidebar({ route }: { route: string }) {
  const { user, logout } = useAuth()
  return (
    <aside className="w-56 flex-shrink-0 h-screen flex flex-col border-r border-border bg-card">
      <div className="px-4 py-4 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Zap size={14} className="text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm text-foreground">SaaSName</span>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ path, label, icon: Icon }) => (
          <a key={path} href={\`#\${path}\`}
            className={\`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all \${route === path ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}\`}>
            <Icon size={15} />{label}
          </a>
        ))}
      </nav>
      <div className="px-2 py-3 border-t border-border space-y-0.5">
        <a href="#/settings"
          className={\`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all \${route === '/settings' ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}\`}>
          <Settings size={15} />Settings
        </a>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
            {user?.avatar ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.plan} plan</p>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground transition flex-shrink-0">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}`,

  'src/components/layout/Header.tsx': `import { Search, Bell } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Header({ title }: { title: string }) {
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search..." className="pl-8 pr-4 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-48" />
        </div>
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
          {user?.avatar ?? 'U'}
        </div>
      </div>
    </header>
  )
}`,

  'src/pages/auth/Login.tsx': `import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Zap } from 'lucide-react'

export default function Login() {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const ok = await login(email, password)
    if (ok) window.location.hash = '/dashboard'
    else setError('Invalid credentials. Try any email address.')
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 relative">
        <img src="{{wyber-image: cinematic dark abstract tech environment, deep blue purple gradient, subtle grid lines, premium SaaS atmosphere | 9:16}}" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/40" />
        <div className="relative z-10 p-12 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap size={16} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">SaaSName</span>
          </div>
          <div>
            <blockquote className="text-lg font-medium text-foreground leading-relaxed mb-3">
              "This product transformed how our team operates. We closed more deals in one month than we did in the previous quarter."
            </blockquote>
            <p className="text-sm text-muted-foreground">— Sarah Chen, VP Sales at Acme Corp</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Zap size={14} className="text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">SaaSName</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                className="w-full px-3 py-2.5 rounded-lg bg-card border border-input text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg bg-card border border-input text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition" />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">Or</span></div></div>
          <button className="w-full py-2.5 rounded-lg border border-border text-sm text-foreground font-medium hover:bg-card transition flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Continue with Google
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Don't have an account? <a href="#/signup" className="text-primary hover:underline">Sign up free</a>
          </p>
        </div>
      </div>
    </div>
  )
}`,

  'src/pages/Dashboard.tsx': `import { TrendingUp, Users, TrendingDown, Star } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Header from '../components/layout/Header'
import { MOCK_STATS, MOCK_CHART_DATA, MOCK_USERS } from '../lib/mockData'

const STATS = [
  { label: 'MRR', value: '$48,200', delta: '+12.4%', trend: 'up', icon: TrendingUp },
  { label: 'Active Users', value: '1,284', delta: '+8.2%', trend: 'up', icon: Users },
  { label: 'Churn Rate', value: '2.1%', delta: '-0.3%', trend: 'up', icon: TrendingDown },
  { label: 'NPS Score', value: '72', delta: '+5pts', trend: 'up', icon: Star },
]

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.icon size={14} className="text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">{s.value}</div>
              <div className="text-xs text-emerald-500 mt-1">{s.delta} this month</div>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-1">MRR Growth</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 6 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_CHART_DATA}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(240 80% 62%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(240 80% 62%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 14%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(220 8% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(220 8% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v/1000).toFixed(0) + 'k'} />
              <Tooltip contentStyle={{ background: 'hsl(220 14% 7%)', border: '1px solid hsl(220 10% 14%)', borderRadius: 8, color: 'hsl(220 8% 96%)', fontSize: 12 }} formatter={(v: number) => ['$' + v.toLocaleString(), 'MRR']} />
              <Area type="monotone" dataKey="mrr" stroke="hsl(240 80% 62%)" strokeWidth={2} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Recent Customers</h3>
            <a href="#/customers" className="text-xs text-primary hover:underline">View all</a>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">MRR</th>
            </tr></thead>
            <tbody>
              {MOCK_USERS.slice(0, 4).map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">{u.name.split(' ').map(n => n[0]).join('')}</div>
                      <div><p className="text-sm font-medium text-foreground">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell"><span className="text-xs text-muted-foreground">{u.plan}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium \${u.status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : u.status === 'trial' ? 'bg-amber-500/15 text-amber-500' : 'bg-muted text-muted-foreground'}\`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-foreground">{u.revenue > 0 ? '$' + u.revenue + '/mo' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}`,

  'src/pages/settings/Settings.tsx': `import { useState } from 'react'
import Header from '../../components/layout/Header'
import { User, Bell, Shield, CreditCard, Key, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

type Tab = 'profile' | 'team' | 'billing' | 'notifications' | 'security' | 'api'
const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'api', label: 'API Keys', icon: Key },
]

export default function Settings() {
  const [tab, setTab] = useState<Tab>('profile')
  const { user } = useAuth()
  const { showToast } = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')

  const save = () => showToast('Settings saved successfully')

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-6">
          <div className="flex gap-1 bg-muted rounded-lg p-1 flex-wrap">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all \${tab === id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}\`}>
                <Icon size={11} />{label}
              </button>
            ))}
          </div>

          {tab === 'profile' && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h3 className="text-sm font-semibold text-foreground">Profile</h3>
              <div className="space-y-4">
                <div><label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition" /></div>
                <div><label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition" /></div>
                <button onClick={save} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">Save Changes</button>
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Current Plan</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Pro — $29/month</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-500">Active</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => showToast('Upgrade flow would open here')} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">Upgrade to Enterprise</button>
                  <button onClick={() => showToast('Manage billing portal')} className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent/30 transition">Manage billing</button>
                </div>
              </div>
            </div>
          )}

          {!['profile', 'billing'].includes(tab) && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-2 capitalize">{tab}</h3>
              <p className="text-sm text-muted-foreground">Configure {tab} settings for your workspace.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}`,

  'src/App.tsx': `import { useHashRoute } from './hooks/useHashRoute'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Sidebar from './components/layout/Sidebar'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import Settings from './pages/settings/Settings'
import './index.css'

function Shell() {
  const route = useHashRoute()
  const { user } = useAuth()

  if (!user) return <Login />

  const renderPage = () => {
    if (route === '/dashboard' || route === '/login') return <Dashboard />
    if (route === '/settings') return <Settings />
    return <Dashboard />
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar route={route} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderPage()}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ToastProvider>
  )
}`,
}
