// Reference: Linear — dense, monochrome-with-accent, precise typography,
// keyboard-first cues (⌘K), a persistent left sidebar shell (the standard
// SaaS-app convention every dense admin/dashboard template — Adminator
// included — converges on), real information density over whitespace.
import { useState } from 'react'
import { Search, Circle, CircleDot, CheckCircle2, LayoutGrid, ListChecks, RefreshCcw, Map, Settings as SettingsIcon } from 'lucide-react'
import { Card, Badge, StatBlock, MonoLabel, Reveal, Stagger, StaggerItem, cn } from '../wyber-ui'

const NAV = [
  { icon: LayoutGrid, label: 'Overview', active: true },
  { icon: ListChecks, label: 'Issues' },
  { icon: RefreshCcw, label: 'Cycles' },
  { icon: Map, label: 'Roadmap' },
  { icon: SettingsIcon, label: 'Settings' },
]

const STATS = [
  { label: 'Open issues', value: 34, delta: -6 },
  { label: 'In progress', value: 12, delta: 4 },
  { label: 'Completed this week', value: 28, delta: 18 },
  { label: 'Avg. cycle time', value: 2.4, suffix: 'd', decimals: 1, delta: -9 },
]

const ISSUES = [
  { id: 'ENG-412', title: 'Fix checkout race condition on double-submit', status: 'in-progress', assignee: 'PS' },
  { id: 'ENG-408', title: 'Migrate billing service to new API', status: 'in-progress', assignee: 'SO' },
  { id: 'ENG-401', title: 'Add keyboard shortcuts to command palette', status: 'todo', assignee: 'JL' },
  { id: 'ENG-397', title: 'Investigate memory leak in worker pool', status: 'todo', assignee: 'JL' },
  { id: 'ENG-390', title: 'Ship v2 onboarding flow', status: 'done', assignee: 'PS' },
]

const STATUS_ICON = { todo: Circle, 'in-progress': CircleDot, done: CheckCircle2 } as const
const STATUS_LABEL = { todo: 'Todo', 'in-progress': 'In Progress', done: 'Done' } as const

function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">W</div>
        <span className="text-sm font-semibold text-foreground">Workspace</span>
      </div>
      <nav className="flex-1 p-3">
        {NAV.map(item => (
          <div
            key={item.label}
            className={cn(
              'mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
              item.active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )}
          >
            <item.icon size={16} />
            {item.label}
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-2.5 border-t border-border px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">JL</div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-foreground">Jordan Lee</div>
          <div className="truncate text-[11px] text-muted-foreground">jordan@example.com</div>
        </div>
      </div>
    </aside>
  )
}

export default function Dashboard() {
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'todo' | 'done'>('all')
  const filtered = filter === 'all' ? ISSUES : ISSUES.filter(i => i.status === filter)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <MonoLabel accent>Engineering</MonoLabel>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">Sprint overview</h1>
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <Search size={14} />
              <span>Search issues…</span>
              <kbd className="ml-4 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
            </button>
          </Reveal>

          <Stagger className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {STATS.map(s => (
              <StaggerItem key={s.label}>
                <Card className="p-4">
                  <StatBlock {...s} />
                </Card>
              </StaggerItem>
            ))}
          </Stagger>

          <Card className="p-0">
            <div className="flex items-center gap-1 border-b border-border p-3">
              {(['all', 'todo', 'in-progress', 'done'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                    filter === f ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f.replace('-', ' ')}
                </button>
              ))}
            </div>
            <div>
              {filtered.map(issue => {
                const Icon = STATUS_ICON[issue.status as keyof typeof STATUS_ICON]
                return (
                  <div key={issue.id} className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-accent/50">
                    <Icon size={15} className={issue.status === 'done' ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="font-mono text-xs text-muted-foreground">{issue.id}</span>
                    <span className="flex-1 truncate text-foreground">{issue.title}</span>
                    <Badge variant="outline" className="hidden sm:inline-flex">{STATUS_LABEL[issue.status as keyof typeof STATUS_LABEL]}</Badge>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {issue.assignee}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
