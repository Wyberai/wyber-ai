// Reference: Linear's issue list — the same split list+detail pattern that
// made Linear's UI famous, inside the same app-shell sidebar as the
// dashboard/settings templates for a consistent interior-app feel.
import { useState } from 'react'
import { Search, LayoutGrid, ListChecks, RefreshCcw, Map } from 'lucide-react'
import { Card, Badge, Input, Button, DataRow, EmptyState, cn } from '../wyber-ui'

const NAV = [
  { icon: LayoutGrid, label: 'Overview' },
  { icon: ListChecks, label: 'Accounts', active: true },
  { icon: RefreshCcw, label: 'Cycles' },
  { icon: Map, label: 'Roadmap' },
]

const ITEMS = [
  { id: '1', name: 'Acme Corp', status: 'Active', owner: 'Jordan Lee', updated: '2h ago', value: '$12,400' },
  { id: '2', name: 'Globex Inc', status: 'Pending', owner: 'Priya Shah', updated: '5h ago', value: '$4,200' },
  { id: '3', name: 'Initech', status: 'Active', owner: 'Sam Ortiz', updated: '1d ago', value: '$28,900' },
  { id: '4', name: 'Umbrella LLC', status: 'Paused', owner: 'Jordan Lee', updated: '3d ago', value: '$1,050' },
]

export default function ListDetail() {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(ITEMS[0].id)

  const filtered = ITEMS.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
  const selected = filtered.find(i => i.id === selectedId) ?? filtered[0] ?? null

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">W</div>
          <span className="text-sm font-semibold text-foreground">Workspace</span>
        </div>
        <nav className="p-3">
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
      </aside>

      <div className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-6 font-display text-2xl font-bold tracking-tight text-foreground">Accounts</h1>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_1fr]">
            <Card className="p-0">
              <div className="border-b border-border p-4">
                <div className="relative">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search accounts…" className="pl-8" value={query} onChange={e => setQuery(e.target.value)} />
                </div>
              </div>
              <div className="max-h-[32rem] overflow-y-auto">
                {filtered.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0',
                      selected?.id === item.id ? 'bg-accent' : 'hover:bg-accent/50',
                    )}
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.owner}</div>
                    </div>
                    <Badge variant={item.status === 'Active' ? 'default' : item.status === 'Pending' ? 'outline' : 'destructive'}>
                      {item.status}
                    </Badge>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              {selected ? (
                <>
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold text-foreground">{selected.name}</div>
                      <div className="text-sm text-muted-foreground">Managed by {selected.owner}</div>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div>
                    <DataRow label="Status" value={selected.status} />
                    <DataRow label="Contract value" value={selected.value} />
                    <DataRow label="Owner" value={selected.owner} />
                    <DataRow label="Last updated" value={selected.updated} />
                  </div>
                </>
              ) : (
                <EmptyState title="No account selected" description="Choose an account from the list to see its details." />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
