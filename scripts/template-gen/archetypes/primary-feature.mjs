// The "primary feature" page — src/pages/[PrimaryFeature].tsx — matching the
// DATA TABLE PAGE spec in src/app/api/generate/route.ts: header with count +
// export/new actions, search + filter chips toolbar, sortable table, bulk
// action bar, pagination, and a slide-in detail side panel. This replaces
// the flat single-page pilot — it's now one page inside the full shell.

function statusVariant(status) {
  const s = status.toLowerCase()
  if (s.includes('active') || s.includes('open') || s.includes('progress')) return 'default'
  if (s.includes('pending') || s.includes('review') || s.includes('waiting')) return 'outline'
  if (s.includes('closed') || s.includes('done') || s.includes('complete')) return 'solid'
  return 'default'
}

export function primaryFeatureFile(config) {
  const { primaryFeatureLabel, primaryFeatureSingular, primaryTable } = config
  const { columns, rows, filters } = primaryTable
  const isWebApp = config.archetype === 'webapp'

  const headerCells = columns.map((c, i) =>
    `<th className="cursor-pointer select-none px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground" onClick={() => toggleSort(${i})}>${c} {sortCol === ${i} && (sortDir === 'asc' ? '↑' : '↓')}</th>`,
  ).join('\n                ')

  const rowsData = JSON.stringify(rows.map((r, i) => ({ ...r, id: String(i) })))
  const filtersData = JSON.stringify(filters)

  // Web App: keyboard-first, single-tenant task tool — Kanban board + inline
  // editing + drag-and-drop + real-time sync are the actual signature
  // patterns (buildSystemPrompt), not the SaaS data-table alone.
  const webAppImports = isWebApp ? `import { useKeyboard } from '../hooks/useKeyboard'\nimport { InlineEdit } from '../components/InlineEdit'\n` : ''
  const webAppState = isWebApp ? `
  const [view, setView] = useState('board')
  const [rowsState, setRowsState] = useState(ROWS)
  const [dragging, setDragging] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const flashSync = () => { setSyncing(true); setTimeout(() => setSyncing(false), 900) }

  const moveCard = (id, status) => {
    setRowsState(rs => rs.map(r => (r.id === id ? { ...r, status } : r)))
    flashSync()
  }
  const editCell = (id, ci, value) => {
    setRowsState(rs => rs.map(r => (r.id === id ? { ...r, cells: r.cells.map((c, i) => (i === ci ? value : c)) } : r)))
    flashSync()
  }

  useKeyboard({
    'cmd+n': () => setQuery(''),
    'escape': () => setPanelRow(null),
  })
` : ''

  const boardView = isWebApp ? `
      {view === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {FILTERS.map(col => {
            const cards = filtered.filter(r => r.status === col)
            return (
              <div
                key={col}
                onDragOver={e => { e.preventDefault(); setDragOverCol(col) }}
                onDrop={e => { e.preventDefault(); if (dragging) moveCard(dragging, col); setDragging(null); setDragOverCol(null) }}
                className={'w-72 shrink-0 rounded-xl border p-3 transition-colors ' + (dragOverCol === col ? 'border-primary/40 bg-primary/5' : 'border-border bg-card/50')}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col}</span>
                  <Badge variant="outline">{cards.length}</Badge>
                </div>
                <div className="flex flex-col gap-2">
                  {cards.map(r => (
                    <div
                      key={r.id}
                      draggable
                      onDragStart={() => setDragging(r.id)}
                      onDragEnd={() => { setDragging(null); setDragOverCol(null) }}
                      onClick={() => setPanelRow(r)}
                      className={'cursor-grab rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-all active:cursor-grabbing ' + (dragging === r.id ? 'opacity-40 scale-[0.98]' : '')}
                    >
                      <p className="font-medium text-foreground">{r.cells[0]}</p>
                      {r.cells[1] && <p className="mt-1 text-xs text-muted-foreground">{r.cells[1]}</p>}
                    </div>
                  ))}
                  {cards.length === 0 && <p className="px-1 py-4 text-center text-xs text-muted-foreground">No ${primaryFeatureLabel.toLowerCase()} here</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
` : ''

  return `import { useMemo, useState } from 'react'
import { Download, Plus, LayoutGrid, List as ListIcon, Loader2, Check } from 'lucide-react'
import { Button, Badge, Input, Card, EmptyState } from '../wyber-ui'
${webAppImports}
const ROWS = ${rowsData}
const FILTERS = ${filtersData}
const PAGE_SIZE = 6

function statusVariant(status) {
  const s = status.toLowerCase()
  if (s.includes('active') || s.includes('open') || s.includes('progress')) return 'default'
  if (s.includes('pending') || s.includes('review') || s.includes('waiting')) return 'outline'
  if (s.includes('closed') || s.includes('done') || s.includes('complete')) return 'solid'
  return 'default'
}

export default function ${config.primaryFeaturePascal}() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [selected, setSelected] = useState([])
  const [page, setPage] = useState(1)
  const [panelRow, setPanelRow] = useState(null)
${webAppState}
  const toggleSort = (i) => {
    if (sortCol === i) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(i); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let out = ${isWebApp ? 'rowsState' : 'ROWS'}
    if (activeFilter) out = out.filter(r => r.status === activeFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      out = out.filter(r => r.cells.some(c => c.toLowerCase().includes(q)))
    }
    if (sortCol !== null) {
      out = [...out].sort((a, b) => {
        const av = a.cells[sortCol], bv = b.cells[sortCol]
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    }
    return out
  }, [query, activeFilter, sortCol, sortDir${isWebApp ? ', rowsState' : ''}])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleRow = (i) => setSelected(s => (s.includes(i) ? s.filter(x => x !== i) : [...s, i]))

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">${primaryFeatureLabel}</h2>
          <Badge variant="outline">{ROWS.length}</Badge>
          ${isWebApp ? `{syncing && <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"><Loader2 size={11} className="animate-spin" />Syncing...</span>}` : ''}
        </div>
        <div className="flex items-center gap-2">
          ${isWebApp ? `<div className="flex gap-1 rounded-lg bg-muted p-1">
            <button onClick={() => setView('board')} className={'rounded-md p-1.5 transition-colors ' + (view === 'board' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}><LayoutGrid size={14} /></button>
            <button onClick={() => setView('table')} className={'rounded-md p-1.5 transition-colors ' + (view === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}><ListIcon size={14} /></button>
          </div>` : ''}
          <Button variant="ghost" size="sm"><Download size={14} className="mr-1.5" />Export CSV</Button>
          <Button size="sm"><Plus size={14} className="mr-1.5" />New ${primaryFeatureSingular}${isWebApp ? ' (⌘N)' : ''}</Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input placeholder="Search..." value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} className="max-w-xs" />
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => { setActiveFilter(a => (a === f ? null : f)); setPage(1) }}
            className={'rounded-full border px-3 py-1 text-xs font-medium transition-colors ' + (activeFilter === f ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}
          >
            {f}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-foreground">
          <span>{selected.length} selected</span>
          <button className="text-primary hover:underline">Export</button>
          <button className="text-destructive hover:underline">Delete</button>
          <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setSelected([])}>Deselect</button>
        </div>
      )}
${boardView}
      ${isWebApp ? `{view === 'table' && (` : ''}
      <Card className="p-0">
        {pageRows.length === 0 ? (
          <EmptyState title="No ${primaryFeatureLabel.toLowerCase()} match your filters" description="Try a different search term or clear the active filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 px-5 py-3" />
                ${headerCells}
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => (
                  <tr key={i} className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent/40" onClick={() => setPanelRow(r)}>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(i)} onChange={() => toggleRow(i)} className="h-4 w-4 rounded border-border accent-primary" />
                    </td>
                    {r.cells.map((c, ci) => (
                      <td key={ci} className={'px-5 py-4 text-sm ' + (ci === 0 ? 'text-foreground' : 'text-muted-foreground')} onClick={e => ${isWebApp ? 'ci === 0 && e.stopPropagation()' : '{}'}}>
                        ${isWebApp ? `{ci === 0 ? <InlineEdit value={c} onSave={v => editCell(r.id, ci, v)} /> : c}` : '{c}'}
                      </td>
                    ))}
                    <td className="px-5 py-4 text-right"><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      ${isWebApp ? `)}` : ''}

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-md border border-border px-2.5 py-1 disabled:opacity-40">Prev</button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-md border border-border px-2.5 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>

      {panelRow && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-foreground/25 backdrop-blur-sm" onClick={() => setPanelRow(null)} />
          <div className="relative flex h-full w-full max-w-[420px] flex-col overflow-y-auto border-l border-border bg-popover p-6">
            <button onClick={() => setPanelRow(null)} className="mb-4 self-end text-sm text-muted-foreground hover:text-foreground">Close</button>
            <h3 className="font-display text-lg font-semibold text-foreground">{panelRow.cells[0]}</h3>
            <div className="mt-4 divide-y divide-border">
              ${columns.map((c, i) => `<div className="flex items-baseline justify-between py-2.5 text-sm"><span className="text-muted-foreground">${c}</span><span className="text-foreground">{panelRow.cells[${i}]}</span></div>`).join('\n              ')}
              <div className="flex items-baseline justify-between py-2.5 text-sm"><span className="text-muted-foreground">Status</span><Badge variant={statusVariant(panelRow.status)}>{panelRow.status}</Badge></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
`
}
