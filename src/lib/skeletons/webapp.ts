export const WEBAPP_SKELETON: Record<string, string> = {
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
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.shimmer { background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground)/0.15) 50%, hsl(var(--muted)) 75%); background-size: 200% 100%; animation: shimmer-sweep 1.8s ease-in-out infinite; border-radius: var(--radius); }
@keyframes shimmer-sweep { from { background-position: 200% 0; } to { background-position: -200% 0; } }`,

  'src/App.tsx': `import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ItemList from './components/ItemList'
import Analytics from './components/Analytics'
import Settings from './components/Settings'
import './index.css'

export type Section = 'dashboard' | 'items' | 'analytics' | 'settings'
const SECTION_TITLES: Record<Section, string> = {
  dashboard: 'Dashboard', items: 'All Items', analytics: 'Analytics', settings: 'Settings',
}

export default function App() {
  const [section, setSection] = useState<Section>('dashboard')
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar currentSection={section} onNavigate={setSection} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{SECTION_TITLES[section]}</h1>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              + New
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {section === 'dashboard' && <Dashboard />}
          {section === 'items' && <ItemList />}
          {section === 'analytics' && <Analytics />}
          {section === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  )
}`,

  'src/components/Sidebar.tsx': `import { LayoutDashboard, List, BarChart2, Settings, Zap } from 'lucide-react'
import type { Section } from '../App'

const NAV: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'items', label: 'Items', icon: List },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
]

export default function Sidebar({ currentSection, onNavigate }: { currentSection: Section; onNavigate: (s: Section) => void }) {
  return (
    <aside className="w-56 flex-shrink-0 h-screen flex flex-col border-r border-border bg-card">
      <div className="px-4 py-4 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Zap size={14} className="text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm text-foreground truncate">AppName</span>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onNavigate(id)}
            className={\`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all \${currentSection === id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}\`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </nav>
      <div className="px-2 py-3 border-t border-border">
        <button onClick={() => onNavigate('settings')}
          className={\`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all \${currentSection === 'settings' ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}\`}>
          <Settings size={15} />Settings
        </button>
      </div>
    </aside>
  )
}`,

  'src/components/Dashboard.tsx': `import { TrendingUp, Users, Activity, DollarSign } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CHART_DATA = [
  { month: 'Jan', value: 42 }, { month: 'Feb', value: 58 }, { month: 'Mar', value: 51 },
  { month: 'Apr', value: 73 }, { month: 'May', value: 67 }, { month: 'Jun', value: 89 },
  { month: 'Jul', value: 95 }, { month: 'Aug', value: 88 },
]

const STATS = [
  { label: 'Total Items', value: '2,847', delta: '+12%', icon: Activity },
  { label: 'Active Users', value: '384', delta: '+8%', icon: Users },
  { label: 'This Month', value: '1,203', delta: '+23%', icon: TrendingUp },
  { label: 'Revenue', value: '\$48.2k', delta: '+15%', icon: DollarSign },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.icon size={14} className="text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">{s.value}</div>
            <div className="text-xs text-emerald-500 mt-1">{s.delta} vs last month</div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-1">Activity Over Time</h3>
        <p className="text-xs text-muted-foreground mb-4">Last 8 months</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={CHART_DATA}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(240 80% 62%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(240 80% 62%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 14%)" />
            <XAxis dataKey="month" tick={{ fill: 'hsl(220 8% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(220 8% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'hsl(220 14% 7%)', border: '1px solid hsl(220 10% 14%)', borderRadius: 8, color: 'hsl(220 8% 96%)', fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="hsl(240 80% 62%)" strokeWidth={2} fill="url(#grad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}`,

  'src/components/ItemList.tsx': `import { useState } from 'react'
import { Search, Plus, MoreHorizontal, ChevronUp, ChevronDown } from 'lucide-react'

interface Item { id: string; name: string; status: 'active' | 'inactive' | 'pending'; date: string; value: string }

const INITIAL_ITEMS: Item[] = [
  { id: '1', name: 'Sample Record Alpha', status: 'active', date: '2026-08-20', value: '\$1,200' },
  { id: '2', name: 'Project Beta Launch', status: 'pending', date: '2026-08-18', value: '\$850' },
  { id: '3', name: 'Customer Gamma Onboard', status: 'active', date: '2026-08-15', value: '\$2,100' },
  { id: '4', name: 'Task Delta Complete', status: 'inactive', date: '2026-08-12', value: '\$430' },
  { id: '5', name: 'Deal Epsilon Closed', status: 'active', date: '2026-08-10', value: '\$1,750' },
  { id: '6', name: 'Pipeline Zeta Review', status: 'pending', date: '2026-08-08', value: '\$920' },
]

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-500',
  pending: 'bg-amber-500/15 text-amber-500',
  inactive: 'bg-muted text-muted-foreground',
}

export default function ItemList() {
  const [items] = useState<Item[]>(INITIAL_ITEMS)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = items
    .filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    .filter(i => statusFilter === 'all' || i.status === statusFilter)
    .sort((a, b) => sortDir === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition" />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {['all', 'active', 'pending', 'inactive'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={\`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all \${statusFilter === s ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}\`}>{s}</button>
          ))}
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition ml-auto">
          <Plus size={14} /> Add Item
        </button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                <span className="inline-flex items-center gap-1">Date {sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}</span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Value</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors group">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{item.name}</td>
                <td className="px-4 py-3">
                  <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium \${STATUS_STYLES[item.status]}\`}>{item.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{item.date}</td>
                <td className="px-4 py-3 text-sm tabular-nums text-foreground">{item.value}</td>
                <td className="px-4 py-3">
                  <button className="text-muted-foreground hover:text-foreground transition opacity-0 group-hover:opacity-100">
                    <MoreHorizontal size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">No items match your filters</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{filtered.length} of {items.length} items</span>
        </div>
      </div>
    </div>
  )
}`,

  'src/components/Analytics.tsx': `import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const BAR_DATA = [
  { name: 'Wk 1', value: 42 }, { name: 'Wk 2', value: 68 }, { name: 'Wk 3', value: 55 },
  { name: 'Wk 4', value: 89 }, { name: 'Wk 5', value: 73 }, { name: 'Wk 6', value: 95 },
  { name: 'Wk 7', value: 82 }, { name: 'Wk 8', value: 110 },
]
const PIE_DATA = [
  { name: 'Category A', value: 40 }, { name: 'Category B', value: 25 },
  { name: 'Category C', value: 20 }, { name: 'Category D', value: 15 },
]
const COLORS = ['hsl(240 80% 62%)', 'hsl(280 70% 55%)', 'hsl(200 80% 55%)', 'hsl(160 70% 45%)']
const TOOLTIP_STYLE = { background: 'hsl(220 14% 7%)', border: '1px solid hsl(220 10% 14%)', borderRadius: 8, color: 'hsl(220 8% 96%)', fontSize: 12 }

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-1">Weekly Activity</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 8 weeks</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={BAR_DATA} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 14%)" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(220 8% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(220 8% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="hsl(240 80% 62%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-1">Breakdown by Category</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribution overview</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none">
                {PIE_DATA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {PIE_DATA.map((d, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />{d.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}`,

  'src/components/Settings.tsx': `import { useState } from 'react'
import { User, Bell, Shield, CreditCard, Key } from 'lucide-react'

type SettingsTab = 'profile' | 'notifications' | 'security' | 'billing' | 'api'
const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'api', label: 'API Keys', icon: Key },
]

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>('profile')
  const [name, setName] = useState('Alex Johnson')
  const [email, setEmail] = useState('alex@example.com')
  const [saved, setSaved] = useState(false)

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all \${tab === id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}\`}>
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-foreground">Profile Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition" />
            </div>
            <button onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {tab !== 'profile' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-2 capitalize">{tab} Settings</h3>
          <p className="text-sm text-muted-foreground">Configure your {tab} preferences here.</p>
        </div>
      )}
    </div>
  )
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
  const days = Math.floor(hours / 24)
  return \`\${days}d ago\`
}`,
}
