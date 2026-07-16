// GTM demo template: a personalized "command center" dashboard for small
// Indian software / dev-shop founders. Built once, then the /api/gtm/stamp
// route clones this file map, replaces the tokens below with a real company's
// details, and publishes it to a free slug so a cold-outreach recipient sees a
// dashboard that looks purpose-built for their agency.
//
// HONESTY CONTRACT (do not weaken): every number is fake and MUST stay visibly
// marked as "Sample data"; every integration is a "Connect …" placeholder tile,
// never a claim that we hold the founder's real data. The pitch is speed — "we
// generated this in 5 minutes, connect your tools and it goes live" — not
// surveillance. Only the company name + first name are personalized; no email
// or any other scraped detail is ever shown in the UI.

/** Tokens replaced per-company at stamp time. Keep in sync with the template. */
export const DEVSHOP_COCKPIT_TOKENS = ['{{COMPANY_NAME}}', '{{FIRST_NAME}}', '{{BRAND_INITIAL}}'] as const

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{COMPANY_NAME}} · Command Center</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`

const MAIN_TSX = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`

const INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Sky Precision — near-black canvas, single sky-blue accent, hairline borders. */
:root,
.dark {
  --background: 220 25% 4%;
  --foreground: 210 20% 96%;
  --card: 220 22% 6%;
  --card-foreground: 210 20% 96%;
  --popover: 220 22% 6%;
  --popover-foreground: 210 20% 96%;
  --primary: 199 89% 48%;
  --primary-foreground: 210 100% 6%;
  --secondary: 220 15% 10%;
  --secondary-foreground: 210 20% 96%;
  --muted: 220 15% 10%;
  --muted-foreground: 218 10% 60%;
  --accent: 218 18% 12%;
  --accent-foreground: 199 80% 80%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 210 20% 98%;
  --success: 152 60% 45%;
  --warning: 38 92% 55%;
  --border: 218 15% 14%;
  --input: 218 15% 14%;
  --ring: 199 89% 48%;
  --radius: 0.375rem;
  --font-sans: 'Switzer', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'General Sans', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace;
}

html { scroll-behavior: smooth; }
body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
.font-mono { font-family: var(--font-mono); }
.font-display { font-family: var(--font-display); }
::selection { background: hsl(var(--primary) / 0.25); }`

const APP_TSX = `import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  LayoutDashboard, Users, FolderKanban, Building2, Receipt, Settings, Plus,
  ArrowUpRight, ArrowDownRight, TriangleAlert, Clock, Github, MessageSquare,
  Kanban, Timer, Wallet, LineChart, Sparkles, ChevronRight,
} from 'lucide-react'

// ── All data below is SAMPLE / placeholder. Nothing here is real. ────────────

const RETAINER_TREND = [
  { m: 'Jan', mrr: 12.1 }, { m: 'Feb', mrr: 13.0 }, { m: 'Mar', mrr: 12.6 },
  { m: 'Apr', mrr: 14.8 }, { m: 'May', mrr: 15.9 }, { m: 'Jun', mrr: 17.2 },
  { m: 'Jul', mrr: 18.4 },
]

const POD_UTIL = [
  { pod: 'Web', util: 84 }, { pod: 'Mobile', util: 72 }, { pod: 'Data', util: 91 },
  { pod: 'QA', util: 63 }, { pod: 'Design', util: 77 },
]

const BENCH = [
  { name: 'Aarav S.', role: 'Sr. Backend', alloc: 120, tag: 'over' },
  { name: 'Meera K.', role: 'Frontend', alloc: 95, tag: 'ok' },
  { name: 'Rohit P.', role: 'Mobile', alloc: 40, tag: 'idle' },
  { name: 'Sana R.', role: 'QA', alloc: 20, tag: 'idle' },
  { name: 'Dev M.', role: 'DevOps', alloc: 88, tag: 'ok' },
]

const PROJECTS = [
  { name: 'Nova CRM revamp', client: 'Acme Retail', status: 'On track' },
  { name: 'Payments SDK', client: 'FinBox', status: 'At risk' },
  { name: 'Analytics portal', client: 'Kite Labs', status: 'On track' },
  { name: 'Onboarding app', client: 'Zeal Health', status: 'Slipping' },
]

const AGING = [
  { bucket: '0–30d', amt: 14.2 }, { bucket: '31–60d', amt: 11.8 },
  { bucket: '61–90d', amt: 9.1 }, { bucket: '90d+', amt: 7.5 },
]

const PIPELINE = [
  { stage: 'Leads', n: 42 }, { stage: 'Qualified', n: 18 },
  { stage: 'Proposal', n: 9 }, { stage: 'Won', n: 4 },
]

const ALERTS = [
  { icon: Timer, text: '2 developers on bench for 3+ weeks — reallocate or bill', tone: 'warning' },
  { icon: Wallet, text: 'Acme Retail invoice #INV-204 is 45 days overdue (₹6.2L)', tone: 'destructive' },
  { icon: TriangleAlert, text: 'Onboarding app is slipping — 3 tasks blocked over 5 days', tone: 'destructive' },
  { icon: ArrowUpRight, text: 'Data pod utilization crossed 90% — capacity risk next sprint', tone: 'warning' },
]

const STACK = [
  { name: 'Jira', icon: Kanban, note: 'Projects & sprints' },
  { name: 'GitHub', icon: Github, note: 'Repos & PR velocity' },
  { name: 'Slack', icon: MessageSquare, note: 'Team & client channels' },
  { name: 'Toggl', icon: Timer, note: 'Time tracking' },
  { name: 'Zoho Books', icon: Receipt, note: 'Invoicing & receivables' },
  { name: 'HubSpot', icon: Building2, note: 'CRM & pipeline' },
  { name: 'Razorpay', icon: Wallet, note: 'Payments & payouts' },
]

const NAV = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Team', icon: Users },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Clients', icon: Building2 },
  { label: 'Billing', icon: Receipt },
  { label: 'Settings', icon: Settings },
]

function SampleTag() {
  return (
    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 border border-border rounded px-1.5 py-0.5">
      Sample
    </span>
  )
}

function Kpi(props: { label: string; value: string; delta: string; up: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{props.label}</span>
        <SampleTag />
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums text-foreground">{props.value}</div>
      <div className={'mt-1 flex items-center gap-1 text-xs ' + (props.up ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]')}>
        {props.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        <span className="tabular-nums">{props.delta}</span>
        <span className="text-muted-foreground">vs last month</span>
      </div>
    </div>
  )
}

function Panel(props: { title: string; hint?: string; children: any }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">{props.title}</h3>
          {props.hint ? <p className="mt-0.5 text-xs text-muted-foreground">{props.hint}</p> : null}
        </div>
        <SampleTag />
      </div>
      {props.children}
    </div>
  )
}

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--foreground))',
}

function statusColor(s: string) {
  if (s === 'On track') return 'text-[hsl(var(--success))] border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10'
  if (s === 'At risk') return 'text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10'
  return 'text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10'
}

function allocColor(tag: string) {
  if (tag === 'over') return 'bg-[hsl(var(--warning))]'
  if (tag === 'idle') return 'bg-[hsl(var(--destructive))]'
  return 'bg-primary'
}

export default function App() {
  const [nav, setNav] = useState('Overview')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border min-h-screen sticky top-0">
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
              {'{{BRAND_INITIAL}}'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{'{{COMPANY_NAME}}'}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Command Center</div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {NAV.map((item) => {
              const active = item.label === nav
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={() => setNav(item.label)}
                  className={'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ' +
                    (active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary')}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
          <div className="p-3">
            <div className="rounded-md border border-border bg-secondary/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Built with WyberAi
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Generated in ~5 minutes. Connect your tools to go live.</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Topbar */}
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 sm:px-8 h-auto sm:h-16 py-3 sm:py-0 sticky top-0 bg-background/80 backdrop-blur z-10">
            <div className="flex items-center gap-3">
              <span className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">
                {'{{BRAND_INITIAL}}'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-[hsl(var(--accent-foreground))]">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Sample data · demo build
              </span>
            </div>
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Connect your data <ChevronRight className="h-4 w-4" />
            </button>
          </header>

          <div className="p-5 sm:p-8 space-y-6">
            {/* Welcome */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
                Morning, {'{{FIRST_NAME}}'} 👋
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here's how {'{{COMPANY_NAME}}'} is tracking today.{' '}
                <span className="text-foreground/80">Numbers below are placeholders</span> until you connect your tools.
              </p>
            </motion.div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Kpi label="Billable utilization" value="78%" delta="4.2%" up={true} />
              <Kpi label="Devs on bench" value="3" delta="1 fewer" up={true} />
              <Kpi label="On-time delivery" value="91%" delta="2.1%" up={true} />
              <Kpi label="Retainer MRR" value="₹18.4L" delta="6.8%" up={true} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Panel title="Retainer revenue" hint="Monthly recurring, last 7 months (₹ lakh)">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={RETAINER_TREND} margin={{ left: -18, right: 8, top: 6 }}>
                      <defs>
                        <linearGradient id="mrr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'hsl(var(--border))' }} />
                      <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#mrr)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Panel>
              </div>
              <Panel title="Utilization by pod" hint="% billable this sprint">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={POD_UTIL} margin={{ left: -18, right: 8, top: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="pod" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--secondary))' }} />
                    <Bar dataKey="util" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            {/* Pain panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Panel title="Bench & allocation" hint="Idle capacity is the #1 margin leak">
                <div className="space-y-3">
                  {BENCH.map((d) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-28 shrink-0">
                        <div className="text-sm text-foreground">{d.name}</div>
                        <div className="text-[11px] text-muted-foreground">{d.role}</div>
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div className={'h-full ' + allocColor(d.tag)} style={{ width: Math.min(d.alloc, 100) + '%' }} />
                      </div>
                      <div className="w-12 text-right text-xs tabular-nums text-muted-foreground">{d.alloc}%</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Project delivery health" hint="Across active client engagements">
                <div className="space-y-2">
                  {PROJECTS.map((p) => (
                    <div key={p.name} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-sm text-foreground">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">{p.client}</div>
                      </div>
                      <span className={'shrink-0 rounded-full border px-2 py-0.5 text-[11px] ' + statusColor(p.status)}>{p.status}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Receivables aging" hint="₹42.6L outstanding — ₹7.5L over 90 days">
                <div className="space-y-3">
                  {AGING.map((a) => (
                    <div key={a.bucket} className="flex items-center gap-3">
                      <div className="w-16 shrink-0 font-mono text-[11px] text-muted-foreground">{a.bucket}</div>
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary/70" style={{ width: (a.amt / 14.2 * 100) + '%' }} />
                      </div>
                      <div className="w-16 text-right text-xs tabular-nums text-foreground">₹{a.amt}L</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Sales pipeline" hint="Open opportunities this quarter">
                <div className="space-y-2">
                  {PIPELINE.map((s, i) => (
                    <div key={s.stage} className="flex items-center gap-3">
                      <div className="w-20 shrink-0 text-xs text-muted-foreground">{s.stage}</div>
                      <div className="flex-1 h-7 rounded-md bg-secondary/50 overflow-hidden flex items-center">
                        <div className="h-full bg-primary/25 flex items-center px-2" style={{ width: (s.n / 42 * 100) + '%' }}>
                          <span className="text-[11px] tabular-nums text-foreground">{s.n}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Your stack */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Your stack</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Connect a tool and this dashboard fills with your real numbers.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {STACK.map((t) => {
                  const Icon = t.icon
                  return (
                    <button key={t.name} className="group flex items-center gap-3 rounded-lg border border-dashed border-border bg-card/50 p-4 text-left hover:border-primary/50 hover:bg-card transition-colors">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-muted-foreground group-hover:text-primary">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-foreground">Connect {t.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{t.note}</div>
                      </div>
                    </button>
                  )
                })}
                <button className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/50 p-4 text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors">
                  <Plus className="h-4 w-4" /> Add data source
                </button>
              </div>
            </div>

            {/* Alerts */}
            <Panel title="Alerts" hint="What would need your attention this week">
              <div className="space-y-2">
                {ALERTS.map((a, i) => {
                  const Icon = a.icon
                  const tone = a.tone === 'destructive' ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--warning))]'
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-md border border-border bg-secondary/30 px-3 py-2.5">
                      <Icon className={'mt-0.5 h-4 w-4 shrink-0 ' + tone} />
                      <span className="text-sm text-foreground/90">{a.text}</span>
                    </div>
                  )
                })}
              </div>
            </Panel>

            {/* Footer CTA */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6 sm:p-8 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-[hsl(var(--accent-foreground))]">
                <Sparkles className="h-3.5 w-3.5" /> Made for {'{{COMPANY_NAME}}'} in ~5 minutes
              </div>
              <h2 className="mt-4 font-display text-xl sm:text-2xl font-semibold">This dashboard is yours, {'{{FIRST_NAME}}'}.</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                Reply to our email to claim it — then connect your tools and every number above turns into {'{{COMPANY_NAME}}'}'s live data. Keep building on it however you like.
              </p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                <LineChart className="h-4 w-4" /> Claim & connect your data
              </button>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                All figures shown are sample placeholders
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}`

/** The canonical tokenized file map. Cloned + token-replaced per company. */
export const DEVSHOP_COCKPIT_FILES: Record<string, string> = {
  'index.html': INDEX_HTML,
  'src/main.tsx': MAIN_TSX,
  'src/index.css': INDEX_CSS,
  'src/App.tsx': APP_TSX,
}
